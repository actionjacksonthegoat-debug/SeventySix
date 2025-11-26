// <copyright file="LoggingExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Logging;

namespace SeventySix.Extensions;

/// <summary>
/// Dependency injection extension methods for the Logging bounded context.
/// Registers all services, repositories, validators, and DbContext for Logging domain.
/// </summary>
/// <remarks>
/// This class follows the Extension Method pattern for clean service registration.
/// It encapsulates all Logging-related dependency injection configuration.
///
/// Usage in Program.cs:
/// <code>
/// builder.Services.AddLoggingDomain(builder.Configuration);
/// </code>
///
/// Registered Components:
/// - LoggingDbContext: Entity Framework Core DbContext
/// - ILogRepository → LogRepository: Data access layer
/// - ILogService → LogService: Business logic layer
/// - Validators: LogFilterRequestValidator
/// </remarks>
public static class LoggingExtensions
{
	/// <summary>
	/// Registers Logging bounded context services with the dependency injection container.
	/// </summary>
	/// <param name="services">The service collection to register services with.</param>
	/// <param name="connectionString">The database connection string for LoggingDbContext.</param>
	/// <returns>The service collection for method chaining.</returns>
	/// <remarks>
	/// Service Lifetimes:
	/// - DbContext: Scoped (per request)
	/// - Repositories: Scoped (shares DbContext instance)
	/// - Services: Scoped (shares repository and DbContext)
	/// - Validators: Singleton (stateless, thread-safe)
	///
	/// This method should be called once during application startup.
	/// </remarks>
	public static IServiceCollection AddLoggingDomain(this IServiceCollection services, string connectionString)
	{
		// Register LoggingDbContext with PostgreSQL
		services.AddDbContext<LoggingDbContext>(options =>
			options.UseNpgsql(connectionString));

		// Register repositories
		services.AddScoped<ILogRepository, LogRepository>();

		// Register services
		services.AddScoped<ILogService, LogService>();

		// Register validators
		services.AddSingleton<IValidator<LogFilterRequest>, LogFilterRequestValidator>();

		return services;
	}
}
