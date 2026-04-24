// <copyright file="AuthenticationRegistrationUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SeventySix.Api.Registration;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Identity.Settings;
using SeventySix.Shared.Constants;
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

	/// <summary>
	/// Verifies that JWT Bearer options are configured with the expected token validation parameters.
	/// </summary>
	[Fact]
	public void AddAuthenticationServices_ValidConfig_ConfiguresJwtBearerOptions()
	{
		IServiceCollection services =
			new ServiceCollection();

		IConfiguration configuration =
			BuildValidJwtConfig();

		services.AddAuthenticationServices(configuration);

		ServiceProvider provider =
			services.BuildServiceProvider();

		IOptionsMonitor<JwtBearerOptions> monitor =
			provider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();

		JwtBearerOptions options =
			monitor.Get(JwtBearerDefaults.AuthenticationScheme);

		options.MapInboundClaims.ShouldBeFalse();
		options.TokenValidationParameters.ValidAlgorithms.ShouldContain(SecurityAlgorithms.HmacSha256);
		options.TokenValidationParameters.ValidIssuer.ShouldBe("test-issuer");
		options.TokenValidationParameters.ValidAudience.ShouldBe("test-audience");
		options.TokenValidationParameters.ClockSkew.ShouldBe(TimeSpan.FromMinutes(5));
		options.TokenValidationParameters.IssuerSigningKey.KeyId.ShouldNotBeNullOrEmpty();
	}

	/// <summary>
	/// Verifies that the OnAuthenticationFailed handler sets the token-expired response header
	/// when the exception is a <see cref="SecurityTokenExpiredException"/>.
	/// </summary>
	[Fact]
	public async Task AddAuthenticationServices_OnAuthenticationFailed_ExpiredToken_SetsTokenExpiredHeader()
	{
		IServiceCollection services =
			new ServiceCollection();

		services.AddAuthenticationServices(BuildValidJwtConfig());

		ServiceProvider provider =
			services.BuildServiceProvider();

		IOptionsMonitor<JwtBearerOptions> monitor =
			provider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();

		JwtBearerOptions options =
			monitor.Get(JwtBearerDefaults.AuthenticationScheme);

		DefaultHttpContext httpContext =
			new();

		AuthenticationScheme scheme =
			new(
				JwtBearerDefaults.AuthenticationScheme,
				null,
				typeof(JwtBearerHandler));

		AuthenticationFailedContext failedContext =
			new(httpContext, scheme, options)
			{
				Exception = new SecurityTokenExpiredException("expired"),
			};

		await options.Events.OnAuthenticationFailed(failedContext);

		string headerValue =
			failedContext.Response.Headers[HttpHeaderConstants.TokenExpired].ToString();

		headerValue.ShouldBe("true");
	}

	/// <summary>
	/// Verifies that the OnAuthenticationFailed handler does not set the token-expired header
	/// for non-expiry exceptions.
	/// </summary>
	[Fact]
	public async Task AddAuthenticationServices_OnAuthenticationFailed_NonExpiryException_DoesNotSetTokenExpiredHeader()
	{
		IServiceCollection services =
			new ServiceCollection();

		services.AddAuthenticationServices(BuildValidJwtConfig());

		ServiceProvider provider =
			services.BuildServiceProvider();

		IOptionsMonitor<JwtBearerOptions> monitor =
			provider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();

		JwtBearerOptions options =
			monitor.Get(JwtBearerDefaults.AuthenticationScheme);

		DefaultHttpContext httpContext =
			new();

		AuthenticationScheme scheme =
			new(
				JwtBearerDefaults.AuthenticationScheme,
				null,
				typeof(JwtBearerHandler));

		AuthenticationFailedContext failedContext =
			new(httpContext, scheme, options)
			{
				Exception = new SecurityTokenInvalidSignatureException("invalid signature"),
			};

		await options.Events.OnAuthenticationFailed(failedContext);

		bool headerPresent =
			failedContext.Response.Headers.ContainsKey(HttpHeaderConstants.TokenExpired);

		headerPresent.ShouldBeFalse();
	}

	/// <summary>
	/// Verifies that the rotation key resolver returns both keys with the expected KIDs
	/// when an explicit previous key ID is provided in configuration.
	/// </summary>
	[Fact]
	public void AddAuthenticationServices_PreviousKeyWithExplicitId_ResolverReturnsBothKeysWithExpectedIds()
	{
		IServiceCollection services =
			new ServiceCollection();

		IConfiguration configuration =
			BuildValidJwtConfig(includePreviousKey: true, previousKeyId: "old-kid");

		services.AddAuthenticationServices(configuration);

		ServiceProvider provider =
			services.BuildServiceProvider();

		IOptionsMonitor<JwtBearerOptions> monitor =
			provider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();

		JwtBearerOptions options =
			monitor.Get(JwtBearerDefaults.AuthenticationScheme);

		IssuerSigningKeyResolver resolver =
			options.TokenValidationParameters.IssuerSigningKeyResolver!;

		List<SecurityKey> keyList =
			resolver(
				null!,
				null!,
				null!,
				null!).ToList();

		keyList.Count.ShouldBe(2);
		keyList.ShouldContain(k => k.KeyId == "old-kid");
	}

	/// <summary>
	/// Verifies that the rotation key resolver computes a fingerprint for the previous key
	/// when no explicit previous key ID is configured.
	/// </summary>
	[Fact]
	public void AddAuthenticationServices_PreviousKeyWithoutExplicitId_ResolverComputesFingerprintForPreviousKey()
	{
		const string previousSecretKey = "old-test-secret-key-min-length-32chars!";

		IServiceCollection services =
			new ServiceCollection();

		IConfiguration configuration =
			BuildValidJwtConfig(includePreviousKey: true);

		services.AddAuthenticationServices(configuration);

		ServiceProvider provider =
			services.BuildServiceProvider();

		IOptionsMonitor<JwtBearerOptions> monitor =
			provider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();

		JwtBearerOptions options =
			monitor.Get(JwtBearerDefaults.AuthenticationScheme);

		IssuerSigningKeyResolver resolver =
			options.TokenValidationParameters.IssuerSigningKeyResolver!;

		List<SecurityKey> keyList =
			resolver(
				null!,
				null!,
				null!,
				null!).ToList();

		string expectedPreviousKid =
			JwtSettings.ComputeKeyFingerprint(previousSecretKey);

		keyList.ShouldContain(k => k.KeyId == expectedPreviousKid);
	}

	/// <summary>
	/// Verifies that no <see cref="IssuerSigningKeyResolver"/> is registered when no previous key is configured.
	/// </summary>
	[Fact]
	public void AddAuthenticationServices_NoPreviousKey_IssuerSigningKeyResolverIsNull()
	{
		IServiceCollection services =
			new ServiceCollection();

		IConfiguration configuration =
			BuildValidJwtConfig();

		services.AddAuthenticationServices(configuration);

		ServiceProvider provider =
			services.BuildServiceProvider();

		IOptionsMonitor<JwtBearerOptions> monitor =
			provider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>();

		JwtBearerOptions options =
			monitor.Get(JwtBearerDefaults.AuthenticationScheme);

		options.TokenValidationParameters.IssuerSigningKeyResolver.ShouldBeNull();
	}

	/// <summary>
	/// Verifies that <see cref="IHttpClientFactory"/> is registered after calling
	/// <see cref="AuthenticationExtensions.AddAuthenticationServices"/>.
	/// </summary>
	[Fact]
	public void AddAuthenticationServices_ValidConfig_RegistersHttpClientFactory()
	{
		IServiceCollection services =
			new ServiceCollection();

		IConfiguration configuration =
			BuildValidJwtConfig();

		services.AddAuthenticationServices(configuration);

		ServiceProvider provider =
			services.BuildServiceProvider();

		IHttpClientFactory httpClientFactory =
			provider.GetRequiredService<IHttpClientFactory>();

		httpClientFactory.ShouldNotBeNull();
	}

	private static IConfiguration BuildValidJwtConfig(
		bool includePreviousKey = false,
		string? previousKeyId = null)
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

		if (previousKeyId is not null)
		{
			values["Jwt:PreviousKeyId"] = previousKeyId;
		}

		return new ConfigurationBuilder()
			.AddInMemoryCollection(values)
			.Build();
	}
}