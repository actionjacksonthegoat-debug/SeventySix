// <copyright file="GlobalExceptionMiddleware.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Api.Middleware;

/// <summary>
/// Global exception handling middleware.
/// Catches all unhandled exceptions and returns consistent ProblemDetails responses.
/// </summary>
/// <remarks>
/// This middleware implements the Chain of Responsibility pattern and provides centralized
/// exception handling following RFC 7807 (Problem Details for HTTP APIs).
/// It translates domain exceptions into appropriate HTTP status codes and formats error responses
/// consistently across the application.
///
/// Exception Mapping:
/// - ValidationException -> 400 Bad Request (with validation errors)
/// - EntityNotFoundException -> 404 Not Found
/// - BusinessRuleViolationException -> 422 Unprocessable Entity
/// - DomainException -> 400 Bad Request
/// - ExternalServiceException -> 503 Service Unavailable
/// - ArgumentException/ArgumentNullException -> 400 Bad Request
/// - KeyNotFoundException -> 404 Not Found
/// - UnauthorizedAccessException -> 401 Unauthorized
/// - All other exceptions -> 500 Internal Server Error
///
/// Security: Stack traces are only included in development environments.
/// </remarks>
/// <remarks>
/// Defense-in-depth: when this middleware writes an error response it will add
/// <c>Access-Control-Allow-Origin</c> (and <c>Access-Control-Allow-Credentials</c> when applicable)
/// when the request's <c>Origin</c> header matches one of the configured
/// <c>Cors:AllowedOrigins</c>. This behaviour is a fallback to ensure cross-origin
/// clients receive the necessary CORS headers on error responses and does not
/// replace proper CORS policy configuration via <c>services.AddCors</c> and
/// <c>app.UseCors</c>.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="GlobalExceptionMiddleware"/> class.
/// </remarks>
/// <param name="next">
/// Next middleware in pipeline.
/// </param>
/// <param name="logger">
/// Logger instance.
/// </param>
/// <param name="environment">
/// Host environment.
/// </param>
public class GlobalExceptionMiddleware
{
	/// <summary>
	/// The next middleware delegate in the pipeline.
	/// </summary>
	private readonly RequestDelegate Next;

	/// <summary>
	/// Logger used for warnings and error reporting within the middleware.
	/// </summary>
	private readonly ILogger<GlobalExceptionMiddleware> Logger;

	/// <summary>
	/// Host environment; used to determine whether to reveal stack traces in error responses.
	/// </summary>
	private readonly IHostEnvironment Environment;

	/// <summary>
	/// Set of allowed CORS origins (case-insensitive) read from configuration. Used to decide
	/// whether to add CORS headers to error responses.
	/// </summary>
	private readonly HashSet<string> AllowedOrigins;

	/// <summary>
	/// Serializer options used when writing ProblemDetails responses (camelCase, indented).
	/// </summary>
	private static readonly JsonSerializerOptions ProblemDetailsJsonOptions =
		new()
		{
			PropertyNamingPolicy =
				JsonNamingPolicy.CamelCase,
			WriteIndented = true,
		};

	/// <summary>
	/// Constructs the middleware and captures required services.
	/// Reads allowed origins from configuration key <c>Cors:AllowedOrigins</c> and stores them
	/// in a case-insensitive set for header preservation on error responses.
	/// If no configuration is present a conservative default of <c>http://localhost:4200</c> is used.
	/// </summary>
	/// <param name="next">
	/// The next middleware delegate in the pipeline.
	/// </param>
	/// <param name="logger">
	/// The logger instance.
	/// </param>
	/// <param name="environment">
	/// Host environment (used to determine whether to include stack traces).
	/// </param>
	/// <param name="configuration">
	/// Application configuration to read CORS allowed origins.
	/// </param>
	public GlobalExceptionMiddleware(
		RequestDelegate next,
		ILogger<GlobalExceptionMiddleware> logger,
		IHostEnvironment environment,
		IConfiguration configuration)
	{
		Next =
			next ?? throw new ArgumentNullException(nameof(next));
		Logger =
			logger ?? throw new ArgumentNullException(nameof(logger));
		Environment =
			environment ?? throw new ArgumentNullException(nameof(environment));

		string[] allowedOrigins =
			configuration?.GetSection("Cors:AllowedOrigins").Get<string[]>()
				?? ["http://localhost:4200"];

		AllowedOrigins =
			new HashSet<string>(
				allowedOrigins,
				StringComparer.OrdinalIgnoreCase);
	}

	/// <summary>
	/// Invokes the middleware to process the HTTP request.
	/// </summary>
	/// <param name="context">
	/// The HTTP context for the current request.
	/// </param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// </returns>
	/// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
	public async Task InvokeAsync(HttpContext context)
	{
		try
		{
			await Next(context);
		}
		catch (Exception ex)
		{
			if (ex is FluentValidation.ValidationException)
			{
				Logger.LogWarning("Validation failed: {Message}", ex.Message);
			}
			else
			{
				Logger.LogError(
					ex,
					"Unhandled exception occurred: {Message}",
					ex.Message);
			}

			await HandleExceptionAsync(context, ex);
		}
	}

	/// <summary>
	/// Handles exceptions and converts them to appropriate ProblemDetails responses.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <param name="exception">
	/// The exception that occurred.
	/// </param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// </returns>
	/// <summary>
	/// Handles exceptions and writes a <see cref="ProblemDetails"/> response.
	/// This method will also attempt to add CORS response headers for allowed origins
	/// before serializing the error response to ensure cross-origin clients receive
	/// the necessary headers even on failures.
	/// </summary>
	/// <param name="context">
	/// The current HTTP context.
	/// </param>
	/// <param name="exception">
	/// The exception that was caught.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task HandleExceptionAsync(
		HttpContext context,
		Exception exception)
	{
		// Ensure CORS headers are present on error responses for allowed origins
		CorsHeaderHelper.AddCorsHeadersIfAllowed(context, AllowedOrigins);

		context.Response.ContentType = "application/problem+json";

		ProblemDetails problemDetails =
			MapExceptionToProblemDetails(
				context,
				exception);

		context.Response.StatusCode =
			problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;

		await context.Response.WriteAsync(
			JsonSerializer.Serialize(
				problemDetails,
				ProblemDetailsJsonOptions));
	}

	/// <summary>
	/// Adds CORS response headers when the Origin header is present and allowed.
	/// </summary>
	/// <param name="context">The http context for the current request.</param>
	[System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage]
	private void AddCorsHeadersIfNeeded(HttpContext context)
	{
		// Keep for backward compatibility with existing tests that may call this method
		CorsHeaderHelper.AddCorsHeadersIfAllowed(context, AllowedOrigins);
	}

	/// <summary>
	/// Maps an exception to a <see cref="ProblemDetails"/> instance.
	/// </summary>
	/// <param name="context">
	/// The HTTP context for the request.
	/// </param>
	/// <param name="exception">
	/// The exception to map.
	/// </param>
	/// <returns>
	/// A <see cref="ProblemDetails"/> with appropriate Status, Title, Detail, and Type.
	/// </returns>
	private ProblemDetails MapExceptionToProblemDetails(
		HttpContext context,
		Exception exception) =>
		exception switch
		{
			ValidationException validationEx => CreateValidationProblemDetails(
				context,
				validationEx),
			EntityNotFoundException ex => CreateProblemDetails(
				context,
				HttpStatusCode.NotFound,
				"Resource Not Found",
				ex.Message),
			BusinessRuleViolationException ex => CreateProblemDetails(
				context,
				HttpStatusCode.UnprocessableEntity,
				"Business Rule Violation",
				ex.Message),
			ExternalServiceException ex => CreateProblemDetails(
				context,
				HttpStatusCode.ServiceUnavailable,
				"External Service Error",
				ex.Message),
			DomainException ex => CreateProblemDetails(
				context,
				HttpStatusCode.BadRequest,
				"Domain Error",
				ex.Message),
			ArgumentNullException => CreateProblemDetails(
				context,
				HttpStatusCode.BadRequest,
				"Bad Request",
				exception.Message),
			ArgumentException => CreateProblemDetails(
				context,
				HttpStatusCode.BadRequest,
				"Bad Request",
				exception.Message),
			KeyNotFoundException => CreateProblemDetails(
				context,
				HttpStatusCode.NotFound,
				"Not Found",
				exception.Message),
			UnauthorizedAccessException => CreateProblemDetails(
				context,
				HttpStatusCode.Unauthorized,
				"Unauthorized",
				exception.Message),
			_ => CreateDefaultProblemDetails(context, exception),
		};

	/// <summary>
	/// Creates a generic Internal Server Error <see cref="ProblemDetails"/> response.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <param name="exception">
	/// The original exception; message is included in Development environment.
	/// </param>
	/// <returns>
	/// A <see cref="ProblemDetails"/> for an internal server error.
	/// </returns>
	private ProblemDetails CreateDefaultProblemDetails(
		HttpContext context,
		Exception exception) =>
		CreateProblemDetails(
			context,
			HttpStatusCode.InternalServerError,
			"Internal Server Error",
			Environment.IsDevelopment()
				? exception.Message
				: "An error occurred processing your request.");

	/// <summary>
	/// Creates a ProblemDetails object for a given exception.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <param name="statusCode">
	/// The HTTP status code.
	/// </param>
	/// <param name="title">
	/// A short, human-readable summary of the problem type.
	/// </param>
	/// <param name="detail">
	/// A human-readable explanation specific to this occurrence of the problem.
	/// </param>
	/// <returns>
	/// A ProblemDetails object following RFC 7807.
	/// </returns>
	private static ProblemDetails CreateProblemDetails(
		HttpContext context,
		HttpStatusCode statusCode,
		string title,
		string detail)
	{
		return new ProblemDetails
		{
			Status =
				(int)statusCode,
			Title = title,
			Detail = detail,
			Instance = context.Request.Path,
			Type =
				$"https://httpstatuses.com/{(int)statusCode}",
		};
	}

	/// <summary>
	/// Creates a ValidationProblemDetails object for FluentValidation exceptions.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <param name="validationException">
	/// The FluentValidation exception.
	/// </param>
	/// <returns>
	/// A ValidationProblemDetails object with grouped validation errors.
	/// </returns>
	private static ValidationProblemDetails CreateValidationProblemDetails(
		HttpContext context,
		ValidationException validationException)
	{
		Dictionary<string, string[]> errors =
			validationException
				.Errors
				.GroupBy(error => error.PropertyName)
				.ToDictionary(
					group => group.Key,
					group => group.Select(error => error.ErrorMessage).ToArray());

		return new ValidationProblemDetails(errors)
		{
			Status =
				(int)HttpStatusCode.BadRequest,
			Title = "Validation Error",
			Detail = "One or more validation errors occurred.",
			Instance = context.Request.Path,
			Type = "https://httpstatuses.com/400",
		};
	}
}