// <copyright file="HealthCheckExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Diagnostics.HealthChecks;
using SeventySix.Api.HealthChecks;
using SeventySix.ApiTracking;
using SeventySix.Identity;
using SeventySix.Logging;

namespace SeventySix.Api.Extensions;

/// <summary>Extension methods for health check configuration.</summary>
public static class HealthCheckExtensions
{
	/// <summary>Adds comprehensive health checks for all bounded contexts.</summary>
	/// <param name="services">The service collection.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddApplicationHealthChecks(this IServiceCollection services)
	{
		services.AddHealthChecks()
			.AddDbContextCheck<IdentityDbContext>(
				name: "identity-database",
				failureStatus: HealthStatus.Unhealthy,
				tags: ["ready", "db"])
			.AddDbContextCheck<LoggingDbContext>(
				name: "logging-database",
				failureStatus: HealthStatus.Unhealthy,
				tags: ["ready", "db"])
			.AddDbContextCheck<ApiTrackingDbContext>(
				name: "apitracking-database",
				failureStatus: HealthStatus.Unhealthy,
				tags: ["ready", "db"])
			.AddCheck<JaegerHealthCheck>(
				name: "jaeger",
				failureStatus: HealthStatus.Degraded,
				tags: ["ready", "tracing"]);

		return services;
	}
}