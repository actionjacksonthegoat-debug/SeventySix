// <copyright file="UpdateProfileCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.UpdateProfile;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for UpdateProfileCommandValidator.
/// Tests email format and full name validation rules.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Email format rules (delegated to ApplyEmailRules)
/// - FullName rules (delegated to ApplyFullNameRules)
///
/// Email uniqueness is enforced at the database level, not in the validator.
/// </remarks>
public sealed class UpdateProfileCommandValidatorTests
{
	private const long TestUserId = 42;

	private readonly UpdateProfileCommandValidator Validator;

	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateProfileCommandValidatorTests"/> class.
	/// </summary>
	public UpdateProfileCommandValidatorTests()
	{
		Validator =
			new UpdateProfileCommandValidator();
	}

	/// <summary>
	/// Tests that valid email and full name pass validation.
	/// </summary>
	[Fact]
	public async Task Validate_ValidEmailAndFullName_PassesValidationAsync()
	{
		// Arrange
		UpdateProfileCommand command =
			CreateCommand(
				email: "unique@example.com");

		// Act
		TestValidationResult<UpdateProfileCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	/// <summary>
	/// Tests that an invalid email format fails validation.
	/// </summary>
	[Fact]
	public async Task Validate_InvalidEmailFormat_ReturnsValidationErrorAsync()
	{
		// Arrange
		UpdateProfileCommand command =
			CreateCommand(
				email: "not-an-email");

		// Act
		TestValidationResult<UpdateProfileCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				profileCommand => profileCommand.Request.Email);
	}

	/// <summary>
	/// Tests that an empty email fails validation.
	/// </summary>
	[Fact]
	public async Task Validate_EmptyEmail_ReturnsValidationErrorAsync()
	{
		// Arrange
		UpdateProfileCommand command =
			CreateCommand(
				email: string.Empty);

		// Act
		TestValidationResult<UpdateProfileCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				profileCommand => profileCommand.Request.Email);
	}

	/// <summary>
	/// Tests that a too-long full name fails validation.
	/// </summary>
	[Fact]
	public async Task Validate_FullNameTooLong_ReturnsValidationErrorAsync()
	{
		// Arrange
		UpdateProfileCommand command =
			CreateCommand(
				fullName: new string('a', 101));

		// Act
		TestValidationResult<UpdateProfileCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				profileCommand => profileCommand.Request.FullName);
	}

	/// <summary>
	/// Creates an <see cref="UpdateProfileCommand"/> for testing.
	/// </summary>
	///
	/// <param name="email">
	/// The email to use in the request.
	/// </param>
	/// <param name="fullName">
	/// The full name to use in the request.
	/// </param>
	/// <param name="userId">
	/// The user ID for the command.
	/// </param>
	///
	/// <returns>
	/// A configured <see cref="UpdateProfileCommand"/>.
	/// </returns>
	private static UpdateProfileCommand CreateCommand(
		string email = "valid@example.com",
		string? fullName = "Valid Name",
		long userId = TestUserId)
	{
		UpdateProfileRequest request =
			new(
				Email: email,
				FullName: fullName);

		return new UpdateProfileCommand(
			userId,
			request);
	}
}