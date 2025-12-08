// <copyright file="LoggingStandardsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Text.RegularExpressions;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that enforce logging standards across the codebase.
/// Rules:
/// - NEVER use LogDebug
/// - NEVER use LogInformation (except background job completion messages)
/// - Use LogWarning for recoverable issues
/// - Use LogError for unrecoverable failures.
/// </summary>
public class LoggingStandardsTests : SourceCodeArchitectureTest
{
	[Fact]
	public void LogDebug_ShouldNeverBeUsed()
	{
		// Arrange
		IEnumerable<string> csFiles =
			GetSourceFiles("*.cs");

		Regex logDebugPattern =
			new Regex(
				@"\.LogDebug\(",
				RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in csFiles)
		{
			// Allow LogDebug in development-only files (WebApplicationExtensions for dev middleware)
			if (file.Contains("\\Extensions\\WebApplicationExtensions.cs"))
			{
				continue;
			}

			string content =
				ReadFileContent(file);

			if (logDebugPattern.IsMatch(content))
			{
				violations.Add(GetRelativePath(file));
			}
		}

		// Assert
		Assert.Empty(violations);
	}

	[Fact]
	public void LogInformation_ShouldOnlyBeUsedInBackgroundJobs()
	{
		// Arrange
		IEnumerable<string> csFiles =
			GetSourceFiles("*.cs");

		Regex logInformationPattern =
			new Regex(
				@"\.LogInformation\(",
				RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in csFiles)
		{
			// Allow in background services and startup/configuration
			bool isBackgroundService =
				file.EndsWith("Service.cs")
				|| file.EndsWith("Job.cs");

			bool isStartupConfig =
				file.Contains("\\Extensions\\WebApplicationExtensions.cs")
				|| file.Contains("\\Extensions\\ServiceCollectionExtensions.cs")
				|| file.Contains("Program.cs");

			string content =
				ReadFileContent(file);

			if (logInformationPattern.IsMatch(content) && !isBackgroundService && !isStartupConfig)
			{
				// Additional check: is it actually a BackgroundService class?
				bool inheritsBackgroundService =
					content.Contains("BackgroundService");

				if (!inheritsBackgroundService)
				{
					violations.Add(GetRelativePath(file));
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}
}