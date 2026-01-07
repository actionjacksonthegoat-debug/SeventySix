using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Persistence;

namespace SeventySix.TestUtilities.Testing;

/// <summary>
/// Factory methods for setting up test DbContexts with Testcontainers.
/// </summary>
public static class TestDbContextFactory
{
	/// <summary>
	/// Replaces an existing DbContext registration with a test connection.
	/// </summary>
	public static IServiceCollection ReplaceDbContextWithTestConnection<TContext>(
		this IServiceCollection services,
		string connectionString,
		string schemaName,
		Action<DbContextOptionsBuilder>? configure = null)
		where TContext : DbContext
	{
		// Remove existing DbContextOptions registration if present
		services.RemoveAll<DbContextOptions<TContext>>();

		services.AddDbContext<TContext>(
			(serviceProvider, options) =>
			{
				AuditInterceptor auditInterceptor =
					serviceProvider.GetRequiredService<AuditInterceptor>();

				options.UseNpgsql(
					connectionString,
					npgsql =>
						npgsql
							.MigrationsHistoryTable(
								DatabaseConstants.MigrationsHistoryTableName,
								schemaName)
							.EnableRetryOnFailure());

				options.AddInterceptors(auditInterceptor);
				configure?.Invoke(options);
			});

		return services;
	}
}