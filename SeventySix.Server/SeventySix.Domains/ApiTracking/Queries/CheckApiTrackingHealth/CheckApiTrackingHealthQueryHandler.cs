// <copyright file="CheckApiTrackingHealthQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;

namespace SeventySix.ApiTracking;

/// <summary>
/// Handler for CheckApiTrackingHealthQuery to verify database connectivity.
/// </summary>
public static class CheckApiTrackingHealthQueryHandler
{
	/// <summary>
	/// Handles the health check query by verifying database connectivity.
	/// </summary>
	/// <param name="query">
	/// The health check query.
	/// </param>
	/// <param name="context">
	/// The database context for connectivity check.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// True if database is accessible, false otherwise.
	/// </returns>
	public static async Task<bool> HandleAsync(
		CheckApiTrackingHealthQuery query,
		ApiTrackingDbContext context,
		CancellationToken cancellationToken)
	{
		try
		{
			return await context.Database.CanConnectAsync(cancellationToken);
		}
		catch (DbException)
		{
			return false;
		}
	}
}