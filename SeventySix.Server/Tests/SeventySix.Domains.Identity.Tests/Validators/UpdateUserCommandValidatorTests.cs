// <copyright file="UpdateUserCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.UpdateUser;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for <see cref="UpdateUserCommandValidator"/>.
/// Tests all format and length validation rules for user update requests.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Id validation (must be greater than 0)
/// - Username validation (required, length, format via shared rules)
/// - Email validation (required, format, length via shared rules)
/// - FullName validation (optional, length via shared rules)
///
/// Email uniqueness is enforced at the database level, not in the validator.
/// </remarks>
public sealed class UpdateUserCommandValidatorTests
{
	private readonly UpdateUserCommandValidator Validator;

	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateUserCommandValidatorTests"/> class.
	/// </summary>
	public UpdateUserCommandValidatorTests()
	{
		Validator =
			new UpdateUserCommandValidator();
	}

	#region Id Validation Tests

	[Theory]
	[InlineData(0)]
	[InlineData(-1)]
	public async Task Id_ShouldHaveError_WhenInvalidAsync(long id)
	{
		// Arrange
		UpdateUserRequest request =
			new()
			{
				Id = id,
				Username = "validuser",
				Email = "test@example.com",
			};

		// Act
		TestValidationResult<UpdateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(request => request.Id)
			.WithErrorMessage("User ID must be greater than 0");
	}

	[Fact]
	public async Task Id_ShouldNotHaveError_WhenPositiveAsync()
	{
		// Arrange
		UpdateUserRequest request =
			new()
			{
				Id = 1,
				Username = "validuser",
				Email = "test@example.com",
			};

		// Act
		TestValidationResult<UpdateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(request => request.Id);
	}

	#endregion

	#region Username Validation Tests

	[Fact]
	public async Task Username_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		UpdateUserRequest request =
			new()
			{
				Id = 1,
				Username = string.Empty,
				Email = "test@example.com",
			};

		// Act
		TestValidationResult<UpdateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(request => request.Username)
			.WithErrorMessage("Username is required");
	}

	[Theory]
	[MemberData(
		nameof(UserValidationTestData.InvalidEmails),
		MemberType = typeof(UserValidationTestData)
	)]
	public async Task Email_ShouldHaveError_WhenInvalidAsync(string email)
	{
		// Arrange
		UpdateUserRequest request =
			new()
			{
				Id = 1,
				Username = "validuser",
				Email = email,
			};

		// Act
		TestValidationResult<UpdateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldHaveValidationErrorFor(request => request.Email);
	}

	#endregion

	#region FullName Validation Tests

	[Fact]
	public async Task FullName_ShouldNotHaveError_WhenNullAsync()
	{
		// Arrange
		UpdateUserRequest request =
			new()
			{
				Id = 1,
				Username = "validuser",
				Email = "test@example.com",
				FullName = null,
			};

		// Act
		TestValidationResult<UpdateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveValidationErrorFor(request => request.FullName);
	}

	#endregion

	#region Full Validation Tests

	[Fact]
	public async Task Validator_ShouldPass_WhenAllFieldsValidAsync()
	{
		// Arrange
		UpdateUserRequest request =
			new()
			{
				Id = 1,
				Username = "validuser",
				Email = "test@example.com",
				FullName = "Test User",
				IsActive = true,
			};

		// Act
		TestValidationResult<UpdateUserRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion
}