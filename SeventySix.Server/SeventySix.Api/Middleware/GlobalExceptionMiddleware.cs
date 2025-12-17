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
/// Initializes a new instance of the <see cref="GlobalExceptionMiddleware"/> class.
/// </remarks>
/// <param name="next">Next middleware in pipeline.</param>
/// <param name="logger">Logger instance.</param>
/// <param name="environment">Host environment.</param>
public class GlobalExceptionMiddleware(
	RequestDelegate next,
	ILogger<GlobalExceptionMiddleware> logger,
	IHostEnvironment environment)
{
	// At the top of the class, add a static readonly field for the options:
	private static readonly JsonSerializerOptions ProblemDetailsJsonOptions =
		new()
		{
			PropertyNamingPolicy =
				JsonNamingPolicy.CamelCase,
			WriteIndented = true,
		};

	/// <summary>
	/// Invokes the middleware to process the HTTP request.
	/// </summary>
	/// <param name="context">The HTTP context for the current request.</param>
	/// <returns>A task that represents the asynchronous operation.</returns>
	/// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
	public async Task InvokeAsync(HttpContext context)
	{
		try
		{
			await next(context);
		}
		catch (Exception ex)
		{
			if (ex is FluentValidation.ValidationException)
			{
				logger.LogWarning("Validation failed: {Message}", ex.Message);
			}
			else
			{
				logger.LogError(
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
	/// <param name="context">The HTTP context.</param>
	/// <param name="exception">The exception that occurred.</param>
	/// <returns>A task that represents the asynchronous operation.</returns>
	private async Task HandleExceptionAsync(
		HttpContext context,
		Exception exception)
	{
		context.Response.ContentType = "application/problem+json";

		ProblemDetails problemDetails =
			MapExceptionToProblemDetails(
				context,
				exception);
		context.Response.StatusCode =
			problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;

		await context.Response.WriteAsync(
			JsonSerializer.Serialize(problemDetails, ProblemDetailsJsonOptions));
	}

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
	/// <param name="context">The HTTP context.</param>
	/// <param name="statusCode">The HTTP status code.</param>
	/// <param name="title">A short, human-readable summary of the problem type.</param>
	/// <param name="detail">A human-readable explanation specific to this occurrence of the problem.</param>
	/// <returns>A ProblemDetails object following RFC 7807.</returns>
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
	/// <param name="context">The HTTP context.</param>
	/// <param name="validationException">The FluentValidation exception.</param>
	/// <returns>A ValidationProblemDetails object with grouped validation errors.</returns>
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