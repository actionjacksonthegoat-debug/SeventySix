// <copyright file="RecurringJobExecution.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Tracks execution history for recurring background jobs.
/// Enables restart-aware scheduling and distributed coordination.
/// </summary>
public record RecurringJobExecution
{
	/// <summary>
	/// Gets or sets the unique job identifier.
	/// </summary>
	public required string JobName { get; init; }

	/// <summary>
	/// Gets or sets the timestamp of the last successful execution.
	/// </summary>
	public DateTimeOffset LastExecutedAt { get; set; }

	/// <summary>
	/// Gets or sets the timestamp of the next scheduled execution.
	/// </summary>
	public DateTimeOffset? NextScheduledAt { get; set; }

	/// <summary>
	/// Gets or sets the instance ID that last executed this job.
	/// Useful for debugging in scaled deployments.
	/// </summary>
	public string? LastExecutedBy { get; set; }
}
