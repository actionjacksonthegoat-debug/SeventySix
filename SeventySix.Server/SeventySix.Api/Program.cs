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

using Scalar.AspNetCore;
using Serilog;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Api.Middleware;
using SeventySix.DependencyExtensions;
using Wolverine;
using Wolverine.FluentValidation;

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
Serilog.Log.Logger = new LoggerConfiguration()
	.ConfigureBaseSerilog(builder.Configuration)
	.CreateLogger();

builder.Host.UseSerilog();

// Configure Wolverine for CQRS handlers
builder.Host.UseWolverine(options =>
{
	// Auto-discover handlers from SeventySix assembly
	options.Discovery.IncludeAssembly(typeof(SeventySix.Logging.Log).Assembly);

	// Use FluentValidation for command validation
	options.UseFluentValidation();
});

// Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddApplicationHealthChecks();
builder.Services.AddConfiguredOpenTelemetry(
	builder.Configuration,
	builder.Environment.EnvironmentName);

// Add MVC controllers to the service container
builder.Services.AddControllers();

// Add all application services using extension methods
// This includes: repositories, business logic services, validators, HTTP clients, and configuration
builder.Services.AddApplicationServices(builder.Configuration);

// Add bounded context domains
string connectionString =
	builder.Configuration.GetConnectionString("DefaultConnection")
	?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// Infrastructure must be registered first (provides AuditInterceptor for DbContexts)
builder.Services.AddInfrastructureDomain();
builder.Services.AddIdentityDomain(connectionString);
builder.Services.AddLoggingDomain(
	connectionString,
	builder.Configuration);
builder.Services.AddApiTrackingDomain(
	connectionString,
	builder.Configuration);
builder.Services.AddElectronicNotificationsDomain(builder.Configuration);

// Register all background jobs (single registration point)
builder.Services.AddBackgroundJobs(builder.Configuration);

// Add response compression (Brotli + Gzip)
builder.Services.AddOptimizedResponseCompression();

// Add output caching with auto-discovery from configuration
builder.Services.AddConfiguredOutputCache(builder.Configuration);

// Add rate limiting (replaces custom middleware)
builder.Services.AddConfiguredRateLimiting(builder.Configuration);

// Add CORS from configuration
builder.Services.AddConfiguredCors(builder.Configuration);

// Add Data Protection for key management
builder.Services.AddConfiguredDataProtection(builder.Environment);

// Add JWT authentication
builder.Services.AddAuthenticationServices(builder.Configuration);

// OpenAPI/Swagger configuration for API documentation
builder.Services.AddOpenApi();

WebApplication app = builder.Build();

// Database migrations
await app.ApplyMigrationsAsync(builder.Configuration);

// Add database sink now that we have the service provider
// This allows us to resolve scoped services (DbContext) for logging
SerilogExtensions.ReconfigureWithDatabaseSink(
	builder.Configuration,
	app.Services,
	app.Environment.EnvironmentName);

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

// Middleware pipeline
app.UseConfiguredForwardedHeaders(builder.Configuration);

// Security headers middleware - Attribute-aware implementation
// Reads [SecurityHeaders] attributes from controllers/actions for customization
app.UseMiddleware<AttributeBasedSecurityHeadersMiddleware>();

// Global exception handling - Catches all unhandled exceptions
// Returns consistent ProblemDetails responses (RFC 7807)
app.UseMiddleware<GlobalExceptionMiddleware>();

// Rate limiting - Uses ASP.NET Core's built-in rate limiter
app.UseRateLimiter();

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

// Authentication and Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Endpoints
app.MapHealthCheckEndpoints();
app.MapPrometheusScrapingEndpoint();
app.MapControllers();

app.Run();