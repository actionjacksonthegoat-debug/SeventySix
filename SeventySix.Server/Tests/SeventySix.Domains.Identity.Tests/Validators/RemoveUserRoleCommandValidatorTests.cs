// <copyright file="RemoveUserRoleCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.RemoveUserRole;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for RemoveUserRoleCommandValidator.
/// Tests all validation rules for role removal requests.
/// </summary>
/// <remarks>
/// Coverage Focus (80/20):
/// - UserId validation (required, positive)
/// - Role validation (required, must be valid role name)
/// - Role manipulation prevention (critical security)
/// </remarks>
public sealed class RemoveUserRoleCommandValidatorTests
{
	private readonly RemoveUserRoleCommandValidator Validator = new();

	#region UserId Validation Tests

	[Fact]
	public void UserId_ShouldHaveError_WhenZeroAsync()
	{
		// Arrange
		RemoveUserRoleCommand command =
			new(
				UserId: 0,
				Role: RoleConstants.Developer);

		// Act
		TestValidationResult<RemoveUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.UserId)
			.WithErrorMessage("User ID must be greater than zero");
	}

	[Fact]
	public void UserId_ShouldHaveError_WhenNegativeAsync()
	{
		// Arrange
		RemoveUserRoleCommand command =
			new(
				UserId: -1,
				Role: RoleConstants.Developer);

		// Act
		TestValidationResult<RemoveUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.UserId)
			.WithErrorMessage("User ID must be greater than zero");
	}

	[Fact]
	public void UserId_ShouldNotHaveError_WhenValidAsync()
	{
		// Arrange
		RemoveUserRoleCommand command =
			new(
				UserId: 1,
				Role: RoleConstants.Developer);

		// Act
		TestValidationResult<RemoveUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldNotHaveValidationErrorFor(
				command => command.UserId);
	}

	#endregion

	#region Role Validation Tests

	[Fact]
	public void Role_ShouldHaveError_WhenEmptyAsync()
	{
		// Arrange
		RemoveUserRoleCommand command =
			new(
				UserId: 1,
				Role: string.Empty);

		// Act
		TestValidationResult<RemoveUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.Role)
			.WithErrorMessage("Role is required");
	}

	[Fact]
	public void Role_ShouldHaveError_WhenNullAsync()
	{
		// Arrange
		RemoveUserRoleCommand command =
			new(
				UserId: 1,
				Role: null!);

		// Act
		TestValidationResult<RemoveUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.Role);
	}

	[Theory]
	[InlineData("SuperAdmin")]
	[InlineData("Root")]
	[InlineData("SystemAdmin")]
	[InlineData("InvalidRole")]
	public void Role_ShouldHaveError_WhenInvalidRoleNameAsync(string invalidRole)
	{
		// Arrange
		RemoveUserRoleCommand command =
			new(
				UserId: 1,
				Role: invalidRole);

		// Act
		TestValidationResult<RemoveUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.Role)
			.WithErrorMessage("Role must be a valid system role");
	}

	[Theory]
	[InlineData("Developer")]
	[InlineData("Admin")]
	[InlineData("developer")] // Case insensitive
	[InlineData("ADMIN")] // Case insensitive
	[InlineData("admin ")] // Trailing space normalized
	[InlineData(" Admin")] // Leading space normalized
	public void Role_ShouldNotHaveError_WhenValidRoleNameAsync(string validRole)
	{
		// Arrange
		RemoveUserRoleCommand command =
			new(
				UserId: 1,
				Role: validRole);

		// Act
		TestValidationResult<RemoveUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldNotHaveValidationErrorFor(
				command => command.Role);
	}

	#endregion

	#region Combined Validation Tests

	[Fact]
	public void Command_ShouldBeValid_WhenAllPropertiesValidAsync()
	{
		// Arrange
		RemoveUserRoleCommand command =
			new(
				UserId: 123,
				Role: RoleConstants.Developer);

		// Act
		TestValidationResult<RemoveUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Command_ShouldHaveMultipleErrors_WhenMultiplePropertiesInvalidAsync()
	{
		// Arrange
		RemoveUserRoleCommand command =
			new(
				UserId: 0,
				Role: "InvalidRole");

		// Act
		TestValidationResult<RemoveUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(
				command => command.UserId);
		result
			.ShouldHaveValidationErrorFor(
				command => command.Role);
	}

	#endregion
}