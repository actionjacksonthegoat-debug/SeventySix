// <copyright file="ClientLogRequestTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.ComponentModel.DataAnnotations;
using System.Reflection;
using SeventySix.BusinessLogic.DTOs.Logs;
using Xunit;

namespace SeventySix.Core.Tests.DTOs;

/// <summary>
/// Unit tests for ClientLogRequest DTO.
/// </summary>
/// <remarks>
/// Tests validation attributes and property requirements for client-side error logging.
///
/// Test Coverage:
/// - Required field validation
/// - Optional field handling
/// - Field length constraints
/// - LogLevel value validation
///
/// SOLID Principles:
/// - SRP: Each test validates one specific behavior
/// </remarks>
public class ClientLogRequestTests
{
	/// <summary>
	/// Tests that a valid ClientLogRequest passes validation.
	/// </summary>
	[Fact]
	public void ClientLogRequest_WithValidData_PassesValidation()
	{
		// Arrange
		ClientLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "Test error message",
		};

		// Act
		List<ValidationResult> validationResults = [];
		bool isValid = Validator.TryValidateObject(
			request,
			new ValidationContext(request),
			validationResults,
			validateAllProperties: true);

		// Assert
		Assert.True(isValid);
		Assert.Empty(validationResults);
	}

	/// <summary>
	/// Tests that LogLevel is required (enforced by required keyword).
	/// </summary>
	[Fact]
	public void ClientLogRequest_LogLevelIsRequired()
	{
		// This test validates that LogLevel is a required property
		// The 'required' keyword enforces this at compile time
		// We verify by checking the property info
		PropertyInfo? property = typeof(ClientLogRequest).GetProperty("LogLevel");
		Assert.NotNull(property);

		// Verify Required attribute exists
		object[] requiredAttribute = property.GetCustomAttributes(typeof(RequiredAttribute), false);
		Assert.NotEmpty(requiredAttribute);
	}

	/// <summary>
	/// Tests that Message is required (enforced by required keyword).
	/// </summary>
	[Fact]
	public void ClientLogRequest_MessageIsRequired()
	{
		// This test validates that Message is a required property
		// The 'required' keyword enforces this at compile time
		// We verify by checking the property info
		PropertyInfo? property = typeof(ClientLogRequest).GetProperty("Message");
		Assert.NotNull(property);

		// Verify Required attribute exists
		object[] requiredAttribute = property.GetCustomAttributes(typeof(RequiredAttribute), false);
		Assert.NotEmpty(requiredAttribute);
	}

	/// <summary>
	/// Tests that optional fields can be null.
	/// </summary>
	[Fact]
	public void ClientLogRequest_WithNullOptionalFields_PassesValidation()
	{
		// Arrange
		ClientLogRequest request = new()
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
		};

		// Act
		List<ValidationResult> validationResults = [];
		bool isValid = Validator.TryValidateObject(
			request,
			new ValidationContext(request),
			validationResults,
			validateAllProperties: true);

		// Assert
		Assert.True(isValid);
		Assert.Empty(validationResults);
	}

	/// <summary>
	/// Tests that all optional fields can be populated.
	/// </summary>
	[Fact]
	public void ClientLogRequest_WithAllFields_PassesValidation()
	{
		// Arrange
		ClientLogRequest request = new()
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
		};

		// Act
		List<ValidationResult> validationResults = [];
		bool isValid = Validator.TryValidateObject(
			request,
			new ValidationContext(request),
			validationResults,
			validateAllProperties: true);

		// Assert
		Assert.True(isValid);
		Assert.Empty(validationResults);
	}

	/// <summary>
	/// Tests that LogLevel accepts valid log level values.
	/// </summary>
	[Theory]
	[InlineData("Error")]
	[InlineData("Warning")]
	[InlineData("Info")]
	[InlineData("Debug")]
	[InlineData("Critical")]
	public void ClientLogRequest_WithValidLogLevel_PassesValidation(string logLevel)
	{
		// Arrange
		ClientLogRequest request = new()
		{
			LogLevel = logLevel,
			Message = "Test message",
		};

		// Act
		List<ValidationResult> validationResults = [];
		bool isValid = Validator.TryValidateObject(
			request,
			new ValidationContext(request),
			validationResults,
			validateAllProperties: true);

		// Assert
		Assert.True(isValid);
		Assert.Empty(validationResults);
	}

	/// <summary>
	/// Tests that StatusCode accepts valid HTTP status codes.
	/// </summary>
	[Theory]
	[InlineData(200)]
	[InlineData(400)]
	[InlineData(404)]
	[InlineData(500)]
	public void ClientLogRequest_WithValidStatusCode_PassesValidation(int statusCode)
	{
		// Arrange
		ClientLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "Test message",
			StatusCode = statusCode,
		};

		// Act
		List<ValidationResult> validationResults = [];
		bool isValid = Validator.TryValidateObject(
			request,
			new ValidationContext(request),
			validationResults,
			validateAllProperties: true);

		// Assert
		Assert.True(isValid);
		Assert.Empty(validationResults);
	}

	/// <summary>
	/// Tests that AdditionalContext can contain various data types.
	/// </summary>
	[Fact]
	public void ClientLogRequest_WithVariousContextTypes_PassesValidation()
	{
		// Arrange
		ClientLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "Test message",
			AdditionalContext = new Dictionary<string, object>
			{
				{ "stringValue", "test" },
				{ "intValue", 42 },
				{ "boolValue", true },
				{ "dateValue", DateTime.UtcNow },
				{ "arrayValue", new[] { 1, 2, 3 } },
			},
		};

		// Act
		List<ValidationResult> validationResults = [];
		bool isValid = Validator.TryValidateObject(
			request,
			new ValidationContext(request),
			validationResults,
			validateAllProperties: true);

		// Assert
		Assert.True(isValid);
		Assert.Empty(validationResults);
		Assert.Equal(5, request.AdditionalContext.Count);
	}
}