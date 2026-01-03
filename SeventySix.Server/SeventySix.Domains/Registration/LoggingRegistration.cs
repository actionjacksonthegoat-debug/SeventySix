// <copyright file="LoggingRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Logging;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Registration;

namespace SeventySix.Registration;

/// <summary>
/// DI extension methods for the Logging bounded context.
/// </summary>
public static class LoggingRegistration
{
	/// <summary>
	/// Registers Logging bounded context services with the DI container.
	/// </summary>
	/// <param name="services">
	/// The service collection to register services with.
	/// </param>
	/// <param name="connectionString">
	/// The database connection string for LoggingDbContext.
	/// </param>
	/// <param name="configuration">
	/// The application configuration for settings binding.
	/// </param>
	/// <returns>
	/// The service collection for method chaining.
	/// </returns>
	public static IServiceCollection AddLoggingDomain(
		this IServiceCollection services,
		string connectionString,
		IConfiguration configuration)
	{
		// Register DbContext via shared helper
		services.AddDomainDbContext<LoggingDbContext>(
			connectionString,
			SchemaConstants.Logging);

		services.AddScoped<ILogRepository, LogRepository>();

		// Register transaction manager for logging context
		services.AddTransactionManagerFor<LoggingDbContext>();

		// Register health check for multi-db health monitoring using generic Wolverine wrapper
		services.AddWolverineHealthCheck<CheckLoggingHealthQuery>(SchemaConstants.Logging);

		// Register validators via assembly scanning + command adapter helper
		services.AddDomainValidatorsFromAssemblyContaining<LoggingDbContext>();

		return services;
	}
}