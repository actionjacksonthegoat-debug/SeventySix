// <copyright file="ConfirmTotpEnrollmentCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.ConfirmTotpEnrollment;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for ConfirmTotpEnrollmentCommandValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Code: required, exactly 6 digits
/// - Valid request passes validation
/// </remarks>
public sealed class ConfirmTotpEnrollmentCommandValidatorTests
{
	private readonly ConfirmTotpEnrollmentCommandValidator Validator = new();

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		ConfirmTotpEnrollmentRequest request =
			new("123456");

		// Act
		TestValidationResult<ConfirmTotpEnrollmentRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion

	#region Code Validation Tests

	[Fact]
	public async Task Code_Empty_FailsValidationAsync()
	{
		// Arrange
		ConfirmTotpEnrollmentRequest request =
			new("");

		// Act
		TestValidationResult<ConfirmTotpEnrollmentRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Code)
			.WithErrorMessage("TOTP code is required");
	}

	[Fact]
	public async Task Code_FiveDigits_FailsValidationAsync()
	{
		// Arrange
		ConfirmTotpEnrollmentRequest request =
			new("12345");

		// Act
		TestValidationResult<ConfirmTotpEnrollmentRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Code);
	}

	[Fact]
	public async Task Code_SevenDigits_FailsValidationAsync()
	{
		// Arrange
		ConfirmTotpEnrollmentRequest request =
			new("1234567");

		// Act
		TestValidationResult<ConfirmTotpEnrollmentRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Code);
	}

	[Fact]
	public async Task Code_NonDigits_FailsValidationAsync()
	{
		// Arrange
		ConfirmTotpEnrollmentRequest request =
			new("12345a");

		// Act
		TestValidationResult<ConfirmTotpEnrollmentRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Code)
			.WithErrorMessage("TOTP code must contain only digits");
	}

	#endregion
}