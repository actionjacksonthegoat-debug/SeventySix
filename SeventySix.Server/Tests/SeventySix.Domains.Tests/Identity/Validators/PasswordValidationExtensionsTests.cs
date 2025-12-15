// <copyright file="PasswordValidationExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.TestHelper;
using SeventySix.Identity.Extensions;

namespace SeventySix.Domains.Tests.Identity.Validators;

/// <summary>
/// Unit tests for PasswordValidationExtensions.
/// Tests centralized password validation rules for DRY compliance.
/// </summary>
/// <remarks>
/// Following TDD principles:
/// - Test valid passwords (should pass)
/// - Test invalid passwords (should fail with specific messages)
/// - Test boundary conditions (minimum length, maximum length)
/// - Test each complexity requirement independently
///
/// Uses FluentValidation.TestHelper for cleaner test syntax.
/// </remarks>
public class PasswordValidationExtensionsTests
{
	private readonly TestPasswordValidator Validator = new();

	[Fact]
	public void Password_ShouldNotHaveError_WhenValid()
	{
		// Arrange
		TestPasswordRequest request =
			new("ValidPass1");

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Password);
	}

	[Fact]
	public void Password_ShouldNotHaveError_WhenExactlyMinimumLength()
	{
		// Arrange - 8 characters exactly
		TestPasswordRequest request =
			new("Abcdef1!");

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Password);
	}

	[Fact]
	public void Password_ShouldNotHaveError_WhenMaximumLength()
	{
		// Arrange - 100 characters
		string longPassword =
			new string('a', 97) + "A1!";

		TestPasswordRequest request =
			new(longPassword);

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Password);
	}

	[Fact]
	public void Password_ShouldHaveError_WhenEmpty()
	{
		// Arrange
		TestPasswordRequest request =
			new(string.Empty);

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password is required");
	}

	[Fact]
	public void Password_ShouldHaveError_WhenNull()
	{
		// Arrange
		TestPasswordRequest request =
			new(null!);

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password is required");
	}

	[Fact]
	public void Password_ShouldHaveError_WhenTooShort()
	{
		// Arrange - 7 characters (below minimum of 8)
		TestPasswordRequest request =
			new("Abc123!");

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password must be at least 8 characters");
	}

	[Fact]
	public void Password_ShouldHaveError_WhenTooLong()
	{
		// Arrange - 101 characters (above maximum of 100)
		string longPassword =
			new string('a', 98) + "A1!";

		TestPasswordRequest request =
			new(longPassword);

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password must not exceed 100 characters");
	}

	[Fact]
	public void Password_ShouldHaveError_WhenNoUppercase()
	{
		// Arrange - Missing uppercase
		TestPasswordRequest request =
			new("lowercase1!");

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password must contain at least one uppercase letter");
	}

	[Fact]
	public void Password_ShouldHaveError_WhenNoLowercase()
	{
		// Arrange - Missing lowercase
		TestPasswordRequest request =
			new("UPPERCASE1!");

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password must contain at least one lowercase letter");
	}

	[Fact]
	public void Password_ShouldHaveError_WhenNoDigit()
	{
		// Arrange - Missing digit
		TestPasswordRequest request =
			new("NoDigitsHere!");

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password must contain at least one digit");
	}

	/// <summary>
	/// Test request record for password validation.
	/// </summary>
	/// <param name="Password">The password to validate.</param>
	private sealed record TestPasswordRequest(string Password);

	/// <summary>
	/// Test validator using password validation extensions.
	/// </summary>
	private sealed class TestPasswordValidator : AbstractValidator<TestPasswordRequest>
	{
		public TestPasswordValidator()
		{
			RuleFor(x => x.Password)
				.ApplyPasswordRules();
		}
	}
}