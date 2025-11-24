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

using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;
using Serilog.Exceptions;
using SeventySix.Api.Extensions;
using SeventySix.Api.HealthChecks;
using SeventySix.Api.Logging;
using SeventySix.Api.Middleware;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.Data;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Bind centralized security settings (single source of truth for HTTPS enforcement)
builder.Services.Configure<SecuritySettings>(
	builder.Configuration.GetSection("Security"));

// Disable HTTPS certificate requirements in development mode
// This allows the app to run without certificate errors in Docker containers
if (builder.Environment.IsDevelopment())
{
	builder.WebHost.ConfigureKestrel(serverOptions =>
	{
		serverOptions.ConfigureHttpsDefaults(httpsOptions =>
		{
			// Accept any client certificate without validation
			httpsOptions.AllowAnyClientCertificate();
		});
	});
}

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

// Add HTTP context accessor for accessing HttpContext in services
builder.Services.AddHttpContextAccessor();

// Add comprehensive health checks for observability
// Liveness: Basic checks to determine if the app should be restarted
// Readiness: Checks if the app is ready to serve traffic (includes dependencies)
builder.Services.AddHealthChecks()
	.AddDbContextCheck<ApplicationDbContext>(
		name: "database",
		failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy,
		tags: new[] { "ready", "db" })
	.AddCheck<JaegerHealthCheck>(
		name: "jaeger",
		failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded,
		tags: new[] { "ready", "tracing" });

// Add OpenTelemetry with Jaeger exporter for tracing and Prometheus for metrics
// Configuration from appsettings.json
string serviceName = builder.Configuration.GetValue<string>("OpenTelemetry:ServiceName") ?? "SeventySix.Api";
string serviceVersion = builder.Configuration.GetValue<string>("OpenTelemetry:ServiceVersion") ?? "1.0.0";
string otlpEndpoint = builder.Configuration.GetValue<string>("OpenTelemetry:OtlpEndpoint") ?? "http://localhost:4317";
string environment = builder.Environment.EnvironmentName;

builder.Services.AddOpenTelemetry()
	.ConfigureResource(resource => resource
		.AddService(serviceName: serviceName, serviceVersion: serviceVersion)
		.AddAttributes(new Dictionary<string, object>
		{
			["deployment.environment"] = environment,
		}))
	.WithTracing(tracing => tracing
		.AddAspNetCoreInstrumentation(options =>
		{
			// Capture additional request/response details
			options.RecordException = true;
		})
		.AddHttpClientInstrumentation()
		.AddOtlpExporter(options =>
		{
			// Jaeger's OTLP endpoint (configurable for Docker vs local)
			options.Endpoint = new Uri(otlpEndpoint);
		}))
	.WithMetrics(metrics => metrics
		// ASP.NET Core metrics (request duration, active requests, etc.)
		.AddAspNetCoreInstrumentation()
		// HTTP client metrics (outbound request duration, failures, etc.)
		.AddHttpClientInstrumentation()
		// .NET Runtime metrics (CPU, memory, GC, exceptions, thread pool)
		.AddRuntimeInstrumentation()
		// Prometheus exporter - exposes /metrics endpoint
		.AddPrometheusExporter());

// Add MVC controllers to the service container
builder.Services.AddControllers();

// Add all application services using extension methods
// This includes: repositories, business logic services, validators, HTTP clients, and configuration
builder.Services.AddApplicationServices(builder.Configuration);

// Add database context with PostgreSQL
builder.Services.AddDatabaseContext(builder.Configuration, builder.Environment);

// Add response compression (Brotli + Gzip)
builder.Services.AddOptimizedResponseCompression();

// Add output caching with auto-discovery from configuration
builder.Services.AddConfiguredOutputCache(builder.Configuration);

// Add CORS from configuration
builder.Services.AddConfiguredCors(builder.Configuration);

// OpenAPI/Swagger configuration for API documentation
builder.Services.AddOpenApi();

WebApplication app = builder.Build();

// Initialize database - Create if not exists and run migrations
using (IServiceScope scope = app.Services.CreateScope())
{
	IServiceProvider services = scope.ServiceProvider;
	ILogger<Program> logger = services.GetRequiredService<ILogger<Program>>();

	try
	{
		logger.LogInformation("Ensuring database exists and applying migrations...");
		ApplicationDbContext context = services.GetRequiredService<ApplicationDbContext>();

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
		diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString());
	};
});

// Security headers middleware - Attribute-aware implementation
// Reads [SecurityHeaders] attributes from controllers/actions for customization
app.UseMiddleware<AttributeBasedSecurityHeadersMiddleware>();

// Global exception handling - Catches all unhandled exceptions
// Returns consistent ProblemDetails responses (RFC 7807)
app.UseMiddleware<GlobalExceptionMiddleware>();

// Rate limiting - Attribute-aware implementation
// Reads [RateLimit] attributes from controllers/actions for customization
app.UseMiddleware<AttributeBasedRateLimitingMiddleware>();

// Enable response compression
app.UseResponseCompression();

// Enable response caching
app.UseResponseCaching();

// Enable output caching (must be before UseAuthorization)
app.UseOutputCache();

// Configure the HTTP request pipeline for development environment
if (app.Environment.IsDevelopment())
{
	_ = app.MapOpenApi();

	// Scalar API reference UI - Modern alternative to Swagger UI
	_ = app.MapScalarApiReference();
}

// CORS - Must be called after UseRouting and before UseAuthorization
app.UseCors("AllowedOrigins");

// Smart HTTPS redirection - Centralized enforcement with configurable exemptions
// Controlled by Security section in appsettings.json (single source of truth)
app.UseMiddleware<SmartHttpsRedirectionMiddleware>();

// Authorization middleware (currently no auth configured)
app.UseAuthorization();

// Map health check endpoints following Kubernetes best practices
// /health/live - Liveness probe (app is running)
// /health/ready - Readiness probe (app is ready to serve traffic)
// /health - Overall health status
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
	Predicate = _ => false, // No checks - just return 200 if app is running
	ResponseWriter = async (context, report) =>
	{
		context.Response.ContentType = "application/json";
		await context.Response.WriteAsJsonAsync(new { status = "Healthy", timestamp = DateTime.UtcNow });
	}
});

app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
	Predicate = check => check.Tags.Contains("ready"), // Only readiness checks
	ResponseWriter = WriteHealthCheckResponse
});

app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
	ResponseWriter = WriteHealthCheckResponse // Detailed JSON response
});

static async Task WriteHealthCheckResponse(HttpContext context, Microsoft.Extensions.Diagnostics.HealthChecks.HealthReport report)
{
	context.Response.ContentType = "application/json";
	string result = System.Text.Json.JsonSerializer.Serialize(new
	{
		status = report.Status.ToString(),
		timestamp = DateTime.UtcNow,
		duration = report.TotalDuration,
		checks = report.Entries.Select(e => new
		{
			name = e.Key,
			status = e.Value.Status.ToString(),
			description = e.Value.Description,
			duration = e.Value.Duration,
			exception = e.Value.Exception?.Message,
			data = e.Value.Data
		})
	}, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
	await context.Response.WriteAsync(result);
}

// Map Prometheus metrics endpoint (accessible at /metrics)
// This endpoint is scraped by Prometheus for metrics collection
app.MapPrometheusScrapingEndpoint();

// Map controller endpoints
app.MapControllers();

// Start the application
app.Run();