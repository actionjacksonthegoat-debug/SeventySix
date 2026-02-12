// <copyright file="UpdateProfileCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Commands.UpdateProfile;
using Wolverine;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for UpdateProfileCommandValidator.
/// Tests email uniqueness validation via CQRS query.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Email uniqueness (async via CheckEmailExistsQuery with user exclusion)
/// - Email format rules (delegated to ApplyEmailRules, covered by shared tests)
/// - FullName rules (delegated to ApplyFullNameRules, covered by shared tests)
///
/// 80/20 Approach:
/// Email format and fullName rules reuse ApplyEmailRules/ApplyFullNameRules
/// which are thoroughly tested in CreateUserCommandValidatorTests.
/// These tests focus on the unique behavior: email uniqueness with UserId exclusion.
/// </remarks>
public sealed class UpdateProfileCommandValidatorTests
{
	private const long TestUserId = 42;

	private readonly IMessageBus MessageBus;
	private readonly UpdateProfileCommandValidator Validator;

	public UpdateProfileCommandValidatorTests()
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
			new UpdateProfileCommandValidator(MessageBus);
	}

	[Fact]
	public async Task Validate_DuplicateEmail_ReturnsValidationErrorAsync()
	{
		// Arrange
		MessageBus
			.InvokeAsync<bool>(
				Arg.Any<CheckEmailExistsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(true);

		UpdateProfileCommand command =
			CreateCommand(
				email: "existing@example.com");

		// Act
		TestValidationResult<UpdateProfileCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				profileCommand => profileCommand.Request.Email)
			.WithErrorMessage("Email address is already registered.");
	}

	[Fact]
	public async Task Validate_SameUserEmail_PassesValidationAsync()
	{
		// Arrange — email exists but belongs to the same user (excluded by UserId)
		MessageBus
			.InvokeAsync<bool>(
				Arg.Any<CheckEmailExistsQuery>(),
				Arg.Any<CancellationToken>())
			.Returns(false);

		UpdateProfileCommand command =
			CreateCommand(
				email: "myemail@example.com");

		// Act
		TestValidationResult<UpdateProfileCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task Validate_UniqueEmail_PassesValidationAsync()
	{
		// Arrange (default mock returns false = email doesn't exist)
		UpdateProfileCommand command =
			CreateCommand(
				email: "unique@example.com");

		// Act
		TestValidationResult<UpdateProfileCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public async Task Validate_DuplicateEmail_PassesCorrectUserIdToQueryAsync()
	{
		// Arrange
		UpdateProfileCommand command =
			CreateCommand(
				email: "test@example.com",
				userId: 99);

		// Act
		await Validator.TestValidateAsync(command);

		// Assert — verify the query was called with the correct UserId for exclusion
		await MessageBus
			.Received(1)
			.InvokeAsync<bool>(
				Arg.Is<CheckEmailExistsQuery>(
					query => query.Email == "test@example.com"
						&& query.ExcludeUserId == 99),
				Arg.Any<CancellationToken>());
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