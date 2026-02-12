/// <summary>
/// Application entry point and service configuration.
/// Configures the ASP.NET Core web application with all required services,
/// middleware, and endpoints following Clean Architecture principles.
/// </summary>
/// <remarks>
/// This file configures:
/// - Logging with Serilog (console and file outputs)
/// - Response compression (Brotli and Gzip)
/// - Response caching
/// - FluentValidation
/// - Repository pattern implementations
/// - Application services
/// - CORS policies
/// - Security headers middleware
/// - Global exception handling
/// - Rate limiting
/// - OpenAPI/Scalar documentation (development only)
///
/// Architecture: Implements Dependency Inversion Principle (DIP) by registering
/// interfaces with their concrete implementations.
/// </remarks>

using FluentValidation;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Scalar.AspNetCore;
using Serilog;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Api.Middleware;
using SeventySix.Api.Registration;
using SeventySix.Identity.Registration;
using SeventySix.Registration;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Registration;
using Wolverine;
using Wolverine.FluentValidation;

WebApplicationBuilder builder =
			WebApplication.CreateBuilder(args);

// Bind centralized security settings with FluentValidation + ValidateOnStart
builder.Services.AddSingleton<IValidator<SecuritySettings>, SecuritySettingsValidator>();

builder.Services
	.AddOptions<SecuritySettings>()
	.Bind(builder.Configuration.GetSection(SecuritySettings.SectionName))
	.ValidateWithFluentValidation()
	.ValidateOnStart();

// Bind forwarded headers settings with FluentValidation + ValidateOnStart
builder.Services.AddSingleton<IValidator<ForwardedHeadersSettings>, ForwardedHeadersSettingsValidator>();

builder.Services
	.AddOptions<ForwardedHeadersSettings>()
	.Bind(builder.Configuration.GetSection(ForwardedHeadersSettings.SectionName))
	.ValidateWithFluentValidation()
	.ValidateOnStart();

// Bind request limits settings for DoS protection
RequestLimitsSettings requestLimitsSettings =
			builder.Configuration
				.GetSection(RequestLimitsSettings.SectionName)
				.Get<RequestLimitsSettings>() ?? new RequestLimitsSettings();

// Configure Kestrel with request body size limits to prevent DoS attacks
builder.WebHost.ConfigureKestrel(
	serverOptions =>
	{
		serverOptions.Limits.MaxRequestBodySize =
			requestLimitsSettings.MaxRequestBodySizeBytes;

		// Enable HTTP/2 for HTTPS endpoints (HTTP/2 requires TLS/ALPN)
		// HTTP endpoints fall back to HTTP/1.1 only to avoid warnings
		serverOptions.ConfigureEndpointDefaults(
			listenOptions =>
			{
				listenOptions.Protocols =
					HttpProtocols.Http1AndHttp2;
			});

		if (builder.Environment.IsDevelopment())
		{
			// Accept any client certificate without validation in development
			serverOptions.ConfigureHttpsDefaults(
				httpsOptions =>
				{
					httpsOptions.AllowAnyClientCertificate();
				});
		}
	});

// Configure form options for multipart uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(
	options =>
	{
		options.MultipartBodyLengthLimit =
			requestLimitsSettings.MaxMultipartBodyLengthBytes;
		options.ValueLengthLimit =
			requestLimitsSettings.MaxFormOptionsBufferLength;
	});

// Configure Serilog for structured logging
// Outputs: Console + Rolling file (daily rotation) + Database (Warning+ levels)
// Note: Database sink is added after building the app to access IServiceProvider
// In Test environment, configures silent logging (no sinks) for performance
Log.Logger =
	new LoggerConfiguration()
		.ConfigureBaseSerilog(
			builder.Configuration,
			builder.Environment.EnvironmentName)
		.CreateLogger();

builder.Host.UseSerilog();

// Configure Wolverine for CQRS handlers
// ExtensionDiscovery.ManualOnly disables automatic assembly scanning messages
builder.Host.UseWolverine(
	options =>
	{
		// Auto-discover handlers from SeventySix assembly
		options.Discovery.IncludeAssembly(typeof(SeventySix.Logging.Log).Assembly);

		// Auto-discover handlers from SeventySix.Identity assembly
		options.Discovery.IncludeAssembly(typeof(SeventySix.Identity.Registration.IdentityRegistration).Assembly);

		// Use FluentValidation for command validation
		options.UseFluentValidation();
	},
	ExtensionDiscovery.ManualOnly);

// Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddApplicationHealthChecks(builder.Configuration);
builder.Services.AddConfiguredOpenTelemetry(
	builder.Configuration,
	builder.Environment.EnvironmentName);

// Add FusionCache with Valkey backend and MemoryPack serialization
// In Test environment, uses memory-only cache to avoid Valkey connection timeouts
builder.Services.AddFusionCacheWithValkey(
	builder.Configuration,
	builder.Environment.EnvironmentName);

// Add MVC controllers to the service container
builder.Services.AddControllers(
	options =>
	{
		options.Filters.Add<SeventySix.Api.Filters.RequiresPasswordChangeFilter>();
	});

// Add all application services using extension methods
// This includes: repositories, business logic services, validators, HTTP clients, and configuration
builder.Services.AddApplicationServices(builder.Configuration);

// Build connection string from Database:* configuration values
// These are provided via User Secrets (Development), appsettings (Test/E2E),
// or environment variables (Production).
string connectionString =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				builder.Configuration);

// Infrastructure must be registered first (provides AuditInterceptor for DbContexts)
builder.Services.AddInfrastructure();
builder.Services.AddIdentityDomain(
	connectionString,
	builder.Configuration);
builder.Services.AddLoggingDomain(
	connectionString,
	builder.Configuration);
builder.Services.AddApiTrackingDomain(
	connectionString,
	builder.Configuration);
builder.Services.AddElectronicNotificationsDomain(
	connectionString,
	builder.Configuration);

// Register cache invalidation service (cross-domain)
builder.Services.AddCacheServices();

// Register all background jobs (single registration point)
builder.Services.AddBackgroundJobs(builder.Configuration);

// E2E test seeder (only runs when E2ESeeder:Enabled is true)
builder.Services.AddE2ESeeder(builder.Configuration);

// Add response compression (Brotli + Gzip)
builder.Services.AddOptimizedResponseCompression(builder.Configuration);

// Add output caching with auto-discovery from configuration
// In Test environment, uses in-memory cache (no Valkey dependency)
builder.Services.AddConfiguredOutputCache(
	builder.Configuration,
	builder.Environment.EnvironmentName);

// Add rate limiting (replaces custom middleware)
builder.Services.AddConfiguredRateLimiting(builder.Configuration);

// Add exception handler and ProblemDetails support
builder.Services.AddExceptionHandler<SeventySix.Api.Infrastructure.GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Add CORS from configuration
builder.Services.AddConfiguredCors(builder.Configuration);

// Add Data Protection for key management
builder.Services.AddConfiguredDataProtection(
	builder.Configuration,
	builder.Environment);

// Add JWT authentication
builder.Services.AddAuthenticationServices(builder.Configuration);

// OpenAPI/Swagger configuration for API documentation
builder.Services.AddOpenApi();

WebApplication app = builder.Build();

// Validate required configuration settings (fails fast in production if secrets missing)
StartupValidator.ValidateConfiguration(
	builder.Configuration,
	app.Environment,
	app.Services.GetRequiredService<ILogger<Program>>());

// Validate dependencies (in debug scenarios this provides actionable errors for VS)
await app.ValidateDependenciesAsync(builder.Configuration);

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
app.UseSerilogRequestLogging(
	options =>
	{
		options.MessageTemplate =
			"HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
		options.EnrichDiagnosticContext =
			(diagnosticContext, httpContext) =>
		{
			diagnosticContext.Set(
				"RequestHost",
				httpContext.Request.Host.Value ?? "unknown");
			diagnosticContext.Set(
				"RequestScheme",
				httpContext.Request.Scheme);
			diagnosticContext.Set(
				"RemoteIpAddress",
				httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
			diagnosticContext.Set(
				"UserAgent",
				httpContext.Request.Headers.UserAgent.ToString());
		};
	});

// Middleware pipeline
app.UseConfiguredForwardedHeaders(builder.Configuration);

// CORS - Must be early so preflight (OPTIONS) requests are handled
app.UseCors("AllowedOrigins");

// Global exception handling - Uses ASP.NET Core 8+ IExceptionHandler pattern
// Returns consistent ProblemDetails responses (RFC 7807)
// Must be early to catch exceptions from all subsequent middleware
app.UseExceptionHandler();

// Security headers middleware - Attribute-aware implementation
// Reads [SecurityHeaders] attributes from controllers/actions for customization
app.UseMiddleware<AttributeBasedSecurityHeadersMiddleware>();

// Rate limiting - Uses ASP.NET Core's built-in rate limiter
app.UseRateLimiter();

// Enable response compression
bool isResponseCompressionEnabled =
			builder.Configuration.GetValue<bool>("ResponseCompression:Enabled");

if (isResponseCompressionEnabled)
{
	app.UseResponseCompression();
}

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

// Smart HTTPS redirection - Centralized enforcement with configurable exemptions
// Controlled by Security section in appsettings.json (single source of truth)
app.UseMiddleware<SmartHttpsRedirectionMiddleware>();

// Authentication and Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Endpoints
app.MapHealthCheckEndpoints();

app.MapControllers();

app.Run();
