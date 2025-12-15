// <copyright file="CorsRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for CORS services.
/// </summary>
public static class CorsRegistration
{
	/// <summary>
	/// Adds CORS policies from configuration.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddConfiguredCors(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		string[] allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
			?? ["http://localhost:4200"];

		services.AddCors(options =>
		{
			options.AddPolicy(
				name: "AllowedOrigins",
				policy =>
				{
					_ = policy
						.WithOrigins(allowedOrigins)
						.AllowAnyHeader()
						.AllowAnyMethod()
						.AllowCredentials();
				});
		});

		return services;
	}
}
