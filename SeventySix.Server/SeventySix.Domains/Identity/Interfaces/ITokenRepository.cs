// <copyright file="ITokenRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Repository for refresh token data access operations.
/// </summary>
/// <remarks>
/// Abstracts database operations for TokenService.
/// Keeps DbContext dependency isolated to repository layer (DIP compliance).
/// </remarks>
public interface ITokenRepository
{
	/// <summary>
	/// Gets a refresh token by its hash.
	/// </summary>
	/// <param name="tokenHash">The SHA256 hash of the token.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The refresh token if found; otherwise, null.</returns>
	public Task<RefreshToken?> GetByTokenHashAsync(
		string tokenHash,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the count of active (non-revoked, non-expired) sessions for a user.
	/// </summary>
	/// <param name="userId">The user ID.</param>
	/// <param name="currentTime">Current UTC time for expiration check.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Count of active sessions.</returns>
	public Task<int> GetActiveSessionCountAsync(
		int userId,
		DateTime currentTime,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new refresh token.
	/// </summary>
	/// <param name="token">The refresh token entity.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task CreateAsync(
		RefreshToken token,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes a specific token by setting IsRevoked and RevokedAt.
	/// </summary>
	/// <param name="token">The token to revoke (must be tracked).</param>
	/// <param name="revokedAt">The revocation timestamp.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task RevokeAsync(
		RefreshToken token,
		DateTime revokedAt,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes all active tokens for a user.
	/// </summary>
	/// <param name="userId">The user ID.</param>
	/// <param name="revokedAt">The revocation timestamp.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Number of tokens revoked.</returns>
	public Task<int> RevokeAllUserTokensAsync(
		int userId,
		DateTime revokedAt,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes all tokens in a token family (for reuse attack response).
	/// </summary>
	/// <param name="familyId">The token family identifier.</param>
	/// <param name="revokedAt">The revocation timestamp.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task RevokeFamilyAsync(
		Guid familyId,
		DateTime revokedAt,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes the oldest active token for a user (for session limit enforcement).
	/// </summary>
	/// <param name="userId">The user ID.</param>
	/// <param name="currentTime">Current UTC time for expiration check.</param>
	/// <param name="revokedAt">The revocation timestamp.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task RevokeOldestActiveTokenAsync(
		int userId,
		DateTime currentTime,
		DateTime revokedAt,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Validates a refresh token and returns the user ID if valid.
	/// </summary>
	/// <param name="tokenHash">The SHA256 hash of the token.</param>
	/// <param name="currentTime">Current UTC time for expiration check.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>User ID if token is valid; otherwise, null.</returns>
	public Task<int?> ValidateTokenAsync(
		string tokenHash,
		DateTime currentTime,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes a token by its hash.
	/// </summary>
	/// <param name="tokenHash">The SHA256 hash of the token.</param>
	/// <param name="revokedAt">The revocation timestamp.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if token was revoked; false if not found.</returns>
	public Task<bool> RevokeByHashAsync(
		string tokenHash,
		DateTime revokedAt,
		CancellationToken cancellationToken = default);
}
