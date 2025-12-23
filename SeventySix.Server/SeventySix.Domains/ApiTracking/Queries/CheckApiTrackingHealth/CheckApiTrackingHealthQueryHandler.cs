// <copyright file="CheckApiTrackingHealthQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Handler for CheckApiTrackingHealthQuery to verify database connectivity.
/// </summary>
public static class CheckApiTrackingHealthQueryHandler
{
	/// <summary>
	/// Handles the health check query by attempting a simple database operation.
	/// </summary>
	/// <param name="query">
	/// The health check query.
	/// </param>
	/// <param name="repository">
	/// The repository for accessing API tracking data.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// True if database is accessible, false otherwise.
	/// </returns>
	public static async Task<bool> HandleAsync(
		CheckApiTrackingHealthQuery query,
		IThirdPartyApiRequestRepository repository,
		CancellationToken cancellationToken)
	{
		try
		{
			_ =
				await repository.GetAllAsync(cancellationToken);
			return true;
		}
		catch
		{
			return false;
		}
	}
}