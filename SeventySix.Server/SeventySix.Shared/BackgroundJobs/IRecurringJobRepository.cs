// <copyright file="IRecurringJobRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Repository contract for recurring job execution tracking.
/// Implemented in Logging domain for cross-cutting persistence.
/// </summary>
public interface IRecurringJobRepository
{
	/// <summary>
	/// Gets the last execution record for a job.
	/// </summary>
	/// <param name="jobName">
	/// The unique name of the job.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// The execution record if found; otherwise null.
	/// </returns>
	public Task<RecurringJobExecution?> GetLastExecutionAsync(
		string jobName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Records or updates a job execution.
	/// </summary>
	/// <param name="execution">
	/// The execution record to persist.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task UpsertExecutionAsync(
		RecurringJobExecution execution,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets all job execution records.
	/// </summary>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// All execution records ordered by job name.
	/// </returns>
	public Task<IReadOnlyList<RecurringJobExecution>> GetAllAsync(
		CancellationToken cancellationToken = default);
}