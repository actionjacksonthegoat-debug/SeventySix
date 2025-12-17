// <copyright file="IEmailVerificationTokenRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Repository for email verification token data access operations.
/// </summary>
/// <remarks>
/// Abstracts database operations for email verification during registration.
/// Keeps DbContext dependency isolated to repository layer (DIP compliance).
/// </remarks>
public interface IEmailVerificationTokenRepository
{
	/// <summary>
	/// Gets a verification token by its hash.
	/// </summary>
	/// <param name="tokenHash">The SHA256 hash of the token.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The token if found; otherwise, null.</returns>
	public Task<EmailVerificationToken?> GetByHashAsync(
		string tokenHash,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new email verification token.
	/// </summary>
	/// <param name="token">The token entity.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task CreateAsync(
		EmailVerificationToken token,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Invalidates all unused tokens for an email address.
	/// </summary>
	/// <param name="email">The email address.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Number of tokens invalidated.</returns>
	public Task<int> InvalidateTokensForEmailAsync(
		string email,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Saves changes to a tracked token entity.
	/// </summary>
	/// <param name="token">The tracked token entity.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task SaveChangesAsync(
		EmailVerificationToken token,
		CancellationToken cancellationToken = default);
}