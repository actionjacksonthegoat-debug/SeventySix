// <copyright file="DesignTimeConnectionStringProvider.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;

namespace SeventySix.Shared.Utilities;

/// <summary>
/// Provides database connection strings for EF Core design-time operations.
/// </summary>
/// <remarks>
/// Used by DbContext factories during migration generation (dotnet ef commands).
/// Loads connection details from appsettings.json and User Secrets.
/// </remarks>
[ExcludeFromCodeCoverage]
public static class DesignTimeConnectionStringProvider
{
	/// <summary>
	/// The User Secrets ID for the SeventySix.Api project.
	/// </summary>
	private const string UserSecretsId = "seventysix-api-dev";

	/// <summary>
	/// Builds a PostgreSQL connection string from appsettings.json and User Secrets.
	/// </summary>
	/// <remarks>
	/// Searches for the SeventySix.Api project directory by traversing up
	/// the directory tree, then loads appsettings.json, appsettings.Development.json,
	/// and User Secrets to build the connection string.
	/// </remarks>
	/// <returns>
	/// A valid PostgreSQL connection string for design-time operations.
	/// </returns>
	/// <exception cref="InvalidOperationException">
	/// Thrown when required Database settings are not configured.
	/// </exception>
	public static string GetConnectionString()
	{
		IConfigurationRoot configuration =
			BuildConfiguration();

		IConfigurationSection databaseSection =
			configuration.GetSection("Database");

		string databaseHost =
			databaseSection["Host"]
			?? throw new InvalidOperationException(
				"Database:Host must be set in User Secrets or appsettings.json for design-time operations. "
					+ $"Run: dotnet user-secrets set \"Database:Host\" \"localhost\" --project SeventySix.Api");

		string databasePort =
			databaseSection["Port"]
			?? throw new InvalidOperationException(
				"Database:Port must be set in User Secrets or appsettings.json for design-time operations. "
					+ $"Run: dotnet user-secrets set \"Database:Port\" \"5433\" --project SeventySix.Api");

		string databaseName =
			databaseSection["Name"]
			?? throw new InvalidOperationException(
				"Database:Name must be set in User Secrets or appsettings.json for design-time operations. "
					+ $"Run: dotnet user-secrets set \"Database:Name\" \"seventysix\" --project SeventySix.Api");

		string databaseUser =
			databaseSection["User"]
			?? throw new InvalidOperationException(
				"Database:User must be set in User Secrets or appsettings.json for design-time operations. "
					+ $"Run: dotnet user-secrets set \"Database:User\" \"postgres\" --project SeventySix.Api");

		string databasePassword =
			databaseSection["Password"]
			?? throw new InvalidOperationException(
				"Database:Password must be set in User Secrets or appsettings.json for design-time operations. "
					+ $"Run: dotnet user-secrets set \"Database:Password\" \"your-password\" --project SeventySix.Api");

		return $"Host={databaseHost};Port={databasePort};Database={databaseName};Username={databaseUser};"
			+ $"Password={databasePassword};Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;"
			+ "Connection Lifetime=0;";
	}

	/// <summary>
	/// Builds configuration from appsettings.json, appsettings.Development.json, and User Secrets.
	/// </summary>
	/// <returns>
	/// The built configuration root.
	/// </returns>
	private static IConfigurationRoot BuildConfiguration()
	{
		string apiProjectDirectory =
			FindApiProjectDirectory()
			?? throw new InvalidOperationException(
				"Could not find SeventySix.Api project directory. "
					+ "Ensure you are running from within the repository.");

		return new ConfigurationBuilder()
			.SetBasePath(apiProjectDirectory)
			.AddJsonFile(
				"appsettings.json",
				optional: false)
			.AddJsonFile(
				"appsettings.Development.json",
				optional: true)
			.AddUserSecrets(UserSecretsId)
			.Build();
	}

	/// <summary>
	/// Searches for the SeventySix.Api project directory by traversing up the directory tree.
	/// </summary>
	/// <returns>
	/// The full path to the SeventySix.Api directory if found; otherwise null.
	/// </returns>
	private static string? FindApiProjectDirectory()
	{
		string? currentDirectory =
			Directory.GetCurrentDirectory();

		while (!string.IsNullOrEmpty(currentDirectory))
		{
			string apiProjectPath =
				Path.Join(
					currentDirectory,
					"SeventySix.Api");

			if (Directory.Exists(apiProjectPath))
			{
				return apiProjectPath;
			}

			string nestedApiProjectPath =
				Path.Join(
					currentDirectory,
					"SeventySix.Server",
					"SeventySix.Api");

			if (Directory.Exists(nestedApiProjectPath))
			{
				return nestedApiProjectPath;
			}

			DirectoryInfo? parent =
				Directory.GetParent(currentDirectory);

			if (parent == null)
			{
				break;
			}

			currentDirectory = parent.FullName;
		}

		return null;
	}
}