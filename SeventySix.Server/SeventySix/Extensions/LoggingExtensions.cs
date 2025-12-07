// <copyright file="LoggingExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Logging;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.Extensions;

/// <summary>DI extension methods for the Logging bounded context.</summary>
public static class LoggingExtensions
{
	/// <summary>Registers Logging bounded context services with the DI container.</summary>
	/// <param name="services">The service collection to register services with.</param>
	/// <param name="connectionString">The database connection string for LoggingDbContext.</param>
	/// <param name="configuration">The application configuration for settings binding.</param>
	/// <returns>The service collection for method chaining.</returns>
	public static IServiceCollection AddLoggingDomain(
		this IServiceCollection services,
		string connectionString,
		IConfiguration configuration)
	{
		services.AddDbContext<LoggingDbContext>((
			serviceProvider,
			options) =>
		{
			AuditInterceptor auditInterceptor =
				serviceProvider.GetRequiredService<AuditInterceptor>();

			options.UseNpgsql(connectionString);
			options.AddInterceptors(auditInterceptor);
		});

		services.AddScoped<ILogRepository, LogRepository>();
		services.AddScoped<ILogService, LogService>();

		// Validators - Singleton (stateless, thread-safe)
		services.AddSingleton<IValidator<LogQueryRequest>, LogQueryRequestValidator>();
		services.AddSingleton<IValidator<CreateLogRequest>, CreateLogRequestValidator>();

		return services;
	}
}