// <copyright file="DesignTimeConnectionStringProvider.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Reflection;

namespace SeventySix.Shared.Utilities;

/// <summary>
/// Provides database connection strings for EF Core design-time operations.
/// </summary>
/// <remarks>
/// Used by DbContext factories during migration generation (dotnet ef commands).
/// Loads connection details from the .env file to maintain single source of truth.
/// </remarks>
public static class DesignTimeConnectionStringProvider
{
	/// <summary>
	/// Builds a PostgreSQL connection string from the .env file.
	/// </summary>
	/// <remarks>
	/// Searches for the .env file starting from the assembly location
	/// and traversing up the directory tree until found.
	/// </remarks>
	/// <returns>
	/// A valid PostgreSQL connection string for design-time operations.
	/// </returns>
	/// <exception cref="InvalidOperationException">
	/// Thrown when DB_PASSWORD is not set in the .env file.
	/// </exception>
	public static string GetConnectionString()
	{
		LoadEnvFile();

		string host =
			Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";

		string port =
			Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";

		string database =
			Environment.GetEnvironmentVariable("DB_NAME") ?? "seventysix";

		string username =
			Environment.GetEnvironmentVariable("DB_USER") ?? "postgres";

		string password =
			Environment.GetEnvironmentVariable("DB_PASSWORD")
			?? throw new InvalidOperationException(
				"DB_PASSWORD must be set in .env file for design-time operations. "
					+ "Ensure .env file exists at repository root with DB_PASSWORD set.");

		return $"Host={host};Port={port};Database={database};Username={username};"
			+ $"Password={password};Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;"
			+ "Connection Lifetime=0;";
	}

	/// <summary>
	/// Loads environment variables from the .env file.
	/// </summary>
	private static void LoadEnvFile()
	{
		string? envPath =
			FindEnvFileFromDirectory(Directory.GetCurrentDirectory());

		if (envPath == null)
		{
			string? assemblyLocation =
				Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

			if (!string.IsNullOrEmpty(assemblyLocation))
			{
				envPath =
					FindEnvFileFromDirectory(assemblyLocation);
			}
		}

		if (envPath == null)
		{
			envPath =
				FindEnvFileFromDirectory(AppDomain.CurrentDomain.BaseDirectory);
		}

		if (envPath != null)
		{
			LoadFile(envPath);
		}
	}

	/// <summary>
	/// Searches for a .env file starting from the specified directory.
	/// </summary>
	/// <param name="startDirectory">
	/// The directory to start searching from.
	/// </param>
	/// <returns>
	/// The full path to the .env file if found; otherwise null.
	/// </returns>
	private static string? FindEnvFileFromDirectory(string startDirectory)
	{
		string? currentDirectory = startDirectory;

		while (!string.IsNullOrEmpty(currentDirectory))
		{
			string envPath =
				Path.Combine(currentDirectory, ".env");

			if (File.Exists(envPath))
			{
				return envPath;
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

	/// <summary>
	/// Loads environment variables from the specified file.
	/// </summary>
	/// <param name="filePath">
	/// The path to the .env file.
	/// </param>
	private static void LoadFile(string filePath)
	{
		foreach (string line in File.ReadAllLines(filePath))
		{
			if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
			{
				continue;
			}

			string[] parts =
				line.Split('=', 2);

			if (parts.Length != 2)
			{
				continue;
			}

			string key = parts[0].Trim();
			string value = parts[1].Trim();

			if (
				value.Length >= 2
				&& ((value.StartsWith('"') && value.EndsWith('"'))
					|| (value.StartsWith('\'') && value.EndsWith('\''))))
			{
				value =
					value.Substring(1, value.Length - 2);
			}

			if (Environment.GetEnvironmentVariable(key) == null)
			{
				Environment.SetEnvironmentVariable(key, value);
			}
		}
	}
}
