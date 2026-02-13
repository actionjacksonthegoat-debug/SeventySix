// <copyright file="AddUserRoleCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.AddUserRole;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for AddUserRoleCommandValidator.
/// Tests all validation rules for role assignment requests.
/// </summary>
/// <remarks>
/// Coverage Focus (80/20):
/// - UserId validation (required, positive)
/// - Role validation (required, must be valid role name)
/// - Role injection prevention (critical security)
/// </remarks>
public class AddUserRoleCommandValidatorTests
{
	private readonly AddUserRoleCommandValidator Validator = new();

	#region UserId Validation Tests

	[Fact]
	public void UserId_ShouldHaveError_WhenZeroAsync()
	{
		// Arrange
		AddUserRoleCommand command =
			new(
				UserId: 0,
				Role: RoleConstants.Developer);

		// Act
		TestValidationResult<AddUserRoleCommand> result =
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
		AddUserRoleCommand command =
			new(
				UserId: -1,
				Role: RoleConstants.Developer);

		// Act
		TestValidationResult<AddUserRoleCommand> result =
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
		AddUserRoleCommand command =
			new(
				UserId: 1,
				Role: RoleConstants.Developer);

		// Act
		TestValidationResult<AddUserRoleCommand> result =
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
		AddUserRoleCommand command =
			new(
				UserId: 1,
				Role: string.Empty);

		// Act
		TestValidationResult<AddUserRoleCommand> result =
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
		AddUserRoleCommand command =
			new(
				UserId: 1,
				Role: null!);

		// Act
		TestValidationResult<AddUserRoleCommand> result =
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
		AddUserRoleCommand command =
			new(
				UserId: 1,
				Role: invalidRole);

		// Act
		TestValidationResult<AddUserRoleCommand> result =
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
		AddUserRoleCommand command =
			new(
				UserId: 1,
				Role: validRole);

		// Act
		TestValidationResult<AddUserRoleCommand> result =
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
		AddUserRoleCommand command =
			new(
				UserId: 123,
				Role: RoleConstants.Developer);

		// Act
		TestValidationResult<AddUserRoleCommand> result =
			Validator.TestValidate(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Command_ShouldHaveMultipleErrors_WhenMultiplePropertiesInvalidAsync()
	{
		// Arrange
		AddUserRoleCommand command =
			new(
				UserId: 0,
				Role: "InvalidRole");

		// Act
		TestValidationResult<AddUserRoleCommand> result =
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