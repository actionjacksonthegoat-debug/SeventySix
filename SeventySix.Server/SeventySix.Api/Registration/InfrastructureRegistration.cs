// <copyright file="InfrastructureRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Api.Infrastructure;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Persistence;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration methods for Infrastructure services.
/// </summary>
/// <remarks>
/// Provides dependency injection registration for cross-cutting infrastructure services
/// including metrics collection, health checks, and audit tracking.
/// </remarks>
public static class InfrastructureRegistration
{
	/// <summary>
	/// Adds Infrastructure services to the dependency injection container.
	/// </summary>
	/// <param name="services">
	/// The service collection to add services to.
	/// </param>
	/// <returns>
	/// The service collection for method chaining.
	/// </returns>
	/// <remarks>
	/// Registers:
	/// - TimeProvider as singleton (System.TimeProvider for production, mockable for tests)
	/// - IMetricsService as singleton (maintains static metrics state)
	/// - IHealthCheckService as scoped (per-request health checks)
	/// - IRateLimitingService as scoped (per-request rate limit tracking)
	/// - AuditInterceptor as scoped (per-request audit tracking).
	/// </remarks>
	public static IServiceCollection AddInfrastructure(
		this IServiceCollection services)
	{
		// Register TimeProvider (enables testable time abstraction)
		services.AddSingleton(TimeProvider.System);

		// Register services
		services.AddSingleton<IMetricsService, MetricsService>();
		services.AddScoped<IHealthCheckService, HealthCheckService>();
		services.AddScoped<IRateLimitingService, RateLimitingService>();

		// Register audit infrastructure (scoped for per-request user context)
		services.AddScoped<AuditInterceptor>();

		return services;
	}
}