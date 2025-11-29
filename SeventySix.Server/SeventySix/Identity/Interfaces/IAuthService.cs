// <copyright file="IAuthService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Authentication operations for login, registration, and OAuth.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Returns Result types for explicit error handling
/// - Uses DTOs for all inputs/outputs (no entity exposure)
/// - Handles both local and OAuth authentication
/// </remarks>
public interface IAuthService
{
	/// <summary>
	/// Authenticates a user with username/email and password.
	/// </summary>
	/// <param name="request">Login credentials.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens or error.</returns>
	public Task<AuthResult> LoginAsync(
		LoginRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Registers a new user with local credentials.
	/// </summary>
	/// <param name="request">Registration details.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens or error.</returns>
	public Task<AuthResult> RegisterAsync(
		RegisterRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Exchanges a refresh token for new access and refresh tokens.
	/// </summary>
	/// <param name="refreshToken">The current refresh token.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>New token pair or error.</returns>
	public Task<AuthResult> RefreshTokensAsync(
		string refreshToken,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes the specified refresh token (logout).
	/// </summary>
	/// <param name="refreshToken">The refresh token to revoke.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if revoked successfully.</returns>
	public Task<bool> LogoutAsync(
		string refreshToken,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Generates the OAuth authorization URL for GitHub.
	/// </summary>
	/// <param name="state">CSRF state parameter.</param>
	/// <param name="codeVerifier">PKCE code verifier.</param>
	/// <returns>GitHub authorization URL.</returns>
	public string BuildGitHubAuthorizationUrl(
		string state,
		string codeVerifier);

	/// <summary>
	/// Handles the OAuth callback and authenticates/registers the user.
	/// </summary>
	/// <param name="code">Authorization code from GitHub.</param>
	/// <param name="codeVerifier">PKCE code verifier.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens or error.</returns>
	public Task<AuthResult> HandleGitHubCallbackAsync(
		string code,
		string codeVerifier,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the current user's profile.
	/// </summary>
	/// <param name="userId">The authenticated user's ID.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>User profile or null if not found.</returns>
	public Task<UserProfileDto?> GetCurrentUserAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Changes the current user's password.
	/// </summary>
	/// <param name="userId">The authenticated user's ID.</param>
	/// <param name="request">Password change request.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Result indicating success or failure with error details.</returns>
	public Task<AuthResult> ChangePasswordAsync(
		int userId,
		ChangePasswordRequest request,
		CancellationToken cancellationToken = default);
}