// <copyright file="AuthenticationRegistrationUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SeventySix.Api.Registration;
using SeventySix.Identity.Constants;
using Shouldly;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for <see cref="AuthenticationExtensions"/>.
/// Focus: JWT section validation, rotation key resolver, and authorization policy registration.
/// </summary>
public sealed class AuthenticationRegistrationUnitTests
{
	/// <summary>
	/// Verifies that a missing JWT configuration section throws an <see cref="InvalidOperationException"/>.
	/// </summary>
	[Fact]
	public void AddAuthenticationServices_MissingJwtSection_ThrowsInvalidOperationException()
	{
		IServiceCollection services =
			new ServiceCollection();

		IConfiguration configuration =
			new ConfigurationBuilder()
				.AddInMemoryCollection(new Dictionary<string, string?>())
				.Build();

		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => services.AddAuthenticationServices(configuration));

		exception.Message.ShouldContain("Jwt");
	}

	/// <summary>
	/// Verifies that authentication services are registered when a valid JWT section is present.
	/// </summary>
	[Fact]
	public void AddAuthenticationServices_ValidJwtSection_RegistersServices()
	{
		IServiceCollection services =
			new ServiceCollection();

		IConfiguration configuration =
			BuildValidJwtConfig();

		Should.NotThrow(
			() => services.AddAuthenticationServices(configuration));
	}

	/// <summary>
	/// Verifies that a previous secret key triggers the rotation key resolver registration path.
	/// </summary>
	[Fact]
	public void AddAuthenticationServices_PreviousSecretKeySet_RegistersWithRotationKeyResolver()
	{
		IServiceCollection services =
			new ServiceCollection();

		IConfiguration configuration =
			BuildValidJwtConfig(includePreviousKey: true);

		Should.NotThrow(
			() => services.AddAuthenticationServices(configuration));
	}

	/// <summary>
	/// Verifies that the AdminOnly, DeveloperOrAdmin, and Authenticated authorization policies are registered.
	/// </summary>
	[Fact]
	public void AddAuthenticationServices_ValidConfig_RegistersAuthorizationPolicies()
	{
		IServiceCollection services =
			new ServiceCollection();

		IConfiguration configuration =
			BuildValidJwtConfig();

		services.AddAuthenticationServices(configuration);

		ServiceProvider provider =
			services.BuildServiceProvider();

		IOptions<AuthorizationOptions> options =
			provider.GetRequiredService<IOptions<AuthorizationOptions>>();

		options.Value.GetPolicy(PolicyConstants.AdminOnly).ShouldNotBeNull();
		options.Value.GetPolicy(PolicyConstants.DeveloperOrAdmin).ShouldNotBeNull();
		options.Value.GetPolicy(PolicyConstants.Authenticated).ShouldNotBeNull();
	}

	private static IConfiguration BuildValidJwtConfig(bool includePreviousKey = false)
	{
		Dictionary<string, string?> values =
			new()
			{
				["Jwt:SecretKey"] = "test-secret-key-min-length-32-chars!!",
				["Jwt:Issuer"] = "test-issuer",
				["Jwt:Audience"] = "test-audience",
				["Jwt:AccessTokenExpirationMinutes"] = "15",
				["Jwt:RefreshTokenExpirationDays"] = "7",
				["Jwt:RefreshTokenRememberMeExpirationDays"] = "30",
				["Jwt:AbsoluteSessionTimeoutDays"] = "90",
				["Jwt:ClockSkewMinutes"] = "5",
				["Jwt:TokenRefreshBufferSeconds"] = "30",
			};

		if (includePreviousKey)
		{
			values["Jwt:PreviousSecretKey"] = "old-test-secret-key-min-length-32chars!";
		}

		return new ConfigurationBuilder()
			.AddInMemoryCollection(values)
			.Build();
	}
}
