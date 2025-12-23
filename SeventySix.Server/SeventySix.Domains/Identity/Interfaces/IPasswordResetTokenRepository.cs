// <copyright file="IPasswordResetTokenRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Repository for password reset token data access operations.
/// </summary>
/// <remarks>
/// Abstracts database operations for password reset functionality.
/// Keeps DbContext dependency isolated to repository layer (DIP compliance).
/// </remarks>
public interface IPasswordResetTokenRepository
{
	/// <summary>
	/// Gets a password reset token by its hash.
	/// </summary>
	/// <param name="tokenHash">
	/// The SHA256 hash of the token.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The token if found; otherwise, null.
	/// </returns>
	public Task<PasswordResetToken?> GetByHashAsync(
		string tokenHash,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new password reset token.
	/// </summary>
	/// <param name="token">
	/// The token entity.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	public Task CreateAsync(
		PasswordResetToken token,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Marks a token as used.
	/// </summary>
	/// <param name="token">
	/// The token entity (must be tracked).
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	public Task MarkAsUsedAsync(
		PasswordResetToken token,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Invalidates all unused tokens for a user.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <param name="invalidatedAt">
	/// The timestamp when tokens were invalidated.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Number of tokens invalidated.
	/// </returns>
	public Task<int> InvalidateAllUserTokensAsync(
		int userId,
		DateTime invalidatedAt,
		CancellationToken cancellationToken = default);
}