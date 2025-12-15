// <copyright file="ICredentialRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Repository for user credential data access operations.
/// </summary>
/// <remarks>
/// Abstracts database operations for credential management.
/// Keeps DbContext dependency isolated to repository layer (DIP compliance).
/// </remarks>
public interface ICredentialRepository
{
	/// <summary>
	/// Gets a user credential by user ID (read-only).
	/// </summary>
	/// <param name="userId">The user ID.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The credential if found; otherwise, null.</returns>
	public Task<UserCredential?> GetByUserIdAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets a user credential by user ID (tracked for updates).
	/// </summary>
	/// <param name="userId">The user ID.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The credential if found; otherwise, null.</returns>
	public Task<UserCredential?> GetByUserIdForUpdateAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new user credential.
	/// </summary>
	/// <param name="credential">The credential entity.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task CreateAsync(
		UserCredential credential,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates an existing user credential.
	/// </summary>
	/// <param name="credential">The credential entity (must be tracked).</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	public Task UpdateAsync(
		UserCredential credential,
		CancellationToken cancellationToken = default);
}
