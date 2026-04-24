// <copyright file="AuthenticationRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Identity.Settings;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Registration;

namespace SeventySix.Api.Registration;

/// <summary>
/// Extension methods for configuring JWT Bearer authentication.
/// </summary>
/// <remarks>
/// Configures:
/// - JWT Bearer authentication with configurable settings
/// - Token validation parameters
/// - Cookie-based refresh token handling
/// </remarks>
public static class AuthenticationExtensions
{
	/// <summary>
	/// Adds JWT Bearer authentication services.
	/// </summary>
	/// <remarks>
	/// Binds configuration sections:
	/// - "Jwt" (JwtSettings)
	/// - "Auth" (AuthSettings)
	/// - Admin seeder and whitelisted permissions sections (AdminSeederSettings, WhitelistedPermissionSettings)
	/// </remarks>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The configuration.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddAuthenticationServices(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		// Bind configuration sections with FluentValidation + ValidateOnStart
		services.AddDomainSettings<JwtSettings, JwtSettingsValidator>(
			configuration,
			JwtSettings.SectionName);

		services.AddDomainSettings<AuthSettings, AuthSettingsValidator>(
			configuration,
			AuthSettings.SectionName);

		// Note: AdminSeederSettings is registered in IdentityRegistration (single registration point)

		services.AddDomainSettings<WhitelistedPermissionSettings, WhitelistedPermissionSettingsValidator>(
			configuration,
			WhitelistedPermissionSettings.SectionName);

		JwtSettings jwtSettings =
			configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
			?? throw new InvalidOperationException(
				$"JWT configuration section '{JwtSettings.SectionName}' is missing.");

		services
			.AddAuthentication(
				options =>
				{
					options.DefaultAuthenticateScheme =
						JwtBearerDefaults.AuthenticationScheme;
					options.DefaultChallengeScheme =
						JwtBearerDefaults.AuthenticationScheme;
				})
			.AddJwtBearer(
				options =>
				{
					options.MapInboundClaims = false;

					options.TokenValidationParameters =
						new TokenValidationParameters
						{
							ValidateIssuer = true,
							ValidateAudience = true,
							ValidateLifetime = true,
							ValidateIssuerSigningKey = true,
							ValidIssuer = jwtSettings.Issuer,
							ValidAudience = jwtSettings.Audience,
							IssuerSigningKey =
								new SymmetricSecurityKey(
									Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
								{
									KeyId = jwtSettings.GetEffectiveKeyId(),
								},
							ClockSkew =
								TimeSpan.FromMinutes(jwtSettings.ClockSkewMinutes),
							// Explicit algorithm validation (defense-in-depth against alg:none attacks)
							ValidAlgorithms =
								[SecurityAlgorithms.HmacSha256],
							IssuerSigningKeyResolver =
								!string.IsNullOrEmpty(jwtSettings.PreviousSecretKey)
									? BuildRotationKeyResolver(jwtSettings)
									: null,
						};
					options.Events =
						new JwtBearerEvents
						{
							OnAuthenticationFailed =
								context =>
								{
									if (context.Exception is SecurityTokenExpiredException)
									{
										context.Response.Headers.Append(
											HttpHeaderConstants.TokenExpired,
											"true");
									}

									return Task.CompletedTask;
								},
						};
				});

		services.AddAuthorization(ConfigureAuthorizationPolicies);

		// Add HttpClientFactory for OAuth
		services.AddHttpClient();

		return services;
	}

	/// <summary>
	/// Builds an <see cref="IssuerSigningKeyResolver"/> that accepts both the current
	/// and previous signing key during a key rotation window.
	/// </summary>
	/// <remarks>
	/// Use this when rotating the JWT secret key:
	/// 1. Set <c>Jwt:PreviousSecretKey</c> = old <c>Jwt:SecretKey</c>
	/// 2. Set <c>Jwt:SecretKey</c> = new key
	/// 3. Wait until all tokens issued with the old key have expired
	/// 4. Remove <c>Jwt:PreviousSecretKey</c>
	/// </remarks>
	/// <param name="jwtSettings">
	/// The JWT settings containing current and previous key information.
	/// </param>
	/// <returns>
	/// A key resolver that returns both current and previous keys for validation.
	/// </returns>
	private static IssuerSigningKeyResolver BuildRotationKeyResolver(
		JwtSettings jwtSettings)
	{
		SymmetricSecurityKey currentKey =
			new(
				Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
			{
				KeyId = jwtSettings.GetEffectiveKeyId(),
			};

		SymmetricSecurityKey previousKey =
			new(
				Encoding.UTF8.GetBytes(jwtSettings.PreviousSecretKey!))
			{
				KeyId =
					string.IsNullOrEmpty(jwtSettings.PreviousKeyId)
						? JwtSettings.ComputeKeyFingerprint(jwtSettings.PreviousSecretKey!)
						: jwtSettings.PreviousKeyId,
			};

		return (token, securityToken, kid, parameters) => [currentKey, previousKey];
	}

	/// <summary>
	/// Configures authorization policies for the application.
	/// </summary>
	/// <param name="options">
	/// The authorization options to configure.
	/// </param>
	private static void ConfigureAuthorizationPolicies(
		AuthorizationOptions options)
	{
		options.AddPolicy(
			PolicyConstants.AdminOnly,
			policy => policy.RequireRole(RoleConstants.Admin));

		options.AddPolicy(
			PolicyConstants.DeveloperOrAdmin,
			policy =>
				policy.RequireRole(
					RoleConstants.Developer,
					RoleConstants.Admin));

		options.AddPolicy(
			PolicyConstants.Authenticated,
			policy => policy.RequireAuthenticatedUser());
	}
}