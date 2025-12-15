// <copyright file="SetPasswordCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;
using SeventySix.Identity.Commands.SetPassword;

namespace SeventySix.Domains.Tests.Identity.Validators;

/// <summary>
/// Unit tests for SetPasswordCommandValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Token validation (required, valid base64)
/// - NewPassword validation (delegates to password rules).
/// </remarks>
public class SetPasswordCommandValidatorTests
{
	private readonly SetPasswordCommandValidator Validator = new();

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		string validToken =
			Convert.ToBase64String(new byte[64]);

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
			.ShouldHaveValidationErrorFor(x => x.Token)
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
			.ShouldHaveValidationErrorFor(x => x.Token)
			.WithErrorMessage("Reset token is required.");
	}

	[Fact]
	public async Task Token_InvalidBase64_FailsValidationAsync()
	{
		// Arrange
		SetPasswordRequest request =
			new(
				Token: "not-valid-base64!!!",
				NewPassword: "Password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Token)
			.WithErrorMessage("Reset token is invalid.");
	}

	[Fact]
	public async Task Token_ValidBase64_PassesValidationAsync()
	{
		// Arrange
		string validToken =
			Convert.ToBase64String("some-random-bytes"u8.ToArray());

		SetPasswordRequest request =
			new(
				Token: validToken,
				NewPassword: "Password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Token);
	}

	#endregion

	#region NewPassword Validation Tests

	[Fact]
	public async Task NewPassword_Empty_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			Convert.ToBase64String(new byte[64]);

		SetPasswordRequest request =
			new(
				Token: validToken,
				NewPassword: "");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.NewPassword);
	}

	[Fact]
	public async Task NewPassword_TooShort_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			Convert.ToBase64String(new byte[64]);

		SetPasswordRequest request =
			new(
				Token: validToken,
				NewPassword: "Pass1!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.NewPassword);
	}

	[Fact]
	public async Task NewPassword_NoUppercase_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			Convert.ToBase64String(new byte[64]);

		SetPasswordRequest request =
			new(
				Token: validToken,
				NewPassword: "password123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.NewPassword);
	}

	[Fact]
	public async Task NewPassword_NoLowercase_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			Convert.ToBase64String(new byte[64]);

		SetPasswordRequest request =
			new(
				Token: validToken,
				NewPassword: "PASSWORD123!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.NewPassword);
	}

	[Fact]
	public async Task NewPassword_NoDigit_FailsValidationAsync()
	{
		// Arrange
		string validToken =
			Convert.ToBase64String(new byte[64]);

		SetPasswordRequest request =
			new(
				Token: validToken,
				NewPassword: "PasswordABC!");

		// Act
		TestValidationResult<SetPasswordRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.NewPassword);
	}

	#endregion
}