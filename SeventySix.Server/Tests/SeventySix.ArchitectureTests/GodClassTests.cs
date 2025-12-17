// <copyright file="GodClassTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to prevent god classes/interfaces.
/// Services and interfaces with 12+ methods violate SRP and must be split.
/// </summary>
/// <remarks>
/// Per CLAUDE.md and copilot-instructions.md:
/// - 1-11 methods: OK - single focused service
/// - 12+ methods: MUST SPLIT - violates SRP
/// - 300+ lines: REVIEW - likely needs split
/// </remarks>
public class GodClassTests
{
	/// <summary>
	/// Maximum allowed methods per service interface before requiring split.
	/// </summary>
	private const int MaxMethodsPerInterface = 11;

	/// <summary>
	/// Interfaces that are explicitly allowed to have more methods.
	/// These should be rare exceptions with documented justification.
	/// </summary>
	private static readonly HashSet<string> AllowedInterfaceExceptions =
		[
		// IUserQueryRepository (15 methods): Logical split of read-only CQRS query operations.
		// Methods are cohesive user query operations - splitting would fragment the query contract
		// and introduce artificial boundaries. The interface follows ISP by being read-only only.
		"IUserQueryRepository",
	];

	/// <summary>
	/// Implementation classes allowed to have more methods.
	/// These implement multiple focused ISP interfaces so naturally have more methods.
	/// The focused interfaces themselves follow the 12-method rule.
	/// </summary>
	private static readonly HashSet<string> AllowedImplementationExceptions =
		[
		// No exceptions - all implementations must follow the 12-method rule
	];

	[Fact]
	public void Service_Interfaces_Should_Have_Less_Than_Twelve_Methods()
	{
		Assembly domainAssembly =
			typeof(SeventySix.Identity.User).Assembly;

		Type[] serviceInterfaces =
			domainAssembly
			.GetTypes()
			.Where(type =>
				type.IsInterface
				&& type.Name.StartsWith("I")
				&& type.Name.EndsWith("Service")
				&& type.Namespace != null
				&& type.Namespace.StartsWith("SeventySix.")
				&& !type.Namespace.Contains("Shared"))
			.ToArray();

		List<string> godClassViolations = [];

		foreach (Type serviceInterface in serviceInterfaces)
		{
			// Skip allowed exceptions
			if (AllowedInterfaceExceptions.Contains(serviceInterface.Name))
			{
				continue;
			}

			// Get all methods declared on this interface (not inherited)
			MethodInfo[] declaredMethods =
				serviceInterface
				.GetMethods(
					BindingFlags.Public
						| BindingFlags.Instance
						| BindingFlags.DeclaredOnly)
				.Where(method => !method.IsSpecialName) // Exclude property getters/setters
				.ToArray();

			int methodCount = declaredMethods.Length;

			if (methodCount > MaxMethodsPerInterface)
			{
				string methodNames =
					string.Join(
					", ",
					declaredMethods.Take(5).Select(method => method.Name));

				string additionalMethods =
					methodCount > 5
						? $" and {methodCount - 5} more"
						: string.Empty;

				godClassViolations.Add(
					$"{serviceInterface.FullName} has {methodCount} methods (max {MaxMethodsPerInterface}): {methodNames}{additionalMethods}");
			}
		}

		Assert.Empty(godClassViolations);
	}

	[Fact]
	public void Repository_Interfaces_Should_Have_Less_Than_Twelve_Methods()
	{
		Assembly domainAssembly =
			typeof(SeventySix.Identity.User).Assembly;

		Type[] repositoryInterfaces =
			domainAssembly
			.GetTypes()
			.Where(type =>
				type.IsInterface
				&& type.Name.StartsWith("I")
				&& type.Name.EndsWith("Repository")
				&& type.Namespace != null
				&& type.Namespace.StartsWith("SeventySix.")
				&& !type.Namespace.Contains("Shared"))
			.ToArray();

		List<string> godClassViolations = [];

		foreach (Type repositoryInterface in repositoryInterfaces)
		{
			// Skip allowed exceptions
			if (AllowedInterfaceExceptions.Contains(repositoryInterface.Name))
			{
				continue;
			}

			MethodInfo[] declaredMethods =
				repositoryInterface
				.GetMethods(
					BindingFlags.Public
						| BindingFlags.Instance
						| BindingFlags.DeclaredOnly)
				.Where(method => !method.IsSpecialName)
				.ToArray();

			int methodCount = declaredMethods.Length;

			if (methodCount > MaxMethodsPerInterface)
			{
				string methodNames =
					string.Join(
					", ",
					declaredMethods.Take(5).Select(method => method.Name));

				string additionalMethods =
					methodCount > 5
						? $" and {methodCount - 5} more"
						: string.Empty;

				godClassViolations.Add(
					$"{repositoryInterface.FullName} has {methodCount} methods (max {MaxMethodsPerInterface}): {methodNames}{additionalMethods}");
			}
		}

		Assert.Empty(godClassViolations);
	}

	[Fact]
	public void Service_Implementations_Should_Have_Less_Than_Twelve_Public_Methods()
	{
		Assembly domainAssembly =
			typeof(SeventySix.Identity.User).Assembly;

		Type[] serviceImplementations =
			domainAssembly
			.GetTypes()
			.Where(type =>
				!type.IsInterface
				&& !type.IsAbstract
				&& type.Name.EndsWith("Service")
				&& type.Namespace != null
				&& type.Namespace.StartsWith("SeventySix.")
				&& !type.Namespace.Contains("Shared"))
			.ToArray();

		List<string> godClassViolations = [];

		foreach (Type serviceType in serviceImplementations)
		{
			// Skip allowed exceptions
			if (AllowedImplementationExceptions.Contains(serviceType.Name))
			{
				continue;
			}

			// Count public instance methods (excluding inherited from object and property accessors)
			MethodInfo[] publicMethods =
				serviceType
				.GetMethods(
					BindingFlags.Public
						| BindingFlags.Instance
						| BindingFlags.DeclaredOnly)
				.Where(method =>
					!method.IsSpecialName // Exclude property getters/setters
					&& method.DeclaringType != typeof(object))
				.ToArray();

			int methodCount = publicMethods.Length;

			if (methodCount > MaxMethodsPerInterface)
			{
				string methodNames =
					string.Join(
					", ",
					publicMethods.Take(5).Select(method => method.Name));

				string additionalMethods =
					methodCount > 5
						? $" and {methodCount - 5} more"
						: string.Empty;

				godClassViolations.Add(
					$"{serviceType.FullName} has {methodCount} public methods (max {MaxMethodsPerInterface}): {methodNames}{additionalMethods}");
			}
		}

		Assert.Empty(godClassViolations);
	}
}