// <copyright file="LoginCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.Login;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for LoginCommandValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - UsernameOrEmail validation (required, max length)
/// - Password validation (required, max length for DoS protection)
/// </remarks>
public sealed class LoginCommandValidatorTests
{
	private readonly LoginCommandValidator Validator = new();

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		LoginRequest request =
			new(
			UsernameOrEmail: "testuser",
			Password: "Password123!");

		// Act
		TestValidationResult<LoginRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task ValidRequest_WithEmail_PassesValidationAsync()
	{
		// Arrange
		LoginRequest request =
			new(
			UsernameOrEmail: "test@example.com",
			Password: "SecureP@ss1");

		// Act
		TestValidationResult<LoginRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion

	#region UsernameOrEmail Validation Tests

	[Fact]
	public async Task UsernameOrEmail_Empty_FailsValidationAsync()
	{
		// Arrange
		LoginRequest request =
			new(
			UsernameOrEmail: "",
			Password: "Password123!");

		// Act
		TestValidationResult<LoginRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.UsernameOrEmail)
			.WithErrorMessage("Username or email is required");
	}

	[Fact]
	public async Task UsernameOrEmail_ExceedsMaxLength_FailsValidationAsync()
	{
		// Arrange
		string longUsername =
			new('a', 256);
		LoginRequest request =
			new(
			UsernameOrEmail: longUsername,
			Password: "Password123!");

		// Act
		TestValidationResult<LoginRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.UsernameOrEmail)
			.WithErrorMessage(
				"Username or email must not exceed 255 characters");
	}

	[Fact]
	public async Task UsernameOrEmail_AtMaxLength_PassesValidationAsync()
	{
		// Arrange
		string maxLengthUsername =
			new('a', 255);
		LoginRequest request =
			new(
			UsernameOrEmail: maxLengthUsername,
			Password: "Password123!");

		// Act
		TestValidationResult<LoginRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.UsernameOrEmail);
	}

	#endregion

	#region Password Validation Tests

	[Fact]
	public async Task Password_Empty_FailsValidationAsync()
	{
		// Arrange
		LoginRequest request =
			new(UsernameOrEmail: "testuser", Password: "");

		// Act
		TestValidationResult<LoginRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password is required");
	}

	[Fact]
	public async Task Password_ExceedsMaxLength_FailsValidationAsync()
	{
		// Arrange - 101 characters exceeds the 100 character max (DoS protection)
		string longPassword =
			new('P', 101);
		LoginRequest request =
			new(
			UsernameOrEmail: "testuser",
			Password: longPassword);

		// Act
		TestValidationResult<LoginRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password must not exceed 100 characters");
	}

	[Fact]
	public async Task Password_AtMaxLength_PassesValidationAsync()
	{
		// Arrange - 100 characters is exactly at max
		string maxLengthPassword =
			new('P', 100);
		LoginRequest request =
			new(
			UsernameOrEmail: "testuser",
			Password: maxLengthPassword);

		// Act
		TestValidationResult<LoginRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Password);
	}

	#endregion
}