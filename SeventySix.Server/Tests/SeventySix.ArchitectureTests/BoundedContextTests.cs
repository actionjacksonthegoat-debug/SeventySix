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
	[Fact]
	public void Bounded_Contexts_Should_Not_Reference_Each_Other()
	{
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;
		string[] boundedContextNames = domainAssembly.GetTypes()
			.Select(type => type.Namespace)
			.Where(namespaceName =>
				namespaceName != null
				&& namespaceName.StartsWith("SeventySix.")
				&& !namespaceName.Contains("Shared")
				&& !namespaceName.Contains("Infrastructure")
				&& !namespaceName.Contains("Extensions"))
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

				TestResult architectureTestResult = Types
					.InNamespace($"SeventySix.{sourceContextName}")
					.ShouldNot()
					.HaveDependencyOn($"SeventySix.{targetContextName}")
					.GetResult();

				if (!architectureTestResult.IsSuccessful)
				{
					circularDependencyViolations.Add(
						$"{sourceContextName} should not depend on {targetContextName}. Violating types: {string.Join(", ", architectureTestResult.FailingTypeNames ?? [])}");
				}
			}
		}

		Assert.Empty(circularDependencyViolations);
	}

	[Fact]
	public void Each_Bounded_Context_Should_Have_DbContext()
	{
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;
		string[] boundedContextNames = domainAssembly.GetTypes()
			.Select(type => type.Namespace)
			.Where(namespaceName =>
				namespaceName != null
				&& namespaceName.StartsWith("SeventySix.")
				&& !namespaceName.Contains("Shared")
				&& !namespaceName.Contains("Infrastructure")
				&& !namespaceName.Contains("Extensions"))
			.Select(namespaceName => namespaceName!.Split('.')[1])
			.Distinct()
			.ToArray();

		List<string> contextsWithoutDbContext = [];

		foreach (string contextName in boundedContextNames)
		{
			Type? dbContextType = domainAssembly.GetTypes()
				.FirstOrDefault(type => type.Namespace == $"SeventySix.{contextName}"
					&& type.Name.EndsWith("DbContext")
					&& type.BaseType?.Name == "DbContext");

			if (dbContextType == null)
			{
				contextsWithoutDbContext.Add(contextName);
			}
		}

		Assert.Empty(contextsWithoutDbContext);
	}
}