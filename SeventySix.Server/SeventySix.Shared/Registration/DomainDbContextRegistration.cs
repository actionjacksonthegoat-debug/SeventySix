// <copyright file="DomainDbContextRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Persistence;

namespace SeventySix.Shared.Registration;

/// <summary>
/// Helper to register domain DbContexts with consistent options (Npgsql, migrations history table, interceptors).
/// </summary>
public static class DomainDbContextRegistration
{
	/// <summary>
	/// Registers a DbContext with UseNpgsql, migrations history table and AuditInterceptor.
	/// </summary>
	/// <typeparam name="TContext">
	/// The DbContext type to register.
	/// </typeparam>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="connectionString">
	/// The database connection string.
	/// </param>
	/// <param name="schemaName">
	/// The schema name for migrations history table.
	/// </param>
	/// <param name="configure">
	/// Optional additional configuration for the DbContextOptionsBuilder.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddDomainDbContext<TContext>(
		this IServiceCollection services,
		string connectionString,
		string schemaName,
		Action<DbContextOptionsBuilder>? configure = null)
		where TContext : DbContext
	{
		services.AddDbContext<TContext>(
			(serviceProvider, options) =>
			{
				AuditInterceptor auditInterceptor =
					serviceProvider.GetRequiredService<AuditInterceptor>();

				options.UseNpgsql(
					connectionString,
					npgsqlOptions =>
					{
						npgsqlOptions.MigrationsHistoryTable(
							DatabaseConstants.MigrationsHistoryTableName,
							schemaName);

						// Conservative defaults - enable retry on transient failures
						npgsqlOptions.EnableRetryOnFailure();
					});

				options.AddInterceptors(auditInterceptor);

				configure?.Invoke(options);
			});

		return services;
	}
}