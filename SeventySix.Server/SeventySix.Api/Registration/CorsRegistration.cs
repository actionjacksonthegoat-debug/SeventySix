// <copyright file="CorsRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for CORS services.
/// </summary>
public static class CorsRegistration
{
	/// <summary>
	/// CORS policy name for allowed origins.
	/// </summary>
	public const string PolicyName = "AllowedOrigins";

	/// <summary>
	/// Default allowed origin for development.
	/// </summary>
	private const string DefaultDevelopmentOrigin = "http://localhost:4200";

	/// <summary>
	/// Adds CORS policies from configuration with security validation.
	/// </summary>
	/// <remarks>
	/// Reads configuration key: "Cors:AllowedOrigins".
	/// Defaults to localhost for development when not configured.
	/// Logs warning if wildcard (*) is detected in origins.
	/// </remarks>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddConfiguredCors(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		string[] allowedOrigins =
			configuration.GetSection(ConfigurationSectionConstants.Cors.AllowedOrigins).Get<string[]>()
			?? [DefaultDevelopmentOrigin];

		ValidateOrigins(allowedOrigins);

		services.AddCors(
			options =>
			{
				options.AddPolicy(
					name: PolicyName,
					policy =>
					{
						_ =
							policy
								.WithOrigins(allowedOrigins)
								.WithMethods(
									"GET",
									"POST",
									"PUT",
									"DELETE",
									"OPTIONS")
								.WithHeaders(
									HttpHeaderConstants.Authorization,
									HttpHeaderConstants.ContentType,
									HttpHeaderConstants.Accept,
									HttpHeaderConstants.XRequestedWith,
									HttpHeaderConstants.CacheControl,
									HttpHeaderConstants.Pragma)
								.AllowCredentials();
					});
			});

		return services;
	}

	/// <summary>
	/// Validates CORS origins for security issues.
	/// </summary>
	/// <param name="origins">
	/// The configured origins to validate.
	/// </param>
	/// <exception cref="InvalidOperationException">
	/// Thrown when wildcard (*) origin is configured (security risk).
	/// </exception>
	private static void ValidateOrigins(string[] origins)
	{
		if (origins.Any(origin => origin == "*"))
		{
			throw new InvalidOperationException(
				"CORS wildcard (*) origin is not allowed. " +
				"Configure specific origins in Cors:AllowedOrigins.");
		}

		if (origins.Length == 0)
		{
			throw new InvalidOperationException(
				"At least one CORS origin must be configured in Cors:AllowedOrigins.");
		}
	}
}