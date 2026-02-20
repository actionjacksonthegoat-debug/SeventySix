// <copyright file="CreateUserCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using NSubstitute;
using SeventySix.Identity.Commands.CreateUser;
using Wolverine;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for CreateUserCommandValidator.
/// Tests all validation rules for user creation requests.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Username validation (required, length, format)
/// - Email validation (required, format, length)
/// - Email uniqueness (async via CheckEmailExistsQuery)
/// - FullName validation (optional, length)
/// - IsActive validation (no rules, just acceptance)
/// </remarks>
public sealed class CreateUserCommandValidatorTests
{
	private readonly IMessageBus MessageBus;
	private readonly CreateUserCommandValidator Validator;

	public CreateUserCommandValidatorTests()
	{
		MessageBus =
			Substitute.For<IMessageBus>();

		// Default: email does not exist (valid)
		MessageBus
			.InvokeAsync<bool>(
				Arg.Any<CheckEmailExistsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(false);

		Validator =
			new CreateUserCommandValidator(MessageBus);
	}

	#region Username Validation Tests

	[Fact]
	public async Task Username_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = string.Empty,
				Email = "test@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username is required");
	}

	[Fact]
	public async Task Username_ShouldHaveError_WhenNullAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username =
					null!,
				Email = "test@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username);
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.TooShortUsernames),
		MemberType = typeof(UserValidationTestData)
	)]
	public async Task Username_ShouldHaveError_WhenTooShortAsync(string username)
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = username,
				Email = "test@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username must be between 3 and 50 characters");
	}

	[Fact]
	public async Task Username_ShouldHaveError_WhenTooLongAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username =
					new string('a', 51), // 51 chars
				Email = "test@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage("Username must be between 3 and 50 characters");
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.InvalidUsernameCharacters),
		MemberType = typeof(UserValidationTestData)
	)]
	public async Task Username_ShouldHaveError_WhenContainsInvalidCharactersAsync(
		string username)
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = username,
				Email = "test@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Username)
			.WithErrorMessage(
				"Username must contain only alphanumeric characters and underscores");
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.ValidUsernames),
		MemberType = typeof(UserValidationTestData)
	)]
	public async Task Username_ShouldNotHaveError_WhenValidAsync(string username)
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = username,
				Email = "test@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Username);
	}

	[Fact]
	public async Task Username_ShouldNotHaveError_WhenMaxLengthAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username =
					new string('a', 50), // Exactly 50 chars
				Email = "test@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Username);
	}

	#endregion

	#region Email Validation Tests

	[Fact]
	public async Task Email_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = string.Empty,
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email is required");
	}

	[Fact]
	public async Task Email_ShouldHaveError_WhenNullAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email =
					null!,
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Email);
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.InvalidEmails),
		MemberType = typeof(UserValidationTestData)
	)]
	public async Task Email_ShouldHaveError_WhenInvalidFormatAsync(string email)
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = email,
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email must be a valid email address");
	}

	[Fact]
	public async Task Email_ShouldHaveError_WhenTooLongAsync()
	{
		// Arrange
		string longEmail =
			new string('a', 244) + "@example.com"; // 256 chars total
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = longEmail,
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Email)
			.WithErrorMessage("Email must not exceed 255 characters");
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.ValidEmails),
		MemberType = typeof(UserValidationTestData)
	)]
	public async Task Email_ShouldNotHaveError_WhenValidAsync(string email)
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = email,
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Email);
	}

	[Fact]
	public async Task Email_ShouldNotHaveError_WhenMaxLengthAsync()
	{
		// Arrange
		string email =
			new string('a', 240) + "@example.co"; // Exactly 255 chars
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = email,
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.Email);
	}

	#endregion

	#region FullName Validation Tests

	[Fact]
	public async Task FullName_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName = string.Empty,
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.FullName)
			.WithErrorMessage("Display name is required");
	}

	[Fact]
	public async Task FullName_ShouldHaveError_WhenWhitespaceAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName = "   ",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.FullName)
			.WithErrorMessage("Display name is required");
	}

	[Fact]
	public async Task FullName_ShouldHaveError_WhenTooLongAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName =
					new string('a', 101), // 101 chars
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.FullName)
			.WithErrorMessage("Display name must not exceed 100 characters");
	}

	[Theory]
	[InlineData("John Doe")]
	[InlineData("Jane Smith")]
	[InlineData("A")]
	[InlineData("John Jacob Jingleheimer Schmidt")]
	public async Task FullName_ShouldNotHaveError_WhenValidAsync(string fullName)
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName = fullName,
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.FullName);
	}

	[Fact]
	public async Task FullName_ShouldNotHaveError_WhenMaxLengthAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName =
					new string('a', 100), // Exactly 100 chars
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.FullName);
	}

	#endregion

	#region IsActive Validation Tests

	[Theory]
	[InlineData(true)]
	[InlineData(false)]
	public async Task IsActive_ShouldNotHaveError_ForAnyValueAsync(bool isActive)
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName = "Test User",
				IsActive = isActive,
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(x => x.IsActive);
	}

	#endregion

	#region Complete Request Validation Tests

	[Fact]
	public async Task Validator_ShouldPass_WhenAllFieldsValidAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "john_doe",
				Email = "john@example.com",
				FullName = "John Doe",
				IsActive = true,
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task Validator_ShouldPass_WhenOnlyRequiredFieldsProvidedAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "test@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task Validator_ShouldFail_WhenMultipleFieldsInvalidAsync()
	{
		// Arrange
		CreateUserRequest request =
			new()
			{
				Username = "ab", // Too short
				Email = "invalid-email", // Invalid format
				FullName =
					new string('a', 101), // Too long
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(x => x.Username);
		result.ShouldHaveValidationErrorFor(x => x.Email);
		result.ShouldHaveValidationErrorFor(x => x.FullName);
	}

	#endregion

	#region Email Uniqueness Tests

	[Fact]
	public async Task Email_ShouldHaveError_WhenAlreadyRegisteredAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<bool>(
				Arg.Any<CheckEmailExistsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(true);

		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "existing@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(user => user.Email)
			.WithErrorMessage("Email address is already registered.");
	}

	[Fact]
	public async Task Email_ShouldNotHaveError_WhenUniqueAsync()
	{
		// Arrange (default mock returns false = email doesn't exist)
		CreateUserRequest request =
			new()
			{
				Username = "testuser",
				Email = "unique@example.com",
				FullName = "Test User",
			};

		// Act
		TestValidationResult<CreateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion
}