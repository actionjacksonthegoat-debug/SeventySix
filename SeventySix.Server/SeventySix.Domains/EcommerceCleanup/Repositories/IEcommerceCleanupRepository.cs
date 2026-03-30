// <copyright file="IEcommerceCleanupRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.EcommerceCleanup.Repositories;

/// <summary>
/// Repository for ecommerce database cleanup operations.
/// Operates against Drizzle-managed databases via raw SQL (not EF Core entities).
/// </summary>
public interface IEcommerceCleanupRepository
{
	/// <summary>
	/// Deletes expired cart sessions from the specified ecommerce database.
	/// Cart items are cascade-deleted by the database foreign key constraint.
	/// </summary>
	/// <param name="connectionString">
	/// The connection string for the target ecommerce database.
	/// </param>
	/// <param name="cutoffDate">
	/// Sessions with <c>expires_at</c> before this date are deleted.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// The number of cart sessions deleted.
	/// </returns>
	public Task<int> DeleteExpiredCartSessionsAsync(
		string connectionString,
		DateTimeOffset cutoffDate,
		CancellationToken cancellationToken);
}