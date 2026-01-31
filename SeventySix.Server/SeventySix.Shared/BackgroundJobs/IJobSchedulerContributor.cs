// <copyright file="IJobSchedulerContributor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Interface for bounded contexts to contribute their recurring jobs to the scheduler.
/// Each domain implements this to register its own jobs without creating cross-domain dependencies.
/// </summary>
public interface IJobSchedulerContributor
{
	/// <summary>
	/// Schedules the recurring jobs for this bounded context.
	/// </summary>
	/// <param name="recurringJobService">
	/// The recurring job service for scheduling.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task ScheduleJobsAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken);
}