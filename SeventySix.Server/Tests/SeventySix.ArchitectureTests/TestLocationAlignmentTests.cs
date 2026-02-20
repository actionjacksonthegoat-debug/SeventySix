// <copyright file="TestLocationAlignmentTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using SeventySix.ElectronicNotifications;
using SeventySix.Identity;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architecture tests ensuring test file locations mirror source code structure.
/// Tests that all command/query handlers have corresponding test files.
/// </summary>
public sealed class TestLocationAlignmentTests : SourceCodeArchitectureTest
{
	private static readonly Assembly IdentityAssembly =
		typeof(ApplicationUser).Assembly;

	private static readonly Assembly DomainsAssembly =
		typeof(ElectronicNotificationsDbContext).Assembly;

	/// <summary>
	/// Verifies that all command handlers have corresponding test files.
	/// Command handlers follow the pattern: {CommandName}Handler.cs
	/// Test files should follow the pattern: {CommandName}HandlerTests.cs
	/// </summary>
	[Fact]
	public void All_CommandHandlers_Should_Have_Corresponding_Tests()
	{
		// Arrange - Get handlers from both domain assemblies
		Type[] commandHandlerTypes =
			DomainsAssembly
				.GetTypes()
				.Concat(IdentityAssembly.GetTypes())
				.Where(type =>
					type.Name.EndsWith("Handler")
					&& type.Namespace?.Contains("Commands") == true
					&& !type.IsAbstract
					&& !type.IsInterface)
				.ToArray();

		List<string> missingTests = [];

		// Act
		foreach (Type handlerType in commandHandlerTypes)
		{
			string expectedTestName =
				$"{handlerType.Name}Tests.cs";

			string? domainFolder =
				GetDomainFromNamespace(handlerType.Namespace);

			if (domainFolder == null)
			{
				continue;
			}

			// Determine the correct test project based on handler namespace
			bool isIdentityHandler =
				handlerType.Namespace?.StartsWith("SeventySix.Identity") == true;

			string testProjectName =
				isIdentityHandler
					? "SeventySix.Domains.Identity.Tests"
					: "SeventySix.Domains.Tests";

			string testsDirectory =
				Path.Combine(
					SolutionRoot,
					"Tests",
					testProjectName);

			string commandName =
				handlerType.Name.Replace(
					"Handler",
					string.Empty);

			// For Identity, the test project structure doesn't have an "Identity" subfolder
			string testDomainFolder =
				isIdentityHandler ? string.Empty : domainFolder;

			string expectedTestPath =
				string.IsNullOrEmpty(testDomainFolder)
					? Path.Combine(
						testsDirectory,
						"Commands",
						commandName,
						expectedTestName)
					: Path.Combine(
						testsDirectory,
						testDomainFolder,
						"Commands",
						commandName,
						expectedTestName);

			// Also check without the command subfolder
			string alternativeTestPath =
				string.IsNullOrEmpty(testDomainFolder)
					? Path.Combine(
						testsDirectory,
						"Commands",
						expectedTestName)
					: Path.Combine(
						testsDirectory,
						testDomainFolder,
						"Commands",
						expectedTestName);

			if (!File.Exists(expectedTestPath) && !File.Exists(alternativeTestPath))
			{
				string displayPath =
					string.IsNullOrEmpty(testDomainFolder)
						? $"Commands/{commandName}/{expectedTestName}"
						: $"{testDomainFolder}/Commands/{commandName}/{expectedTestName}";

				missingTests.Add(displayPath);
			}
		}

		// Assert
		missingTests.ShouldBeEmpty(
			$"Missing command handler tests ({missingTests.Count}):\n" +
			string.Join(
				"\n",
				missingTests.Select(test => $"  - {test}")));
	}

	/// <summary>
	/// Verifies that all query handlers have corresponding test files.
	/// Query handlers follow the pattern: {QueryName}Handler.cs
	/// Test files should follow the pattern: {QueryName}HandlerTests.cs
	/// </summary>
	[Fact]
	public void All_QueryHandlers_Should_Have_Corresponding_Tests()
	{
		// Arrange - Get handlers from both domain assemblies
		Type[] queryHandlerTypes =
			DomainsAssembly
				.GetTypes()
				.Concat(IdentityAssembly.GetTypes())
				.Where(type =>
					type.Name.EndsWith("Handler")
					&& type.Namespace?.Contains("Queries") == true
					&& !type.IsAbstract
					&& !type.IsInterface)
				.ToArray();

		List<string> missingTests = [];

		// Act
		foreach (Type handlerType in queryHandlerTypes)
		{
			string expectedTestName =
				$"{handlerType.Name}Tests.cs";

			string? domainFolder =
				GetDomainFromNamespace(handlerType.Namespace);

			if (domainFolder == null)
			{
				continue;
			}

			// Determine the correct test project based on handler namespace
			bool isIdentityHandler =
				handlerType.Namespace?.StartsWith("SeventySix.Identity") == true;

			string testProjectName =
				isIdentityHandler
					? "SeventySix.Domains.Identity.Tests"
					: "SeventySix.Domains.Tests";

			string testsDirectory =
				Path.Combine(
					SolutionRoot,
					"Tests",
					testProjectName);

			string queryName =
				handlerType.Name.Replace(
					"Handler",
					string.Empty);

			// For Identity, the test project structure doesn't have an "Identity" subfolder
			string testDomainFolder =
				isIdentityHandler ? string.Empty : domainFolder;

			string expectedTestPath =
				string.IsNullOrEmpty(testDomainFolder)
					? Path.Combine(
						testsDirectory,
						"Queries",
						queryName,
						expectedTestName)
					: Path.Combine(
						testsDirectory,
						testDomainFolder,
						"Queries",
						queryName,
						expectedTestName);

			// Also check without the query subfolder
			string alternativeTestPath =
				string.IsNullOrEmpty(testDomainFolder)
					? Path.Combine(
						testsDirectory,
						"Queries",
						expectedTestName)
					: Path.Combine(
						testsDirectory,
						testDomainFolder,
						"Queries",
						expectedTestName);

			if (!File.Exists(expectedTestPath) && !File.Exists(alternativeTestPath))
			{
				string displayPath =
					string.IsNullOrEmpty(testDomainFolder)
						? $"Queries/{queryName}/{expectedTestName}"
						: $"{testDomainFolder}/Queries/{queryName}/{expectedTestName}";

				missingTests.Add(displayPath);
			}
		}

		// Assert
		missingTests.ShouldBeEmpty(
			$"Missing query handler tests ({missingTests.Count}):\n" +
			string.Join(
				"\n",
				missingTests.Select(test => $"  - {test}")));
	}

	/// <summary>
	/// Verifies that all job handlers have corresponding test files.
	/// Job handlers follow the pattern: {JobName}Handler.cs
	/// Test files should follow the pattern: {JobName}HandlerTests.cs
	/// </summary>
	[Fact]
	public void All_JobHandlers_Should_Have_Corresponding_Tests()
	{
		// Arrange - Get handlers from both domain assemblies
		Type[] jobHandlerTypes =
			DomainsAssembly
				.GetTypes()
				.Concat(IdentityAssembly.GetTypes())
				.Where(type =>
					type.Name.EndsWith("Handler")
					&& type.Namespace?.Contains("Jobs") == true
					&& !type.IsAbstract
					&& !type.IsInterface)
				.ToArray();

		List<string> missingTests = [];

		// Act
		foreach (Type handlerType in jobHandlerTypes)
		{
			string expectedTestName =
				$"{handlerType.Name}Tests.cs";

			string? relativePath =
				GetRelativePathToJobsFolder(handlerType.Namespace);

			if (relativePath == null)
			{
				continue;
			}

			// Determine the correct test project based on handler namespace
			bool isIdentityHandler =
				handlerType.Namespace?.StartsWith("SeventySix.Identity") == true;

			string testProjectName =
				isIdentityHandler
					? "SeventySix.Domains.Identity.Tests"
					: "SeventySix.Domains.Tests";

			// For Identity, the test project structure doesn't have an "Identity" subfolder
			// so we need to strip the "Identity\" prefix from the relative path
			string testRelativePath =
				isIdentityHandler && relativePath.StartsWith("Identity/")
					? relativePath["Identity/".Length..]
					: relativePath;

			string testsDirectory =
				Path.Combine(
					SolutionRoot,
					"Tests",
					testProjectName);

			string expectedTestPath =
				Path.Combine(
					testsDirectory,
					testRelativePath,
					expectedTestName);

			if (!File.Exists(expectedTestPath))
			{
				missingTests.Add(
					$"{testRelativePath}/{expectedTestName}");
			}
		}

		// Assert
		missingTests.ShouldBeEmpty(
			$"Missing job handler tests ({missingTests.Count}):\n" +
			string.Join(
				"\n",
				missingTests.Select(test => $"  - {test}")));
	}

	/// <summary>
	/// Verifies that all repositories have corresponding test files.
	/// </summary>
	[Fact]
	public void All_Repositories_Should_Have_Corresponding_Tests()
	{
		// Arrange
		Type[] repositoryTypes =
			DomainsAssembly
				.GetTypes()
				.Where(type =>
					type.Name.EndsWith("Repository")
					&& type.Namespace?.Contains("Repositories") == true
					&& !type.IsAbstract
					&& !type.IsInterface)
				.ToArray();

		string testsDirectory =
			Path.Combine(
				SolutionRoot,
				"Tests",
				"SeventySix.Domains.Tests");

		List<string> missingTests = [];

		// Act
		foreach (Type repositoryType in repositoryTypes)
		{
			string expectedTestName =
				$"{repositoryType.Name}Tests.cs";

			string? domainFolder =
				GetDomainFromNamespace(repositoryType.Namespace);

			if (domainFolder == null)
			{
				continue;
			}

			string expectedTestPath =
				Path.Combine(
					testsDirectory,
					domainFolder,
					"Repositories",
					expectedTestName);

			if (!File.Exists(expectedTestPath))
			{
				missingTests.Add(
					$"{domainFolder}/Repositories/{expectedTestName}");
			}
		}

		// Assert
		missingTests.ShouldBeEmpty(
			$"Missing repository tests ({missingTests.Count}):\n" +
			string.Join(
				"\n",
				missingTests.Select(test => $"  - {test}")));
	}

	/// <summary>
	/// Extracts the domain name from a namespace.
	/// Example: "SeventySix.Identity.Commands.Login" returns "Identity".
	/// </summary>
	/// <param name="typeNamespace">
	/// The full namespace of the type.
	/// </param>
	/// <returns>
	/// The domain name or null if not found.
	/// </returns>
	private static string? GetDomainFromNamespace(string? typeNamespace)
	{
		if (string.IsNullOrEmpty(typeNamespace))
		{
			return null;
		}

		// Expected format: SeventySix.{Domain}.{SubNamespace}
		string[] parts =
			typeNamespace.Split('.');

		if (parts.Length < 2)
		{
			return null;
		}

		// Return the second part (domain name)
		return parts[1];
	}

	/// <summary>
	/// Extracts the relative path to the Jobs folder from a namespace.
	/// Handles nested domain structures like ElectronicNotifications.Emails.Jobs.
	/// Example: "SeventySix.Identity.Jobs" returns "Identity/Jobs".
	/// Example: "SeventySix.ElectronicNotifications.Emails.Jobs" returns "ElectronicNotifications/Emails/Jobs".
	/// </summary>
	/// <param name="typeNamespace">
	/// The full namespace of the type.
	/// </param>
	/// <returns>
	/// The relative path including Jobs folder or null if not found.
	/// </returns>
	private static string? GetRelativePathToJobsFolder(string? typeNamespace)
	{
		if (string.IsNullOrEmpty(typeNamespace))
		{
			return null;
		}

		// Expected format: SeventySix.{Domain}[.{SubDomain}].Jobs
		// Remove "SeventySix." prefix
		const string prefix = "SeventySix.";

		if (!typeNamespace.StartsWith(prefix))
		{
			return null;
		}

		string relativePath =
			typeNamespace[prefix.Length..];

		// Convert dots to forward slashes for cross-platform consistency
		return relativePath.Replace('.', '/');
	}
}