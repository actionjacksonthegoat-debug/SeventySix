// <copyright file="OAuthService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Extensions;

namespace SeventySix.Identity;

/// <summary>
/// Authentication service for OAuth integration.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Returns AuthResult for explicit error handling (no exceptions for auth failures)
/// - Uses ASP.NET Core Identity for user management
/// - Supports GitHub OAuth authentication with PKCE
/// </remarks>
public class OAuthService(
	UserManager<ApplicationUser> userManager,
	IHttpClientFactory httpClientFactory,
	IOptions<AuthSettings> authSettings,
	TimeProvider timeProvider,
	AuthenticationService authenticationService,
	ILogger<OAuthService> logger) : IOAuthService
{
	/// <inheritdoc/>
	public string BuildGitHubAuthorizationUrl(string state, string codeVerifier)
	{
		OAuthProviderSettings? github =
			authSettings.Value.OAuth.Providers.FirstOrDefault(provider =>
				provider.Provider == OAuthProviderConstants.GitHub);

		if (github == null)
		{
			throw new InvalidOperationException(
				OAuthProviderConstants.ErrorMessages.GitHubNotConfigured);
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
			authSettings.Value.OAuth.Providers.FirstOrDefault(provider =>
				provider.Provider == OAuthProviderConstants.GitHub);

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
			ApplicationUser user =
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
	/// Exchanges authorization code for access token.
	/// </summary>
	/// <param name="provider">
	/// OAuth provider settings to use for the exchange.
	/// </param>
	/// <param name="code">
	/// The authorization code received from provider.
	/// </param>
	/// <param name="codeVerifier">
	/// The PKCE code verifier to validate the code challenge.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The provider access token string.
	/// </returns>
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
			await response.Content.ReadAsStringAsync(cancellationToken);

		using JsonDocument doc =
			JsonDocument.Parse(json);

		return doc.RootElement.GetProperty("access_token").GetString()
			?? throw new InvalidOperationException("No access_token in response");
	}

	/// <summary>
	/// Gets user info from GitHub API.
	/// </summary>
	/// <param name="accessToken">
	/// OAuth access token to call GitHub API.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A <see cref="GitHubUserInfo"/> parsed from the API response.
	/// </returns>
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
			await response.Content.ReadAsStringAsync(cancellationToken);

		using JsonDocument doc =
			JsonDocument.Parse(json);

		JsonElement root =
			doc.RootElement;

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
	/// Uses ASP.NET Core Identity's external login functionality.
	/// </summary>
	/// <param name="userInfo">
	/// The parsed GitHub user information.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The existing or newly created <see cref="ApplicationUser"/>.
	/// </returns>
	private async Task<ApplicationUser> FindOrCreateGitHubUserAsync(
		GitHubUserInfo userInfo,
		CancellationToken cancellationToken)
	{
		// Look for existing external login using Identity
		ApplicationUser? existingUser =
			await userManager.FindByLoginAsync(
				OAuthProviderConstants.GitHub,
				userInfo.Id);

		if (existingUser != null)
		{
			return existingUser;
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Create new user - ensure unique username
		string username =
			userInfo.Login;
		int counter = 1;

		while (await userManager.FindByNameAsync(username) != null)
		{
			username =
				$"{userInfo.Login}{counter++}";
		}

		ApplicationUser newUser =
			new()
			{
				UserName = username,
				Email =
					userInfo.Email
					?? $"{userInfo.Login}{OAuthProviderConstants.AuditValues.GitHubPlaceholderEmailDomain}",
				FullName = userInfo.Name,
				IsActive = true,
				CreateDate = now,
				CreatedBy =
					OAuthProviderConstants.AuditValues.GitHubOAuthCreatedBy,
			};

		// Create user without password (OAuth users don't have local passwords)
		IdentityResult createResult =
			await userManager.CreateAsync(newUser);

		if (!createResult.Succeeded)
		{
			string errors =
				string.Join(", ", createResult.Errors.Select(error => error.Description));
			throw new InvalidOperationException($"Failed to create OAuth user: {errors}");
		}

		// Add external login
		UserLoginInfo loginInfo =
			new(
				OAuthProviderConstants.GitHub,
				userInfo.Id,
				OAuthProviderConstants.GitHub);

		IdentityResult loginResult =
			await userManager.AddLoginAsync(newUser, loginInfo);

		if (!loginResult.Succeeded)
		{
			string errors = loginResult.ToErrorString();
			throw new InvalidOperationException($"Failed to add external login: {errors}");
		}

		// Assign User role
		IdentityResult roleResult =
			await userManager.AddToRoleAsync(newUser, RoleConstants.User);

		if (!roleResult.Succeeded)
		{
			string errors = roleResult.ToErrorString();
			throw new InvalidOperationException($"Failed to assign role: {errors}");
		}

		return newUser;
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