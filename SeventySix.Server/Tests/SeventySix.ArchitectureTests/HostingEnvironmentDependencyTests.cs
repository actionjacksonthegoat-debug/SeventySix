// <copyright file="HostingEnvironmentDependencyTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System;
using NetArchTest.Rules;
using Shouldly;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Tests that domain and shared projects do not reference the hosting environment.
/// IWebHostEnvironment and IHostEnvironment are API-layer concerns only.
/// </summary>
/// <remarks>
/// Rule: Domain and Shared code must be agnostic to the hosting environment.
/// Environment-conditional logic belongs in SeventySix.Api (Program.cs, Registration/).
/// Violations indicate leakage of infrastructure concerns into business logic.
/// </remarks>
public sealed class HostingEnvironmentDependencyTests
{
	[Fact]
	public void DomainAssembly_ShouldNotDepend_OnAspNetCoreHosting()
	{
		TestResult result =
			Types.InAssembly(typeof(Logging.Log).Assembly)
				.ShouldNot()
				.HaveDependencyOn("Microsoft.AspNetCore.Hosting")
				.GetResult();

		result.IsSuccessful.ShouldBeTrue(
			string.Join(
				Environment.NewLine,
				result.FailingTypeNames ?? []));
	}

	[Fact]
	public void SharedAssembly_ShouldNotDepend_OnAspNetCoreHosting()
	{
		TestResult result =
			Types.InAssembly(typeof(Shared.Persistence.TransactionManager).Assembly)
				.ShouldNot()
				.HaveDependencyOn("Microsoft.AspNetCore.Hosting")
				.GetResult();

		result.IsSuccessful.ShouldBeTrue(
			string.Join(
				Environment.NewLine,
				result.FailingTypeNames ?? []));
	}

	[Fact]
	public void SharedAssembly_ShouldNotDepend_OnMicrosoftExtensionsHosting()
	{
		TestResult result =
			Types.InAssembly(typeof(Shared.Persistence.TransactionManager).Assembly)
				.ShouldNot()
				.HaveDependencyOn("Microsoft.Extensions.Hosting")
				.GetResult();

		result.IsSuccessful.ShouldBeTrue(
			string.Join(
				Environment.NewLine,
				result.FailingTypeNames ?? []));
	}
}