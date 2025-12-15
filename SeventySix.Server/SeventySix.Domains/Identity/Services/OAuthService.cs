// <copyright file="OAuthService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Extensions;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Identity;

/// <summary>
/// Authentication service for login, registration, and OAuth.
/// </summary>
/// <remarks>
/// Design Principles:
/// - BCrypt for password hashing with configurable work factor
/// - Returns AuthResult for explicit error handling (no exceptions for auth failures)
/// - Supports both local and GitHub OAuth authentication
/// - DIP compliant: Depends on repository abstractions, not DbContext
///
/// ISP Pattern: Single implementation, multiple focused interfaces.
/// Callers depend only on the specific interface they need.
/// </remarks>
public class OAuthService(
	IAuthRepository authRepository,
	IUserQueryRepository userQueryRepository,
	IHttpClientFactory httpClientFactory,
	IOptions<AuthSettings> authSettings,
	TimeProvider timeProvider,
	ITransactionManager transactionManager,
	AuthenticationService authenticationService,
	ILogger<OAuthService> logger) : IOAuthService
{
	/// <inheritdoc/>
	public string BuildGitHubAuthorizationUrl(string state, string codeVerifier)
	{
		OAuthProviderSettings? github =
			authSettings.Value.OAuth.Providers.FirstOrDefault(p =>
				p.Provider == OAuthProviderConstants.GitHub);

		if (github == null)
		{
			throw new InvalidOperationException(
				OAuthProviderConstants.ErrorMessages.GitHubNotConfigured);
		}

		// Generate PKCE code challenge
		string codeChallenge =
			CryptoExtensions.ComputePkceCodeChallenge(
				codeVerifier);

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
			authSettings.Value.OAuth.Providers.FirstOrDefault(p =>
				p.Provider == OAuthProviderConstants.GitHub);

		if (github == null)
		{
			return AuthResult.Failed(
				OAuthProviderConstants.ErrorMessages.GitHubOAuthDisabled,
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

			return await authenticationService.GenerateAuthResultAsync(
				user,
				clientIp,
				requiresPasswordChange: false,
				rememberMe: false,
				cancellationToken);
		}
		catch (Exception ex)
		{
			logger.LogError(
				ex,
				OAuthProviderConstants.ErrorMessages.GitHubCallbackFailed);

			return AuthResult.Failed(
				OAuthProviderConstants.ErrorMessages.GitHubAuthenticationFailed,
				AuthErrorCodes.OAuthError);
		}
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
			await authRepository.GetRoleIdByNameAsync(
				roleName,
				cancellationToken);

		if (roleId is null)
		{
			throw new InvalidOperationException(
				$"Role '{roleName}' not found in SecurityRoles");
		}

		return roleId.Value;
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
			["code_verifier"] = codeVerifier,
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
			await response.Content.ReadAsStringAsync(
				cancellationToken);

		using JsonDocument doc =
			JsonDocument.Parse(json);

		return doc.RootElement.GetProperty("access_token").GetString()
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
				OAuthProviderConstants.Endpoints.GitHubUserApi,
				cancellationToken);

		response.EnsureSuccessStatusCode();

		string json =
			await response.Content.ReadAsStringAsync(
				cancellationToken);

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
			await authRepository.GetExternalLoginAsync(
				OAuthProviderConstants.GitHub,
				userInfo.Id,
				cancellationToken);

		if (existingLogin != null)
		{
			// Update last used
			existingLogin.LastUsedAt =
				timeProvider.GetUtcNow().UtcDateTime;

			await authRepository.UpdateExternalLoginAsync(
				existingLogin,
				cancellationToken);

			User? existingUser =
				await userQueryRepository.GetByIdAsync(
					existingLogin.UserId,
					cancellationToken);

			return existingUser
				?? throw new InvalidOperationException(
					$"User with ID {existingLogin.UserId} not found for external login.");
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Get role ID before creating entities (read-only query)
		int userRoleId =
			await GetRoleIdByNameAsync(
				RoleConstants.User,
				cancellationToken);

		// Create user with external login and role atomically
		return await transactionManager.ExecuteInTransactionAsync(
			async transactionCancellationToken =>
			{
				// Create new user - ensure unique username
				string username = userInfo.Login;
				int counter = 1;

				while (
					await authRepository.UsernameExistsAsync(
						username,
						transactionCancellationToken))
				{
					username =
						$"{userInfo.Login}{counter++}";
				}

				User user =
					new()
				{
					Username = username,
					Email =
						userInfo.Email
						?? $"{userInfo.Login}{OAuthProviderConstants.AuditValues.GitHubPlaceholderEmailDomain}",
					FullName = userInfo.Name,
					IsActive = true,
					CreateDate = now,
					CreatedBy =
					OAuthProviderConstants
						.AuditValues
						.GitHubOAuthCreatedBy,
				};

				// Create user with role assignment
				User createdUser =
					await authRepository.CreateUserWithRoleAsync(
						user,
						userRoleId,
						transactionCancellationToken);

				// Create external login with user ID
				ExternalLogin externalLogin =
					new()
				{
					UserId = createdUser.Id,
					Provider =
					OAuthProviderConstants.GitHub,
					ProviderUserId = userInfo.Id,
					ProviderEmail = userInfo.Email,
					CreateDate = now,
					LastUsedAt = now,
				};

				await authRepository.CreateExternalLoginAsync(
					externalLogin,
					transactionCancellationToken);

				return createdUser;
			},
			cancellationToken: cancellationToken);
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
