// <copyright file="ServiceCollectionExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IO.Compression;
using FluentValidation;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.BusinessLogic.Infrastructure;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.BusinessLogic.Services;
using SeventySix.BusinessLogic.Validators;
using SeventySix.Data;
using SeventySix.Data.Infrastructure;
using SeventySix.Data.Repositories;

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

		// FluentValidation
		services.AddValidatorsFromAssemblyContaining<CreateUserValidator>();

		// Repositories
		services.AddScoped<IUserRepository, UserRepository>();
		services.AddScoped<IThirdPartyApiRequestRepository, ThirdPartyApiRequestRepository>();
		services.AddScoped<ILogRepository, LogRepository>();

		// Business logic services
		services.AddScoped<IUserService, UserService>();
		services.AddScoped<IThirdPartyApiRequestService, ThirdPartyApiRequestService>();
		services.AddScoped<IHealthCheckService, HealthCheckService>();
		services.AddSingleton<IMetricsService, MetricsService>();

		// Infrastructure services
		services.AddScoped<ITransactionManager, TransactionManager>();
		services.AddScoped<IRateLimitingService, RateLimitingService>();

		// HTTP clients
		services.AddHttpClient<IPollyIntegrationClient, PollyIntegrationClient>()
			.ConfigureHttpClient((serviceProvider, client) =>
			{
				client.Timeout = TimeSpan.FromSeconds(30);
				client.DefaultRequestHeaders.Add("User-Agent", "SeventySix/1.0");
			});

		// Memory cache
		services.AddMemoryCache();

		return services;
	}

	/// <summary>
	/// Adds database context with PostgreSQL configuration.
	/// </summary>
	/// <param name="services">The service collection.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <param name="environment">The web host environment.</param>
	/// <returns>The service collection for chaining.</returns>
	public static IServiceCollection AddDatabaseContext(
		this IServiceCollection services,
		IConfiguration configuration,
		IWebHostEnvironment environment)
	{
		services.AddDbContext<ApplicationDbContext>(options =>
		{
			string connectionString = configuration.GetConnectionString("DefaultConnection")
				?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

			options.UseNpgsql(connectionString, npgsqlOptions =>
			{
				npgsqlOptions.EnableRetryOnFailure(
					maxRetryCount: 3,
					maxRetryDelay: TimeSpan.FromSeconds(5),
					errorCodesToAdd: null);

				npgsqlOptions.CommandTimeout(30);
			});

			if (environment.IsDevelopment())
			{
				options.EnableSensitiveDataLogging();
				options.EnableDetailedErrors();
			}
		});

		return services;
	}

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