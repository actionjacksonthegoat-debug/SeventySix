// <copyright file="LogFilterRequestValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.BusinessLogic.DTOs.Logs;
using SeventySix.BusinessLogic.Validators;

namespace SeventySix.BusinessLogic.Tests.Validators;

/// <summary>
/// Unit tests for LogFilterRequestValidator.
/// Tests validation rules for log filter requests (80/20 rule - critical paths only).
/// </summary>
/// <remarks>
/// Following TDD principles and 80/20 rule:
/// - Focus on LogFilterRequest-specific validation (LogLevel)
/// - Common validation (Page, PageSize, SearchTerm, DateRange, SortBy) tested in BaseQueryValidatorTests
///
/// Coverage Focus:
/// - LogLevel validation (domain-specific)
/// - Valid request (happy path)
/// </remarks>
public class LogFilterRequestValidatorTests
{
	private readonly LogFilterRequestValidator Validator = new();

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		LogFilterRequest request = new()
		{
			SearchTerm = "error message",
			LogLevel = "Error",
			StartDate = DateTime.UtcNow.AddDays(-7),
			EndDate = DateTime.UtcNow,
			Page = 1,
			PageSize = 50,
		};

		// Act
		TestValidationResult<LogFilterRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Theory]
	[InlineData("InvalidLevel")]
	[InlineData("Trace")]
	public async Task LogLevel_Invalid_FailsValidationAsync(string invalidLogLevel)
	{
		// Arrange
		LogFilterRequest request = new()
		{
			LogLevel = invalidLogLevel,
			Page = 1,
			PageSize = 50,
		};

		// Act
		TestValidationResult<LogFilterRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(request => request.LogLevel)
			.WithErrorMessage("LogLevel must be one of: Verbose, Debug, Information, Warning, Error, Fatal");
	}

	[Theory]
	[InlineData("Error")]
	[InlineData("Warning")]
	[InlineData("Fatal")]
	public async Task LogLevel_Valid_PassesValidationAsync(string validLogLevel)
	{
		// Arrange
		LogFilterRequest request = new()
		{
			LogLevel = validLogLevel,
			Page = 1,
			PageSize = 50,
		};

		// Act
		TestValidationResult<LogFilterRequest> result = await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}
}