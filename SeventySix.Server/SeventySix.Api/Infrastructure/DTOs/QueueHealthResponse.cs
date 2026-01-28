// <copyright file="QueueHealthResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents error queue health status.
/// </summary>
public class QueueHealthResponse
{
	/// <summary>
	/// Gets or sets the number of items currently in the queue.
	/// </summary>
	public int QueuedItems { get; set; }

	/// <summary>
	/// Gets or sets the number of failed items in the queue.
	/// </summary>
	public int FailedItems { get; set; }

	/// <summary>
	/// Gets or sets a value indicating whether the circuit breaker is open.
	/// </summary>
	/// <value>
	/// True if circuit breaker is open (blocking requests), false otherwise.
	/// </value>
	public bool CircuitBreakerOpen { get; set; }

	/// <summary>
	/// Gets or sets the queue health status.
	/// </summary>
	/// <value>
	/// Status: "Healthy", "Degraded", or "Unhealthy".
	/// </value>
	public string Status { get; set; } = HealthStatusConstants.Healthy;
}