// <copyright file="AltchaChallengeStore.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Ixnas.AltchaNet;
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// EF Core-based store for ALTCHA challenge tracking.
/// Prevents replay attacks by tracking verified challenges.
/// </summary>
/// <remarks>
/// Implements <see cref="IAltchaCancellableChallengeStore"/> for async cancellation support.
/// Uses IdentityDbContext for storage in the Identity schema.
/// Method names (Store, Exists) are defined by the Ixnas.AltchaNet interface
/// and cannot be renamed to follow *Async convention.
/// Registered as scoped service, matching IdentityDbContext lifetime.
/// </remarks>
/// <param name="context">
/// The Identity database context (scoped).
/// </param>
/// <param name="timeProvider">
/// Time provider for UTC time.
/// </param>
public class AltchaChallengeStore(
	IdentityDbContext context,
	TimeProvider timeProvider) : IAltchaCancellableChallengeStore
{
	/// <inheritdoc/>
	public async Task Store(
		string challenge,
		DateTimeOffset expiryUtc,
		CancellationToken cancellationToken)
	{
		AltchaChallenge entity =
			new()
			{
				Challenge = challenge,
				ExpiryUtc = expiryUtc.UtcDateTime
			};

		context.AltchaChallenges.Add(entity);
		await context.SaveChangesAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> Exists(
		string challenge,
		CancellationToken cancellationToken)
	{
		// Clean up expired challenges first
		DateTimeOffset utcNow =
			timeProvider.GetUtcNow();

		await context.AltchaChallenges
			.Where(altchaChallenge => altchaChallenge.ExpiryUtc <= utcNow)
			.ExecuteDeleteAsync(cancellationToken);

		// Check if challenge exists (already used)
		return await context.AltchaChallenges
			.AnyAsync(
				altchaChallenge => altchaChallenge.Challenge == challenge,
				cancellationToken);
	}
}