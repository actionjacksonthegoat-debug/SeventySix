// <copyright file="SettingsPatternTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Text.RegularExpressions;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that enforce settings pattern standards.
/// Rules:
/// - Settings classes must be records (for immutability)
/// - Settings must be in Settings/ or Api/Configuration/ folders
/// - Settings use init properties (NOT positional params - breaks Options pattern).
/// </summary>
/// <remarks>
/// Settings are different from DTOs:
/// - DTOs use positional parameters (immutable API contracts)
/// - Settings use init properties with defaults (Options pattern compatibility).
/// </remarks>
public class SettingsPatternTests : SourceCodeArchitectureTest
{
	[Fact]
	public void Settings_ShouldBeRecords()
	{
		// Arrange
		IEnumerable<string> settingsFiles =
			GetSourceFiles("*Settings.cs");

		Regex classPattern =
			new Regex(
			@"public\s+class\s+(\w+Settings)\b",
			RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in settingsFiles)
		{
			string content =
				ReadFileContent(file);

			MatchCollection matches =
				classPattern.Matches(content);

			if (matches.Count > 0)
			{
				string relativePath =
					GetRelativePath(file);

				foreach (Match match in matches)
				{
					string className = match.Groups[1].Value;

					violations.Add(
						$"{relativePath}: {className} (should be record)");
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}

	[Fact]
	public void Settings_ShouldBeInSettingsOrConfigurationFolder()
	{
		// Arrange
		IEnumerable<string> settingsFiles =
			GetSourceFiles("*Settings.cs");

		List<string> violations = [];

		// Act
		foreach (string file in settingsFiles)
		{
			string relativePath =
				GetRelativePath(file);

			// Valid locations:
			// 1. SeventySix.Api/Configuration/ (API-only settings)
			// 2. SeventySix/{Context}/Settings/ (bounded context settings)
			bool isInSettingsFolder =
				relativePath.Contains("\\Settings\\")
				|| relativePath.Contains("/Settings/");

			bool isInApiConfiguration =
				relativePath.Contains("SeventySix.Api")
				&& (
					relativePath.Contains("\\Configuration\\")
					|| relativePath.Contains("/Configuration/"));

			if (!isInSettingsFolder && !isInApiConfiguration)
			{
				violations.Add(
					$"{relativePath}: Settings must be in Settings/ folder (or Api/Configuration/)");
			}
		}

		// Assert
		Assert.Empty(violations);
	}
}
