// <copyright file="SetPasswordCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.SetPassword;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for SetPasswordCommandValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Token validation (required, valid {userId}:{base64} format)
/// - NewPassword validation (delegates to password rules).
/// </remarks>
public sealed class SetPasswordCommandValidatorTests
{
	private static readonly PasswordSettings TestPasswordSettings =
		new()
		{
			MinLength = 8,
			RequireUppercase = true,
			RequireLowercase = true,
			RequireDigit = true,
			RequireSpecialChar = false,
		};

	private readonly SetPasswordCommandValidator Validator =
		new(TestPasswordSettings);

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		string validToken =
			$"123:{Convert.ToBase64String(new byte[64])}";

		SetPasswordRequest request =
			new(
			Token: validToken,
			NewPassword: "Password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion

	#region Token Validation Tests

	[Fact]
	public async Task Token_Empty_FailsValidationAsync()
	{
		// Arrange
		SetPasswordRequest request =
			new(
			Token: "",
			NewPassword: "Password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(request => request.Token)
			.WithErrorMessage("Reset token is required.");
	}

	[Fact]
	public async Task Token_Null_FailsValidationAsync()
	{
		// Arrange
		SetPasswordRequest request =
			new(
			Token: null!,
			NewPassword: "Password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(request => request.Token)
			.WithErrorMessage("Reset token is required.");
	}

	[Fact]
	public async Task Token_InvalidFormat_FailsValidationAsync()
	{
		// Arrange — no colon separator
		SetPasswordRequest request =
			new(
			Token: "not-valid-token!!!",
			NewPassword: "Password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(request => request.Token)
			.WithErrorMessage("Reset token is invalid.");
	}

	[Fact]
	public async Task Token_NonNumericUserId_FailsValidationAsync()
	{
		// Arrange — user ID portion is not a number
		string invalidToken =
			$"abc:{Convert.ToBase64String(new byte[32])}";

		SetPasswordRequest request =
			new(
			Token: invalidToken,
			NewPassword: "Password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(request => request.Token)
			.WithErrorMessage("Reset token is invalid.");
	}

	[Fact]
	public async Task Token_InvalidBase64Part_FailsValidationAsync()
	{
		// Arrange — Base64 portion is invalid
		SetPasswordRequest request =
			new(
			Token: "123:not-valid-base64!!!",
			NewPassword: "Password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(request => request.Token)
			.WithErrorMessage("Reset token is invalid.");
	}

	[Fact]
	public async Task Token_ValidCombinedFormat_PassesValidationAsync()
	{
		// Arrange — correct {userId}:{base64Token} format
		string validToken =
			$"42:{Convert.ToBase64String("some-random-bytes"u8.ToArray())}";

		SetPasswordRequest request =
			new(
			Token: validToken,
			NewPassword: "Password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(request => request.Token);
	}

	#endregion

	#region NewPassword Validation Tests

	[Fact]
	public async Task NewPassword_Empty_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			$"123:{Convert.ToBase64String(new byte[64])}";

		SetPasswordRequest request =
			new(Token: validToken, NewPassword: "");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(request => request.NewPassword);
	}

	[Fact]
	public async Task NewPassword_TooShort_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			$"123:{Convert.ToBase64String(new byte[64])}";

		SetPasswordRequest request =
			new(
			Token: validToken,
			NewPassword: "Pass1!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(request => request.NewPassword);
	}

	[Fact]
	public async Task NewPassword_NoUppercase_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			$"123:{Convert.ToBase64String(new byte[64])}";

		SetPasswordRequest request =
			new(
			Token: validToken,
			NewPassword: "password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(request => request.NewPassword);
	}

	[Fact]
	public async Task NewPassword_NoLowercase_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			$"123:{Convert.ToBase64String(new byte[64])}";

		SetPasswordRequest request =
			new(
			Token: validToken,
			NewPassword: "PASSWORD123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(request => request.NewPassword);
	}

	[Fact]
	public async Task NewPassword_NoDigit_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			$"123:{Convert.ToBase64String(new byte[64])}";

		SetPasswordRequest request =
			new(
			Token: validToken,
			NewPassword: "PasswordABC!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(request => request.NewPassword);
	}

	#endregion
}