// <copyright file="SecurityHeaderPoliciesUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using NSubstitute;
using SeventySix.Api.Configuration;
using Shouldly;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for <see cref="SecurityHeaderPolicies"/>.
/// </summary>
public sealed class SecurityHeaderPoliciesUnitTests
{
	/// <summary>
	/// Verifies Build returns a non-null policy collection for a development environment.
	/// </summary>
	[Fact]
	public void Build_DevelopmentEnvironment_ReturnsNonNullPolicyCollection()
	{
		IWebHostEnvironment environment =
			CreateEnvironment(isDevelopment: true);

		HeaderPolicyCollection result =
			SecurityHeaderPolicies.Build(environment);

		result.ShouldNotBeNull();
		result.Count.ShouldBeGreaterThan(0);
	}

	/// <summary>
	/// Verifies Build returns a non-null policy collection for a production environment.
	/// </summary>
	[Fact]
	public void Build_ProductionEnvironment_ReturnsNonNullPolicyCollection()
	{
		IWebHostEnvironment environment =
			CreateEnvironment(isDevelopment: false);

		HeaderPolicyCollection result =
			SecurityHeaderPolicies.Build(environment);

		result.ShouldNotBeNull();
		result.Count.ShouldBeGreaterThan(0);
	}

	/// <summary>
	/// Verifies BuildWithCspOverride in development omits HSTS
	/// (fewer policies than production equivalent).
	/// </summary>
	[Fact]
	public void BuildWithCspOverride_DevelopmentEnvironment_OmitsHsts()
	{
		IWebHostEnvironment developmentEnvironment =
			CreateEnvironment(isDevelopment: true);

		IWebHostEnvironment productionEnvironment =
			CreateEnvironment(isDevelopment: false);

		string overrideCsp =
			"default-src 'none'; script-src 'nonce-abc123'";

		HeaderPolicyCollection devResult =
			SecurityHeaderPolicies.BuildWithCspOverride(
				developmentEnvironment,
				overrideCsp);

		HeaderPolicyCollection prodResult =
			SecurityHeaderPolicies.BuildWithCspOverride(
				productionEnvironment,
				overrideCsp);

		// Production includes HSTS header, so it has more entries than development
		devResult.ShouldNotBeNull();
		prodResult.ShouldNotBeNull();
		prodResult.Count.ShouldBeGreaterThan(devResult.Count);
	}

	/// <summary>
	/// Verifies BuildWithCspOverride in production includes the HSTS header.
	/// </summary>
	[Fact]
	public void BuildWithCspOverride_ProductionEnvironment_IncludesHstsHeader()
	{
		IWebHostEnvironment environment =
			CreateEnvironment(isDevelopment: false);

		string overrideCsp =
			"default-src 'none'; script-src 'nonce-abc123'";

		HeaderPolicyCollection result =
			SecurityHeaderPolicies.BuildWithCspOverride(
				environment,
				overrideCsp);

		result.ShouldNotBeNull();
		result.ContainsKey("Strict-Transport-Security").ShouldBeTrue();
	}

	/// <summary>
	/// Verifies BuildWithCspOverride in development does not include HSTS.
	/// </summary>
	[Fact]
	public void BuildWithCspOverride_DevelopmentEnvironment_DoesNotIncludeHsts()
	{
		IWebHostEnvironment environment =
			CreateEnvironment(isDevelopment: true);

		string overrideCsp =
			"default-src 'none'; script-src 'nonce-abc123'";

		HeaderPolicyCollection result =
			SecurityHeaderPolicies.BuildWithCspOverride(
				environment,
				overrideCsp);

		result.ShouldNotBeNull();
		result.ContainsKey("Strict-Transport-Security").ShouldBeFalse();
	}

	private static IWebHostEnvironment CreateEnvironment(bool isDevelopment)
	{
		IWebHostEnvironment environment =
			Substitute.For<IWebHostEnvironment>();

		environment.EnvironmentName.Returns(
			isDevelopment
				? "Development"
				: "Production");

		return environment;
	}
}
