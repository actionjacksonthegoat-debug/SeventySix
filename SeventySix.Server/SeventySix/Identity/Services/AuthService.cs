// <copyright file="AuthService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text.Json;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
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
	IValidator<SetPasswordRequest> setPasswordValidator,
	IValidator<InitiateRegistrationRequest> initiateRegistrationValidator,
	IValidator<CompleteRegistrationRequest> completeRegistrationValidator,
	IEmailService emailService,
	TimeProvider timeProvider,
	ITransactionManager transactionManager,
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

		// Get role ID before creating entities (read-only query)
		int userRoleId =
			await GetRoleIdByNameAsync(
				"User",
				cancellationToken);

		// Create user with credential and role atomically
		User user =
			await transactionManager.ExecuteInTransactionAsync(
				async transactionCancellationToken =>
				{
					User newUser =
						new()
						{
							Username = request.Username,
							Email = request.Email,
							FullName = request.FullName,
							IsActive = true,
							CreateDate = now,
							CreatedBy = "Registration"
						};

					context.Users.Add(newUser);

					// Save user first to get the ID
					await context.SaveChangesAsync(transactionCancellationToken);

					// Create credential with user ID
					string passwordHash =
						BCrypt.Net.BCrypt.HashPassword(
							request.Password,
							authSettings.Value.Password.WorkFactor);

					UserCredential credential =
						new()
						{
							UserId = newUser.Id,
							PasswordHash = passwordHash,
							CreateDate = now
						};

					context.UserCredentials.Add(credential);

					// Assign default role
					UserRole userRole =
						new()
						{
							UserId = newUser.Id,
							RoleId = userRoleId
						};

					context.UserRoles.Add(userRole);

					await context.SaveChangesAsync(transactionCancellationToken);

					return newUser;
				},
				cancellationToken: cancellationToken);

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
				.Include(ur => ur.Role)
				.Select(ur => ur.Role!.Name)
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
				.FirstOrDefault(p => p.Provider == OAuthProviderConstants.GitHub);

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
				.FirstOrDefault(p => p.Provider == OAuthProviderConstants.GitHub);

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
					CreateDate = now
				};

			context.UserCredentials.Add(credential);
		}

		await context.SaveChangesAsync(cancellationToken);

		// Revoke all tokens to require re-login
		await tokenService.RevokeAllUserTokensAsync(
			userId,
			cancellationToken);

		return AuthResult.Succeeded();
	}

	/// <inheritdoc/>
	public async Task InitiatePasswordResetAsync(
		int userId,
		bool isNewUser,
		CancellationToken cancellationToken = default)
	{
		User user =
			await context.Users
				.AsNoTracking()
				.Where(u => u.Id == userId)
				.FirstOrDefaultAsync(cancellationToken)
			?? throw new InvalidOperationException($"User with ID {userId} not found.");

		// Invalidate any existing unused tokens for this user
		await context.PasswordResetTokens
			.Where(t => t.UserId == userId && !t.IsUsed)
			.ExecuteUpdateAsync(
				setters => setters.SetProperty(t => t.IsUsed, true),
				cancellationToken);

		// Generate secure token
		byte[] tokenBytes =
			RandomNumberGenerator.GetBytes(64);
		string token =
			Convert.ToBase64String(tokenBytes);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		PasswordResetToken resetToken =
			new()
			{
				UserId = userId,
				Token = token,
				ExpiresAt = now.AddHours(24),
				CreateDate = now,
				IsUsed = false,
			};

		context.PasswordResetTokens.Add(resetToken);
		await context.SaveChangesAsync(cancellationToken);

		// Send appropriate email
		if (isNewUser)
		{
			await emailService.SendWelcomeEmailAsync(
				user.Email,
				user.Username,
				token,
				cancellationToken);
		}
		else
		{
			await emailService.SendPasswordResetEmailAsync(
				user.Email,
				user.Username,
				token,
				cancellationToken);
		}
	}

	/// <inheritdoc/>
	public async Task InitiatePasswordResetByEmailAsync(
		string email,
		CancellationToken cancellationToken = default)
	{
		User? user =
			await context.Users
				.AsNoTracking()
				.Where(user => user.Email.ToLower() == email.ToLower()
					&& user.IsActive)
				.FirstOrDefaultAsync(cancellationToken);

		// Silent success for non-existent/inactive emails (prevents enumeration)
		if (user == null)
		{
			return;
		}

		await InitiatePasswordResetAsync(
			user.Id,
			isNewUser: false,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<AuthResult> SetPasswordAsync(
		SetPasswordRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		// Validate request
		ValidationResult validationResult =
			await setPasswordValidator.ValidateAsync(request, cancellationToken);

		if (!validationResult.IsValid)
		{
			string errorMessage =
				string.Join(" ", validationResult.Errors.Select(e => e.ErrorMessage));

			return AuthResult.Failed(
				errorMessage,
				"VALIDATION_ERROR");
		}

		// Find the token
		PasswordResetToken? resetToken =
			await context.PasswordResetTokens
				.Where(t => t.Token == request.Token)
				.FirstOrDefaultAsync(cancellationToken);

		if (resetToken == null)
		{
			logger.LogWarning("Invalid password reset token attempted.");
			return AuthResult.Failed(
				"Invalid or expired reset token.",
				AuthErrorCodes.InvalidToken);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		if (resetToken.IsUsed)
		{
			logger.LogWarning(
				"Attempted to use already-used reset token. UserId: {UserId}",
				resetToken.UserId);
			return AuthResult.Failed(
				"This reset link has already been used.",
				AuthErrorCodes.TokenExpired);
		}

		if (resetToken.ExpiresAt < now)
		{
			logger.LogWarning(
				"Attempted to use expired reset token. UserId: {UserId}, ExpiredAt: {ExpiredAt}",
				resetToken.UserId,
				resetToken.ExpiresAt);
			return AuthResult.Failed(
				"This reset link has expired.",
				AuthErrorCodes.TokenExpired);
		}

		// Get the user
		User? user =
			await context.Users
				.Where(u => u.Id == resetToken.UserId)
				.FirstOrDefaultAsync(cancellationToken);

		if (user == null)
		{
			logger.LogError(
				"User not found for valid reset token. UserId: {UserId}",
				resetToken.UserId);
			return AuthResult.Failed(
				"User not found.",
				AuthErrorCodes.UserNotFound);
		}

		// Mark token as used
		resetToken.IsUsed = true;

		// Update or create credential
		UserCredential? credential =
			await context.UserCredentials
				.Where(c => c.UserId == user.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (credential != null)
		{
			credential.PasswordHash =
				BCrypt.Net.BCrypt.HashPassword(
					request.NewPassword,
					authSettings.Value.Password.WorkFactor);
			credential.PasswordChangedAt = now;
		}
		else
		{
			credential =
				new UserCredential
				{
					UserId = user.Id,
					PasswordHash =
						BCrypt.Net.BCrypt.HashPassword(
							request.NewPassword,
							authSettings.Value.Password.WorkFactor),
					CreateDate = now
				};

			context.UserCredentials.Add(credential);
		}

		await context.SaveChangesAsync(cancellationToken);

		// Revoke all existing tokens
		await tokenService.RevokeAllUserTokensAsync(
			user.Id,
			cancellationToken);

		// Generate new auth tokens for immediate login
		return await GenerateAuthResultAsync(
			user,
			clientIp,
			requiresPasswordChange: false,
			cancellationToken);
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
				.Include(r => r.Role)
				.Select(r => r.Role!.Name)
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
	/// Gets the RoleId for a given role name from SecurityRoles table.
	/// </summary>
	/// <param name="roleName">The role name to look up.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The role ID.</returns>
	/// <exception cref="InvalidOperationException">Thrown if role not found.</exception>
	private async Task<int> GetRoleIdByNameAsync(
		string roleName,
		CancellationToken cancellationToken)
	{
		int? roleId =
			await context.SecurityRoles
				.Where(securityRole => securityRole.Name == roleName)
				.Select(securityRole => (int?)securityRole.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (roleId is null)
		{
			throw new InvalidOperationException($"Role '{roleName}' not found in SecurityRoles");
		}

		return roleId.Value;
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
			new MediaTypeWithQualityHeaderValue(MediaTypeConstants.Json));

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
				.Where(externalLogin => externalLogin.Provider == OAuthProviderConstants.GitHub)
				.Where(externalLogin => externalLogin.ProviderUserId == userInfo.Id)
				.FirstOrDefaultAsync(cancellationToken);

		if (existingLogin != null)
		{
			// Update last used
			existingLogin.LastUsedAt =
				timeProvider.GetUtcNow().UtcDateTime;

			await context.SaveChangesAsync(cancellationToken);

			return await context.Users
				.Where(user => user.Id == existingLogin.UserId)
				.FirstAsync(cancellationToken);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Get role ID before creating entities (read-only query)
		int userRoleId =
			await GetRoleIdByNameAsync(
				"User",
				cancellationToken);

		// Create user with external login and role atomically
		return await transactionManager.ExecuteInTransactionAsync(
			async transactionCancellationToken =>
			{
				// Create new user - ensure unique username
				string username =
					userInfo.Login;
				int counter =
					1;

				while (await context.Users.AnyAsync(
					user => user.Username == username,
					transactionCancellationToken))
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

				// Save user first to get the ID
				await context.SaveChangesAsync(transactionCancellationToken);

				// Create external login with user ID
				ExternalLogin externalLogin =
					new()
					{
						UserId = user.Id,
						Provider = OAuthProviderConstants.GitHub,
						ProviderUserId = userInfo.Id,
						ProviderEmail = userInfo.Email,
						CreateDate = now,
						LastUsedAt = now
					};

				context.ExternalLogins.Add(externalLogin);

				// Assign default role
				UserRole userRole =
					new()
					{
						UserId = user.Id,
						RoleId = userRoleId
					};

				context.UserRoles.Add(userRole);

				await context.SaveChangesAsync(transactionCancellationToken);

				return user;
			},
			cancellationToken: cancellationToken);
	}

	/// <inheritdoc/>
	public async Task InitiateRegistrationAsync(
		InitiateRegistrationRequest request,
		CancellationToken cancellationToken = default)
	{
		await initiateRegistrationValidator.ValidateAndThrowAsync(
			request,
			cancellationToken);

		string email =
			request.Email;

		// Check if email is already registered
		bool emailExists =
			await context.Users
				.AsNoTracking()
				.AnyAsync(
					u => u.Email.ToLower() == email.ToLower(),
					cancellationToken);

		if (emailExists)
		{
			return; // Silent success to prevent enumeration
		}

		// Invalidate any existing verification tokens for this email
		List<EmailVerificationToken> existingTokens =
			await context.EmailVerificationTokens
				.Where(t => t.Email.ToLower() == email.ToLower()
					&& !t.IsUsed)
				.ToListAsync(cancellationToken);

		foreach (EmailVerificationToken existingToken in existingTokens)
		{
			existingToken.IsUsed = true;
		}

		// Generate new verification token
		byte[] tokenBytes =
			RandomNumberGenerator.GetBytes(64);
		string token =
			Convert.ToBase64String(tokenBytes);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		EmailVerificationToken verificationToken =
			new()
			{
				Email = email,
				Token = token,
				ExpiresAt = now.AddHours(24),
				CreateDate = now,
				IsUsed = false,
			};

		context.EmailVerificationTokens.Add(verificationToken);
		await context.SaveChangesAsync(cancellationToken);

		// Send verification email
		await emailService.SendVerificationEmailAsync(
			email,
			token,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<AuthResult> CompleteRegistrationAsync(
		CompleteRegistrationRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		await completeRegistrationValidator.ValidateAndThrowAsync(
			request,
			cancellationToken);

		// Find the verification token
		EmailVerificationToken? verificationToken =
			await context.EmailVerificationTokens
				.Where(t => t.Token == request.Token)
				.FirstOrDefaultAsync(cancellationToken);

		if (verificationToken == null)
		{
			logger.LogWarning("Invalid email verification token attempted.");
			return AuthResult.Failed(
				"Invalid or expired verification link.",
				AuthErrorCodes.InvalidToken);
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		if (verificationToken.IsUsed)
		{
			logger.LogWarning(
				"Attempted to use already-used verification token. Email: {Email}",
				verificationToken.Email);
			return AuthResult.Failed(
				"This verification link has already been used.",
				AuthErrorCodes.TokenExpired);
		}

		if (verificationToken.ExpiresAt < now)
		{
			logger.LogWarning(
				"Attempted to use expired verification token. Email: {Email}, ExpiredAt: {ExpiredAt}",
				verificationToken.Email,
				verificationToken.ExpiresAt);
			return AuthResult.Failed(
				"This verification link has expired. Please request a new one.",
				AuthErrorCodes.TokenExpired);
		}

		// Check if username already exists
		bool usernameExists =
			await context.Users
				.AsNoTracking()
				.AnyAsync(
					u => u.Username.ToLower() == request.Username.ToLower(),
					cancellationToken);

		if (usernameExists)
		{
			logger.LogWarning(
				"Registration attempt with existing username: {Username}",
				request.Username);
			return AuthResult.Failed(
				"Username is already taken.",
				AuthErrorCodes.UsernameExists);
		}

		// Double-check email isn't already registered (race condition protection)
		bool emailExists =
			await context.Users
				.AsNoTracking()
				.AnyAsync(
					u => u.Email.ToLower() == verificationToken.Email.ToLower(),
					cancellationToken);

		if (emailExists)
		{
			logger.LogWarning(
				"Registration attempt with already registered email: {Email}",
				verificationToken.Email);
			return AuthResult.Failed(
				"This email is already registered.",
				AuthErrorCodes.EmailExists);
		}

		// Get role ID before creating entities (read-only query)
		int userRoleId =
			await GetRoleIdByNameAsync(
				"User",
				cancellationToken);

		// Create user with credential and role atomically
		User user =
			await transactionManager.ExecuteInTransactionAsync(
				async transactionCancellationToken =>
				{
					User newUser =
						new()
						{
							Username = request.Username,
							Email = verificationToken.Email,
							IsActive = true,
							CreateDate = now,
							CreatedBy = "Self-Registration",
						};

					context.Users.Add(newUser);

					// Mark token as used
					verificationToken.IsUsed = true;

					// Save user first to get the ID
					await context.SaveChangesAsync(transactionCancellationToken);

					// Create credential with user ID
					string hashedPassword =
						BCrypt.Net.BCrypt.HashPassword(
							request.Password,
							authSettings.Value.Password.WorkFactor);

					UserCredential credential =
						new()
						{
							UserId = newUser.Id,
							PasswordHash = hashedPassword,
							CreateDate = now,
							PasswordChangedAt = now, // Set to now so no password change required
						};

					context.UserCredentials.Add(credential);

					// Assign default User role
					UserRole userRole =
						new()
						{
							UserId = newUser.Id,
							RoleId = userRoleId
						};

					context.UserRoles.Add(userRole);

					await context.SaveChangesAsync(transactionCancellationToken);

					return newUser;
				},
				cancellationToken: cancellationToken);

		// Generate tokens for immediate login
		List<string> roles =
			["User"];

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

		return AuthResult.Succeeded(
			accessToken,
			refreshToken,
			timeProvider.GetUtcNow().AddMinutes(jwtSettings.Value.AccessTokenExpirationMinutes).UtcDateTime,
			requiresPasswordChange: false);
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