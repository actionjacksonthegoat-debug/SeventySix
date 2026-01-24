// <copyright file="TestLocationAlignmentTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using SeventySix.Identity;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architecture tests ensuring test file locations mirror source code structure.
/// Tests that all command/query handlers have corresponding test files.
/// </summary>
public class TestLocationAlignmentTests : SourceCodeArchitectureTest
{
	private static readonly Assembly DomainsAssembly =
		typeof(ApplicationUser).Assembly;

	/// <summary>
	/// Verifies that all command handlers have corresponding test files.
	/// Command handlers follow the pattern: {CommandName}Handler.cs
	/// Test files should follow the pattern: {CommandName}HandlerTests.cs
	/// </summary>
	[Fact]
	public void All_CommandHandlers_Should_Have_Corresponding_Tests()
	{
		// Arrange
		Type[] commandHandlerTypes =
			DomainsAssembly
				.GetTypes()
				.Where(type =>
					type.Name.EndsWith("Handler")
					&& type.Namespace?.Contains("Commands") == true
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

			string commandName =
				handlerType.Name.Replace(
					"Handler",
					string.Empty);

			string expectedTestPath =
				Path.Combine(
					testsDirectory,
					domainFolder,
					"Commands",
					commandName,
					expectedTestName);

			// Also check without the command subfolder
			string alternativeTestPath =
				Path.Combine(
					testsDirectory,
					domainFolder,
					"Commands",
					expectedTestName);

			if (!File.Exists(expectedTestPath) && !File.Exists(alternativeTestPath))
			{
				missingTests.Add(
					$"{domainFolder}/Commands/{commandName}/{expectedTestName}");
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
		// Arrange
		Type[] queryHandlerTypes =
			DomainsAssembly
				.GetTypes()
				.Where(type =>
					type.Name.EndsWith("Handler")
					&& type.Namespace?.Contains("Queries") == true
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

			string queryName =
				handlerType.Name.Replace(
					"Handler",
					string.Empty);

			string expectedTestPath =
				Path.Combine(
					testsDirectory,
					domainFolder,
					"Queries",
					queryName,
					expectedTestName);

			// Also check without the query subfolder
			string alternativeTestPath =
				Path.Combine(
					testsDirectory,
					domainFolder,
					"Queries",
					expectedTestName);

			if (!File.Exists(expectedTestPath) && !File.Exists(alternativeTestPath))
			{
				missingTests.Add(
					$"{domainFolder}/Queries/{queryName}/{expectedTestName}");
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
		// Arrange
		Type[] jobHandlerTypes =
			DomainsAssembly
				.GetTypes()
				.Where(type =>
					type.Name.EndsWith("Handler")
					&& type.Namespace?.Contains("Jobs") == true
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

			string expectedTestPath =
				Path.Combine(
					testsDirectory,
					relativePath,
					expectedTestName);

			if (!File.Exists(expectedTestPath))
			{
				missingTests.Add(
					$"{relativePath}/{expectedTestName}");
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

		// Convert dots to path separators
		return relativePath.Replace('.', Path.DirectorySeparatorChar);
	}
}
