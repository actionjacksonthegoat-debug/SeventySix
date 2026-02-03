// <copyright file="RequestLimitsSettingsValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Api.Configuration;

namespace SeventySix.Api.Tests.Configuration;

/// <summary>
/// Unit tests for RequestLimitsSettingsValidator.
/// Validates request limits configuration requirements.
/// </summary>
/// <remarks>
/// Test Pattern: MethodName_Scenario_ExpectedResult
/// </remarks>
public sealed class RequestLimitsSettingsValidatorTests
{
	private readonly RequestLimitsSettingsValidator Validator = new();

	/// <summary>
	/// Creates a valid RequestLimitsSettings instance with optional overrides.
	/// </summary>
	/// <param name="maxRequestBodySizeBytes">
	/// The maximum request body size in bytes.
	/// </param>
	/// <param name="maxFormOptionsBufferLength">
	/// The maximum form options buffer length.
	/// </param>
	/// <param name="maxMultipartBodyLengthBytes">
	/// The maximum multipart body length in bytes.
	/// </param>
	/// <returns>
	/// A configured RequestLimitsSettings instance.
	/// </returns>
	private static RequestLimitsSettings CreateValidSettings(
		long maxRequestBodySizeBytes = 10_485_760,
		int maxFormOptionsBufferLength = 4_194_304,
		long maxMultipartBodyLengthBytes = 104_857_600) =>
		new()
		{
			MaxRequestBodySizeBytes = maxRequestBodySizeBytes,
			MaxFormOptionsBufferLength = maxFormOptionsBufferLength,
			MaxMultipartBodyLengthBytes = maxMultipartBodyLengthBytes,
		};

	[Fact]
	public void Validate_ValidSettings_PassesValidation()
	{
		// Arrange
		RequestLimitsSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<RequestLimitsSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ZeroMaxRequestBodySizeBytes_FailsValidation()
	{
		// Arrange
		RequestLimitsSettings settings =
			CreateValidSettings(maxRequestBodySizeBytes: 0);

		// Act
		TestValidationResult<RequestLimitsSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.MaxRequestBodySizeBytes)
			.WithErrorMessage("RequestLimits:MaxRequestBodySizeBytes must be greater than 0");
	}

	[Fact]
	public void Validate_NegativeMaxRequestBodySizeBytes_FailsValidation()
	{
		// Arrange
		RequestLimitsSettings settings =
			CreateValidSettings(maxRequestBodySizeBytes: -1);

		// Act
		TestValidationResult<RequestLimitsSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.MaxRequestBodySizeBytes)
			.WithErrorMessage("RequestLimits:MaxRequestBodySizeBytes must be greater than 0");
	}

	[Fact]
	public void Validate_ZeroMaxFormOptionsBufferLength_FailsValidation()
	{
		// Arrange
		RequestLimitsSettings settings =
			CreateValidSettings(maxFormOptionsBufferLength: 0);

		// Act
		TestValidationResult<RequestLimitsSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.MaxFormOptionsBufferLength)
			.WithErrorMessage("RequestLimits:MaxFormOptionsBufferLength must be greater than 0");
	}

	[Fact]
	public void Validate_ZeroMaxMultipartBodyLengthBytes_FailsValidation()
	{
		// Arrange
		RequestLimitsSettings settings =
			CreateValidSettings(maxMultipartBodyLengthBytes: 0);

		// Act
		TestValidationResult<RequestLimitsSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.MaxMultipartBodyLengthBytes)
			.WithErrorMessage("RequestLimits:MaxMultipartBodyLengthBytes must be greater than 0");
	}
}