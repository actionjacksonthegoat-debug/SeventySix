using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using NetArchTest.Rules;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce service facade pattern.
/// Ensures controllers ONLY access services, never repositories directly.
/// Automatically discovers all bounded contexts to prevent regression.
/// </summary>
public sealed class ServiceFacadeTests
{
	[Fact]
	public void Controllers_Should_Not_Depend_On_Any_Repository_Namespace()
	{
		Assembly domainAssembly =
			typeof(SeventySix.Identity.ApplicationUser).Assembly;
		string[] boundedContextNames =
			domainAssembly
			.GetTypes()
			.Select(type => type.Namespace)
			.Where(ns =>
				ns != null
				&& ns.StartsWith("SeventySix.")
				&& !ns.Contains("Shared")
				&& !ns.Contains("Infrastructure"))
			.Select(ns => ns!.Split('.')[1])
			.Distinct()
			.ToArray();

		foreach (string contextName in boundedContextNames)
		{
			string repositoryNamespace =
				$"SeventySix.{contextName}.Repositories";

			TestResult architectureTestResult =
				Types
				.InAssembly(
					typeof(SeventySix.Api.Controllers.UsersController).Assembly)
				.That()
				.ResideInNamespace("SeventySix.Api.Controllers")
				.ShouldNot()
				.HaveDependencyOn(repositoryNamespace)
				.GetResult();

			architectureTestResult.IsSuccessful.ShouldBeTrue(
				$"Controllers must not depend on {repositoryNamespace} directly. Found violations: {string.Join(
					", ",
					architectureTestResult.FailingTypeNames ?? [])}");
		}
	}

	[Fact]
	public void Repositories_Should_Not_Be_Public()
	{
		Assembly domainAssembly =
			typeof(SeventySix.Identity.ApplicationUser).Assembly;
		Type[] repositoryTypes =
			domainAssembly
			.GetTypes()
			.Where(type =>
				type.Name.EndsWith("Repository")
				&& !type.IsInterface
				&& !type.IsAbstract
				&& type.Namespace != null
				&& type.Namespace.StartsWith("SeventySix.")
				&& !type.Namespace.Contains("Shared"))
			.ToArray();

		List<string> publicRepositoryNames = [];
		foreach (Type repositoryType in repositoryTypes.Where(t => t.IsPublic))
		{
			publicRepositoryNames.Add(
				$"{repositoryType.Namespace}.{repositoryType.Name}");
		}

		publicRepositoryNames.ShouldBeEmpty();
	}

	[Fact]
	public void Controllers_Should_Only_Depend_On_Service_Interfaces()
	{
		Type[] controllerTypes =
			Types
			.InAssembly(
				typeof(SeventySix.Api.Controllers.UsersController).Assembly)
			.That()
			.ResideInNamespace("SeventySix.Api.Controllers")
			.GetTypes()
			.ToArray();

		Assembly domainAssembly =
			typeof(SeventySix.Identity.ApplicationUser).Assembly;
		Type[] repositoryInterfaces =
			domainAssembly
			.GetTypes()
			.Where(type => type.IsInterface && type.Name.EndsWith("Repository"))
			.ToArray();

		List<string> dependencyViolations = [];
		foreach (Type controllerType in controllerTypes)
		{
			ConstructorInfo[] constructors =
				controllerType.GetConstructors();
			foreach (ConstructorInfo constructor in constructors)
			{
				ParameterInfo[] constructorParameters =
					constructor.GetParameters();
				foreach (ParameterInfo parameter in constructorParameters.Where(
					p => repositoryInterfaces.Contains(p.ParameterType)))
				{
					dependencyViolations.Add(
						$"{controllerType.Name} injects {parameter.ParameterType.Name} (repository) instead of a service");
				}
			}
		}

		dependencyViolations.ShouldBeEmpty();
	}
}