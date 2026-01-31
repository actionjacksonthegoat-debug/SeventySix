// <copyright file="IRecurringJobService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Orchestrates recurring job scheduling and execution tracking.
/// Coordinates between <see cref="IRecurringJobRepository"/> and <see cref="IMessageScheduler"/>.
/// </summary>
public interface IRecurringJobService
{
	/// <summary>
	/// Ensures a job is scheduled based on its last execution and interval.
	/// Called at application startup to resume scheduling after restart.
	/// </summary>
	/// <typeparam name="TJob">
	/// The job message type.
	/// </typeparam>
	/// <param name="jobName">
	/// The unique name of the job.
	/// </param>
	/// <param name="interval">
	/// The interval between executions.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task EnsureScheduledAsync<TJob>(
		string jobName,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new();

	/// <summary>
	/// Records a job execution and schedules the next occurrence.
	/// Called by job handlers after successful execution.
	/// </summary>
	/// <typeparam name="TJob">
	/// The job message type.
	/// </typeparam>
	/// <param name="jobName">
	/// The unique name of the job.
	/// </param>
	/// <param name="executedAt">
	/// When the job was executed.
	/// </param>
	/// <param name="interval">
	/// The interval until the next execution.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task RecordAndScheduleNextAsync<TJob>(
		string jobName,
		DateTimeOffset executedAt,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new();

	/// <summary>
	/// Ensures a job is scheduled to run at a preferred UTC time, then repeats at interval.
	/// Ideal for daily/weekly maintenance jobs that should run during off-peak hours.
	/// </summary>
	/// <typeparam name="TJob">
	/// The job message type.
	/// </typeparam>
	/// <param name="jobName">
	/// Unique identifier for the job.
	/// </param>
	/// <param name="preferredTimeUtc">
	/// The preferred UTC time (hour and minute) for the job to run.
	/// </param>
	/// <param name="interval">
	/// Time between subsequent runs.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task EnsureScheduledAtPreferredTimeAsync<TJob>(
		string jobName,
		TimeOnly preferredTimeUtc,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new();
}