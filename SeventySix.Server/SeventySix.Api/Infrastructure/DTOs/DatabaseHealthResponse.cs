// <copyright file="DatabaseHealthResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents database health status.
/// </summary>
public class DatabaseHealthResponse
{
	/// <summary>
	/// Gets or sets a value indicating whether the database is connected.
	/// </summary>
	public bool IsConnected { get; set; }

	/// <summary>
	/// Gets or sets the database response time in milliseconds.
	/// </summary>
	public double ResponseTimeMs { get; set; }

	/// <summary>
	/// Gets or sets the database health status.
	/// </summary>
	/// <value>
	/// Status: "Healthy", "Degraded", or "Unhealthy".
	/// </value>
	public string Status { get; set; } = HealthStatusConstants.Healthy;

	/// <summary>
	/// Gets or sets the health status per bounded context.
	/// </summary>
	public Dictionary<string, bool> ContextResults { get; set; } = [];
}