using System;
using System.IO;
using System.Reflection;

namespace SeventySix.Api.Utilities;

/// <summary>
/// Utility to load environment variables from a .env file.
/// </summary>
/// <remarks>
/// Security: Only loads .env files in Development/Test environments.
/// In Production, environment variables must be set via proper secrets management
/// (e.g., Kubernetes secrets, Azure Key Vault, Docker secrets).
/// </remarks>
public static class DotEnvLoader
{
	/// <summary>
	/// Locates and loads the .env file into environment variables.
	/// Searches hierarchically up from the current directory, then from the assembly location.
	/// </summary>
	/// <remarks>
	/// Security: Skips loading in Production to prevent accidental .env file deployment.
	/// Uses ASPNETCORE_ENVIRONMENT check before configuration is built.
	/// </remarks>
	public static void Load()
	{
		// Security: Never load .env in Production - use proper secrets management
		string environment =
			Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";

		if (string.Equals(environment, "Production", StringComparison.OrdinalIgnoreCase))
		{
			return;
		}

		// Strategy 1: Search from current working directory (npm run scenarios)
		string? envPath =
			FindEnvFileFromDirectory(
				Directory.GetCurrentDirectory());

		// Strategy 2: Search from assembly location (Visual Studio F5 scenarios)
		if (envPath == null)
		{
			string? assemblyLocation =
				Path.GetDirectoryName(
					Assembly.GetExecutingAssembly().Location);

			if (!string.IsNullOrEmpty(assemblyLocation))
			{
				envPath =
					FindEnvFileFromDirectory(assemblyLocation);
			}
		}

		// Strategy 3: Search from base directory (fallback for other scenarios)
		if (envPath == null)
		{
			envPath =
				FindEnvFileFromDirectory(
					AppDomain.CurrentDomain.BaseDirectory);
		}

		if (envPath != null)
		{
			LoadFile(envPath);
		}
	}

	/// <summary>
	/// Searches for a .env file starting from the specified directory and traversing up.
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
	/// Loads environment variables from the specified .env file.
	/// </summary>
	/// <param name="filePath">
	/// The path to the .env file.
	/// </param>
	private static void LoadFile(string filePath)
	{
		foreach (string line in File.ReadAllLines(filePath))
		{
			if (string.IsNullOrWhiteSpace(line)
				|| line.TrimStart().StartsWith('#'))
			{
				continue;
			}

			// Split on first '=' only
			string[] parts =
				line.Split('=', 2);
			if (parts.Length != 2)
			{
				continue;
			}

			string key = parts[0].Trim();
			string value = parts[1].Trim();

			// Remove quotes if present
			if (value.Length >= 2
				&& ((value.StartsWith('"') && value.EndsWith('"'))
					|| (value.StartsWith('\'') && value.EndsWith('\''))))
			{
				value =
					value.Substring(1, value.Length - 2);
			}

			// Don't overwrite existing environment variables
			if (Environment.GetEnvironmentVariable(key) == null)
			{
				Environment.SetEnvironmentVariable(key, value);
			}
		}
	}
}