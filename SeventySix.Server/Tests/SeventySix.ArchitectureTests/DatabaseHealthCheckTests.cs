// <copyright file="DatabaseHealthCheckTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using System.Collections.Generic;
using System.Linq;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Persistence;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architecture tests enforcing database health check patterns.
/// </summary>
/// <remarks>
/// Ensures all bounded contexts with databases implement IDatabaseHealthCheck
/// for comprehensive system-wide health monitoring.
/// </remarks>
public class DatabaseHealthCheckTests
{
	[Fact]
	public void All_DbContext_Bounded_Contexts_Must_Implement_IDatabaseHealthCheck()
	{
		// Find all DbContext implementations
		Type[] dbContextTypes =
			typeof(BaseDbContext<>)
			.Assembly.GetTypes()
			.Where(type =>
				type.IsClass
				&& !type.IsAbstract
				&& type.BaseType != null
				&& type.BaseType.IsGenericType
				&& type.BaseType.GetGenericTypeDefinition()
					== typeof(BaseDbContext<>))
			.ToArray();

		// For each DbContext, find the primary service in its bounded context
		List<string> violations = [];

		foreach (Type dbContextType in dbContextTypes)
		{
			string contextName =
				dbContextType.Name.Replace(
				"DbContext",
				string.Empty);

			// Find service interface OR health check class that implements IDatabaseHealthCheck
			Type? healthCheckImplementation =
				dbContextType
				.Assembly.GetTypes()
				.FirstOrDefault(type =>
					type.Namespace != null
					&& type.Namespace.Contains(contextName)
					&& (
						(
							type.IsInterface
							&& type.GetInterfaces()
								.Contains(typeof(IDatabaseHealthCheck)))
						|| (
							type.IsClass
							&& !type.IsAbstract
							&& type.GetInterfaces()
								.Contains(typeof(IDatabaseHealthCheck)))));

			if (healthCheckImplementation == null)
			{
				violations.Add(
					$"{contextName} bounded context has {dbContextType.Name} "
						+ $"but no service interface or health check class implements IDatabaseHealthCheck");
			}
		}

		Assert.Empty(violations);
	}
}
