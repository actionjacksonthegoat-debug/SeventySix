// <copyright file="WebApplicationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using SeventySix.Api.Configuration;
using SeventySix.ApiTracking;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.Shared;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Extensions;

/// <summary>Extension methods for WebApplication pipeline configuration.</summary>
public static class WebApplicationExtensions
{
	/// <summary>Applies pending database migrations for all bounded contexts.</summary>
	/// <param name="app">The web application.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>A task representing the asynchronous operation.</returns>
	public static async Task ApplyMigrationsAsync(
		this WebApplication app,
		IConfiguration configuration)
	{
		bool skipMigrationCheck =
			configuration.GetValue<bool>("SkipMigrationCheck");

		if (skipMigrationCheck)
		{
			return;
		}

		using IServiceScope scope =
			app.Services.CreateScope();

		IServiceProvider services =
			scope.ServiceProvider;

		ILogger logger =
			services.GetRequiredService<ILogger<WebApplication>>();

		try
		{
			logger.LogInformation("Checking for pending database migrations...");

			await ApplyContextMigrationsAsync<IdentityDbContext>(
				services,
				logger,
				"Identity");

			await ApplyContextMigrationsAsync<LoggingDbContext>(
				services,
				logger,
				"Logging");

			await ApplyContextMigrationsAsync<ApiTrackingDbContext>(
				services,
				logger,
				"ApiTracking");

			logger.LogInformation("Database initialization completed successfully");
		}
		catch (Exception ex)
		{
			logger.LogError(
				ex,
				"An error occurred while initializing the database");
			throw;
		}
	}

	/// <summary>Configures forwarded headers for reverse proxy scenarios.</summary>
	/// <param name="app">The web application.</param>
	/// <param name="configuration">The application configuration.</param>
	/// <returns>The web application for chaining.</returns>
	public static WebApplication UseConfiguredForwardedHeaders(
		this WebApplication app,
		IConfiguration configuration)
	{
		ForwardedHeadersSettings settings =
			configuration
				.GetSection(ForwardedHeadersSettings.SectionName)
				.Get<ForwardedHeadersSettings>()
			?? new ForwardedHeadersSettings();

		ForwardedHeadersOptions options =
			new()
			{
				ForwardedHeaders =
					ForwardedHeaders.XForwardedFor
					| ForwardedHeaders.XForwardedProto,
				ForwardLimit = settings.ForwardLimit
			};

		foreach (string proxy in settings.KnownProxies)
		{
			if (IPAddress.TryParse(
				proxy,
				out IPAddress? ip))
			{
				options.KnownProxies.Add(ip);
			}
		}

		foreach (string network in settings.KnownNetworks)
		{
			string[] parts =
				network.Split('/');

			if (parts.Length == 2
				&& IPAddress.TryParse(
					parts[0],
					out IPAddress? prefix)
				&& int.TryParse(
					parts[1],
					out int prefixLength))
			{
				options.KnownIPNetworks.Add(new System.Net.IPNetwork(
					prefix,
					prefixLength));
			}
		}

		app.UseForwardedHeaders(options);

		return app;
	}

	/// <summary>Maps health check endpoints following Kubernetes best practices.</summary>
	/// <param name="app">The web application.</param>
	/// <returns>The web application for chaining.</returns>
	public static WebApplication MapHealthCheckEndpoints(this WebApplication app)
	{
		app.MapHealthChecks(
			"/health/live",
			new HealthCheckOptions
			{
				Predicate = _ => false,
				ResponseWriter = WriteLivenessResponseAsync
			});

		app.MapHealthChecks(
			"/health/ready",
			new HealthCheckOptions
			{
				Predicate = check => check.Tags.Contains("ready"),
				ResponseWriter = WriteHealthCheckResponseAsync
			});

		app.MapHealthChecks(
			"/health",
			new HealthCheckOptions
			{
				ResponseWriter = WriteHealthCheckResponseAsync
			});

		return app;
	}

	private static async Task ApplyContextMigrationsAsync<TContext>(
		IServiceProvider services,
		ILogger logger,
		string contextName)
		where TContext : DbContext
	{
		TContext context =
			services.GetRequiredService<TContext>();

		IEnumerable<string> pending =
			await context.Database.GetPendingMigrationsAsync();

		if (pending.Any())
		{
			await context.Database.MigrateAsync();
			logger.LogInformation(
				"{ContextName} database migrations applied",
				contextName);
		}
	}

	private static async Task WriteLivenessResponseAsync(
		HttpContext context,
		HealthReport _)
	{
		context.Response.ContentType = MediaTypeConstants.Json;

		TimeProvider timeProvider =
			context.RequestServices.GetRequiredService<TimeProvider>();

		await context.Response.WriteAsJsonAsync(new
		{
			status = HealthStatusConstants.Healthy,
			timestamp =
				timeProvider
					.GetUtcNow()
					.UtcDateTime
		});
	}

	private static async Task WriteHealthCheckResponseAsync(
		HttpContext context,
		HealthReport report)
	{
		context.Response.ContentType = MediaTypeConstants.Json;

		TimeProvider timeProvider =
			context.RequestServices.GetRequiredService<TimeProvider>();

		object response =
			new
			{
				status = report.Status.ToString(),
				timestamp =
					timeProvider
						.GetUtcNow()
						.UtcDateTime,
				duration = report.TotalDuration,
				checks = report.Entries.Select(entry => new
				{
					name = entry.Key,
					status = entry.Value.Status.ToString(),
					description = entry.Value.Description,
					duration = entry.Value.Duration,
					exception = entry.Value.Exception?.Message,
					data = entry.Value.Data
				})
			};

		string result =
			JsonSerializer.Serialize(
				response,
				new JsonSerializerOptions { WriteIndented = true });

		await context.Response.WriteAsync(result);
	}
}