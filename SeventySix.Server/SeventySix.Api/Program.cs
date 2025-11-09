// <copyright file="Program.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.AspNetCore.ResponseCompression;
using Scalar.AspNetCore;
using Serilog;
using SeventySix.Api.Middleware;
using SeventySix.Application.Interfaces;
using SeventySix.Application.Services;
using SeventySix.Application.Validators;
using SeventySix.Domain.Interfaces;
using SeventySix.Infrastructure.Repositories;
using System.IO.Compression;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
	.ReadFrom.Configuration(builder.Configuration)
	.Enrich.FromLogContext()
	.WriteTo.Console()
	.WriteTo.File("logs/seventysix-.txt", rollingInterval: RollingInterval.Day)
	.CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();

// Response compression for performance
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

// Response caching
builder.Services.AddResponseCaching();

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateWeatherForecastValidator>();

// Repository pattern - Scoped for per-request instances
builder.Services.AddScoped<IWeatherForecastRepository, WeatherForecastRepository>();

// Application services
builder.Services.AddScoped<IWeatherForecastService, WeatherForecastService>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// CORS configuration from appsettings
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

// Security headers middleware
app.Use(async (context, next) =>
{
	context.Response.Headers["X-Content-Type-Options"] = "nosniff";
	context.Response.Headers["X-Frame-Options"] = "DENY";
	context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
	context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
	context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";

	if (!app.Environment.IsDevelopment())
	{
		context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
	}

	await next();
});

// Global exception handling
app.UseMiddleware<GlobalExceptionMiddleware>();

// Rate limiting
app.UseMiddleware<RateLimitingMiddleware>();

// Enable response compression
app.UseResponseCompression();

// Enable response caching
app.UseResponseCaching();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	_ = app.MapOpenApi();

	// Scalar API reference UI
	_ = app.MapScalarApiReference();
}

app.UseCors("AllowedOrigins");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

// Make Program class accessible to integration tests
public partial class Program
{
}
