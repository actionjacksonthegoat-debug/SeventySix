// <copyright file="HostingEnvironmentDependencyTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that domain and shared projects do not reference the hosting environment.
/// IWebHostEnvironment and IHostEnvironment are API-layer concerns only.
/// </summary>
/// <remarks>
/// Rule: Domain and Shared code must be agnostic to the hosting environment.
/// Environment-conditional logic belongs in SeventySix.Api (Program.cs, Registration/).
/// Violations indicate leakage of infrastructure concerns into business logic.
/// </remarks>
public sealed class HostingEnvironmentDependencyTests : SourceCodeArchitectureTest
{
	/// <summary>
	/// Tests that domain and shared source files do not reference IWebHostEnvironment.
	/// </summary>
	[Fact]
	public void DomainAndSharedFiles_ShouldNotReference_IWebHostEnvironment()
	{
		// Arrange — only scan Domains and Shared projects, not Api
		IEnumerable<string> domainFiles =
			GetSourceFiles("*.cs")
				.Where(filePath =>
					filePath.Contains("/SeventySix.Domains")
					|| filePath.Contains("/SeventySix.Shared"));

		Regex hostingEnvPattern =
			new Regex(
			@"\bIWebHostEnvironment\b",
			RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in domainFiles)
		{
			string content =
				ReadFileContent(file);

			if (hostingEnvPattern.IsMatch(content))
			{
				string relativePath =
					GetRelativePath(file);

				violations.Add(
					$"{relativePath}: references IWebHostEnvironment (API-layer concern only)");
			}
		}

		// Assert
		violations.ShouldBeEmpty();
	}

	/// <summary>
	/// Tests that domain and shared source files do not reference IHostEnvironment.
	/// </summary>
	[Fact]
	public void DomainAndSharedFiles_ShouldNotReference_IHostEnvironment()
	{
		// Arrange — only scan Domains and Shared projects, not Api
		IEnumerable<string> domainFiles =
			GetSourceFiles("*.cs")
				.Where(filePath =>
					filePath.Contains("/SeventySix.Domains")
					|| filePath.Contains("/SeventySix.Shared"));

		Regex hostEnvPattern =
			new Regex(
			@"\bIHostEnvironment\b",
			RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in domainFiles)
		{
			string content =
				ReadFileContent(file);

			if (hostEnvPattern.IsMatch(content))
			{
				string relativePath =
					GetRelativePath(file);

				violations.Add(
					$"{relativePath}: references IHostEnvironment (API-layer concern only)");
			}
		}

		// Assert
		violations.ShouldBeEmpty();
	}

	/// <summary>
	/// Tests that domain and shared source files do not use ASPNETCORE_ENVIRONMENT
	/// via <see cref="Environment.GetEnvironmentVariable"/>.
	/// Environment-conditional logic belongs in SeventySix.Api (Program.cs, Registration/, StartupValidator).
	/// </summary>
	[Fact]
	public void DomainAndSharedFiles_ShouldNotReference_AspNetCoreEnvironmentVariable()
	{
		// Arrange — only scan Domains and Shared projects, not Api
		IEnumerable<string> domainFiles =
			GetSourceFiles("*.cs")
				.Where(filePath =>
					filePath.Contains("/SeventySix.Domains")
					|| filePath.Contains("/SeventySix.Shared"));

		Regex envVarPattern =
			new Regex(
			@"ASPNETCORE_ENVIRONMENT",
			RegexOptions.Compiled);

		List<string> violations = [];

		// Act
		foreach (string file in domainFiles)
		{
			string content =
				ReadFileContent(file);

			if (envVarPattern.IsMatch(content))
			{
				string relativePath =
					GetRelativePath(file);

				violations.Add(
					$"{relativePath}: references ASPNETCORE_ENVIRONMENT (API-layer concern only)");
			}
		}

		// Assert
		violations.ShouldBeEmpty();
	}
}