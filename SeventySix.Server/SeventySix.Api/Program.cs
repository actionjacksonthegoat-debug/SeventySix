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
using JasperFx.Resources;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using NetEscapades.AspNetCore.SecurityHeaders;
using Scalar.AspNetCore;
using Serilog;
using SeventySix.Api.Attributes;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Api.Registration;
using SeventySix.EcommerceCleanup.Registration;
using SeventySix.Identity.Registration;
using SeventySix.Registration;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Registration;
using Wolverine;
using Wolverine.FluentValidation;
using Wolverine.Postgresql;

WebApplicationBuilder builder =
			WebApplication.CreateBuilder(args);

// Bind centralized security settings with FluentValidation + ValidateOnStart
builder.Services.AddDomainSettings<SecuritySettings, SecuritySettingsValidator>(
	builder.Configuration,
	SecuritySettings.SectionName);

// Bind forwarded headers settings with FluentValidation + ValidateOnStart
builder.Services.AddDomainSettings<ForwardedHeadersSettings, ForwardedHeadersSettingsValidator>(
	builder.Configuration,
	ForwardedHeadersSettings.SectionName);

// Bind request limits settings with FluentValidation + ValidateOnStart
builder.Services.AddDomainSettings<RequestLimitsSettings, RequestLimitsSettingsValidator>(
	builder.Configuration,
	RequestLimitsSettings.SectionName);

// Bind request limits settings for DoS protection (early read required before builder.Build())
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

// Build connection string early — needed for Wolverine PostgreSQL persistence
// and domain registrations below. Uses Database:* configuration values.
string connectionString =
			ConnectionStringBuilder.BuildPostgresConnectionString(
				builder.Configuration);

// Read background jobs flag — gates Wolverine persistence.
// In Test environment, BackgroundJobs:Enabled = false, so Wolverine
// stays in-memory (tests use Testcontainers on random ports).
bool isBackgroundJobsEnabled =
			builder.Configuration.GetValue<bool>("BackgroundJobs:Enabled");

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

		if (isBackgroundJobsEnabled)
		{
			// Enable durable message persistence with PostgreSQL.
			// Scheduled messages (recurring jobs) survive container restarts.
			// Tables are auto-created in the 'wolverine' schema.
			options.PersistMessagesWithPostgresql(connectionString, "wolverine");

			// Make all local queues durable — messages are persisted to PostgreSQL
			// until successfully processed. Without this, ScheduleAsync() uses
			// in-memory buffering and messages are lost when the DI scope disposes.
			options.Policies.UseDurableLocalQueues();

			// Poll for scheduled messages every 5 seconds
			options.Durability.ScheduledJobPollingTime =
				TimeSpan.FromSeconds(5);

			// Reassign agents from stale/dead nodes every 30 seconds
			// (default is 5 minutes — too slow for container restarts)
			options.Durability.NodeReassignmentPollingTime =
				TimeSpan.FromSeconds(30);
		}
	},
	ExtensionDiscovery.ManualOnly);

// Auto-create/rebuild Wolverine envelope tables on startup
if (isBackgroundJobsEnabled)
{
	builder.Host.UseResourceSetupOnStartup();
}

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
builder.Services.AddEcommerceCleanupDomain(
	builder.Configuration);

// Register cache invalidation service (cross-domain)
builder.Services.AddCacheServices();

// Register all background jobs (single registration point)
builder.Services.AddBackgroundJobs(builder.Configuration);

// Register proactive job health monitoring (logs warnings/errors for stale jobs)
if (isBackgroundJobsEnabled)
{
	builder.Services
		.AddHostedService<SeventySix.Api.Infrastructure.ScheduledJobHealthCheckService>();

	builder.Services
		.AddHostedService<SeventySix.Api.Infrastructure.JobChainWatchdogService>();
}

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

// Security header policies — NetEscapades replaces AttributeBasedSecurityHeadersMiddleware.
// The selector is called per-request (at OnStarting time) so it can honour the CSP override
// that AuthControllerBase places in HttpContext.Items for OAuth callback pages.
HeaderPolicyCollection standardPolicy =
			SecurityHeaderPolicies.Build(builder.Environment);
builder.Services.AddSecurityHeaderPolicies()
	.SetPolicySelector(
		ctx =>
		{
			ctx.HttpContext.Items.TryGetValue(
				SecurityHeaderConstants.ItemKeys.CspOverride,
				out object? cspOverrideRaw);
			if (cspOverrideRaw is string overrideCsp)
			{
				return SecurityHeaderPolicies.BuildWithCspOverride(
					builder.Environment,
					overrideCsp);
			}

			return standardPolicy;
		});

// Configure HTTPS redirection port from SecuritySettings so the built-in
// UseHttpsRedirection() middleware knows which port to redirect to.
builder.Services.AddHttpsRedirection(
	options =>
	{
		options.HttpsPort =
			builder.Configuration.GetValue<int>($"{SecuritySettings.SectionName}:HttpsPort");
	});

WebApplication app = builder.Build();

// Validate configuration, allowed hosts, production security settings,
// and external dependencies in a single coordinated startup gate.
await app.UseStartupValidationAsync();

// Database migrations
await app.ApplyMigrationsAsync(builder.Configuration);

// Add database sink now that we have the service provider
// This allows us to resolve scoped services (DbContext) for logging
SerilogExtensions.ReconfigureWithDatabaseSink(
	builder.Configuration,
	app.Services,
	app.Environment.EnvironmentName);

// Serilog HTTP request logging — status-aware levels (5xx→Error, 4xx→Warning)
// Enriches logs with RequestHost, RequestScheme, UserAgent
app.UseRequestLogging();

// Middleware pipeline
app.UseConfiguredForwardedHeaders(builder.Configuration);

// Endpoint routing — placed early so all downstream middleware can inspect endpoint metadata
// (rate limiter endpoint policies, security header policy selector, AllowHttp exemptions).
app.UseRouting();

// Selective HTTPS redirection — respects the EnforceHttps configuration flag and
// exempts endpoints tagged with [AllowHttp] (health checks, metrics).
bool enforceHttps =
			app.Configuration.GetValue<bool>($"{SecuritySettings.SectionName}:EnforceHttps");
if (enforceHttps)
{
	app.UseWhen(
		ctx => ctx.GetEndpoint()?.Metadata.GetMetadata<AllowHttpAttribute>() is null,
		pipeline => pipeline.UseHttpsRedirection());
}

// CORS - Must be early so preflight (OPTIONS) requests are handled
app.UseCors("AllowedOrigins");

// Global exception handling - Uses ASP.NET Core 8+ IExceptionHandler pattern
// Returns consistent ProblemDetails responses (RFC 7807)
// Must be early to catch exceptions from all subsequent middleware
app.UseExceptionHandler();

// Security headers middleware — NetEscapades.AspNetCore.SecurityHeaders
// Policy is selected per-request; see SecurityHeaderPolicies.cs for the full policy definition.
app.UseSecurityHeaders();

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

// Authentication and Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Endpoints
app.MapHealthCheckEndpoints();

// /metrics is served by the OTel Collector in production via reverse-proxy routing.
// Mapped here so the AllowHttp metadata exempts it from HTTPS redirection.
app.MapGet(
	EndpointPathConstants.Metrics,
	() => Results.NotFound())
	.WithMetadata(new AllowHttpAttribute());

app.MapControllers();

app.Run();