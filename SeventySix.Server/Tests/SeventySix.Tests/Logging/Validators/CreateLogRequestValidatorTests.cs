// <copyright file="CreateLogRequestValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Logging;

namespace SeventySix.Tests.Logging;

/// <summary>Unit tests for CreateLogRequestValidator.</summary>
public class CreateLogRequestValidatorTests
{
	private readonly CreateLogRequestValidator Validator = new();

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		CreateLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "Test error message",
		};

		TestValidationResult<CreateLogRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task EmptyLogLevel_FailsValidationAsync()
	{
		CreateLogRequest request = new()
		{
			LogLevel = "",
			Message = "Test message",
		};

		TestValidationResult<CreateLogRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldHaveValidationErrorFor(r => r.LogLevel);
	}

	[Fact]
	public async Task EmptyMessage_FailsValidationAsync()
	{
		CreateLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "",
		};

		TestValidationResult<CreateLogRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldHaveValidationErrorFor(r => r.Message);
	}

	[Theory]
	[InlineData("InvalidLevel")]
	[InlineData("Trace")]
	public async Task InvalidLogLevel_FailsValidationAsync(string invalidLogLevel)
	{
		CreateLogRequest request = new()
		{
			LogLevel = invalidLogLevel,
			Message = "Test message",
		};

		TestValidationResult<CreateLogRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldHaveValidationErrorFor(r => r.LogLevel);
	}

	[Theory]
	[InlineData("Error")]
	[InlineData("Warning")]
	[InlineData("Information")]
	[InlineData("Debug")]
	[InlineData("Critical")]
	[InlineData("Fatal")]
	public async Task ValidLogLevel_PassesValidationAsync(string validLogLevel)
	{
		CreateLogRequest request = new()
		{
			LogLevel = validLogLevel,
			Message = "Test message",
		};

		TestValidationResult<CreateLogRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task AllOptionalFieldsNull_PassesValidationAsync()
	{
		CreateLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "Test message",
			ExceptionMessage = null,
			StackTrace = null,
			SourceContext = null,
			RequestUrl = null,
			RequestMethod = null,
			StatusCode = null,
			UserAgent = null,
			ClientTimestamp = null,
			AdditionalContext = null,
			CorrelationId = null,
		};

		TestValidationResult<CreateLogRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task AllFieldsPopulated_PassesValidationAsync()
	{
		CreateLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "Test error message",
			ExceptionMessage = "Test exception",
			StackTrace = "at TestComponent.method()",
			SourceContext = "TestComponent",
			RequestUrl = "/api/test",
			RequestMethod = "POST",
			StatusCode = 500,
			UserAgent = "Mozilla/5.0",
			ClientTimestamp = DateTime.UtcNow.ToString("O"),
			AdditionalContext = new Dictionary<string, object>
			{
				{ "userId", 123 },
				{ "action", "test" },
			},
			CorrelationId = "abc123",
		};

		TestValidationResult<CreateLogRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task MessageExceedsMaxLength_FailsValidationAsync()
	{
		CreateLogRequest request = new()
		{
			LogLevel = "Error",
			Message = new string('x', 4001),
		};

		TestValidationResult<CreateLogRequest> result = await Validator.TestValidateAsync(request);

		result.ShouldHaveValidationErrorFor(r => r.Message);
	}
}
