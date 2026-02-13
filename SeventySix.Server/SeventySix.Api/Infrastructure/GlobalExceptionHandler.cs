// <copyright file="GlobalExceptionHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SeventySix.Api.Middleware;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Global exception handler using ASP.NET Core 8+ IExceptionHandler.
/// Catches all unhandled exceptions and returns consistent ProblemDetails responses.
/// </summary>
/// <remarks>
/// <para>
/// This handler implements the IExceptionHandler pattern and provides centralized
/// exception handling following RFC 7807 (Problem Details for HTTP APIs).
/// It translates domain exceptions into appropriate HTTP status codes and formats error responses
/// consistently across the application.
/// </para>
/// <para>
/// Exception Mapping:
/// </para>
/// <list type="bullet">
///   <item><description>ValidationException -> 400 Bad Request (with validation errors)</description></item>
///   <item><description>EntityNotFoundException -> 404 Not Found</description></item>
///   <item><description>BusinessRuleViolationException -> 422 Unprocessable Entity</description></item>
///   <item><description>DomainException -> 400 Bad Request</description></item>
///   <item><description>ArgumentException/ArgumentNullException -> 400 Bad Request</description></item>
///   <item><description>KeyNotFoundException -> 404 Not Found</description></item>
///   <item><description>UnauthorizedAccessException -> 401 Unauthorized</description></item>
///   <item><description>All other exceptions -> 500 Internal Server Error</description></item>
/// </list>
/// <para>
/// Security: Stack traces are only included in development environments.
/// </para>
/// <para>
/// Defense-in-depth: when this handler writes an error response it will add
/// <c>Access-Control-Allow-Origin</c> (and <c>Access-Control-Allow-Credentials</c> when applicable)
/// when the request's <c>Origin</c> header matches one of the configured
/// <c>Cors:AllowedOrigins</c>.
/// </para>
/// </remarks>
/// <param name="logger">
/// Logger instance for recording exceptions.
/// </param>
/// <param name="environment">
/// Host environment for determining whether to include stack traces.
/// </param>
/// <param name="configuration">
/// Application configuration to read CORS allowed origins.
/// </param>
public class GlobalExceptionHandler(
	ILogger<GlobalExceptionHandler> logger,
	IHostEnvironment environment,
	IConfiguration configuration) : IExceptionHandler
{
	/// <summary>
	/// Set of allowed CORS origins (case-insensitive) read from configuration.
	/// </summary>
	private readonly HashSet<string> AllowedOrigins =
		new(
			configuration
				.GetSection(ConfigurationSectionConstants.Cors.AllowedOrigins)
				.Get<string[]>() ?? ["http://localhost:4200"],
			StringComparer.OrdinalIgnoreCase);

	/// <summary>
	/// Attempts to handle an exception and return an appropriate error response.
	/// </summary>
	/// <param name="httpContext">
	/// The HTTP context for the current request.
	/// </param>
	/// <param name="exception">
	/// The exception that was thrown.
	/// </param>
	/// <param name="cancellationToken">
	/// A cancellation token to observe while handling the exception.
	/// </param>
	/// <returns>
	/// True if the exception was handled; otherwise, false.
	/// </returns>
	public async ValueTask<bool> TryHandleAsync(
		HttpContext httpContext,
		Exception exception,
		CancellationToken cancellationToken)
	{
		LogException(exception);

		// Ensure CORS headers are present on error responses for allowed origins
		CorsHeaderHelper.AddCorsHeadersIfAllowed(httpContext, AllowedOrigins);

		ProblemDetails problemDetails =
			MapExceptionToProblemDetails(httpContext, exception);

		httpContext.Response.StatusCode =
			problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;

		await httpContext.Response.WriteAsJsonAsync(
			problemDetails,
			cancellationToken);

		return true;
	}

	/// <summary>
	/// Logs the exception at appropriate level based on exception type.
	/// </summary>
	/// <param name="exception">
	/// The exception to log.
	/// </param>
	private void LogException(Exception exception)
	{
		if (exception is ValidationException)
		{
			logger.LogWarning(
				"Validation failed: {Message}",
				exception.Message);
		}
		else
		{
			logger.LogError(
				exception,
				"Unhandled exception occurred: {Message}",
				exception.Message);
		}
	}

	/// <summary>
	/// Maps an exception to a ProblemDetails instance.
	/// </summary>
	/// <param name="context">
	/// The HTTP context for the request.
	/// </param>
	/// <param name="exception">
	/// The exception to map.
	/// </param>
	/// <returns>
	/// A ProblemDetails with appropriate Status, Title, Detail, and Type.
	/// </returns>
	private ProblemDetails MapExceptionToProblemDetails(
		HttpContext context,
		Exception exception) =>
		exception switch
		{
			ValidationException validationException =>
				CreateValidationProblemDetails(context, validationException),
			EntityNotFoundException entityException =>
				CreateProblemDetails(
					context,
					HttpStatusCode.NotFound,
					"Resource Not Found",
					entityException.Message),
			BusinessRuleViolationException businessException =>
				CreateProblemDetails(
					context,
					HttpStatusCode.UnprocessableEntity,
					"Business Rule Violation",
					businessException.Message),
			DomainException domainException =>
				CreateProblemDetails(
					context,
					HttpStatusCode.BadRequest,
					"Domain Error",
					domainException.Message),
			ArgumentNullException =>
				CreateProblemDetails(
					context,
					HttpStatusCode.BadRequest,
					"Bad Request",
					ProblemDetailConstants.Details.BadRequest),
			ArgumentException =>
				CreateProblemDetails(
					context,
					HttpStatusCode.BadRequest,
					"Bad Request",
					ProblemDetailConstants.Details.BadRequest),
			KeyNotFoundException =>
				CreateProblemDetails(
					context,
					HttpStatusCode.NotFound,
					"Not Found",
					ProblemDetailConstants.Details.ResourceNotFound),
			UnauthorizedAccessException =>
				CreateProblemDetails(
					context,
					HttpStatusCode.Unauthorized,
					"Unauthorized",
					ProblemDetailConstants.Details.Unauthorized),
			_ =>
				CreateDefaultProblemDetails(context, exception),
		};

	/// <summary>
	/// Creates a generic Internal Server Error ProblemDetails response.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <param name="exception">
	/// The original exception; message is included in Development environment.
	/// </param>
	/// <returns>
	/// A ProblemDetails for an internal server error.
	/// </returns>
	private ProblemDetails CreateDefaultProblemDetails(
		HttpContext context,
		Exception exception) =>
		CreateProblemDetails(
			context,
			HttpStatusCode.InternalServerError,
			"Internal Server Error",
			environment.IsDevelopment()
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
		string detail) =>
		new()
		{
			Status = (int)statusCode,
			Title = title,
			Detail = detail,
			Instance = context.Request.Path,
			Type = $"https://httpstatuses.com/{(int)statusCode}",
		};

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
					group => group
						.Select(error => error.ErrorMessage)
						.ToArray());

		return new ValidationProblemDetails(errors)
		{
			Status = (int)HttpStatusCode.BadRequest,
			Title = "Validation Error",
			Detail = "One or more validation errors occurred.",
			Instance = context.Request.Path,
			Type = "https://httpstatuses.com/400",
		};
	}
}