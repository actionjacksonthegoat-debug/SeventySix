// <copyright file="ApiTrackingExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.ApiTracking;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.Extensions;

/// <summary>
/// Dependency injection extension methods for the ApiTracking bounded context.
/// Registers all services, repositories, and DbContext for ApiTracking domain.
/// </summary>
/// <remarks>
/// This class follows the Extension Method pattern for clean service registration.
/// It encapsulates all ApiTracking-related dependency injection configuration.
///
/// Usage in Program.cs:
/// <code>
/// builder.Services.AddApiTrackingDomain(builder.Configuration);
/// </code>
///
/// Registered Components:
/// - ApiTrackingDbContext: Entity Framework Core DbContext
/// - IThirdPartyApiRequestRepository → ThirdPartyApiRequestRepository: Data access layer
/// - IThirdPartyApiRequestService → ThirdPartyApiRequestService: Business logic layer
/// </remarks>
public static class ApiTrackingExtensions
{
	/// <summary>
	/// Registers ApiTracking bounded context services with the dependency injection container.
	/// </summary>
	/// <param name="services">The service collection to register services with.</param>
	/// <param name="connectionString">The database connection string for ApiTrackingDbContext.</param>
	/// <returns>The service collection for method chaining.</returns>
	/// <remarks>
	/// Service Lifetimes:
	/// - DbContext: Scoped (per request)
	/// - Repositories: Scoped (shares DbContext instance)
	/// - Services: Scoped (shares repository and DbContext)
	///
	/// This method should be called once during application startup.
	/// </remarks>
	public static IServiceCollection AddApiTrackingDomain(this IServiceCollection services, string connectionString)
	{
		// Register ApiTrackingDbContext with PostgreSQL and AuditInterceptor
		services.AddDbContext<ApiTrackingDbContext>((serviceProvider, options) =>
		{
			AuditInterceptor auditInterceptor = serviceProvider.GetRequiredService<AuditInterceptor>();
			options.UseNpgsql(connectionString);
			options.AddInterceptors(auditInterceptor);
		});

		// Register repositories
		services.AddScoped<IThirdPartyApiRequestRepository, ThirdPartyApiRequestRepository>();

		// Register services
		services.AddScoped<IThirdPartyApiRequestService, ThirdPartyApiRequestService>();

		return services;
	}
}
