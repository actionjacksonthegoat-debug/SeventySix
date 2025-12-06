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

	/// <summary>
	/// Initiates a password reset flow by creating a reset token and sending an email.
	/// </summary>
	/// <remarks>
	/// Used for both:
	/// - Admin creating new user (welcome email with password setup)
	/// - User requesting password reset (forgot password).
	/// </remarks>
	/// <param name="userId">The user's ID.</param>
	/// <param name="isNewUser">True for welcome email, false for password reset email.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Task representing the async operation.</returns>
	public Task InitiatePasswordResetAsync(
		int userId,
		bool isNewUser,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Initiates password reset by email address (public endpoint).
	/// </summary>
	/// <remarks>
	/// Silently succeeds even if email doesn't exist (prevents email enumeration).
	/// Only sends email if user exists and is active.
	/// </remarks>
	/// <param name="email">The email address to send reset link to.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Task representing the async operation.</returns>
	public Task InitiatePasswordResetByEmailAsync(
		string email,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Sets a new password using a valid password reset token.
	/// </summary>
	/// <remarks>
	/// Validates the token, sets the password, and marks the token as used.
	/// Returns AuthResult to allow immediate login after password setup.
	/// </remarks>
	/// <param name="request">The set password request containing token and new password.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens if successful, or error.</returns>
	public Task<AuthResult> SetPasswordAsync(
		SetPasswordRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Initiates self-registration by sending verification email.
	/// Always returns success to prevent email enumeration.
	/// </summary>
	/// <param name="request">The registration initiation request.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Task representing the async operation.</returns>
	public Task InitiateRegistrationAsync(
		InitiateRegistrationRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Completes registration after email verification.
	/// </summary>
	/// <param name="request">The registration completion request.</param>
	/// <param name="clientIp">Client IP for token tracking.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Authentication result with tokens if successful.</returns>
	public Task<AuthResult> CompleteRegistrationAsync(
		CompleteRegistrationRequest request,
		string? clientIp,
		CancellationToken cancellationToken = default);
}