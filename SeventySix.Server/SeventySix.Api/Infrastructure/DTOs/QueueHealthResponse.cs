// <copyright file="QueueHealthResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents error queue health status.
/// </summary>
public record QueueHealthResponse
{
	/// <summary>
	/// Gets the number of items currently in the queue.
	/// </summary>
	public int QueuedItems { get; init; }

	/// <summary>
	/// Gets the number of failed items in the queue.
	/// </summary>
	public int FailedItems { get; init; }

	/// <summary>
	/// Gets a value indicating whether the circuit breaker is open.
	/// </summary>
	/// <value>
	/// True if circuit breaker is open (blocking requests), false otherwise.
	/// </value>
	public bool CircuitBreakerOpen { get; init; }

	/// <summary>
	/// Gets the queue health status.
	/// </summary>
	/// <value>
	/// Status: "Healthy", "Degraded", or "Unhealthy".
	/// </value>
	public string Status { get; init; } = HealthStatusConstants.Healthy;
}