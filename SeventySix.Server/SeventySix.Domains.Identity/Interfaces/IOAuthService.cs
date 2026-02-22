// <copyright file="IOAuthService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// OAuth authentication operations.
/// </summary>
/// <remarks>
/// Focused service following SRP — handles OAuth provider integrations.
/// Provider-agnostic: delegates provider-specific logic to IOAuthProviderStrategy.
/// </remarks>
public interface IOAuthService
{
	/// <summary>
	/// Generates the OAuth authorization URL for the specified provider.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name (e.g., "GitHub").
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
	/// The provider's authorization URL.
	/// </returns>
	public string BuildAuthorizationUrl(
		string provider,
		string redirectUri,
		string state,
		string codeVerifier);

	/// <summary>
	/// Handles the OAuth callback and authenticates/registers the user.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name (e.g., "GitHub").
	/// </param>
	/// <param name="code">
	/// Authorization code from the provider.
	/// </param>
	/// <param name="redirectUri">
	/// The callback redirect URI (must match the one used in authorization).
	/// </param>
	/// <param name="codeVerifier">
	/// PKCE code verifier.
	/// </param>
	/// <param name="clientIp">
	/// Client IP for token tracking.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Authentication result with tokens or error.
	/// </returns>
	public Task<AuthResult> HandleCallbackAsync(
		string provider,
		string code,
		string redirectUri,
		string codeVerifier,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Exchanges the authorization code for user info from the provider.
	/// Used by the account linking flow which needs user info but not authentication.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name.
	/// </param>
	/// <param name="code">
	/// Authorization code from the provider.
	/// </param>
	/// <param name="redirectUri">
	/// The callback redirect URI.
	/// </param>
	/// <param name="codeVerifier">
	/// PKCE code verifier.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// User info from the provider, or null on failure.
	/// </returns>
	public Task<OAuthUserInfoResult?> ExchangeCodeForUserInfoAsync(
		string provider,
		string code,
		string redirectUri,
		string codeVerifier,
		CancellationToken cancellationToken = default);
}