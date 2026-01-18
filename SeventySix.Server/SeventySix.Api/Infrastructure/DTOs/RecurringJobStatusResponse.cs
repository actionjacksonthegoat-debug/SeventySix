// <copyright file="RecurringJobStatusResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Response DTO for recurring job execution status.
/// </summary>
public record RecurringJobStatusResponse
{
	/// <summary>
	/// Gets or sets the unique job name.
	/// </summary>
	public required string JobName { get; init; }

	/// <summary>
	/// Gets or sets the human-readable display name.
	/// </summary>
	public required string DisplayName { get; init; }

	/// <summary>
	/// Gets or sets when the job was last executed.
	/// </summary>
	public DateTimeOffset? LastExecutedAt { get; init; }

	/// <summary>
	/// Gets or sets when the next execution is scheduled.
	/// </summary>
	public DateTimeOffset? NextScheduledAt { get; init; }

	/// <summary>
	/// Gets or sets the machine that last executed this job.
	/// </summary>
	public string? LastExecutedBy { get; init; }

	/// <summary>
	/// Gets or sets the job health status.
	/// </summary>
	/// <value>
	/// "Healthy" if on schedule, "Degraded" if overdue, "Unknown" if never run.
	/// </value>
	public required string Status { get; init; }

	/// <summary>
	/// Gets or sets the configured interval as human-readable string.
	/// </summary>
	public required string Interval { get; init; }
}