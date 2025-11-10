// <copyright file="GlobalExceptionMiddleware.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SeventySix.Core.Exceptions;

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
/// - ArgumentException/ArgumentNullException -> 400 Bad Request
/// - KeyNotFoundException -> 404 Not Found
/// - UnauthorizedAccessException -> 401 Unauthorized
/// - All other exceptions -> 500 Internal Server Error
///
/// Security: Stack traces are only included in development environments.
/// </remarks>
public class GlobalExceptionMiddleware
{
	private readonly RequestDelegate Next;
	private readonly ILogger<GlobalExceptionMiddleware> Logger;
	private readonly IHostEnvironment Environment;

	/// <summary>
	/// Initializes a new instance of the <see cref="GlobalExceptionMiddleware"/> class.
	/// </summary>
	/// <param name="next">Next middleware in pipeline.</param>
	/// <param name="logger">Logger instance.</param>
	/// <param name="environment">Host environment.</param>
	public GlobalExceptionMiddleware(
		RequestDelegate next,
		ILogger<GlobalExceptionMiddleware> logger,
		IHostEnvironment environment)
	{
		Next = next ?? throw new ArgumentNullException(nameof(next));
		Logger = logger ?? throw new ArgumentNullException(nameof(logger));
		Environment = environment ?? throw new ArgumentNullException(nameof(environment));
	}

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
			await Next(context);
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
			await HandleExceptionAsync(context, ex);
		}
	}

	/// <summary>
	/// Handles exceptions and converts them to appropriate ProblemDetails responses.
	/// </summary>
	/// <param name="context">The HTTP context.</param>
	/// <param name="exception">The exception that occurred.</param>
	/// <returns>A task that represents the asynchronous operation.</returns>
	private async Task HandleExceptionAsync(HttpContext context, Exception exception)
	{
		context.Response.ContentType = "application/problem+json";

		var problemDetails = exception switch
		{
			ValidationException validationEx => CreateValidationProblemDetails(context, validationEx),
			EntityNotFoundException notFoundEx => CreateProblemDetails(
				context,
				HttpStatusCode.NotFound,
				"Resource Not Found",
				notFoundEx.Message),
			BusinessRuleViolationException businessEx => CreateProblemDetails(
				context,
				HttpStatusCode.UnprocessableEntity,
				"Business Rule Violation",
				businessEx.Message),
			DomainException domainEx => CreateProblemDetails(
				context,
				HttpStatusCode.BadRequest,
				"Domain Error",
				domainEx.Message),
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
			_ => CreateProblemDetails(
				context,
				HttpStatusCode.InternalServerError,
				"Internal Server Error",
				Environment.IsDevelopment() ? exception.Message : "An error occurred processing your request.")
		};

		context.Response.StatusCode = problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;

		var options = new JsonSerializerOptions
		{
			PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
			WriteIndented = true,
		};

		await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
	}

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
			Status = (int)statusCode,
			Title = title,
			Detail = detail,
			Instance = context.Request.Path,
			Type = $"https://httpstatuses.com/{(int)statusCode}",
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
		var errors = validationException.Errors
			.GroupBy(e => e.PropertyName)
			.ToDictionary(
				g => g.Key,
				g => g.Select(e => e.ErrorMessage).ToArray());

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