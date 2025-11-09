// <copyright file="GlobalExceptionMiddleware.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using SeventySix.Domain.Exceptions;

namespace SeventySix.Api.Middleware;

/// <summary>
/// Global exception handling middleware.
/// Catches all unhandled exceptions and returns consistent ProblemDetails responses.
/// </summary>
public class GlobalExceptionMiddleware
{
	private readonly RequestDelegate _next;
	private readonly ILogger<GlobalExceptionMiddleware> _logger;
	private readonly IHostEnvironment _environment;

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
		_next = next ?? throw new ArgumentNullException(nameof(next));
		_logger = logger ?? throw new ArgumentNullException(nameof(logger));
		_environment = environment ?? throw new ArgumentNullException(nameof(environment));
	}

	/// <summary>
	/// Invokes the middleware.
	/// </summary>
	/// <param name="context">HTTP context.</param>
	/// <returns>Task.</returns>
	public async Task InvokeAsync(HttpContext context)
	{
		try
		{
			await _next(context);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
			await HandleExceptionAsync(context, ex);
		}
	}

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
				_environment.IsDevelopment() ? exception.Message : "An error occurred processing your request.")
		};

		context.Response.StatusCode = problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;

		var options = new JsonSerializerOptions
		{
			PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
			WriteIndented = true,
		};

		await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
	}

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
