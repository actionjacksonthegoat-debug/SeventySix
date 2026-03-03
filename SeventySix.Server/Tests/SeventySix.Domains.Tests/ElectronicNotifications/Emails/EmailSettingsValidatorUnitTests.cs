// <copyright file="EmailSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.ElectronicNotifications.Emails;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails;

/// <summary>
/// Unit tests for EmailSettingsValidator.
/// Validates email configuration requirements when email sending is enabled.
/// </summary>
/// <remarks>
/// Test Pattern: MethodName_Scenario_ExpectedResult
/// </remarks>
public sealed class EmailSettingsValidatorUnitTests
{
	private readonly EmailSettingsValidator Validator = new();

	/// <summary>
	/// Creates a valid EmailSettings instance with optional overrides.
	/// </summary>
	/// <param name="enabled">
	/// Whether email sending is enabled.
	/// </param>
	/// <param name="apiKey">
	/// The Brevo API key.
	/// </param>
	/// <param name="apiUrl">
	/// The Brevo API base URL.
	/// </param>
	/// <param name="fromAddress">
	/// The sender email address.
	/// </param>
	/// <param name="clientBaseUrl">
	/// The client application base URL.
	/// </param>
	/// <returns>
	/// A configured EmailSettings instance.
	/// </returns>
	private static EmailSettings CreateValidSettings(
		bool enabled = true,
		string apiKey = "test-api-key",
		string apiUrl = "https://api.brevo.com",
		string fromAddress = "noreply@test.com",
		string clientBaseUrl = "https://app.test.com") =>
		new()
		{
			Enabled = enabled,
			ApiKey = apiKey,
			ApiUrl = apiUrl,
			FromAddress = fromAddress,
			FromName = "Test App",
			ClientBaseUrl = clientBaseUrl,
		};

	[Fact]
	public void Validate_EnabledWithMissingApiKey_FailsValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				apiKey: string.Empty);

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(settings => settings.ApiKey);
	}

	[Fact]
	public void Validate_EnabledWithMissingApiUrl_FailsValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				apiUrl: string.Empty);

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(settings => settings.ApiUrl);
	}

	[Fact]
	public void Validate_EnabledWithInvalidApiUrl_FailsValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				apiUrl: "not-a-url");

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(settings => settings.ApiUrl);
	}

	[Fact]
	public void Validate_EnabledWithHttpApiUrl_PassesValidation()
	{
		// Arrange — HTTP scheme is valid for mock Brevo API in E2E/LoadTest
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				apiUrl: "http://mock-brevo-api:3000");

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(settings => settings.ApiUrl);
	}

	[Fact]
	public void Validate_DisabledWithMissingApiKey_PassesValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: false,
				apiKey: string.Empty);

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_EnabledWithInvalidFromAddress_FailsValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				fromAddress: "not-an-email");

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(settings => settings.FromAddress);
	}

	[Fact]
	public void Validate_EnabledWithValidFromAddress_PassesValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				fromAddress: "valid@example.com");

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(settings => settings.FromAddress);
	}

	[Fact]
	public void Validate_EnabledWithInvalidClientBaseUrl_FailsValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				clientBaseUrl: "not-a-url");

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldHaveValidationErrorFor(settings => settings.ClientBaseUrl);
	}

	[Fact]
	public void Validate_EnabledWithValidClientBaseUrl_PassesValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				clientBaseUrl: "https://app.example.com");

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveValidationErrorFor(settings => settings.ClientBaseUrl);
	}

	[Fact]
	public void Validate_EnabledWithAllValid_PassesValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				apiKey: "test-api-key",
				apiUrl: "https://api.brevo.com",
				fromAddress: "noreply@example.com",
				clientBaseUrl: "https://app.example.com");

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}
}