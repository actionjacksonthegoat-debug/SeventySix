using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce CancellationToken usage rules.
/// - Query methods (Get*, List*, Search*) MUST have CancellationToken
/// - Mutation methods (Create*, Update*, Delete*) MUST NOT have CancellationToken
/// Automatically discovers all service interfaces across all bounded contexts.
/// </summary>
public class CancellationTokenTests
{
	private static readonly string[] QueryPrefixes = ["Get", "List", "Search", "Count", "Check", "Find"];
	private static readonly string[] MutationPrefixes = ["Create", "Update", "Delete", "Restore", "Soft", "Add", "Remove", "Bulk"];

	[Fact]
	public void Query_Methods_Should_Have_CancellationToken()
	{
		Type[] serviceTypes = GetAllServiceInterfaces();
		List<string> missingCancellationTokenViolations = [];

		foreach (Type serviceType in serviceTypes)
		{
			MethodInfo[] queryMethods = serviceType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
				.Where(method => IsQueryMethod(method.Name) || method.Name.Contains("Exists"))
				.ToArray();

			foreach (MethodInfo queryMethod in queryMethods)
			{
				bool hasCancellationToken = queryMethod.GetParameters()
					.Any(parameter => parameter.ParameterType == typeof(CancellationToken));

				if (!hasCancellationToken)
				{
					missingCancellationTokenViolations.Add($"{serviceType.Name}.{queryMethod.Name} should have CancellationToken parameter");
				}
			}
		}

		Assert.Empty(missingCancellationTokenViolations);
	}

	[Fact]
	public void Mutation_Methods_Should_Not_Have_CancellationToken()
	{
		Type[] serviceTypes = GetAllServiceInterfaces();
		List<string> unexpectedCancellationTokenViolations = [];

		foreach (Type serviceType in serviceTypes)
		{
			MethodInfo[] mutationMethods = serviceType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
				.Where(method => IsMutationMethod(method.Name))
				.ToArray();

			foreach (MethodInfo mutationMethod in mutationMethods)
			{
				bool hasCancellationToken = mutationMethod.GetParameters()
					.Any(parameter => parameter.ParameterType == typeof(CancellationToken));

				if (hasCancellationToken)
				{
					unexpectedCancellationTokenViolations.Add($"{serviceType.Name}.{mutationMethod.Name} should NOT have CancellationToken parameter");
				}
			}
		}

		Assert.Empty(unexpectedCancellationTokenViolations);
	}

	[Fact]
	public void Repository_Query_Methods_Should_Have_CancellationToken()
	{
		Type[] repositoryTypes = GetAllRepositoryInterfaces();
		List<string> missingCancellationTokenViolations = [];

		foreach (Type repositoryType in repositoryTypes)
		{
			MethodInfo[] queryMethods = repositoryType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
				.Where(method => IsQueryMethod(method.Name) || method.Name.Contains("Exists"))
				.ToArray();

			foreach (MethodInfo queryMethod in queryMethods)
			{
				bool hasCancellationToken = queryMethod.GetParameters()
					.Any(parameter => parameter.ParameterType == typeof(CancellationToken));

				if (!hasCancellationToken)
				{
					missingCancellationTokenViolations.Add($"{repositoryType.Name}.{queryMethod.Name} should have CancellationToken parameter");
				}
			}
		}

		Assert.Empty(missingCancellationTokenViolations);
	}

	[Fact]
	public void Repository_Mutation_Methods_Should_Not_Have_CancellationToken()
	{
		Type[] repositoryTypes = GetAllRepositoryInterfaces();
		List<string> unexpectedCancellationTokenViolations = [];

		foreach (Type repositoryType in repositoryTypes)
		{
			MethodInfo[] mutationMethods = repositoryType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
				.Where(method => IsMutationMethod(method.Name))
				.ToArray();

			foreach (MethodInfo mutationMethod in mutationMethods)
			{
				bool hasCancellationToken = mutationMethod.GetParameters()
					.Any(parameter => parameter.ParameterType == typeof(CancellationToken));

				if (hasCancellationToken)
				{
					unexpectedCancellationTokenViolations.Add($"{repositoryType.Name}.{mutationMethod.Name} should NOT have CancellationToken parameter");
				}
			}
		}

		Assert.Empty(unexpectedCancellationTokenViolations);
	}

	private static Type[] GetAllServiceInterfaces()
	{
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;

		Type[] serviceInterfaces = domainAssembly.GetTypes()
			.Where(serviceType => serviceType.IsInterface
				&& serviceType.Name.EndsWith("Service")
				&& serviceType.Namespace != null
				&& serviceType.Namespace.StartsWith("SeventySix.")
				&& !serviceType.Namespace.Contains("Shared")
				&& !serviceType.Namespace.Contains("Infrastructure"))
			.ToArray();

		return serviceInterfaces;
	}

	private static Type[] GetAllRepositoryInterfaces()
	{
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;

		Type[] repositoryInterfaces = domainAssembly.GetTypes()
			.Where(repositoryType => repositoryType.IsInterface
				&& repositoryType.Name.EndsWith("Repository")
				&& repositoryType.Namespace != null
				&& repositoryType.Namespace.StartsWith("SeventySix.")
				&& !repositoryType.Namespace.Contains("Shared")
				&& !repositoryType.Namespace.Contains("Infrastructure"))
			.ToArray();

		return repositoryInterfaces;
	}

	private static bool IsQueryMethod(string methodName)
	{
		return QueryPrefixes.Any(prefix => methodName.StartsWith(prefix));
	}

	private static bool IsMutationMethod(string methodName)
	{
		return MutationPrefixes.Any(prefix => methodName.StartsWith(prefix));
	}
}
