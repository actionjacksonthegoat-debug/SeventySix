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
using Scalar.AspNetCore;
using Serilog;
using SeventySix.Api.Middleware;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.BusinessLogic.Services;
using SeventySix.BusinessLogic.Validators;
using SeventySix.Core.Interfaces;
using SeventySix.DataAccess.Repositories;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configure Serilog for structured logging
// Outputs: Console + Rolling file (daily rotation)
Log.Logger = new LoggerConfiguration()
	.ReadFrom.Configuration(builder.Configuration)
	.Enrich.FromLogContext()
	.WriteTo.Console()
	.WriteTo.File("logs/seventysix-.txt", rollingInterval: RollingInterval.Day)
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

// FluentValidation - Register all validators from the assembly
builder.Services.AddValidatorsFromAssemblyContaining<CreateWeatherForecastValidator>();

// Repository pattern - Scoped lifetime for per-request database context
// Implements Dependency Inversion Principle (DIP)
builder.Services.AddScoped<IWeatherForecastRepository, WeatherForecastRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Application services - Business logic layer
// Scoped lifetime ensures proper DbContext management
builder.Services.AddScoped<IWeatherForecastService, WeatherForecastService>();
builder.Services.AddScoped<IUserService, UserService>();

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