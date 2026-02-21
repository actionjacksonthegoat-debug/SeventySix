// <copyright file="DatabaseHealthResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents database health status.
/// </summary>
public record DatabaseHealthResponse
{
	/// <summary>
	/// Gets a value indicating whether the database is connected.
	/// </summary>
	public bool IsConnected { get; init; }

	/// <summary>
	/// Gets the database response time in milliseconds.
	/// </summary>
	public decimal ResponseTimeMs { get; init; }

	/// <summary>
	/// Gets the database health status.
	/// </summary>
	/// <value>
	/// Status: "Healthy", "Degraded", or "Unhealthy".
	/// </value>
	public string Status { get; init; } = HealthStatusConstants.Healthy;

	/// <summary>
	/// Gets the health status per bounded context.
	/// </summary>
	public Dictionary<string, bool> ContextResults { get; init; } = [];
}