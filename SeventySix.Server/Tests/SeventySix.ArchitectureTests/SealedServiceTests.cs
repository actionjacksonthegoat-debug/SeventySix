// <copyright file="SealedServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce sealed service classes.
/// Services should be sealed unless they have virtual methods for testing.
/// </summary>
/// <remarks>
/// Rationale:
/// - Sealed classes enable JIT optimizations (devirtualization)
/// - Clear intent: "this class is not designed for inheritance"
/// - Services implement interfaces - test via interface, not inheritance.
/// </remarks>
public sealed class SealedServiceTests
{
	/// <summary>
	/// Services that are intentionally not sealed.
	/// These must have XML documentation explaining why.
	/// </summary>
	private static readonly HashSet<string> ExcludedServices =
		[
			// Has virtual methods for NSubstitute mocking in unit tests
			"AuthenticationService",
		];

	[Fact]
	public void Service_Classes_Should_Be_Sealed()
	{
		// Arrange
		Assembly domainsAssembly =
			typeof(SeventySix.Identity.ApplicationUser).Assembly;

		Assembly apiAssembly =
			typeof(SeventySix.Api.Controllers.UsersController).Assembly;

		Assembly sharedAssembly =
			typeof(SeventySix.Shared.BackgroundJobs.IRecurringJobService).Assembly;

		Assembly[] assemblies =
			[
				domainsAssembly,
				apiAssembly,
				sharedAssembly,
			];

		List<string> unsealedServices = [];

		// Act
		foreach (Assembly assembly in assemblies)
		{
			Type[] serviceTypes =
				assembly
					.GetTypes()
					.Where(type =>
						type.IsClass
						&& !type.IsAbstract
						&& type.Name.EndsWith("Service")
						&& type.Namespace != null
						&& type.Namespace.StartsWith("SeventySix.")
						&& !type.Namespace.Contains("Tests")
						&& !ExcludedServices.Contains(type.Name))
					.ToArray();

			foreach (Type serviceType in serviceTypes)
			{
				if (!serviceType.IsSealed)
				{
					unsealedServices.Add(
						$"{serviceType.Namespace}.{serviceType.Name}");
				}
			}
		}

		// Assert
		unsealedServices.ShouldBeEmpty(
			$"The following services should be sealed (or added to exclusions with documented reason): {string.Join(", ", unsealedServices)}");
	}

	[Fact]
	public void Excluded_Services_Should_Have_Virtual_Methods()
	{
		// Arrange
		Assembly domainsAssembly =
			typeof(SeventySix.Identity.ApplicationUser).Assembly;

		// Act & Assert
		foreach (string serviceName in ExcludedServices)
		{
			Type? serviceType =
				domainsAssembly
					.GetTypes()
					.FirstOrDefault(type =>
						type.Name == serviceName);

			serviceType.ShouldNotBeNull(
				$"Excluded service '{serviceName}' not found");

			MethodInfo[] virtualMethods =
				serviceType!
					.GetMethods(BindingFlags.Public | BindingFlags.Instance)
					.Where(method =>
						method.IsVirtual
						&& !method.IsFinal
						&& method.DeclaringType == serviceType)
					.ToArray();

			virtualMethods.ShouldNotBeEmpty(
				$"Service '{serviceName}' is excluded from sealing but has no virtual methods. " +
				"Remove from exclusions or add virtual methods.");
		}
	}
}