// <copyright file="MfaChallengeRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Repository for MFA challenge data access operations.
/// </summary>
/// <remarks>
/// Implements <see cref="IMfaChallengeRepository"/> using Entity Framework Core.
/// </remarks>
/// <param name="context">
/// The Identity database context.
/// </param>
internal sealed class MfaChallengeRepository(IdentityDbContext context)
	: IMfaChallengeRepository
{
	/// <inheritdoc/>
	public async Task<MfaChallenge?> GetByTokenAsync(
		string challengeToken,
		CancellationToken cancellationToken = default)
	{
		MfaChallenge? challenge =
			await context
				.MfaChallenges
				.FirstOrDefaultAsync(
					challenge => challenge.Token == challengeToken,
					cancellationToken);

		return challenge;
	}

	/// <inheritdoc/>
	public async Task CreateAsync(
		MfaChallenge challenge,
		CancellationToken cancellationToken = default)
	{
		context.MfaChallenges.Add(challenge);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task UpdateAsync(
		MfaChallenge challenge,
		CancellationToken cancellationToken = default)
	{
		context.MfaChallenges.Update(challenge);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> DeleteExpiredAsync(
		DateTime expirationCutoff,
		CancellationToken cancellationToken = default)
	{
		int deletedCount =
			await context
				.MfaChallenges
				.Where(challenge => challenge.ExpiresAt < expirationCutoff)
				.ExecuteDeleteAsync(cancellationToken);

		return deletedCount;
	}
}