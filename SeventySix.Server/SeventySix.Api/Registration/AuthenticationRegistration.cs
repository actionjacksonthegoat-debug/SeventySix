// <copyright file="AuthenticationRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Identity.Settings;
using SeventySix.Shared.Constants;

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
		// Bind configuration sections
		services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
		services.Configure<AuthSettings>(configuration.GetSection("Auth"));
		services.Configure<AdminSeederSettings>(
			configuration.GetSection(AdminSeederSettings.SectionName));
		services.Configure<WhitelistedPermissionSettings>(
			configuration.GetSection(WhitelistedPermissionSettings.SectionName));

		JwtSettings jwtSettings =
			configuration.GetSection("Jwt").Get<JwtSettings>()
			?? throw new InvalidOperationException(
				"JWT configuration section 'Jwt' is missing.");

		AuthSettings authSettings =
			configuration.GetSection("Auth").Get<AuthSettings>()
			?? throw new InvalidOperationException(
				"Auth configuration section 'Auth' is missing.");

		services
			.AddAuthentication(options =>
			{
				options.DefaultAuthenticateScheme =
					JwtBearerDefaults.AuthenticationScheme;
				options.DefaultChallengeScheme =
					JwtBearerDefaults.AuthenticationScheme;
			})
			.AddJwtBearer(options =>
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
								Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
						ClockSkew =
							TimeSpan.FromMinutes(1),
						// Explicit algorithm validation (defense-in-depth against alg:none attacks)
						ValidAlgorithms =
							[SecurityAlgorithms.HmacSha256],
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

		services.AddAuthorization(options =>
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
		});

		// Add HttpClientFactory for OAuth
		services.AddHttpClient();

		return services;
	}
}