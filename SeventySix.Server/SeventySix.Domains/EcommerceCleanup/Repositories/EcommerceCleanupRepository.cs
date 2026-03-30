// <copyright file="EcommerceCleanupRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Npgsql;

namespace SeventySix.EcommerceCleanup.Repositories;

/// <summary>
/// Repository for ecommerce database cleanup operations.
/// Uses direct <see cref="NpgsqlConnection"/> for Drizzle-managed databases (not EF Core).
/// </summary>
public sealed class EcommerceCleanupRepository : IEcommerceCleanupRepository
{
	/// <inheritdoc />
	public async Task<int> DeleteExpiredCartSessionsAsync(
		string connectionString,
		DateTimeOffset cutoffDate,
		CancellationToken cancellationToken)
	{
		await using NpgsqlConnection connection =
			new(connectionString);
		await connection.OpenAsync(cancellationToken);

		await using NpgsqlCommand command =
			new(
				"DELETE FROM cart_sessions WHERE expires_at < @cutoffDate",
				connection);

		command.Parameters.AddWithValue("@cutoffDate", cutoffDate);

		int deletedCount =
			await command.ExecuteNonQueryAsync(cancellationToken);

		return deletedCount;
	}
}