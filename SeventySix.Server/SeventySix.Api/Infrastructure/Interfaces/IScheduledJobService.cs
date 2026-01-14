// <copyright file="IScheduledJobService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Service for retrieving scheduled job status.
/// </summary>
public interface IScheduledJobService
{
	/// <summary>
	/// Gets status for all scheduled jobs.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for the async operation.
	/// </param>
	/// <returns>
	/// List of job status responses with computed health status.
	/// </returns>
	Task<IReadOnlyList<RecurringJobStatusResponse>> GetAllJobStatusesAsync(
		CancellationToken cancellationToken);
}
