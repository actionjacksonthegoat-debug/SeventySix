// <copyright file="IdentityDbContextFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SeventySix.Shared.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Design-time factory for creating IdentityDbContext instances.
/// Used by EF Core tools (migrations, database updates) at design time.
/// </summary>
/// <remarks>
/// This factory is ONLY used for EF Core tooling (dotnet ef commands).
/// Runtime context instances are created via dependency injection in Program.cs.
///
/// The connection string here is a placeholder - migrations are schema-only.
/// Actual database connection is configured in appsettings.json.
/// </remarks>
public class IdentityDbContextFactory
	: IDesignTimeDbContextFactory<IdentityDbContext>
{
	/// <summary>
	/// Creates a new instance of IdentityDbContext for design-time operations.
	/// </summary>
	/// <param name="args">
	/// Arguments passed from EF Core tools.
	/// </param>
	/// <returns>
	/// A configured IdentityDbContext instance.
	/// </returns>
	public IdentityDbContext CreateDbContext(string[] args)
	{
		DbContextOptionsBuilder<IdentityDbContext> optionsBuilder = new();

		// Use placeholder connection string for migrations (schema generation only)
		// Actual connection string comes from appsettings.json at runtime
		optionsBuilder.UseNpgsql(
			DatabaseConstants.DesignTimeConnectionString,
			options =>
				options.MigrationsHistoryTable(
					DatabaseConstants.MigrationsHistoryTableName,
					SchemaConstants.Identity));

		return new IdentityDbContext(optionsBuilder.Options);
	}
}