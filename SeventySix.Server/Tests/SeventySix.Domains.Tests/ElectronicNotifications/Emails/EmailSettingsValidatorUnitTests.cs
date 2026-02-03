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
	/// <param name="smtpHost">
	/// The SMTP host.
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
		string smtpHost = "smtp.test.com",
		string fromAddress = "noreply@test.com",
		string clientBaseUrl = "https://app.test.com") =>
		new()
		{
			Enabled = enabled,
			SmtpHost = smtpHost,
			SmtpPort = 587,
			FromAddress = fromAddress,
			FromName = "Test App",
			ClientBaseUrl = clientBaseUrl,
		};

	[Fact]
	public void Validate_EnabledWithMissingSmtpHost_FailsValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: true,
				smtpHost: string.Empty);

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result
			.ShouldHaveValidationErrorFor(settings => settings.SmtpHost)
			.WithErrorMessage("SmtpHost is required when email is enabled");
	}

	[Fact]
	public void Validate_DisabledWithMissingSmtpHost_PassesValidation()
	{
		// Arrange
		EmailSettings settings =
			CreateValidSettings(
				enabled: false,
				smtpHost: string.Empty);

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
				smtpHost: "smtp.example.com",
				fromAddress: "noreply@example.com",
				clientBaseUrl: "https://app.example.com");

		// Act
		TestValidationResult<EmailSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}
}