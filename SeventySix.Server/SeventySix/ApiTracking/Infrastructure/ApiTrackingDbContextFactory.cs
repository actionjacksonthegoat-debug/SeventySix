// <copyright file="ApiTrackingDbContextFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SeventySix.ApiTracking;

/// <summary>
/// Design-time factory for creating ApiTrackingDbContext instances.
/// Used by EF Core tools (migrations, database updates) at design time.
/// </summary>
/// <remarks>
/// This factory is ONLY used for EF Core tooling (dotnet ef commands).
/// Runtime context instances are created via dependency injection in Program.cs.
///
/// The connection string here is a placeholder - migrations are schema-only.
/// Actual database connection is configured in appsettings.json.
/// </remarks>
public class ApiTrackingDbContextFactory : IDesignTimeDbContextFactory<ApiTrackingDbContext>
{
	/// <summary>
	/// Creates a new instance of ApiTrackingDbContext for design-time operations.
	/// </summary>
	/// <param name="args">Arguments passed from EF Core tools.</param>
	/// <returns>A configured ApiTrackingDbContext instance.</returns>
	public ApiTrackingDbContext CreateDbContext(string[] args)
	{
		DbContextOptionsBuilder<ApiTrackingDbContext> optionsBuilder = new();

		// Use placeholder connection string for migrations (schema generation only)
		// Actual connection string comes from appsettings.json at runtime
		optionsBuilder.UseNpgsql(
			"Host=localhost;Database=seventysix;Username=postgres;Password=postgres",
			options => options.MigrationsHistoryTable("__EFMigrationsHistory", "ApiTracking"));

		return new ApiTrackingDbContext(optionsBuilder.Options);
	}
}