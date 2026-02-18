// <copyright file="IOAuthProviderStrategy.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Strategy interface for OAuth provider-specific logic.
/// Each provider (GitHub, Google, etc.) implements this interface.
/// Adding a new provider requires ONLY:
///   1. A new class implementing this interface
///   2. An appsettings entry with provider config
///   3. A user secret pair (ClientId + ClientSecret)
/// </summary>
public interface IOAuthProviderStrategy
{
	/// <summary>
	/// Gets the provider name (e.g., "GitHub", "Google").
	/// Must match the OAuthProviderSettings.Provider value in appsettings.
	/// </summary>
	public string ProviderName { get; }

	/// <summary>
	/// Builds the authorization URL for this provider.
	/// </summary>
	/// <param name="settings">
	/// The OAuth provider settings containing client ID, endpoints, scopes.
	/// </param>
	/// <param name="redirectUri">
	/// The callback redirect URI.
	/// </param>
	/// <param name="state">
	/// CSRF state parameter.
	/// </param>
	/// <param name="codeVerifier">
	/// PKCE code verifier.
	/// </param>
	/// <returns>
	/// The full authorization URL to redirect the user to.
	/// </returns>
	public string BuildAuthorizationUrl(
		OAuthProviderSettings settings,
		string redirectUri,
		string state,
		string codeVerifier);

	/// <summary>
	/// Exchanges an authorization code for an access token.
	/// </summary>
	/// <param name="settings">
	/// The OAuth provider settings containing client ID, secret, endpoints.
	/// </param>
	/// <param name="code">
	/// The authorization code received from the provider.
	/// </param>
	/// <param name="redirectUri">
	/// The callback redirect URI (must match the one used in authorization).
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
	public Task<string> ExchangeCodeForTokenAsync(
		OAuthProviderSettings settings,
		string code,
		string redirectUri,
		string codeVerifier,
		CancellationToken cancellationToken);

	/// <summary>
	/// Gets standardized user info from the provider API.
	/// </summary>
	/// <param name="accessToken">
	/// The OAuth access token for the provider API.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Standardized OAuth user information.
	/// </returns>
	public Task<OAuthUserInfo> GetUserInfoAsync(
		string accessToken,
		CancellationToken cancellationToken);
}