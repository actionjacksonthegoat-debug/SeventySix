// <copyright file="AuthService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Headers;
using System.Text.Json;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// Authentication service for login, registration, and OAuth.
/// </summary>
/// <remarks>
/// Design Principles:
/// - BCrypt for password hashing with configurable work factor
/// - Returns AuthResult for explicit error handling (no exceptions for auth failures)
/// - Supports both local and GitHub OAuth authentication
/// </remarks>
public class AuthService(
	IdentityDbContext context,
	ITokenService tokenService,
	IHttpClientFactory httpClientFactory,
	IOptions<AuthSettings> authSettings,
	IOptions<JwtSettings> jwtSettings,
	IValidator<ChangePasswordRequest> changePasswordValidator,
	TimeProvider timeProvider,
	ILogger<AuthService> logger) : IAuthService
{
	/// <inheritdoc/>
	public async Task<AuthResult> LoginAsync(
		LoginRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		// Find user by username or email (tracked for lockout updates)
		User? user =
			await context.Users
				.Where(u => u.Username == request.UsernameOrEmail
					|| u.Email == request.UsernameOrEmail)
				.FirstOrDefaultAsync(cancellationToken);

		if (user == null)
		{
			logger.LogWarning(
				"Login attempt with invalid credentials. UsernameOrEmail: {UsernameOrEmail}",
				request.UsernameOrEmail);
			return AuthResult.Failed(
				"Invalid username/email or password.",
				AuthErrorCodes.InvalidCredentials);
		}

		// Check account lockout (before password verification)
		if (IsAccountLockedOut(user))
		{
			logger.LogWarning(
				"Login attempt for locked account. UserId: {UserId}, LockoutEnd: {LockoutEnd}",
				user.Id,
				user.LockoutEndUtc);
			return AuthResult.Failed(
				"Account is temporarily locked. Please try again later.",
				AuthErrorCodes.AccountLocked);
		}

		if (!user.IsActive)
		{
			logger.LogWarning(
				"Login attempt for inactive account. UserId: {UserId}",
				user.Id);
			return AuthResult.Failed(
				"Account is inactive.",
				AuthErrorCodes.AccountInactive);
		}

		// Get user credential
		UserCredential? credential =
			await context.UserCredentials
				.AsNoTracking()
				.Where(c => c.UserId == user.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (credential == null)
		{
			logger.LogWarning(
				"Login attempt for user without password. UserId: {UserId}",
				user.Id);
			return AuthResult.Failed(
				"Invalid username/email or password.",
				AuthErrorCodes.InvalidCredentials);
		}

		// Verify password
		if (!BCrypt.Net.BCrypt.Verify(
			request.Password,
			credential.PasswordHash))
		{
			await HandleFailedLoginAttemptAsync(
				user,
				cancellationToken);

			logger.LogWarning(
				"Login attempt with wrong password. UserId: {UserId}, FailedAttempts: {FailedAttempts}",
				user.Id,
				user.FailedLoginCount);

			return AuthResult.Failed(
				"Invalid username/email or password.",
				AuthErrorCodes.InvalidCredentials);
		}

		// Success - reset lockout tracking
		await ResetLockoutAsync(
			user,
			cancellationToken);

		// Check if password change is required (first login with seeded password)
		bool requiresPasswordChange =
			credential.PasswordChangedAt == null;

		if (requiresPasswordChange)
		{
			logger.LogInformation(
				"User requires password change on first login. UserId: {UserId}",
				user.Id);
		}

		return await GenerateAuthResultAsync(
			user,
			clientIp,
			requiresPasswordChange,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<AuthResult> RegisterAsync(
		RegisterRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		// Check for existing username
		bool usernameExists =
			await context.Users
				.AnyAsync(
					u => u.Username == request.Username,
					cancellationToken);

		if (usernameExists)
		{
			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		// Check for existing email
		bool emailExists =
			await context.Users
				.AnyAsync(
					u => u.Email == request.Email,
					cancellationToken);

		if (emailExists)
		{
			return AuthResult.Failed(
				"Email is already registered.",
				AuthErrorCodes.EmailExists);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Create user
		User user =
			new()
			{
				Username = request.Username,
				Email = request.Email,
				FullName = request.FullName,
				IsActive = true,
				CreateDate = now,
				CreatedBy = "Registration"
			};

		context.Users.Add(user);
		await context.SaveChangesAsync(cancellationToken);

		// Create credential
		string passwordHash =
			BCrypt.Net.BCrypt.HashPassword(
				request.Password,
				authSettings.Value.Password.WorkFactor);

		UserCredential credential =
			new()
			{
				UserId = user.Id,
				PasswordHash = passwordHash,
				CreatedAt = now
			};

		context.UserCredentials.Add(credential);

		// Assign default role
		UserRole userRole =
			new()
			{
				UserId = user.Id,
				Role = "User",
				AssignedAt = now
			};

		context.UserRoles.Add(userRole);
		await context.SaveChangesAsync(cancellationToken);

		logger.LogInformation(
			"New user registered. UserId: {UserId}, Username: {Username}",
			user.Id,
			user.Username);

		return await GenerateAuthResultAsync(
			user,
			clientIp,
			requiresPasswordChange: false,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<AuthResult> RefreshTokensAsync(
		string refreshToken,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		// Validate token first to get userId (needed to load user)
		int? userId =
			await tokenService.ValidateRefreshTokenAsync(
				refreshToken,
				cancellationToken);

		if (userId == null)
		{
			return AuthResult.Failed(
				"Invalid or expired refresh token.",
				AuthErrorCodes.InvalidToken);
		}

		User? user =
			await context.Users
				.AsNoTracking()
				.Where(u => u.Id == userId.Value)
				.FirstOrDefaultAsync(cancellationToken);

		if (user == null || !user.IsActive)
		{
			return AuthResult.Failed(
				"User account is no longer valid.",
				AuthErrorCodes.AccountInactive);
		}

		// Rotate token (revokes old, creates new with same family)
		// This also handles reuse attack detection
		string? newRefreshToken =
			await tokenService.RotateRefreshTokenAsync(
				refreshToken,
				clientIp,
				cancellationToken);

		if (newRefreshToken == null)
		{
			// Token was already used (reuse attack) or expired
			return AuthResult.Failed(
				"Token has already been used. Please login again.",
				AuthErrorCodes.TokenReuse);
		}

		// Check if user still needs password change (persists across sessions)
		UserCredential? credential =
			await context.UserCredentials
				.AsNoTracking()
				.Where(c => c.UserId == user.Id)
				.FirstOrDefaultAsync(cancellationToken);

		bool requiresPasswordChange =
			credential?.PasswordChangedAt == null;

		List<string> roles =
			await context.UserRoles
				.AsNoTracking()
				.Where(ur => ur.UserId == user.Id)
				.Select(ur => ur.Role)
				.ToListAsync(cancellationToken);

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.Username,
				user.Email,
				user.FullName,
				roles);

		DateTime expiresAt =
			timeProvider.GetUtcNow()
				.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes)
				.UtcDateTime;

		return AuthResult.Succeeded(
			accessToken,
			newRefreshToken,
			expiresAt,
			requiresPasswordChange);
	}

	/// <inheritdoc/>
	public async Task<bool> LogoutAsync(
		string refreshToken,
		CancellationToken cancellationToken = default)
	{
		return await tokenService.RevokeRefreshTokenAsync(
			refreshToken,
			cancellationToken);
	}

	/// <inheritdoc/>
	public string BuildGitHubAuthorizationUrl(
		string state,
		string codeVerifier)
	{
		OAuthProviderSettings? github =
			authSettings.Value.OAuth.Providers
				.FirstOrDefault(p => p.Provider == "GitHub");

		if (github == null)
		{
			throw new InvalidOperationException(
				"GitHub OAuth provider is not configured.");
		}

		// Generate PKCE code challenge
		string codeChallenge =
			CryptoExtensions.ComputePkceCodeChallenge(codeVerifier);

		string url =
			$"{github.AuthorizationEndpoint}"
			+ $"?client_id={Uri.EscapeDataString(github.ClientId)}"
			+ $"&redirect_uri={Uri.EscapeDataString(github.RedirectUri)}"
			+ $"&scope={Uri.EscapeDataString(github.Scopes)}"
			+ $"&state={Uri.EscapeDataString(state)}"
			+ $"&code_challenge={Uri.EscapeDataString(codeChallenge)}"
			+ "&code_challenge_method=S256";

		return url;
	}

	/// <inheritdoc/>
	public async Task<AuthResult> HandleGitHubCallbackAsync(
		string code,
		string codeVerifier,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		OAuthProviderSettings? github =
			authSettings.Value.OAuth.Providers
				.FirstOrDefault(p => p.Provider == "GitHub");

		if (github == null)
		{
			return AuthResult.Failed(
				"GitHub OAuth is not configured.",
				AuthErrorCodes.OAuthError);
		}

		try
		{
			// Exchange code for access token
			string accessToken =
				await ExchangeCodeForTokenAsync(
					github,
					code,
					codeVerifier,
					cancellationToken);

			// Get user info from GitHub
			GitHubUserInfo userInfo =
				await GetGitHubUserInfoAsync(
					accessToken,
					cancellationToken);

			// Find or create user
			User user =
				await FindOrCreateGitHubUserAsync(
					userInfo,
					cancellationToken);

			logger.LogInformation(
				"GitHub OAuth login successful. UserId: {UserId}, GitHubId: {GitHubId}",
				user.Id,
				userInfo.Id);

			return await GenerateAuthResultAsync(
				user,
				clientIp,
				requiresPasswordChange: false,
				cancellationToken);
		}
		catch (Exception ex)
		{
			logger.LogError(
				ex,
				"GitHub OAuth callback failed.");

			return AuthResult.Failed(
				"GitHub authentication failed.",
				AuthErrorCodes.OAuthError);
		}
	}

	/// <inheritdoc/>
	public async Task<UserProfileDto?> GetCurrentUserAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		User? user =
			await context.Users
				.AsNoTracking()
				.Where(u => u.Id == userId)
				.FirstOrDefaultAsync(cancellationToken);

		if (user == null)
		{
			return null;
		}

		List<string> roles =
			await context.UserRoles
				.AsNoTracking()
				.Where(r => r.UserId == userId)
				.Select(r => r.Role)
				.ToListAsync(cancellationToken);

		bool hasPassword =
			await context.UserCredentials
				.AnyAsync(
					c => c.UserId == userId,
					cancellationToken);

		List<string> linkedProviders =
			await context.ExternalLogins
				.AsNoTracking()
				.Where(e => e.UserId == userId)
				.Select(e => e.Provider)
				.ToListAsync(cancellationToken);

		return new UserProfileDto(
			Id: user.Id,
			Username: user.Username,
			Email: user.Email,
			FullName: user.FullName,
			Roles: roles,
			HasPassword: hasPassword,
			LinkedProviders: linkedProviders,
			LastLoginAt: user.LastLoginAt);
	}

	/// <inheritdoc/>
	public async Task<AuthResult> ChangePasswordAsync(
		int userId,
		ChangePasswordRequest request,
		CancellationToken cancellationToken = default)
	{
		// Validate password requirements
		ValidationResult validationResult =
			await changePasswordValidator.ValidateAsync(request, cancellationToken);

		if (!validationResult.IsValid)
		{
			string errorMessage =
				string.Join(" ", validationResult.Errors.Select(e => e.ErrorMessage));

			return AuthResult.Failed(
				errorMessage,
				"VALIDATION_ERROR");
		}

		UserCredential? credential =
			await context.UserCredentials
				.Where(c => c.UserId == userId)
				.FirstOrDefaultAsync(cancellationToken);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		if (credential != null)
		{
			// Verify current password if user has one
			if (request.CurrentPassword == null
				|| !BCrypt.Net.BCrypt.Verify(
					request.CurrentPassword,
					credential.PasswordHash))
			{
				return AuthResult.Failed(
					"Current password is incorrect.",
					"INVALID_PASSWORD");
			}

			credential.PasswordHash =
				BCrypt.Net.BCrypt.HashPassword(
					request.NewPassword,
					authSettings.Value.Password.WorkFactor);
			credential.PasswordChangedAt = now;
		}
		else
		{
			// Create credential for OAuth-only user
			credential =
				new UserCredential
				{
					UserId = userId,
					PasswordHash =
						BCrypt.Net.BCrypt.HashPassword(
							request.NewPassword,
							authSettings.Value.Password.WorkFactor),
					CreatedAt = now
				};

			context.UserCredentials.Add(credential);
		}

		await context.SaveChangesAsync(cancellationToken);

		// Revoke all tokens to require re-login
		await tokenService.RevokeAllUserTokensAsync(
			userId,
			cancellationToken);

		logger.LogInformation(
			"Password changed for user. UserId: {UserId}",
			userId);

		return AuthResult.Succeeded();
	}

	/// <summary>
	/// Generates auth result with new tokens for user.
	/// </summary>
	/// <param name="user">The user to generate tokens for.</param>
	/// <param name="clientIp">The client IP address.</param>
	/// <param name="requiresPasswordChange">Whether user must change password.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens.</returns>
	private async Task<AuthResult> GenerateAuthResultAsync(
		User user,
		string? clientIp,
		bool requiresPasswordChange,
		CancellationToken cancellationToken)
	{
		List<string> roles =
			await context.UserRoles
				.AsNoTracking()
				.Where(r => r.UserId == user.Id)
				.Select(r => r.Role)
				.ToListAsync(cancellationToken);

		string accessToken =
			tokenService.GenerateAccessToken(
				user.Id,
				user.Username,
				user.Email,
				user.FullName,
				roles);

		string refreshToken =
			await tokenService.GenerateRefreshTokenAsync(
				user.Id,
				clientIp,
				cancellationToken);

		DateTime expiresAt =
			timeProvider.GetUtcNow()
				.AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes)
				.UtcDateTime;

		// Update last login
		await context.Users
			.Where(u => u.Id == user.Id)
			.ExecuteUpdateAsync(
				setters => setters
					.SetProperty(u => u.LastLoginAt, timeProvider.GetUtcNow().UtcDateTime)
					.SetProperty(u => u.LastLoginIp, clientIp),
				cancellationToken);

		return AuthResult.Succeeded(
			accessToken,
			refreshToken,
			expiresAt,
			requiresPasswordChange);
	}

	/// <summary>
	/// Checks if the user account is currently locked out.
	/// </summary>
	/// <param name="user">The user to check.</param>
	/// <returns>True if locked out; otherwise false.</returns>
	private bool IsAccountLockedOut(User user)
	{
		if (!authSettings.Value.Lockout.Enabled)
		{
			return false;
		}

		if (user.LockoutEndUtc == null)
		{
			return false;
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Lockout expired?
		if (user.LockoutEndUtc <= now)
		{
			return false;
		}

		return true;
	}

	/// <summary>
	/// Handles a failed login attempt by incrementing counter and potentially locking the account.
	/// </summary>
	private async Task HandleFailedLoginAttemptAsync(
		User user,
		CancellationToken cancellationToken)
	{
		if (!authSettings.Value.Lockout.Enabled)
		{
			return;
		}

		user.FailedLoginCount++;

		// Check if we need to lock out
		if (user.FailedLoginCount >= authSettings.Value.Lockout.MaxFailedAttempts)
		{
			DateTime lockoutEnd =
				timeProvider.GetUtcNow()
					.AddMinutes(authSettings.Value.Lockout.LockoutDurationMinutes)
					.UtcDateTime;

			user.LockoutEndUtc = lockoutEnd;

			logger.LogWarning(
				"Account locked due to failed attempts. UserId: {UserId}, FailedAttempts: {FailedAttempts}, LockoutEnd: {LockoutEnd}",
				user.Id,
				user.FailedLoginCount,
				lockoutEnd);
		}

		await context.SaveChangesAsync(cancellationToken);
	}

	/// <summary>
	/// Resets lockout tracking on successful login.
	/// </summary>
	private async Task ResetLockoutAsync(
		User user,
		CancellationToken cancellationToken)
	{
		if (user.FailedLoginCount == 0 && user.LockoutEndUtc == null)
		{
			return; // Nothing to reset
		}

		user.FailedLoginCount = 0;
		user.LockoutEndUtc = null;

		await context.SaveChangesAsync(cancellationToken);
	}

	/// <summary>
	/// Exchanges authorization code for access token.
	/// </summary>
	private async Task<string> ExchangeCodeForTokenAsync(
		OAuthProviderSettings provider,
		string code,
		string codeVerifier,
		CancellationToken cancellationToken)
	{
		using HttpClient client =
			httpClientFactory.CreateClient();

		Dictionary<string, string> parameters =
			new()
			{
				["client_id"] = provider.ClientId,
				["client_secret"] = provider.ClientSecret,
				["code"] = code,
				["redirect_uri"] = provider.RedirectUri,
				["code_verifier"] = codeVerifier
			};

		using FormUrlEncodedContent content =
			new(parameters);

		client.DefaultRequestHeaders.Accept.Add(
			new MediaTypeWithQualityHeaderValue("application/json"));

		HttpResponseMessage response =
			await client.PostAsync(
				provider.TokenEndpoint,
				content,
				cancellationToken);

		response.EnsureSuccessStatusCode();

		string json =
			await response.Content.ReadAsStringAsync(cancellationToken);

		using JsonDocument doc =
			JsonDocument.Parse(json);

		return doc.RootElement
			.GetProperty("access_token")
			.GetString()
			?? throw new InvalidOperationException(
				"No access_token in response");
	}

	/// <summary>
	/// Gets user info from GitHub API.
	/// </summary>
	private async Task<GitHubUserInfo> GetGitHubUserInfoAsync(
		string accessToken,
		CancellationToken cancellationToken)
	{
		using HttpClient client =
			httpClientFactory.CreateClient();

		client.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue("Bearer", accessToken);

		client.DefaultRequestHeaders.UserAgent.Add(
			new ProductInfoHeaderValue("SeventySix", "1.0"));

		HttpResponseMessage response =
			await client.GetAsync(
				"https://api.github.com/user",
				cancellationToken);

		response.EnsureSuccessStatusCode();

		string json =
			await response.Content.ReadAsStringAsync(cancellationToken);

		using JsonDocument doc =
			JsonDocument.Parse(json);

		JsonElement root = doc.RootElement;

		return new GitHubUserInfo(
			Id: root.GetProperty("id").GetInt64().ToString(),
			Login: root.GetProperty("login").GetString() ?? "",
			Email: root.TryGetProperty("email", out JsonElement emailElement)
				? emailElement.GetString()
				: null,
			Name: root.TryGetProperty("name", out JsonElement nameElement)
				? nameElement.GetString()
				: null);
	}

	/// <summary>
	/// Finds existing user by GitHub ID or creates new one.
	/// </summary>
	private async Task<User> FindOrCreateGitHubUserAsync(
		GitHubUserInfo userInfo,
		CancellationToken cancellationToken)
	{
		// Look for existing external login
		ExternalLogin? existingLogin =
			await context.ExternalLogins
				.Where(e => e.Provider == "GitHub")
				.Where(e => e.ProviderUserId == userInfo.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (existingLogin != null)
		{
			// Update last used
			existingLogin.LastUsedAt =
				timeProvider.GetUtcNow().UtcDateTime;

			await context.SaveChangesAsync(cancellationToken);

			return await context.Users
				.Where(u => u.Id == existingLogin.UserId)
				.FirstAsync(cancellationToken);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Create new user
		string username = userInfo.Login;
		int counter = 1;

		// Ensure unique username
		while (await context.Users.AnyAsync(
			u => u.Username == username,
			cancellationToken))
		{
			username = $"{userInfo.Login}{counter++}";
		}

		User user =
			new()
			{
				Username = username,
				Email = userInfo.Email ?? $"{userInfo.Login}@github.placeholder",
				FullName = userInfo.Name,
				IsActive = true,
				CreateDate = now,
				CreatedBy = "GitHub OAuth"
			};

		context.Users.Add(user);
		await context.SaveChangesAsync(cancellationToken);

		// Create external login
		ExternalLogin externalLogin =
			new()
			{
				UserId = user.Id,
				Provider = "GitHub",
				ProviderUserId = userInfo.Id,
				ProviderEmail = userInfo.Email,
				CreatedAt = now,
				LastUsedAt = now
			};

		context.ExternalLogins.Add(externalLogin);

		// Assign default role
		UserRole userRole =
			new()
			{
				UserId = user.Id,
				Role = "User",
				AssignedAt = now
			};

		context.UserRoles.Add(userRole);
		await context.SaveChangesAsync(cancellationToken);

		return user;
	}

	/// <summary>
	/// GitHub user info from API response.
	/// </summary>
	private record GitHubUserInfo(
		string Id,
		string Login,
		string? Email,
		string? Name);
}