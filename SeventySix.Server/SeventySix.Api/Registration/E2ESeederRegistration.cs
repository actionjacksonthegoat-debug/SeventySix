// <copyright file="E2ESeederRegistration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using SeventySix.Api.Seeders;

namespace SeventySix.Api.Registration;

/// <summary>
/// Registration for E2E test seeder.
/// Only runs when E2ESeeder:Enabled is true (Test environment).
/// </summary>
[ExcludeFromCodeCoverage]
public static class E2ESeederRegistration
{
	/// <summary>
	/// Adds the E2E test seeder if enabled in configuration.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddE2ESeeder(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		services.Configure<E2ESeederSettings>(
			configuration.GetSection("E2ESeeder"));

		bool isE2ESeederEnabled =
			configuration.GetValue<bool>("E2ESeeder:Enabled");

		if (isE2ESeederEnabled)
		{
			services.AddHostedService<E2ETestSeeder>();
		}

		return services;
	}
}