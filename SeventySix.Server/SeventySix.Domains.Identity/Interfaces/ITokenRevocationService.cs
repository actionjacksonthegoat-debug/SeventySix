// <copyright file="ITokenRevocationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Token revocation operations for refresh tokens.
/// </summary>
/// <remarks>
/// Handles revoking individual tokens, token families (reuse attack response),
/// and all tokens for a user (logout-all, account compromise response).
/// </remarks>
public interface ITokenRevocationService
{
	/// <summary>
	/// Revokes a specific refresh token by its plaintext value.
	/// </summary>
	/// <param name="refreshToken">
	/// The plaintext refresh token to revoke.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if token was revoked, false if not found.
	/// </returns>
	public Task<bool> RevokeRefreshTokenAsync(
		string refreshToken,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Revokes all refresh tokens for a user.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Number of tokens revoked.
	/// </returns>
	public Task<int> RevokeAllUserTokensAsync(
		long userId,
		CancellationToken cancellationToken = default);
}