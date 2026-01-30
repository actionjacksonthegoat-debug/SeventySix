// <copyright file="IOAuthService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// OAuth authentication operations.
/// </summary>
/// <remarks>
/// Focused service following SRP - handles OAuth provider integrations.
/// Currently supports GitHub, extensible for other providers.
/// </remarks>
public interface IOAuthService
{
	/// <summary>
	/// Generates the OAuth authorization URL for GitHub.
	/// </summary>
	/// <param name="state">
	/// CSRF state parameter.
	/// </param>
	/// <param name="codeVerifier">
	/// PKCE code verifier.
	/// </param>
	/// <returns>
	/// GitHub authorization URL.
	/// </returns>
	public string BuildGitHubAuthorizationUrl(
		string state,
		string codeVerifier);

	/// <summary>
	/// Handles the OAuth callback and authenticates/registers the user.
	/// </summary>
	/// <param name="code">
	/// Authorization code from GitHub.
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
	public Task<AuthResult> HandleGitHubCallbackAsync(
		string code,
		string codeVerifier,
		string? clientIp,
		CancellationToken cancellationToken = default);
}