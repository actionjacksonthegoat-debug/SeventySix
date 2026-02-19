// <copyright file="BulkUpdateActiveStatusCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="BulkUpdateActiveStatusCommand"/>.
/// </summary>
public static class BulkUpdateActiveStatusCommandHandler
{
	/// <summary>
	/// Handles bulk update of user active status.
	/// </summary>
	/// <param name="command">
	/// The bulk update command.
	/// </param>
	/// <param name="context">
	/// The identity database context.
	/// </param>
	/// <param name="identityCache">
	/// Identity cache service for clearing user cache.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for <see cref="DateTimeOffset"/> stamping.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The number of users updated.
	/// </returns>
	public static async Task<long> HandleAsync(
		BulkUpdateActiveStatusCommand command,
		IdentityDbContext context,
		IIdentityCacheService identityCache,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		List<long> userIdList =
			[.. command.UserIds];

		if (userIdList.Count == 0)
		{
			return 0;
		}

		// Single query to collect valid user IDs for cache invalidation
		List<long> existingUserIds =
			await context.Users
				.Where(user => userIdList.Contains(user.Id))
				.Select(user => user.Id)
				.ToListAsync(cancellationToken);

		if (existingUserIds.Count == 0)
		{
			return 0;
		}

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		// Single UPDATE statement — 1 DB roundtrip regardless of batch size
		// AuditInterceptor is bypassed by ExecuteUpdateAsync, so set audit fields explicitly
		int updatedCount =
			await context.Users
				.Where(
					user => userIdList.Contains(user.Id)
						&& user.IsActive != command.IsActive)
				.ExecuteUpdateAsync(
					setter => setter
						.SetProperty(
							user => user.IsActive,
							command.IsActive)
						.SetProperty(
							user => user.ModifiedBy,
							command.ModifiedBy)
						.SetProperty(
							user => user.ModifyDate,
							now),
					cancellationToken);

		// Invalidate cache — idempotent, so invalidate all existing regardless of prior state
		await identityCache.InvalidateBulkUsersAsync(existingUserIds);

		return updatedCount;
	}
}