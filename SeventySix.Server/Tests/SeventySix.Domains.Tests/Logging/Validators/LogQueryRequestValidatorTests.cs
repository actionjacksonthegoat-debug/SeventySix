// <copyright file="LogQueryRequestValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Logging;
using SeventySix.Logging.Queries.GetLogsPaged;

namespace SeventySix.Domains.Tests.Logging.Validators;

/// <summary>Unit tests for LogQueryRequestValidator.</summary>
public class LogQueryRequestValidatorTests
{
	private readonly LogQueryRequestValidator Validator = new();

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		LogQueryRequest request = new()
		{
			SearchTerm = "error message",
			LogLevel = LogLevelConstants.Error,
			StartDate = DateTime.UtcNow.AddDays(-7),
			EndDate = DateTime.UtcNow,
			Page = 1,
			PageSize = 50,
		};

		TestValidationResult<LogQueryRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldNotHaveAnyValidationErrors();
	}

	[Theory]
	[InlineData("InvalidLevel")]
	[InlineData("Trace")]
	public async Task LogLevel_Invalid_FailsValidationAsync(string invalidLogLevel)
	{
		LogQueryRequest request = new()
		{
			LogLevel = invalidLogLevel,
			Page = 1,
			PageSize = 50,
		};

		TestValidationResult<LogQueryRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldHaveValidationErrorFor(request => request.LogLevel)
			.WithErrorMessage("LogLevel must be one of: Verbose, Debug, Information, Warning, Error, Fatal");
	}

	[Theory]
	[InlineData("Error")]
	[InlineData("Warning")]
	[InlineData("Fatal")]
	public async Task LogLevel_Valid_PassesValidationAsync(string validLogLevel)
	{
		LogQueryRequest request = new()
		{
			LogLevel = validLogLevel,
			Page = 1,
			PageSize = 50,
		};

		TestValidationResult<LogQueryRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldNotHaveAnyValidationErrors();
	}
}