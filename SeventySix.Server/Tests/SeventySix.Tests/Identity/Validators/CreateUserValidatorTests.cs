// <copyright file="CreateUserValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;
using SeventySix.Identity.Commands.CreateUser;

namespace SeventySix.Tests.Identity;

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
		CreateUserRequest request = new()
		{
			Username = string.Empty,
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username is required");
	}

	[Fact]
	public void Username_ShouldHaveError_WhenNull()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = null!,
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username);
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.TooShortUsernames), MemberType = typeof(UserValidationTestData))]
	public void Username_ShouldHaveError_WhenTooShort(string username)
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = username,
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username must be between 3 and 50 characters");
	}

	[Fact]
	public void Username_ShouldHaveError_WhenTooLong()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = new string('a', 51), // 51 chars
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username must be between 3 and 50 characters");
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.InvalidUsernameCharacters), MemberType = typeof(UserValidationTestData))]
	public void Username_ShouldHaveError_WhenContainsInvalidCharacters(string username)
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = username,
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username must contain only alphanumeric characters and underscores");
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.ValidUsernames), MemberType = typeof(UserValidationTestData))]
	public void Username_ShouldNotHaveError_WhenValid(string username)
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = username,
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Username);
	}

	[Fact]
	public void Username_ShouldNotHaveError_WhenMaxLength()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = new string('a', 50), // Exactly 50 chars
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Username);
	}

	#endregion

	#region Email Validation Tests

	[Fact]
	public void Email_ShouldHaveError_WhenEmpty()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = string.Empty,
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email is required");
	}

	[Fact]
	public void Email_ShouldHaveError_WhenNull()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = null!,
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Email);
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.InvalidEmails), MemberType = typeof(UserValidationTestData))]
	public void Email_ShouldHaveError_WhenInvalidFormat(string email)
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = email,
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email must be a valid email address");
	}

	[Fact]
	public void Email_ShouldHaveError_WhenTooLong()
	{
		// Arrange
		string longEmail = new string('a', 244) + "@example.com"; // 256 chars total
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = longEmail,
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email must not exceed 255 characters");
	}

	[Theory]
	[MemberData(nameof(UserValidationTestData.ValidEmails), MemberType = typeof(UserValidationTestData))]
	public void Email_ShouldNotHaveError_WhenValid(string email)
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = email,
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Email);
	}

	[Fact]
	public void Email_ShouldNotHaveError_WhenMaxLength()
	{
		// Arrange
		string email = new string('a', 240) + "@example.co"; // Exactly 255 chars
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = email,
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Email);
	}

	#endregion

	#region FullName Validation Tests

	[Fact]
	public void FullName_ShouldHaveError_WhenEmpty()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = string.Empty,
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.FullName)
			.WithErrorMessage("Display name is required");
	}

	[Fact]
	public void FullName_ShouldHaveError_WhenWhitespace()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = "   ",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.FullName)
			.WithErrorMessage("Display name is required");
	}

	[Fact]
	public void FullName_ShouldHaveError_WhenTooLong()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = new string('a', 101), // 101 chars
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.FullName)
			.WithErrorMessage("Display name must not exceed 100 characters");
	}

	[Theory]
	[InlineData("John Doe")]
	[InlineData("Jane Smith")]
	[InlineData("A")]
	[InlineData("John Jacob Jingleheimer Schmidt")]
	public void FullName_ShouldNotHaveError_WhenValid(string fullName)
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = fullName,
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.FullName);
	}

	[Fact]
	public void FullName_ShouldNotHaveError_WhenMaxLength()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = new string('a', 100), // Exactly 100 chars
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

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
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = "Test User",
			IsActive = isActive,
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.IsActive);
	}

	#endregion

	#region Complete Request Validation Tests

	[Fact]
	public void Validator_ShouldPass_WhenAllFieldsValid()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "john_doe",
			Email = "john@example.com",
			FullName = "John Doe",
			IsActive = true,
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validator_ShouldPass_WhenOnlyRequiredFieldsProvided()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "testuser",
			Email = "test@example.com",
			FullName = "Test User",
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validator_ShouldFail_WhenMultipleFieldsInvalid()
	{
		// Arrange
		CreateUserRequest request = new()
		{
			Username = "ab", // Too short
			Email = "invalid-email", // Invalid format
			FullName = new string('a', 101), // Too long
		};

		// Act
		TestValidationResult<CreateUserRequest> result = Validator.TestValidate(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username);
		result.ShouldHaveValidationErrorFor(x => x.Email);
		result.ShouldHaveValidationErrorFor(x => x.FullName);
	}

	#endregion
}