// <copyright file="GlobalExceptionHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Text.Json;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Api.Infrastructure;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Exceptions;
using Shouldly;

namespace SeventySix.Api.Tests.Infrastructure;

/// <summary>
/// Tests that <see cref="GlobalExceptionHandler"/> returns safe, curated
/// ProblemDetails responses and never leaks raw exception messages for
/// framework exception types.
/// </summary>
public sealed class GlobalExceptionHandlerTests
{
	/// <summary>
	/// Shared configuration stub with default CORS settings.
	/// </summary>
	private readonly IConfiguration Configuration =
		new ConfigurationBuilder()
			.AddInMemoryCollection(
				new Dictionary<string, string?>
				{
					["Cors:AllowedOrigins:0"] = "http://localhost:4200",
				})
			.Build();

	/// <summary>
	/// Creates a <see cref="GlobalExceptionHandler"/> wired to a production-like
	/// (non-development) host environment by default.
	/// </summary>
	/// <param name="isDevelopment">
	/// Whether the host environment should report as Development.
	/// </param>
	/// <returns>
	/// A configured handler instance.
	/// </returns>
	private GlobalExceptionHandler CreateHandler(bool isDevelopment = false)
	{
		ILogger<GlobalExceptionHandler> logger =
			Substitute.For<ILogger<GlobalExceptionHandler>>();

		IHostEnvironment environment =
			Substitute.For<IHostEnvironment>();

		environment.EnvironmentName.Returns(
			isDevelopment ? Environments.Development : Environments.Production);

		return new GlobalExceptionHandler(
			logger,
			environment,
			Configuration);
	}

	/// <summary>
	/// Invokes <see cref="GlobalExceptionHandler.TryHandleAsync"/> and
	/// deserializes the written ProblemDetails from the response body.
	/// </summary>
	/// <param name="handler">
	/// The handler under test.
	/// </param>
	/// <param name="exception">
	/// The exception to handle.
	/// </param>
	/// <returns>
	/// A tuple of (HttpStatusCode, ProblemDetails).
	/// </returns>
	private static async Task<(HttpStatusCode StatusCode, ProblemDetails Problem)> HandleExceptionAsync(
		GlobalExceptionHandler handler,
		Exception exception)
	{
		DefaultHttpContext httpContext =
			new();

		httpContext.Response.Body =
			new MemoryStream();

		bool handled =
			await handler.TryHandleAsync(
				httpContext,
				exception,
				CancellationToken.None);

		handled.ShouldBeTrue();

		httpContext.Response.Body.Seek(0, SeekOrigin.Begin);

		ProblemDetails? problemDetails =
			await JsonSerializer.DeserializeAsync<ProblemDetails>(
				httpContext.Response.Body,
				new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

		problemDetails.ShouldNotBeNull();

		return ((HttpStatusCode)httpContext.Response.StatusCode, problemDetails);
	}

	[Fact]
	public async Task ArgumentException_Returns400_WithGenericDetail_NotExceptionMessageAsync()
	{
		// Arrange
		GlobalExceptionHandler handler =
			CreateHandler();

		ArgumentException exception =
			new("Value cannot be null. (Parameter 'userId')");

		// Act
		(HttpStatusCode statusCode, ProblemDetails problem) =
			await HandleExceptionAsync(handler, exception);

		// Assert
		statusCode.ShouldBe(HttpStatusCode.BadRequest);
		string argumentDetail =
			problem.Detail.ShouldNotBeNull();
		argumentDetail.ShouldBe(ProblemDetailConstants.Details.BadRequest);
		argumentDetail.ShouldNotContain("userId");
	}

	[Fact]
	public async Task ArgumentNullException_Returns400_WithGenericDetailAsync()
	{
		// Arrange
		GlobalExceptionHandler handler =
			CreateHandler();

		ArgumentNullException exception =
			new("userId", "Value cannot be null.");

		// Act
		(HttpStatusCode statusCode, ProblemDetails problem) =
			await HandleExceptionAsync(handler, exception);

		// Assert
		statusCode.ShouldBe(HttpStatusCode.BadRequest);
		string nullArgDetail =
			problem.Detail.ShouldNotBeNull();
		nullArgDetail.ShouldBe(ProblemDetailConstants.Details.BadRequest);
		nullArgDetail.ShouldNotContain("userId");
	}

	[Fact]
	public async Task KeyNotFoundException_Returns404_WithGenericDetailAsync()
	{
		// Arrange
		GlobalExceptionHandler handler =
			CreateHandler();

		KeyNotFoundException exception =
			new("The given key 'admin-role-id-123' was not present.");

		// Act
		(HttpStatusCode statusCode, ProblemDetails problem) =
			await HandleExceptionAsync(handler, exception);

		// Assert
		statusCode.ShouldBe(HttpStatusCode.NotFound);
		string notFoundDetail =
			problem.Detail.ShouldNotBeNull();
		notFoundDetail.ShouldBe(ProblemDetailConstants.Details.ResourceNotFound);
		notFoundDetail.ShouldNotContain("admin-role-id-123");
	}

	[Fact]
	public async Task UnauthorizedAccessException_Returns401_WithGenericDetailAsync()
	{
		// Arrange
		GlobalExceptionHandler handler =
			CreateHandler();

		UnauthorizedAccessException exception =
			new("Access to the path '/secure/admin' is denied.");

		// Act
		(HttpStatusCode statusCode, ProblemDetails problem) =
			await HandleExceptionAsync(handler, exception);

		// Assert
		statusCode.ShouldBe(HttpStatusCode.Unauthorized);
		string unauthorizedDetail =
			problem.Detail.ShouldNotBeNull();
		unauthorizedDetail.ShouldBe(ProblemDetailConstants.Details.Unauthorized);
		unauthorizedDetail.ShouldNotContain("/secure/admin");
	}

	[Fact]
	public async Task UnhandledException_InProduction_Returns500_WithoutExceptionMessageAsync()
	{
		// Arrange
		GlobalExceptionHandler handler =
			CreateHandler(isDevelopment: false);

		InvalidOperationException exception =
			new("Connection string 'DefaultConnection' not found.");

		// Act
		(HttpStatusCode statusCode, ProblemDetails problem) =
			await HandleExceptionAsync(handler, exception);

		// Assert
		statusCode.ShouldBe(HttpStatusCode.InternalServerError);
		string serverErrorDetail =
			problem.Detail.ShouldNotBeNull();
		serverErrorDetail.ShouldNotContain("Connection string");
		serverErrorDetail.ShouldBe("An error occurred processing your request.");
	}

	[Fact]
	public async Task ValidationException_Returns400_WithFieldErrorsAsync()
	{
		// Arrange
		GlobalExceptionHandler handler =
			CreateHandler();

		List<ValidationFailure> failures =
			[
				new ValidationFailure(
					"Email",
					"Email is required."),
				new ValidationFailure(
					"Password",
					"Password must be at least 8 characters."),
			];

		ValidationException exception =
			new(failures);

		// Act
		(HttpStatusCode statusCode, ProblemDetails problem) =
			await HandleExceptionAsync(handler, exception);

		// Assert
		statusCode.ShouldBe(HttpStatusCode.BadRequest);
		problem.Title.ShouldBe(ProblemDetailConstants.Titles.ValidationError);
		problem.Detail.ShouldBe(ProblemDetailConstants.Titles.ValidationFailed);
	}

	[Fact]
	public async Task EntityNotFoundException_Returns404_WithCuratedMessageAsync()
	{
		// Arrange
		GlobalExceptionHandler handler =
			CreateHandler();

		EntityNotFoundException exception =
			new("User", 42);

		// Act
		(HttpStatusCode statusCode, ProblemDetails problem) =
			await HandleExceptionAsync(handler, exception);

		// Assert — domain exceptions now return safe constants, never raw messages
		statusCode.ShouldBe(HttpStatusCode.NotFound);
		problem.Title.ShouldBe(ProblemDetailConstants.Titles.NotFound);
		problem.Detail.ShouldBe(ProblemDetailConstants.Details.ResourceNotFound);
	}

	[Fact]
	public async Task BusinessRuleViolationException_Returns422_WithCuratedMessageAsync()
	{
		// Arrange
		GlobalExceptionHandler handler =
			CreateHandler();

		BusinessRuleViolationException exception =
			new("Cannot deactivate the last admin user.");

		// Act
		(HttpStatusCode statusCode, ProblemDetails problem) =
			await HandleExceptionAsync(handler, exception);

		// Assert — domain exceptions now return safe constants, never raw messages
		statusCode.ShouldBe(HttpStatusCode.UnprocessableEntity);
		problem.Title.ShouldBe(ProblemDetailConstants.Titles.BusinessRuleViolation);
		problem.Detail.ShouldBe(ProblemDetailConstants.Details.UnprocessableEntity);
	}

	[Fact]
	public async Task DomainException_Returns400_WithCuratedMessageAsync()
	{
		// Arrange
		GlobalExceptionHandler handler =
			CreateHandler();

		DomainException exception =
			new("The operation is not valid for the current state.");

		// Act
		(HttpStatusCode statusCode, ProblemDetails problem) =
			await HandleExceptionAsync(handler, exception);

		// Assert — domain exceptions now return safe constants, never raw messages
		statusCode.ShouldBe(HttpStatusCode.BadRequest);
		problem.Title.ShouldBe(ProblemDetailConstants.Titles.DomainError);
		problem.Detail.ShouldBe(ProblemDetailConstants.Details.BadRequest);
	}
}