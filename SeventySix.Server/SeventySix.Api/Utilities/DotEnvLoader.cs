using System;
using System.IO;

namespace SeventySix.Api.Utilities;

/// <summary>
/// Utility to load environment variables from a .env file.
/// </summary>
public static class DotEnvLoader
{
	/// <summary>
	/// Locates and loads the .env file into environment variables.
	/// Searches hierarchically up from the current directory.
	/// </summary>
	public static void Load()
	{
		string currentDirectory =
			Directory.GetCurrentDirectory();

		// Look for .env file by traversing up the directory tree
		while (!string.IsNullOrEmpty(currentDirectory))
		{
			string envPath =
				Path.Combine(currentDirectory, ".env");
			if (File.Exists(envPath))
			{
				LoadFile(envPath);
				return;
			}

			DirectoryInfo? parent =
				Directory.GetParent(currentDirectory);
			if (parent == null)
			{
				break;
			}

			currentDirectory = parent.FullName;
		}
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
			if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith('#'))
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
			if (value.Length >= 2 &&
				((value.StartsWith('"') && value.EndsWith('"')) ||
				 (value.StartsWith('\'') && value.EndsWith('\''))))
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
