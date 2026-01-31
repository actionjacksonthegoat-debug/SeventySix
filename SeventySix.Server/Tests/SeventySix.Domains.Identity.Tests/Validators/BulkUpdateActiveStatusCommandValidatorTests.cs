// <copyright file="BulkUpdateActiveStatusCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;
using SeventySix.Identity.Commands.BulkUpdateActiveStatus;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for BulkUpdateActiveStatusCommandValidator.
/// Tests validation rules for bulk status update requests.
/// </summary>
/// <remarks>
/// Coverage Focus (80/20):
/// - UserIds validation (required, not empty, positive values)
/// - ModifiedBy validation (required)
/// </remarks>
public class BulkUpdateActiveStatusCommandValidatorTests
{
	private readonly BulkUpdateActiveStatusCommandValidator Validator = new();

	[Fact]
	public void UserIds_ShouldHaveError_WhenNullAsync()
	{
		// Arrange
		BulkUpdateActiveStatusCommand command =
			new(
				UserIds: null!,
				IsActive: true,
				ModifiedBy: "admin@test.com");

		// Act
		TestValidationResult<BulkUpdateActiveStatusCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.UserIds)
			.WithErrorMessage("At least one user ID is required");
	}

	[Fact]
	public void UserIds_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		BulkUpdateActiveStatusCommand command =
			new(
				UserIds: [],
				IsActive: true,
				ModifiedBy: "admin@test.com");

		// Act
		TestValidationResult<BulkUpdateActiveStatusCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.UserIds)
			.WithErrorMessage("At least one user ID is required");
	}

	[Fact]
	public void UserIds_ShouldHaveError_WhenContainsZeroAsync()
	{
		// Arrange
		BulkUpdateActiveStatusCommand command =
			new(
				UserIds: [1, 0, 3],
				IsActive: true,
				ModifiedBy: "admin@test.com");

		// Act
		TestValidationResult<BulkUpdateActiveStatusCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.UserIds)
			.WithErrorMessage("All user IDs must be greater than zero");
	}

	[Fact]
	public void ModifiedBy_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		BulkUpdateActiveStatusCommand command =
			new(
				UserIds: [1, 2],
				IsActive: true,
				ModifiedBy: string.Empty);

		// Act
		TestValidationResult<BulkUpdateActiveStatusCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.ModifiedBy)
			.WithErrorMessage("ModifiedBy is required");
	}

	[Fact]
	public void Command_ShouldBeValid_WhenAllPropertiesValidAsync()
	{
		// Arrange
		BulkUpdateActiveStatusCommand command =
			new(
				UserIds: [1, 2, 3],
				IsActive: false,
				ModifiedBy: "admin@test.com");

		// Act
		TestValidationResult<BulkUpdateActiveStatusCommand> result =
			Validator.TestValidate(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}
}