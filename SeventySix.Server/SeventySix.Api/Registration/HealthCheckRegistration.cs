// <copyright file="HealthCheckRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Diagnostics.HealthChecks;
using SeventySix.Api.HealthChecks;
using SeventySix.ApiTracking;
using SeventySix.Identity;
using SeventySix.Logging;

namespace SeventySix.Api.Registration;

/// <summary>Extension methods for health check configuration.</summary>
public static class HealthCheckExtensions
{
	/// <summary>Adds comprehensive health checks for all bounded contexts.</summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddApplicationHealthChecks(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		// Skip health checks in Test environment for performance
		bool enabled =
			configuration.GetValue<bool?>("HealthChecks:Enabled") ?? true;
		if (!enabled)
		{
			// Add minimal health checks service (required by some middleware)
			services.AddHealthChecks();
			return services;
		}

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