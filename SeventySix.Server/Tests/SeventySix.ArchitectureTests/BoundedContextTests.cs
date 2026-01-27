using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using NetArchTest.Rules;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce bounded context isolation.
/// Ensures bounded contexts don't have circular dependencies.
/// Automatically discovers all bounded contexts.
/// </summary>
public class BoundedContextTests
{
	/// <summary>
	/// Service-only bounded contexts that don't require a DbContext.
	/// These provide cross-cutting services (email, notifications, etc.).
	/// </summary>
	private static readonly string[] ServiceOnlyContexts =
		[
		"ElectronicNotifications",
	];

	/// <summary>
	/// Allowed cross-context dependencies.
	/// Key = dependent context, Value = contexts it can depend on.
	/// Service-only contexts are typically safe to depend on.
	/// </summary>
	private static readonly Dictionary<string, string[]> AllowedDependencies =
		new()
		{
			["Identity"] =
				["ElectronicNotifications"]
		};

	[Fact]
	public void Bounded_Contexts_Should_Not_Reference_Each_Other()
	{
		Assembly domainAssembly =
			typeof(SeventySix.Identity.ApplicationUser).Assembly;

		string[] boundedContextNames =
			GetBoundedContextNames(domainAssembly);

		List<string> circularDependencyViolations =
			FindCircularDependencyViolations(boundedContextNames);

		circularDependencyViolations.ShouldBeEmpty();
	}

	/// <summary>
	/// Finds violations where one bounded context depends on another.
	/// </summary>
	/// <param name="boundedContextNames">
	/// Names of all discovered bounded contexts.
	/// </param>
	/// <returns>
	/// List of violation messages.
	/// </returns>
	private static List<string> FindCircularDependencyViolations(
		string[] boundedContextNames)
	{
		List<string> violations = [];

		foreach (string sourceContextName in boundedContextNames)
		{
			foreach (string targetContextName in boundedContextNames)
			{
				if (ShouldSkipDependencyCheck(
					sourceContextName,
					targetContextName))
				{
					continue;
				}

				CheckAndAddViolation(
					sourceContextName,
					targetContextName,
					violations);
			}
		}

		return violations;
	}

	/// <summary>
	/// Determines if a dependency check should be skipped.
	/// </summary>
	private static bool ShouldSkipDependencyCheck(
		string sourceContextName,
		string targetContextName)
	{
		// Skip self-references
		if (sourceContextName == targetContextName)
		{
			return true;
		}

		// Check if this dependency is explicitly allowed
		return AllowedDependencies.TryGetValue(
			sourceContextName,
			out string[]? allowed) && allowed.Contains(targetContextName);
	}

	/// <summary>
	/// Checks if source depends on target and adds violation if found.
	/// </summary>
	private static void CheckAndAddViolation(
		string sourceContextName,
		string targetContextName,
		List<string> violations)
	{
		TestResult architectureTestResult =
			Types
			.InNamespace($"SeventySix.{sourceContextName}")
			.ShouldNot()
			.HaveDependencyOn($"SeventySix.{targetContextName}")
			.GetResult();

		if (!architectureTestResult.IsSuccessful)
		{
			string failingTypes =
				string.Join(
					", ",
					architectureTestResult.FailingTypeNames ?? []);

			violations.Add(
				$"{sourceContextName} should not depend on {targetContextName}. " +
				$"Violating types: {failingTypes}");
		}
	}

	/// <summary>
	/// Verifies that each bounded context has its own DbContext (except service-only contexts).
	/// </summary>
	[Fact]
	public void Bounded_Contexts_Should_Have_Own_DbContext()
	{
		Assembly domainAssembly =
			typeof(SeventySix.Identity.ApplicationUser).Assembly;

		string[] boundedContextNames =
			GetBoundedContextNames(domainAssembly);

		List<string> contextsWithoutDbContext = [];

		foreach (string contextName in boundedContextNames)
		{
			// Service-only contexts don't require a DbContext
			if (ServiceOnlyContexts.Contains(contextName))
			{
				continue;
			}

			Type? dbContextType =
				domainAssembly
				.GetTypes()
				.FirstOrDefault(type =>
					type.Namespace == $"SeventySix.{contextName}"
					&& type.Name.EndsWith("DbContext")
					&& InheritsFromDbContext(type));

			if (dbContextType == null)
			{
				contextsWithoutDbContext.Add(contextName);
			}
		}

		contextsWithoutDbContext.ShouldBeEmpty();
	}

	/// <summary>
	/// Checks if a type inherits from DbContext (directly or indirectly).
	/// </summary>
	/// <param name="type">
	/// The type to check.
	/// </param>
	/// <returns>
	/// True if the type inherits from DbContext.
	/// </returns>
	private static bool InheritsFromDbContext(Type type)
	{
		Type? baseType = type.BaseType;
		while (baseType != null)
		{
			if (baseType.Name == "DbContext")
			{
				return true;
			}

			// Handle generic base types like BaseDbContext<T>
			if (baseType.IsGenericType)
			{
				Type genericDefinition =
					baseType.GetGenericTypeDefinition();
				if (genericDefinition.Name.StartsWith("BaseDbContext"))
				{
					return true;
				}
			}

			baseType = baseType.BaseType;
		}

		return false;
	}

	/// <summary>
	/// Gets the names of all bounded contexts in the given assembly.
	/// </summary>
	/// <param name="domainAssembly">
	/// The assembly to scan for bounded contexts.
	/// </param>
	/// <returns>
	/// Array of bounded context names.
	/// </returns>
	private static string[] GetBoundedContextNames(Assembly domainAssembly)
	{
		return domainAssembly
			.GetTypes()
			.Select(type => type.Namespace)
			.Where(namespaceName =>
				namespaceName != null
				&& namespaceName.StartsWith("SeventySix.")
				&& !namespaceName.Contains("Shared")
				&& !namespaceName.Contains("Infrastructure")
				&& !namespaceName.Contains("Extensions")
				&& !namespaceName.Contains("Registration")
				&& !namespaceName.Contains("Domains"))
			.Select(namespaceName => namespaceName!.Split('.')[1])
			.Distinct()
			.ToArray();
	}
}