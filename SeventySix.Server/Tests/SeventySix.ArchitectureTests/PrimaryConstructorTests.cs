// <copyright file="PrimaryConstructorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce C# 12+ primary constructor pattern.
/// Fully dynamic - scans ALL classes in production assemblies and ensures
/// they use primary constructors instead of traditional constructor with field assignments.
/// Automatically discovers all classes across all bounded contexts with smart exclusions.
/// </summary>
public class PrimaryConstructorTests
{
	/// <summary>
	/// Verifies that ALL production classes use primary constructors.
	/// This is a fully dynamic test that scans every class in the domain and API assemblies.
	/// Classes should declare dependencies as primary constructor parameters and use them directly,
	/// not assign to private readonly fields in a traditional constructor.
	/// </summary>
	/// <remarks>
	/// Exclusions (legitimate use cases for private readonly fields):
	/// - DTOs/Records/POCOs (data transfer objects with no constructor parameters)
	/// - Entity classes (database models with property initialization)
	/// - Builder classes (fluent API pattern requires mutable state)
	/// - Static classes (no constructors)
	/// - Abstract classes (may have different patterns)
	/// - Test classes (in Test assemblies, not production)
	/// - Exception classes (standard .NET pattern)
	/// - Attribute classes (metadata, no DI)
	/// - Enums (no fields)
	/// </remarks>
	[Fact]
	public void All_Production_Classes_Should_Use_Primary_Constructors()
	{
		// Scan both domain and API assemblies
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;
		Assembly apiAssembly = typeof(SeventySix.Api.Controllers.UsersController).Assembly;

		List<Type> allProductionTypes = [];
		allProductionTypes.AddRange(domainAssembly.GetTypes());
		allProductionTypes.AddRange(apiAssembly.GetTypes());

		// Filter to only production classes (exclude test artifacts, interfaces, DTOs, etc.)
		Type[] productionClasses = allProductionTypes
			.Where(type => !type.IsInterface
				&& !type.IsAbstract
				&& type.IsClass
				&& type.Namespace != null
				&& type.Namespace.StartsWith("SeventySix.")
				&& !ShouldExcludeClass(type))
			.ToArray();

		List<string> violations = [];

		foreach (Type productionClass in productionClasses)
		{
			// Check for private readonly fields (potential anti-pattern with primary constructors)
			FieldInfo[] privateReadonlyFields =
				productionClass.GetFields(BindingFlags.NonPublic | BindingFlags.Instance)
					.Where(field => field.IsPrivate && field.IsInitOnly)
					.ToArray();

			if (privateReadonlyFields.Length > 0)
			{
				// Check if class has a traditional constructor with parameters
				ConstructorInfo[] constructors =
					productionClass.GetConstructors(BindingFlags.Public | BindingFlags.Instance);

				foreach (ConstructorInfo constructor in constructors)
				{
					ParameterInfo[] constructorParameters = constructor.GetParameters();

					if (constructorParameters.Length > 0)
					{
						// Only flag if field names match parameter names (traditional pattern)
						// This allows internal state fields like Queue, Semaphore, etc.
						foreach (FieldInfo field in privateReadonlyFields)
						{
							// Check if field name matches any constructor parameter (case-insensitive)
							bool matchesParameter = constructorParameters.Any(param =>
								field.Name.Equals(param.Name, StringComparison.OrdinalIgnoreCase) ||
								field.Name.TrimStart('_').Equals(param.Name, StringComparison.OrdinalIgnoreCase));

							if (matchesParameter)
							{
								violations.Add($"{productionClass.FullName} has private readonly field "
									+ $"'{field.Name}' matching constructor parameter. "
									+ "Use primary constructor pattern instead.");
							}
						}
					}
				}
			}
		}

		Assert.Empty(violations);
	}

	/// <summary>
	/// Determines if a class should be excluded from primary constructor enforcement.
	/// </summary>
	/// <param name="type">The type to evaluate.</param>
	/// <returns>True if the class should be excluded from the test.</returns>
	private static bool ShouldExcludeClass(Type type)
	{
		// Exclude DTOs, Requests, Responses (data transfer objects - no constructor logic)
		if (type.Name.EndsWith("Dto") ||
			type.Name.EndsWith("Request") ||
			type.Name.EndsWith("Response") ||
			type.Name.EndsWith("Options") ||
			type.Name.EndsWith("Settings") ||
			type.Name.EndsWith("Configuration"))
		{
			return true;
		}

		// Exclude entity/model classes (database models)
		if (type.Namespace != null &&
			(type.Namespace.EndsWith(".Entities") ||
			 type.Namespace.EndsWith(".Models") ||
			 type.Namespace.EndsWith(".DTOs")))
		{
			return true;
		}

		// Exclude builder classes (fluent API pattern)
		if (type.Name.EndsWith("Builder"))
		{
			return true;
		}

		// Exclude exceptions (standard .NET pattern)
		if (type.IsSubclassOf(typeof(Exception)))
		{
			return true;
		}

		// Exclude attributes (metadata, no DI)
		if (type.IsSubclassOf(typeof(Attribute)))
		{
			return true;
		}

		// Exclude validators (FluentValidation pattern - no DI in constructor usually)
		if (type.Name.EndsWith("Validator") && type.Namespace != null && type.Namespace.Contains(".Validators"))
		{
			return true;
		}

		// Exclude extension method container classes (static)
		if (type.Name.EndsWith("Extensions"))
		{
			return true;
		}

		// Exclude context classes (EF DbContext has specific pattern)
		if (type.Name.EndsWith("DbContext") || type.Name.EndsWith("Context"))
		{
			return true;
		}

		return false;
	}
}
