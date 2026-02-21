// <copyright file="OAuthService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Provider-agnostic OAuth authentication service.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Returns AuthResult for explicit error handling (no exceptions for auth failures)
/// - Uses ASP.NET Core Identity for user management
/// - Delegates provider-specific logic to IOAuthProviderStrategy via OAuthProviderFactory
/// - Syncs Display Name from provider on login (only if user's is empty)
/// </remarks>
public sealed class OAuthService(
	UserManager<ApplicationUser> userManager,
	OAuthProviderFactory providerFactory,
	IOptions<AuthSettings> authSettings,
	TimeProvider timeProvider,
	AuthenticationService authenticationService,
	ILogger<OAuthService> logger) : IOAuthService
{
	/// <inheritdoc/>
	public string BuildAuthorizationUrl(
		string provider,
		string redirectUri,
		string state,
		string codeVerifier)
	{
		OAuthProviderSettings providerSettings =
			GetProviderSettings(provider);

		IOAuthProviderStrategy strategy =
			providerFactory.GetStrategy(provider);

		return strategy.BuildAuthorizationUrl(
			providerSettings,
			redirectUri,
			state,
			codeVerifier);
	}

	/// <inheritdoc/>
	public async Task<AuthResult> HandleCallbackAsync(
		string provider,
		string code,
		string redirectUri,
		string codeVerifier,
		string? clientIp,
		CancellationToken cancellationToken = default)
	{
		OAuthProviderSettings? providerSettings =
			authSettings.Value.OAuth.Providers.FirstOrDefault(
				providerConfig => string.Equals(
					providerConfig.Provider,
					provider,
					StringComparison.OrdinalIgnoreCase));

		if (providerSettings is null)
		{
			return AuthResult.Failed(
				OAuthProviderConstants.ErrorMessages.ProviderNotConfigured(
					provider),
				AuthErrorCodes.OAuthError);
		}

		try
		{
			IOAuthProviderStrategy strategy =
				providerFactory.GetStrategy(provider);

			// Exchange code for access token
			string accessToken =
				await strategy.ExchangeCodeForTokenAsync(
					providerSettings,
					code,
					redirectUri,
					codeVerifier,
					cancellationToken);

			// Get user info from provider
			OAuthUserInfoResult userInfo =
				await strategy.GetUserInfoAsync(
					accessToken,
					cancellationToken);

			// Find or create user
			ApplicationUser user =
				await FindOrCreateOAuthUserAsync(
					provider,
					userInfo,
					cancellationToken);

			return await authenticationService.GenerateAuthResultAsync(
				user,
				clientIp,
				requiresPasswordChange: false,
				rememberMe: false,
				cancellationToken);
		}
		catch (HttpRequestException ex)
		{
			logger.LogError(
				ex,
				"OAuth callback failed for provider {Provider}",
				provider);

			return AuthResult.Failed(
				OAuthProviderConstants.ErrorMessages.AuthenticationFailed(
					provider),
				AuthErrorCodes.OAuthError);
		}
		catch (JsonException ex)
		{
			logger.LogError(
				ex,
				"OAuth callback failed for provider {Provider}",
				provider);

			return AuthResult.Failed(
				OAuthProviderConstants.ErrorMessages.AuthenticationFailed(
					provider),
				AuthErrorCodes.OAuthError);
		}
		catch (InvalidOperationException ex)
		{
			logger.LogError(
				ex,
				"OAuth callback failed for provider {Provider}",
				provider);

			return AuthResult.Failed(
				OAuthProviderConstants.ErrorMessages.AuthenticationFailed(
					provider),
				AuthErrorCodes.OAuthError);
		}
	}

	/// <inheritdoc/>
	public async Task<OAuthUserInfoResult?> ExchangeCodeForUserInfoAsync(
		string provider,
		string code,
		string redirectUri,
		string codeVerifier,
		CancellationToken cancellationToken = default)
	{
		OAuthProviderSettings? providerSettings =
			authSettings.Value.OAuth.Providers.FirstOrDefault(
				providerConfig => string.Equals(
					providerConfig.Provider,
					provider,
					StringComparison.OrdinalIgnoreCase));

		if (providerSettings is null)
		{
			return null;
		}

		try
		{
			IOAuthProviderStrategy strategy =
				providerFactory.GetStrategy(provider);

			string accessToken =
				await strategy.ExchangeCodeForTokenAsync(
					providerSettings,
					code,
					redirectUri,
					codeVerifier,
					cancellationToken);

			return await strategy.GetUserInfoAsync(
				accessToken,
				cancellationToken);
		}
		catch (HttpRequestException ex)
		{
			logger.LogError(
				ex,
				"Failed to exchange code for user info from provider {Provider}",
				provider);

			return null;
		}
		catch (JsonException ex)
		{
			logger.LogError(
				ex,
				"Failed to exchange code for user info from provider {Provider}",
				provider);

			return null;
		}
		catch (InvalidOperationException ex)
		{
			logger.LogError(
				ex,
				"Failed to exchange code for user info from provider {Provider}",
				provider);

			return null;
		}
	}

	/// <summary>
	/// Gets provider settings or throws if not configured.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name.
	/// </param>
	/// <returns>
	/// The provider settings.
	/// </returns>
	/// <exception cref="InvalidOperationException">
	/// Thrown when the provider is not configured.
	/// </exception>
	private OAuthProviderSettings GetProviderSettings(string provider)
	{
		return authSettings.Value.OAuth.Providers.FirstOrDefault(
			providerConfig => string.Equals(
				providerConfig.Provider,
				provider,
				StringComparison.OrdinalIgnoreCase))
			?? throw new InvalidOperationException(
				OAuthProviderConstants.ErrorMessages.ProviderNotConfigured(
					provider));
	}

	/// <summary>
	/// Finds existing user by provider login or creates new one.
	/// Uses ASP.NET Core Identity's external login functionality.
	/// Syncs Display Name from provider if user's is empty.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name (e.g., "GitHub").
	/// </param>
	/// <param name="userInfo">
	/// The standardized OAuth user information.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The existing or newly created <see cref="ApplicationUser"/>.
	/// </returns>
	private async Task<ApplicationUser> FindOrCreateOAuthUserAsync(
		string provider,
		OAuthUserInfoResult userInfo,
		CancellationToken cancellationToken)
	{
		// Look for existing external login using Identity
		ApplicationUser? existingUser =
			await userManager.FindByLoginAsync(
				provider,
				userInfo.ProviderId);

		if (existingUser is not null)
		{
			// Sync Display Name from provider if user's is empty
			if (string.IsNullOrEmpty(existingUser.FullName)
				&& !string.IsNullOrEmpty(userInfo.FullName))
			{
				existingUser.FullName = userInfo.FullName;
				existingUser.ModifyDate = timeProvider.GetUtcNow();
				existingUser.ModifiedBy =
					OAuthProviderConstants.GetAuditSource(provider);
				await userManager.UpdateAsync(existingUser);
			}

			return existingUser;
		}

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		// Create new user — use deterministic unique username
		string username =
			$"{provider.ToLowerInvariant()}_{userInfo.ProviderId}";

		string placeholderEmailDomain =
			OAuthProviderConstants.GetPlaceholderEmailDomain(provider);

		ApplicationUser newUser =
			new()
			{
				UserName = username,
				Email =
					userInfo.Email
						?? $"{userInfo.Login}{placeholderEmailDomain}",
				FullName = userInfo.FullName,
				IsActive = true,
				CreateDate = now,
				CreatedBy = OAuthProviderConstants.GetAuditSource(provider),
			};

		await RegisterOAuthUserAsync(
			newUser,
			provider,
			userInfo.ProviderId);

		return newUser;
	}

	/// <summary>
	/// Creates the user in Identity, links the external login, and assigns the User role.
	/// </summary>
	/// <param name="newUser">
	/// The pre-built <see cref="ApplicationUser"/> to persist.
	/// </param>
	/// <param name="provider">
	/// OAuth provider name (e.g. "GitHub").
	/// </param>
	/// <param name="providerId">
	/// Provider-specific user identifier.
	/// </param>
	private async Task RegisterOAuthUserAsync(
		ApplicationUser newUser,
		string provider,
		string providerId)
	{
		IdentityResult createResult =
			await userManager.CreateAsync(newUser);

		if (!createResult.Succeeded)
		{
			string errors =
				string.Join(
					", ",
					createResult.Errors.Select(error => error.Description));
			logger.LogError(
				"Failed to create OAuth user: {Errors}",
				errors);
			throw new InvalidOperationException(
				ProblemDetailConstants.Details.OAuthUserCreationFailed);
		}

		UserLoginInfo loginInfo =
			new(provider, providerId, provider);

		IdentityResult loginResult =
			await userManager.AddLoginAsync(newUser, loginInfo);

		if (!loginResult.Succeeded)
		{
			string errors = loginResult.ToErrorString();
			logger.LogError(
				"Failed to add external login: {Errors}",
				errors);
			throw new InvalidOperationException(
				ProblemDetailConstants.Details.ExternalLoginLinkFailed);
		}

		IdentityResult roleResult =
			await userManager.AddToRoleAsync(
				newUser,
				RoleConstants.User);

		if (!roleResult.Succeeded)
		{
			string errors = roleResult.ToErrorString();
			logger.LogError(
				"Failed to assign role: {Errors}",
				errors);
			throw new InvalidOperationException(
				ProblemDetailConstants.Details.RoleAssignmentFailed);
		}
	}
}