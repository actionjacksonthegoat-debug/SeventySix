// <copyright file="PasswordValidationExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.TestHelper;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for PasswordValidationExtensions.
/// Tests centralized password validation rules per OWASP ASVS V2.1.9 (length-only).
/// </summary>
/// <remarks>
/// Following TDD principles:
/// - Test valid passwords (should pass)
/// - Test invalid passwords (should fail with specific messages)
/// - Test boundary conditions (minimum length, maximum length)
///
/// Uses FluentValidation.TestHelper for cleaner test syntax.
/// </remarks>
public sealed class PasswordValidationExtensionsTests
{
	private static readonly PasswordSettings TestPasswordSettings =
		new()
		{
			MinLength = 12,
		};

	private readonly TestPasswordValidator Validator =
		new(TestPasswordSettings);

	[Fact]
	public void Password_ShouldNotHaveError_WhenValid()
	{
		// Arrange
		TestPasswordRequest request =
			new("validpassword");

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Password);
	}

	[Fact]
	public void Password_ShouldNotHaveError_WhenExactlyMinimumLength()
	{
		// Arrange - 12 characters exactly
		TestPasswordRequest request =
			new("abcdefghijkl");

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
		TestPasswordRequest request =
			new(new string('a', 100));

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Password);
	}

	[Fact]
	public void Password_ShouldNotHaveError_WhenAllLowercase()
	{
		// Arrange - no composition rules per OWASP ASVS V2.1.9
		TestPasswordRequest request =
			new("alllowercase!");

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Password);
	}

	[Fact]
	public void Password_ShouldNotHaveError_WhenNoDigits()
	{
		// Arrange - no composition rules per OWASP ASVS V2.1.9
		TestPasswordRequest request =
			new("nodigitshere!");

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
		result
			.ShouldHaveValidationErrorFor(x => x.Password)
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
		result
			.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password is required");
	}

	[Fact]
	public void Password_ShouldHaveError_WhenTooShort()
	{
		// Arrange - 11 characters (below minimum of 12)
		TestPasswordRequest request =
			new("short12345!");

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password must be at least 12 characters");
	}

	[Fact]
	public void Password_ShouldHaveError_WhenTooLong()
	{
		// Arrange - 101 characters (above maximum of 100)
		TestPasswordRequest request =
			new(new string('a', 101));

		// Act
		TestValidationResult<TestPasswordRequest> result =
			Validator.TestValidate(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password must not exceed 100 characters");
	}

	/// <summary>
	/// Test request record for password validation.
	/// </summary>
	/// <param name="Password">
	/// The password to validate.
	/// </param>
	private sealed record TestPasswordRequest(string Password);

	/// <summary>
	/// Test validator using password validation extensions.
	/// </summary>
	private sealed class TestPasswordValidator
		: AbstractValidator<TestPasswordRequest>
	{
		public TestPasswordValidator(PasswordSettings passwordSettings)
		{
			RuleFor(request => request.Password)
				.ApplyPasswordRules(passwordSettings);
		}
	}
}