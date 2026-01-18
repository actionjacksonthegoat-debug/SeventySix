using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using NetArchTest.Rules;
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
			domainAssembly
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

		List<string> circularDependencyViolations = [];

		foreach (string sourceContextName in boundedContextNames)
		{
			foreach (string targetContextName in boundedContextNames)
			{
				if (sourceContextName == targetContextName)
				{
					continue;
				}

				// Check if this dependency is explicitly allowed
				if (
					AllowedDependencies.TryGetValue(
						sourceContextName,
						out string[]? allowed) && allowed.Contains(targetContextName))
				{
					continue;
				}

				TestResult architectureTestResult =
					Types
					.InNamespace($"SeventySix.{sourceContextName}")
					.ShouldNot()
					.HaveDependencyOn($"SeventySix.{targetContextName}")
					.GetResult();

				if (!architectureTestResult.IsSuccessful)
				{
					circularDependencyViolations.Add(
						$"{sourceContextName} should not depend on {targetContextName}. Violating types: {string.Join(
							", ",
							architectureTestResult.FailingTypeNames ?? [])}");
				}
			}
		}

		Assert.Empty(circularDependencyViolations);
	}

	[Fact]
	public void Each_Bounded_Context_Should_Have_DbContext()
	{
		Assembly domainAssembly =
			typeof(SeventySix.Identity.ApplicationUser).Assembly;
		string[] boundedContextNames =
			domainAssembly
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

		Assert.Empty(contextsWithoutDbContext);
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
}