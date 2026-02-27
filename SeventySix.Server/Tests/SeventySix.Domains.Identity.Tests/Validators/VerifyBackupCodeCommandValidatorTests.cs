// <copyright file="VerifyBackupCodeCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.VerifyBackupCode;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for VerifyBackupCodeCommandValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - ChallengeToken: required
/// - Code: required, 8-10 characters
/// - Valid request passes validation
/// </remarks>
public sealed class VerifyBackupCodeCommandValidatorTests
{
	private readonly VerifyBackupCodeCommandValidator Validator = new();

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_BackupCode8Chars_PassesValidationAsync()
	{
		// Arrange
		VerifyBackupCodeRequest request =
			new(
				ChallengeToken: "valid-challenge-token",
				Code: "ABCD1234");

		// Act
		TestValidationResult<VerifyBackupCodeRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task ValidRequest_BackupCodeWithDash_PassesValidationAsync()
	{
		// Arrange
		VerifyBackupCodeRequest request =
			new(
				ChallengeToken: "valid-challenge-token",
				Code: "ABCD-1234");

		// Act
		TestValidationResult<VerifyBackupCodeRequest> result =
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
		VerifyBackupCodeRequest request =
			new(
				ChallengeToken: "",
				Code: "ABCD1234");

		// Act
		TestValidationResult<VerifyBackupCodeRequest> result =
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
		VerifyBackupCodeRequest request =
			new(
				ChallengeToken: "valid-token",
				Code: "");

		// Act
		TestValidationResult<VerifyBackupCodeRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Code)
			.WithErrorMessage("Backup code is required");
	}

	[Fact]
	public async Task Code_TooShort_FailsValidationAsync()
	{
		// Arrange
		VerifyBackupCodeRequest request =
			new(
				ChallengeToken: "valid-token",
				Code: "ABC1234");

		// Act
		TestValidationResult<VerifyBackupCodeRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Code)
			.WithErrorMessage("Backup code must be 8-10 characters");
	}

	[Fact]
	public async Task Code_TooLong_FailsValidationAsync()
	{
		// Arrange
		VerifyBackupCodeRequest request =
			new(
				ChallengeToken: "valid-token",
				Code: "ABCD12345678");

		// Act
		TestValidationResult<VerifyBackupCodeRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Code)
			.WithErrorMessage("Backup code must be 8-10 characters");
	}

	#endregion
}