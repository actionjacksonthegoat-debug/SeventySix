// <copyright file="SettingsPatternTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Shouldly;
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
public sealed class SettingsPatternTests : SourceCodeArchitectureTest
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
		violations.ShouldBeEmpty();
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
				relativePath.Contains("/Settings/");

			bool isInApiConfiguration =
				relativePath.Contains("SeventySix.Api")
				&& relativePath.Contains("/Configuration/");

			if (!isInSettingsFolder && !isInApiConfiguration)
			{
				violations.Add(
					$"{relativePath}: Settings must be in Settings/ folder (or Api/Configuration/)");
			}
		}

		// Assert
		violations.ShouldBeEmpty();
	}

	/// <summary>
	/// Excluded records that intentionally do not need validators (YAGNI).
	/// </summary>
	private static readonly HashSet<string> ExcludedFromValidation =
		[
		// Sub-settings validated as part of parent composite validators
		"LockoutSettings",
		"PasswordSettings",
		"Argon2Settings",
		"AuthRateLimitSettings",
		"AuthCookieSettings",
		"TokenSettings",
		"BreachedPasswordSettings",
		"OAuthSettings",
		"OAuthProviderSettings",
		// Simple boolean toggles or marker records
		"E2ESeederSettings",
		// Named cache entries validated by CacheSettingsValidator
		"NamedCacheSettings",
		// Sub-settings without independent registration
		"ValkeySettings",
		// Request limits validated at registration level
		"RequestLimitsSettings",
	];

	[Fact]
	public void EverySettingsRecord_ShouldHaveValidator()
	{
		// Arrange: Find all *Settings/*Options records across all source assemblies
		IEnumerable<string> settingsFiles =
			GetSourceFiles("*Settings.cs")
				.Concat(GetSourceFiles("*Options.cs"));

		Regex recordPattern =
			new(
			@"public\s+record\s+(\w+(?:Settings|Options))\b",
			RegexOptions.Compiled);

		List<string> settingsWithoutValidators = [];

		// Act
		foreach (string settingsFile in settingsFiles)
		{
			string content =
				ReadFileContent(settingsFile);

			MatchCollection matches =
				recordPattern.Matches(content);

			foreach (Match match in matches)
			{
				string settingsName =
					match.Groups[1].Value;

				if (ExcludedFromValidation.Contains(settingsName))
				{
					continue;
				}

				// Look for a corresponding validator file in the same directory
				string directory =
					Path.GetDirectoryName(settingsFile)!;

				string validatorFileName =
					$"{settingsName}Validator.cs";

				bool validatorExists =
					File.Exists(Path.Combine(directory, validatorFileName));

				if (!validatorExists)
				{
					string relativePath =
						GetRelativePath(settingsFile);

					settingsWithoutValidators.Add(
						$"{relativePath}: {settingsName} (missing {validatorFileName})");
				}
			}
		}

		// Assert
		settingsWithoutValidators.ShouldBeEmpty();
	}
}