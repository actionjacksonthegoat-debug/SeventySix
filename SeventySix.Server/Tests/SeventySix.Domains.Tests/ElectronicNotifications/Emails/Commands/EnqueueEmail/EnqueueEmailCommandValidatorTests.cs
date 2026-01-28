// <copyright file="EnqueueEmailCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.ElectronicNotifications.Emails;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Commands.EnqueueEmail;

/// <summary>
/// Unit tests for EnqueueEmailCommandValidator.
/// Tests validation rules for email enqueue requests.
/// </summary>
/// <remarks>
/// Coverage Focus (80/20):
/// - EmailType validation (required, valid type)
/// - RecipientEmail validation (required, valid format)
/// - TemplateData validation (required)
/// </remarks>
public class EnqueueEmailCommandValidatorTests
{
	private readonly EnqueueEmailCommandValidator Validator = new();

	[Fact]
	public void EmailType_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		EnqueueEmailCommand command =
			new(
				EmailType: string.Empty,
				RecipientEmail: "test@example.com",
				RecipientUserId: 1,
				TemplateData: new Dictionary<string, string> { ["name"] = "Test" });

		// Act
		TestValidationResult<EnqueueEmailCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.EmailType)
			.WithErrorMessage("Email type is required");
	}

	[Fact]
	public void EmailType_ShouldHaveError_WhenInvalidTypeAsync()
	{
		// Arrange
		EnqueueEmailCommand command =
			new(
				EmailType: "InvalidType",
				RecipientEmail: "test@example.com",
				RecipientUserId: 1,
				TemplateData: new Dictionary<string, string> { ["name"] = "Test" });

		// Act
		TestValidationResult<EnqueueEmailCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.EmailType)
			.WithErrorMessage("Email type must be a valid email type");
	}

	[Theory]
	[InlineData(EmailType.Welcome)]
	[InlineData(EmailType.PasswordReset)]
	[InlineData(EmailType.Verification)]
	[InlineData(EmailType.MfaVerification)]
	public void EmailType_ShouldNotHaveError_WhenValidTypeAsync(string emailType)
	{
		// Arrange
		EnqueueEmailCommand command =
			new(
				EmailType: emailType,
				RecipientEmail: "test@example.com",
				RecipientUserId: 1,
				TemplateData: new Dictionary<string, string> { ["name"] = "Test" });

		// Act
		TestValidationResult<EnqueueEmailCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldNotHaveValidationErrorFor(
				command => command.EmailType);
	}

	[Fact]
	public void RecipientEmail_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		EnqueueEmailCommand command =
			new(
				EmailType: EmailType.Welcome,
				RecipientEmail: string.Empty,
				RecipientUserId: 1,
				TemplateData: new Dictionary<string, string> { ["name"] = "Test" });

		// Act
		TestValidationResult<EnqueueEmailCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.RecipientEmail)
			.WithErrorMessage("Recipient email is required");
	}

	[Theory]
	[InlineData("notanemail")]
	[InlineData("missing@")]
	[InlineData("@nodomain.com")]
	public void RecipientEmail_ShouldHaveError_WhenInvalidFormatAsync(string invalidEmail)
	{
		// Arrange
		EnqueueEmailCommand command =
			new(
				EmailType: EmailType.Welcome,
				RecipientEmail: invalidEmail,
				RecipientUserId: 1,
				TemplateData: new Dictionary<string, string> { ["name"] = "Test" });

		// Act
		TestValidationResult<EnqueueEmailCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.RecipientEmail)
			.WithErrorMessage("Recipient email must be a valid email address");
	}

	[Fact]
	public void TemplateData_ShouldHaveError_WhenNullAsync()
	{
		// Arrange
		EnqueueEmailCommand command =
			new(
				EmailType: EmailType.Welcome,
				RecipientEmail: "test@example.com",
				RecipientUserId: 1,
				TemplateData: null!);

		// Act
		TestValidationResult<EnqueueEmailCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.TemplateData)
			.WithErrorMessage("Template data is required");
	}

	[Fact]
	public void Command_ShouldBeValid_WhenAllPropertiesValidAsync()
	{
		// Arrange
		EnqueueEmailCommand command =
			new(
				EmailType: EmailType.Welcome,
				RecipientEmail: "test@example.com",
				RecipientUserId: 1,
				TemplateData: new Dictionary<string, string> { ["username"] = "Test User" });

		// Act
		TestValidationResult<EnqueueEmailCommand> result =
			Validator.TestValidate(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Command_ShouldBeValid_WhenRecipientUserIdIsNullAsync()
	{
		// Arrange
		EnqueueEmailCommand command =
			new(
				EmailType: EmailType.Welcome,
				RecipientEmail: "test@example.com",
				RecipientUserId: null,
				TemplateData: new Dictionary<string, string> { ["username"] = "Test User" });

		// Act
		TestValidationResult<EnqueueEmailCommand> result =
			Validator.TestValidate(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}
}