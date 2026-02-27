// <copyright file="VerifyTotpCodeCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.VerifyTotpCode;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for VerifyTotpCodeCommandValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - ChallengeToken: required
/// - Code: required, exactly 6 digits
/// - Valid request passes validation
/// </remarks>
public sealed class VerifyTotpCodeCommandValidatorTests
{
	private readonly VerifyTotpCodeCommandValidator Validator = new();

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		VerifyTotpRequest request =
			new(
				ChallengeToken: "valid-challenge-token",
				Code: "123456");

		// Act
		TestValidationResult<VerifyTotpRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion

	#region ChallengeToken Validation Tests

	[Fact]
	public async Task ChallengeToken_Empty_FailsValidationAsync()
	{
		// Arrange
		VerifyTotpRequest request =
			new(
				ChallengeToken: "",
				Code: "123456");

		// Act
		TestValidationResult<VerifyTotpRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.ChallengeToken)
			.WithErrorMessage("Challenge token is required");
	}

	#endregion

	#region Code Validation Tests

	[Fact]
	public async Task Code_Empty_FailsValidationAsync()
	{
		// Arrange
		VerifyTotpRequest request =
			new(
				ChallengeToken: "valid-token",
				Code: "");

		// Act
		TestValidationResult<VerifyTotpRequest> result =
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
		VerifyTotpRequest request =
			new(
				ChallengeToken: "valid-token",
				Code: "12345");

		// Act
		TestValidationResult<VerifyTotpRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Code);
	}

	[Fact]
	public async Task Code_NonDigits_FailsValidationAsync()
	{
		// Arrange
		VerifyTotpRequest request =
			new(
				ChallengeToken: "valid-token",
				Code: "12345a");

		// Act
		TestValidationResult<VerifyTotpRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Code)
			.WithErrorMessage("TOTP code must contain only digits");
	}

	#endregion
}