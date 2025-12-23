// <copyright file="IDatabaseHealthCheck.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Interfaces;

/// <summary>
/// Contract for database health checks across bounded contexts.
/// </summary>
/// <remarks>
/// <para>
/// Each bounded context with a database must implement this interface
/// to participate in system-wide health monitoring.
/// </para>
/// <para>
/// SOLID Principles:
/// - SRP: Single responsibility - database health verification only
/// - DIP: Infrastructure depends on abstraction, not concrete services
/// - ISP: Single focused method - only health check responsibility
/// - OCP: New bounded contexts can add health checks without modifying Infrastructure
/// </para>
/// </remarks>
public interface IDatabaseHealthCheck
{
	/// <summary>
	/// Gets the bounded context name for health reporting.
	/// </summary>
	/// <remarks>
	/// Used to identify which database failed in health check responses.
	/// Examples: "Identity", "Logging", "ApiTracking"
	/// </remarks>
	public string ContextName { get; }

	/// <summary>
	/// Checks database connectivity and health for this bounded context.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if database is healthy, false otherwise.
	/// </returns>
	/// <remarks>
	/// <para>Implementation requirements:</para>
	/// <list type="bullet">
	/// <item>Execute a lightweight query (e.g., SELECT 1 or read single row)</item>
	/// <item>Catch all exceptions and return false (no throw)</item>
	/// <item>Complete within 5 seconds (timeout)</item>
	/// </list>
	/// </remarks>
	public Task<bool> CheckHealthAsync(
		CancellationToken cancellationToken = default);
}