// <copyright file="ElectronicNotificationsDbContextFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Utilities;

namespace SeventySix.ElectronicNotifications;

/// <summary>
/// Design-time factory for creating ElectronicNotificationsDbContext instances.
/// Used by EF Core tools (migrations, database updates) at design time.
/// </summary>
/// <remarks>
/// This factory is ONLY used for EF Core tooling (dotnet ef commands).
/// Runtime context instances are created via dependency injection in Program.cs.
/// Connection string is loaded from the .env file at repository root.
/// </remarks>
public class ElectronicNotificationsDbContextFactory
	: IDesignTimeDbContextFactory<ElectronicNotificationsDbContext>
{
	/// <summary>
	/// Creates a new instance of ElectronicNotificationsDbContext for design-time operations.
	/// </summary>
	/// <param name="args">
	/// Arguments passed from EF Core tools.
	/// </param>
	/// <returns>
	/// A configured ElectronicNotificationsDbContext instance.
	/// </returns>
	public ElectronicNotificationsDbContext CreateDbContext(string[] args)
	{
		DbContextOptionsBuilder<ElectronicNotificationsDbContext> optionsBuilder =
			new();

		// Load connection string from .env file (single source of truth)
		string connectionString =
			DesignTimeConnectionStringProvider.GetConnectionString();

		optionsBuilder.UseNpgsql(
			connectionString,
			npgsqlOptions =>
				npgsqlOptions.MigrationsHistoryTable(
					DatabaseConstants.MigrationsHistoryTableName,
					SchemaConstants.ElectronicNotifications));

		return new ElectronicNotificationsDbContext(optionsBuilder.Options);
	}
}