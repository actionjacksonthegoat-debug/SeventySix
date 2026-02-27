// <copyright file="ApiTrackingDbContextFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Utilities;

namespace SeventySix.ApiTracking;

/// <summary>
/// Design-time factory for creating ApiTrackingDbContext instances.
/// Used by EF Core tools (migrations, database updates) at design time.
/// </summary>
/// <remarks>
/// This factory is ONLY used for EF Core tooling (dotnet ef commands).
/// Runtime context instances are created via dependency injection in Program.cs.
/// Connection string is loaded from appsettings.json and User Secrets.
/// </remarks>
[ExcludeFromCodeCoverage]
public class ApiTrackingDbContextFactory
	: IDesignTimeDbContextFactory<ApiTrackingDbContext>
{
	/// <summary>
	/// Creates a new instance of ApiTrackingDbContext for design-time operations.
	/// </summary>
	/// <param name="args">
	/// Arguments passed from EF Core tools.
	/// </param>
	/// <returns>
	/// A configured ApiTrackingDbContext instance.
	/// </returns>
	public ApiTrackingDbContext CreateDbContext(string[] args)
	{
		DbContextOptionsBuilder<ApiTrackingDbContext> optionsBuilder =
			new();

		// Load connection string from appsettings.json and User Secrets
		string connectionString =
			DesignTimeConnectionStringProvider.GetConnectionString();

		optionsBuilder.UseNpgsql(
			connectionString,
			npgsqlOptions =>
				npgsqlOptions.MigrationsHistoryTable(
					DatabaseConstants.MigrationsHistoryTableName,
					SchemaConstants.ApiTracking));

		return new ApiTrackingDbContext(optionsBuilder.Options);
	}
}