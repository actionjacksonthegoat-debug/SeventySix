// <copyright file="LoggingDbContextFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SeventySix.Logging;

/// <summary>
/// Design-time factory for creating LoggingDbContext instances.
/// Used by EF Core tools (migrations, database updates) at design time.
/// </summary>
/// <remarks>
/// This factory is ONLY used for EF Core tooling (dotnet ef commands).
/// Runtime context instances are created via dependency injection in Program.cs.
///
/// The connection string here is a placeholder - migrations are schema-only.
/// Actual database connection is configured in appsettings.json.
/// </remarks>
public class LoggingDbContextFactory : IDesignTimeDbContextFactory<LoggingDbContext>
{
	/// <summary>
	/// Creates a new instance of LoggingDbContext for design-time operations.
	/// </summary>
	/// <param name="args">Arguments passed from EF Core tools.</param>
	/// <returns>A configured LoggingDbContext instance.</returns>
	public LoggingDbContext CreateDbContext(string[] args)
	{
		DbContextOptionsBuilder<LoggingDbContext> optionsBuilder = new();

		// Use placeholder connection string for migrations (schema generation only)
		// Actual connection string comes from appsettings.json at runtime
		optionsBuilder.UseNpgsql(
			"Host=localhost;Database=seventysix;Username=postgres;Password=postgres",
			options => options.MigrationsHistoryTable("__EFMigrationsHistory", "Logging"));

		return new LoggingDbContext(optionsBuilder.Options);
	}
}