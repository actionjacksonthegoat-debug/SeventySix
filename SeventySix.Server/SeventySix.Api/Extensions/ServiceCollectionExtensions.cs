// <copyright file="ServiceCollectionExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IO.Compression;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Options;
using SeventySix.Api.Configuration;
using SeventySix.Shared;

namespace SeventySix.Api.Extensions;

/// <summary>
/// Extension methods for IServiceCollection to simplify dependency injection configuration.
/// </summary>
/// <remarks>
/// Provides clean, maintainable methods to register groups of related services.
/// This eliminates the need to maintain large registration blocks in Program.cs.
/// </remarks>
public static class ServiceCollectionExtensions
{
	/// <summary>
	/// Adds application-specific services to the service collection.
	/// Includes repositories, business logic services, validators, and HTTP clients.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddApplicationServices(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		// Configuration options with validation
		services.Configure<PollyOptions>(
			configuration.GetSection(PollyOptions.SECTION_NAME));

		services.Configure<OutputCacheOptions>(
			configuration.GetSection(OutputCacheOptions.SECTION_NAME));

		services.AddOptions<PollyOptions>()
			.Bind(configuration.GetSection(PollyOptions.SECTION_NAME))
			.ValidateOnStart();

		services.AddOptions<OutputCacheOptions>()
			.Bind(configuration.GetSection(OutputCacheOptions.SECTION_NAME))
			.ValidateOnStart();

		// Note: FluentValidation, Repositories, and Business Services
		// are now registered via bounded context extensions:
		// - AddIdentityDomain()
		// - AddLoggingDomain()
		// - AddApiTrackingDomain()
		// - AddInfrastructureDomain()

		// Memory cache
		services.AddMemoryCache();

		return services;
	}

	// AddDatabaseContext removed - bounded contexts now handle their own DbContext registration

	/// <summary>
	/// Adds response compression with optimized settings.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddOptimizedResponseCompression(
		this IServiceCollection services)
	{
		services.AddResponseCompression(options =>
		{
			options.EnableForHttps = true;
			options.Providers.Add<BrotliCompressionProvider>();
			options.Providers.Add<GzipCompressionProvider>();
		});

		services.Configure<BrotliCompressionProviderOptions>(options =>
		{
			options.Level = CompressionLevel.Fastest;
		});

		services.Configure<GzipCompressionProviderOptions>(options =>
		{
			options.Level = CompressionLevel.Fastest;
		});

		return services;
	}

	/// <summary>
	/// Adds output caching with dynamic policy registration from configuration.
	/// Automatically discovers and registers all policies defined in appsettings.json.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddConfiguredOutputCache(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		services.AddOutputCache(options =>
		{
			OutputCacheOptions? cacheConfig = configuration
				.GetSection(OutputCacheOptions.SECTION_NAME)
				.Get<OutputCacheOptions>();

			if (cacheConfig?.Policies == null)
			{
				return;
			}

			foreach ((string? name, CachePolicyConfig? config) in cacheConfig.Policies)
			{
				if (!config.Enabled)
				{
					continue;
				}

				string policyName = name.ToLowerInvariant();

				options.AddPolicy(policyName, policyBuilder =>
				{
					policyBuilder
						.Expire(TimeSpan.FromSeconds(config.DurationSeconds))
						.Tag(config.Tag);

					if (config.VaryByQuery.Length > 0)
					{
						policyBuilder.SetVaryByQuery(config.VaryByQuery);
					}
				});
			}
		});

		services.AddResponseCaching();

		return services;
	}

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