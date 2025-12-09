// <copyright file="CheckLoggingHealthQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Handler for checking logging database health.
/// </summary>
public static class CheckLoggingHealthQueryHandler
{
	/// <summary>
	/// Handles the health check query for the logging database.
	/// </summary>
	/// <param name="query">The health check query.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if database is healthy, false otherwise.</returns>
	public static async Task<bool> HandleAsync(
		CheckLoggingHealthQuery query,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		try
		{
			LogQueryRequest healthCheckRequest =
				new()
				{
					Page = 1,
					PageSize = 1
				};

			_ = await repository.GetPagedAsync(
				healthCheckRequest,
				cancellationToken);

			return true;
		}
		catch
		{
			return false;
		}
	}
}
