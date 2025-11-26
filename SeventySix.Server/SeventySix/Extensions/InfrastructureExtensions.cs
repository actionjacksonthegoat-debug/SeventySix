// <copyright file="InfrastructureExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using SeventySix.Infrastructure;

namespace SeventySix.Extensions;

/// <summary>
/// Extension methods for registering Infrastructure bounded context services.
/// </summary>
/// <remarks>
/// Provides dependency injection registration for cross-cutting infrastructure services
/// including metrics collection and health checks.
/// </remarks>
public static class InfrastructureExtensions
{
	/// <summary>
	/// Adds Infrastructure bounded context services to the dependency injection container.
	/// </summary>
	/// <param name="services">The service collection to add services to.</param>
	/// <returns>The service collection for method chaining.</returns>
	/// <remarks>
	/// Registers:
	/// - IMetricsService as singleton (maintains static metrics state)
	/// - IHealthCheckService as scoped (per-request health checks).
	/// </remarks>
	public static IServiceCollection AddInfrastructureDomain(this IServiceCollection services)
	{
		// Register services
		services.AddSingleton<IMetricsService, MetricsService>();
		services.AddScoped<IHealthCheckService, HealthCheckService>();

		return services;
	}
}
