// <copyright file="InitiatePasswordResetByEmailCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;
using SeventySix.Identity.Commands.InitiatePasswordResetByEmail;

namespace SeventySix.Domains.Tests.Identity.Validators;

/// <summary>
/// Unit tests for InitiatePasswordResetByEmailCommandValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Email validation (required, valid format, max length).
/// </remarks>
public class InitiatePasswordResetByEmailCommandValidatorTests
{
	private readonly InitiatePasswordResetByEmailCommandValidator Validator = new();

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		ForgotPasswordRequest request =
			new(Email: "test@example.com");

		// Act
		TestValidationResult<ForgotPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task ValidRequest_WithSubdomain_PassesValidationAsync()
	{
		// Arrange
		ForgotPasswordRequest request =
			new(Email: "user@mail.subdomain.example.com");

		// Act
		TestValidationResult<ForgotPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion

	#region Email Validation Tests

	[Fact]
	public async Task Email_Empty_FailsValidationAsync()
	{
		// Arrange
		ForgotPasswordRequest request =
			new(Email: "");

		// Act
		TestValidationResult<ForgotPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email is required");
	}

	[Fact]
	public async Task Email_Null_FailsValidationAsync()
	{
		// Arrange
		ForgotPasswordRequest request =
			new(Email: null!);

		// Act
		TestValidationResult<ForgotPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email is required");
	}

	[Theory]
	[InlineData("invalid-email")]
	[InlineData("@nodomain.com")]
	[InlineData("nodomain@")]
	[InlineData("no@@double.com")]
	public async Task Email_InvalidFormat_FailsValidationAsync(string invalidEmail)
	{
		// Arrange
		ForgotPasswordRequest request =
			new(Email: invalidEmail);

		// Act
		TestValidationResult<ForgotPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email must be a valid email address");
	}

	[Fact]
	public async Task Email_ExceedsMaxLength_FailsValidationAsync()
	{
		// Arrange
		string longEmail =
			new string('a', 250) + "@example.com";

		ForgotPasswordRequest request =
			new(Email: longEmail);

		// Act
		TestValidationResult<ForgotPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email must not exceed 255 characters");
	}

	[Fact]
	public async Task Email_AtMaxLength_PassesValidationAsync()
	{
		// Arrange - email exactly 255 characters
		string localPart =
			new string('a', 243);
		string email =
			localPart + "@example.com";

		ForgotPasswordRequest request =
			new(Email: email);

		// Act
		TestValidationResult<ForgotPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion
}