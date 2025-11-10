// <copyright file="CreateUserValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Validators;

namespace SeventySix.BusinessLogic.Tests.Validators;

/// <summary>
/// Unit tests for CreateUserValidator.
/// Tests all validation rules for user creation requests.
/// </summary>
/// <remarks>
/// Following TDD principles:
/// - Test valid scenarios (should pass)
/// - Test invalid scenarios (should fail)
/// - Test boundary conditions
/// - Test each validation rule independently
///
/// Uses FluentValidation.TestHelper for cleaner test syntax.
///
/// Coverage Focus:
/// - Username validation (required, length, format)
/// - Email validation (required, format, length)
/// - FullName validation (optional, length)
/// - IsActive validation (no rules, just acceptance)
/// </remarks>
public class CreateUserValidatorTests
{
	private readonly CreateUserValidator Validator = new();

	#region Username Validation Tests

	[Fact]
	public void Username_ShouldHaveError_WhenEmpty()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = string.Empty,
			Email = "test@example.com",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username is required");
	}

	[Fact]
	public void Username_ShouldHaveError_WhenNull()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = null!,
			Email = "test@example.com",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username);
	}

	[Theory]
	[InlineData("ab")] // Too short (2 chars)
	[InlineData("a")] // Too short (1 char)
	public void Username_ShouldHaveError_WhenTooShort(string username)
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = username,
			Email = "test@example.com",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username must be between 3 and 50 characters");
	}

	[Fact]
	public void Username_ShouldHaveError_WhenTooLong()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = new string('a', 51), // 51 chars
			Email = "test@example.com",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username must be between 3 and 50 characters");
	}

	[Theory]
	[InlineData("user name")] // Contains space
	[InlineData("user-name")] // Contains hyphen
	[InlineData("user.name")] // Contains dot
	[InlineData("user@name")] // Contains @
	[InlineData("user#name")] // Contains special char
	[InlineData("user!name")] // Contains exclamation
	public void Username_ShouldHaveError_WhenContainsInvalidCharacters(string username)
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = username,
			Email = "test@example.com",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username must contain only alphanumeric characters and underscores");
	}

	[Theory]
	[InlineData("abc")] // Min length (3 chars)
	[InlineData("user123")] // Alphanumeric
	[InlineData("john_doe")] // With underscore
	[InlineData("User_123")] // Mixed case with number and underscore
	[InlineData("A1_b2_C3")] // Complex valid format
	public void Username_ShouldNotHaveError_WhenValid(string username)
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = username,
			Email = "test@example.com",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Username);
	}

	[Fact]
	public void Username_ShouldNotHaveError_WhenMaxLength()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = new string('a', 50), // Exactly 50 chars
			Email = "test@example.com",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Username);
	}

	#endregion

	#region Email Validation Tests

	[Fact]
	public void Email_ShouldHaveError_WhenEmpty()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = string.Empty,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email is required");
	}

	[Fact]
	public void Email_ShouldHaveError_WhenNull()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = null!,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Email);
	}

	[Theory]
	[InlineData("notanemail")] // No @ symbol
	[InlineData("@example.com")] // Missing local part
	[InlineData("user@")] // Missing domain
	[InlineData("user @example.com")] // Space in local part
	[InlineData("user@exam ple.com")] // Space in domain
	[InlineData("user@@example.com")] // Double @
	public void Email_ShouldHaveError_WhenInvalidFormat(string email)
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = email,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email must be a valid email address");
	}

	[Fact]
	public void Email_ShouldHaveError_WhenTooLong()
	{
		// Arrange
		var longEmail = new string('a', 244) + "@example.com"; // 256 chars total
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = longEmail,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email must not exceed 255 characters");
	}

	[Theory]
	[InlineData("user@example.com")]
	[InlineData("john.doe@example.com")]
	[InlineData("user+tag@example.co.uk")]
	[InlineData("test_user123@sub.example.com")]
	[InlineData("a@b.co")]
	public void Email_ShouldNotHaveError_WhenValid(string email)
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = email,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Email);
	}

	[Fact]
	public void Email_ShouldNotHaveError_WhenMaxLength()
	{
		// Arrange
		var email = new string('a', 240) + "@example.co"; // Exactly 255 chars
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = email,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Email);
	}

	#endregion

	#region FullName Validation Tests

	[Fact]
	public void FullName_ShouldNotHaveError_WhenNull()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = null,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.FullName);
	}

	[Fact]
	public void FullName_ShouldNotHaveError_WhenEmpty()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = string.Empty,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.FullName);
	}

	[Fact]
	public void FullName_ShouldNotHaveError_WhenWhitespace()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = "   ",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.FullName);
	}

	[Fact]
	public void FullName_ShouldHaveError_WhenTooLong()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = new string('a', 101), // 101 chars
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.FullName)
			.WithErrorMessage("Full name must not exceed 100 characters");
	}

	[Theory]
	[InlineData("John Doe")]
	[InlineData("Jane Smith")]
	[InlineData("A")]
	[InlineData("John Jacob Jingleheimer Schmidt")]
	public void FullName_ShouldNotHaveError_WhenValid(string fullName)
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = fullName,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.FullName);
	}

	[Fact]
	public void FullName_ShouldNotHaveError_WhenMaxLength()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = new string('a', 100), // Exactly 100 chars
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.FullName);
	}

	#endregion

	#region IsActive Validation Tests

	[Theory]
	[InlineData(true)]
	[InlineData(false)]
	public void IsActive_ShouldNotHaveError_ForAnyValue(bool isActive)
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = "test@example.com",
			IsActive = isActive,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.IsActive);
	}

	#endregion

	#region Complete Request Validation Tests

	[Fact]
	public void Validator_ShouldPass_WhenAllFieldsValid()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "john_doe",
			Email = "john@example.com",
			FullName = "John Doe",
			IsActive = true,
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validator_ShouldPass_WhenOnlyRequiredFieldsProvided()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "testuser",
			Email = "test@example.com",
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validator_ShouldFail_WhenMultipleFieldsInvalid()
	{
		// Arrange
		var request = new CreateUserRequest
		{
			Username = "ab", // Too short
			Email = "invalid-email", // Invalid format
			FullName = new string('a', 101), // Too long
		};

		// Act
		var result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username);
		result.ShouldHaveValidationErrorFor(x => x.Email);
		result.ShouldHaveValidationErrorFor(x => x.FullName);
	}

	#endregion
}
