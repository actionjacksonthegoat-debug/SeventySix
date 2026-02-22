// <copyright file="IMfaChallengeRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Repository for MFA challenge data access operations.
/// </summary>
public interface IMfaChallengeRepository
{
	/// <summary>
	/// Gets a challenge by its token.
	/// </summary>
	/// <param name="challengeToken">
	/// The challenge token (GUID).
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The challenge if found; otherwise, null.
	/// </returns>
	public Task<MfaChallenge?> GetByTokenAsync(
		string challengeToken,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates a new MFA challenge.
	/// </summary>
	/// <param name="challenge">
	/// The challenge to create.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Task representing the async operation.
	/// </returns>
	public Task CreateAsync(
		MfaChallenge challenge,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates an existing MFA challenge.
	/// </summary>
	/// <param name="challenge">
	/// The challenge to update.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Task representing the async operation.
	/// </returns>
	public Task UpdateAsync(
		MfaChallenge challenge,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes expired challenges for cleanup.
	/// </summary>
	/// <param name="expirationCutoff">
	/// Delete challenges expired before this time.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Number of deleted challenges.
	/// </returns>
	public Task<int> DeleteExpiredAsync(
		DateTimeOffset expirationCutoff,
		CancellationToken cancellationToken = default);
}