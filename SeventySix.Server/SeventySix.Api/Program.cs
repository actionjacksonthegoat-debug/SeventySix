// <copyright file="Program.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

// <summary>
// Application entry point and service configuration.
// Configures the ASP.NET Core web application with all required services,
// middleware, and endpoints following Clean Architecture principles.
// </summary>
//
// <remarks>
// This file configures:
// - Logging with Serilog (console and file outputs)
// - Response compression (Brotli and Gzip)
// - Response caching
// - FluentValidation
// - Repository pattern implementations
// - Application services
// - CORS policies
// - Security headers middleware
// - Global exception handling
// - Rate limiting
// - OpenAPI/Scalar documentation (development only)
//
// Architecture: Implements Dependency Inversion Principle (DIP) by registering
// interfaces with their concrete implementations.
// </remarks>

using System.IO.Compression;
using FluentValidation;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;
using Serilog.Exceptions;
using SeventySix.Api.Logging;
using SeventySix.Api.Middleware;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.BusinessLogic.Services;
using SeventySix.BusinessLogic.Validators;
using SeventySix.Core.Interfaces;
using SeventySix.Data;
using SeventySix.Data.Infrastructure;
using SeventySix.DataAccess.Repositories;
using SeventySix.DataAccess.Services;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configure Serilog for structured logging
// Outputs: Console + Rolling file (daily rotation) + Database (Warning+ levels)
// Note: Database sink is added after building the app to access IServiceProvider
Log.Logger = new LoggerConfiguration()
	.ReadFrom.Configuration(builder.Configuration)
	.Enrich.FromLogContext()
	.Enrich.WithMachineName()
	.Enrich.WithThreadId()
	.Enrich.WithExceptionDetails()
	.WriteTo.Console(
		outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
	.WriteTo.File(
		path: "logs/seventysix-.txt",
		rollingInterval: RollingInterval.Day,
		retainedFileCountLimit: 30,
		outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {SourceContext} {Message:lj} {Properties:j}{NewLine}{Exception}")
	.MinimumLevel.Information()
	.MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
	.MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
	.MinimumLevel.Override("System", LogEventLevel.Warning)
	.CreateLogger();

builder.Host.UseSerilog();

// Add MVC controllers to the service container
builder.Services.AddControllers();

// Response compression for improved performance
// Enables HTTPS compression with Brotli (preferred) and Gzip fallback
builder.Services.AddResponseCompression(options =>
{
	options.EnableForHttps = true;
	options.Providers.Add<BrotliCompressionProvider>();
	options.Providers.Add<GzipCompressionProvider>();
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
	options.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
	options.Level = CompressionLevel.Fastest;
});

// Response caching middleware
builder.Services.AddResponseCaching();

// Memory cache for OpenWeather API responses
builder.Services.AddMemoryCache();

// Entity Framework Core with PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
	var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
		?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

	options.UseNpgsql(connectionString, npgsqlOptions =>
	{
		// Retry on transient failures (network issues, deadlocks)
		npgsqlOptions.EnableRetryOnFailure(
			maxRetryCount: 3,
			maxRetryDelay: TimeSpan.FromSeconds(5),
			errorCodesToAdd: null);

		// Set command timeout (default: 30s)
		npgsqlOptions.CommandTimeout(30);
	});

	// Logging for development
	if (builder.Environment.IsDevelopment())
	{
		options.EnableSensitiveDataLogging(); // Show parameter values in logs
		options.EnableDetailedErrors(); // More detailed error messages
	}
});

// Configuration options for OpenWeather API and Polly resilience policies
// Uses Options pattern for strongly-typed configuration with validation
builder.Services.Configure<OpenWeatherOptions>(
	builder.Configuration.GetSection(OpenWeatherOptions.SECTION_NAME));

builder.Services.Configure<PollyOptions>(
	builder.Configuration.GetSection(PollyOptions.SECTION_NAME));

// Validate configuration on startup to fail fast if misconfigured
builder.Services.AddOptions<OpenWeatherOptions>()
	.Bind(builder.Configuration.GetSection(OpenWeatherOptions.SECTION_NAME))
	.ValidateOnStart();

builder.Services.AddOptions<PollyOptions>()
	.Bind(builder.Configuration.GetSection(PollyOptions.SECTION_NAME))
	.ValidateOnStart();

// Rate limiting service (Scoped - uses DbContext via repository)
// Changed from Singleton: Database-backed implementation requires DbContext which is scoped
builder.Services.AddScoped<ITransactionManager, TransactionManager>();
builder.Services.AddScoped<IRateLimitingService, RateLimitingService>();

// HttpClient for PollyIntegrationClient
// Configures base address, timeout, and User-Agent header
builder.Services.AddHttpClient<IPollyIntegrationClient, PollyIntegrationClient>()
	.ConfigureHttpClient((serviceProvider, client) =>
	{
		var options = serviceProvider.GetRequiredService<IOptions<OpenWeatherOptions>>().Value;
		client.BaseAddress = new Uri(options.BaseUrl);
		client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds + 5); // Add buffer for Polly timeout
		client.DefaultRequestHeaders.Add("User-Agent", "SeventySix/1.0");
	});

// OpenWeather API client (Scoped - uses HttpClient)
builder.Services.AddScoped<IOpenWeatherApiClient, OpenWeatherApiClient>();

// OpenWeather business logic service (Scoped - depends on IOpenWeatherApiClient)
builder.Services.AddScoped<IOpenWeatherService, OpenWeatherService>();

// FluentValidation - Register all validators for OpenWeather requests
// Validates weather coordinates, units, language codes, and timestamps
builder.Services.AddValidatorsFromAssemblyContaining<WeatherRequestValidator>();

// Repository pattern - Scoped lifetime for per-request database context
// Implements Dependency Inversion Principle (DIP)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IThirdPartyApiRequestRepository, ThirdPartyApiRequestRepository>();
builder.Services.AddScoped<ILogRepository, LogRepository>();

// Application services - Business logic layer
// Scoped lifetime ensures proper DbContext management
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IThirdPartyApiRequestService, ThirdPartyApiRequestService>();
builder.Services.AddScoped<IHealthCheckService, HealthCheckService>();
builder.Services.AddScoped<ILogChartService, LogChartService>();

// OpenAPI/Swagger configuration for API documentation
builder.Services.AddOpenApi();

// CORS configuration - Load allowed origins from appsettings.json
// Defaults to localhost:4200 for development if not configured
string[] allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
	?? ["http://localhost:4200"];

builder.Services.AddCors(options =>
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

WebApplication app = builder.Build();

// Initialize database - Create if not exists and run migrations
using (var scope = app.Services.CreateScope())
{
	var services = scope.ServiceProvider;
	var logger = services.GetRequiredService<ILogger<Program>>();

	try
	{
		logger.LogInformation("Ensuring database exists and applying migrations...");
		var context = services.GetRequiredService<ApplicationDbContext>();

		// Create database if it doesn't exist and apply all pending migrations
		await context.Database.MigrateAsync();

		logger.LogInformation("Database initialization completed successfully");
	}
	catch (Exception ex)
	{
		logger.LogError(ex, "An error occurred while initializing the database");
		throw; // Re-throw to prevent app startup with invalid database
	}
}

// Add database sink now that we have the service provider
// This allows us to resolve scoped services (DbContext) for logging
Log.Logger = new LoggerConfiguration()
	.ReadFrom.Configuration(builder.Configuration)
	.Enrich.FromLogContext()
	.Enrich.WithMachineName()
	.Enrich.WithThreadId()
	.Enrich.WithExceptionDetails()
	.WriteTo.Console(
		outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
	.WriteTo.File(
		path: "logs/seventysix-.txt",
		rollingInterval: RollingInterval.Day,
		retainedFileCountLimit: 30,
		outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {SourceContext} {Message:lj} {Properties:j}{NewLine}{Exception}")
	.WriteTo.Database(
		serviceProvider: app.Services,
		environment: app.Environment.EnvironmentName,
		machineName: System.Environment.MachineName)
	.MinimumLevel.Information()
	.MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
	.MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
	.MinimumLevel.Override("System", LogEventLevel.Warning)
	.CreateLogger();

// Serilog HTTP request logging - Captures request details
// Enriches logs with RequestMethod, RequestPath, StatusCode, Elapsed time
app.UseSerilogRequestLogging(options =>
{
	options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
	options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
	{
		diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value ?? "unknown");
		diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
		diagnosticContext.Set("RemoteIpAddress", httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
		diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].ToString());
	};
});

// Security headers middleware - Implements defense in depth
// Adds various security headers to prevent common web vulnerabilities
app.Use(async (context, next) =>
{
	context.Response.Headers["X-Content-Type-Options"] = "nosniff";
	context.Response.Headers["X-Frame-Options"] = "DENY";
	context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
	context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
	context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";

	// Content Security Policy - Mitigates XSS and data injection attacks
	// Configured for Angular + Material Design + Google Fonts
	context.Response.Headers["Content-Security-Policy"] =
		"default-src 'self'; " +
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
		"font-src 'self' https://fonts.gstatic.com; " +
		"img-src 'self' data: https:; " +
		"connect-src 'self'; " +
		"frame-ancestors 'none'; " +
		"base-uri 'self'; " +
		"form-action 'self'";

	// HSTS only in production to avoid development certificate issues
	if (!app.Environment.IsDevelopment())
	{
		context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
	}

	await next();
});

// Global exception handling - Catches all unhandled exceptions
// Returns consistent ProblemDetails responses (RFC 7807)
app.UseMiddleware<GlobalExceptionMiddleware>();

// Rate limiting - Prevents API abuse (100 requests/minute per IP)
app.UseMiddleware<RateLimitingMiddleware>();

// Enable response compression
app.UseResponseCompression();

// Enable response caching
app.UseResponseCaching();

// Configure the HTTP request pipeline for development environment
if (app.Environment.IsDevelopment())
{
	_ = app.MapOpenApi();

	// Scalar API reference UI - Modern alternative to Swagger UI
	_ = app.MapScalarApiReference();
}

// CORS - Must be called after UseRouting and before UseAuthorization
app.UseCors("AllowedOrigins");

// HTTPS redirection - Redirect HTTP to HTTPS in production
app.UseHttpsRedirection();

// Authorization middleware (currently no auth configured)
app.UseAuthorization();

// Map controller endpoints
app.MapControllers();

// Start the application
app.Run();

// Make Program class accessible to integration tests via partial class
// This enables WebApplicationFactory<Program> in test projects
public partial class Program
{
}