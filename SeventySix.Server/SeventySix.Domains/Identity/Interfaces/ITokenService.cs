// <copyright file="ITokenService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Token generation and validation operations.
/// </summary>
/// <remarks>
/// Handles JWT access tokens and refresh tokens.
/// Uses SHA256 hashing for refresh token storage.
/// </remarks>
public interface ITokenService
{
	/// <summary>
	/// Generates a JWT access token for the specified user.
	/// </summary>
	/// <param name="userId">The user's ID.</param>
	/// <param name="username">The user's username.</param>
	/// <param name="roles">The user's roles.</param>
	/// <returns>The JWT access token string.</returns>
	/// <remarks>
	/// PII (email, fullName) is NOT included in JWT claims for GDPR compliance.
	/// This data is returned in the AuthResponse body instead.
	/// </remarks>
	public string GenerateAccessToken(
		int userId,
		string username,
		IEnumerable<string> roles);

	/// <summary>
	/// Generates a new refresh token and stores it.
	/// </summary>
	/// <param name="userId">The user's ID.</param>
	/// <param name="clientIp">The client's IP address.</param>
	/// <param name="rememberMe">Whether to extend refresh token expiration.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The plaintext refresh token (hash stored in database).</returns>
	public Task<string> GenerateRefreshTokenAsync(
		int userId,
		string? clientIp,
		bool rememberMe = false,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Validates a refresh token and returns the associated user ID.
	/// </summary>
	/// <param name="refreshToken">The plaintext refresh token.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The user ID if valid, null otherwise.</returns>
	public Task<int?> ValidateRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes a specific refresh token.
	/// </summary>
	/// <param name="refreshToken">The plaintext refresh token to revoke.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if token was revoked, false if not found.</returns>
	public Task<bool> RevokeRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Rotates a refresh token - validates old token, revokes it, creates new one.
	/// Implements token family tracking to detect reuse attacks.
	/// </summary>
	/// <param name="refreshToken">The current plaintext refresh token.</param>
	/// <param name="clientIp">The client's IP address.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>
	/// New plaintext refresh token if successful, null if:
	/// - Token not found or expired
	/// - Token already revoked (reuse attack detected - entire family revoked)
	/// </returns>
	public Task<string?> RotateRefreshTokenAsync(
		string refreshToken,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes all refresh tokens for a user.
	/// </summary>
	/// </summary>
	/// <param name="userId">The user's ID.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Number of tokens revoked.</returns>
	public Task<int> RevokeAllUserTokensAsync(
		int userId,
		CancellationToken cancellationToken = default);
}