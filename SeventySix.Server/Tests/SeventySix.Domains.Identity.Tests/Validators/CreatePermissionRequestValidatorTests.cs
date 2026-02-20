// <copyright file="CreatePermissionRequestValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.Results;
using SeventySix.Identity.Commands.CreatePermissionRequest;
using SeventySix.Identity.Constants;
using Shouldly;

namespace SeventySix.Identity.Tests.Validators;

public sealed class CreatePermissionRequestValidatorTests
{
	[Fact]
	public void Validate_ReturnsFailure_ForInvalidRoleName()
	{
		// Arrange
		CreatePermissionRequestValidator validator = new();
		CreatePermissionRequestDto dto =
			new(
				["NotARole"],
				null);
		CreatePermissionRequestCommand command =
			new(1, "tester", dto);

		// Act
		ValidationResult result =
			validator.Validate(command);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error =>
			error.ErrorMessage.Contains("Invalid role"));
	}

	[Fact]
	public void Validate_ReturnsSuccess_ForValidRoles()
	{
		// Arrange
		CreatePermissionRequestValidator validator = new();
		CreatePermissionRequestDto dto =
			new(
				[RoleConstants.Developer],
				null);
		CreatePermissionRequestCommand command =
			new(1, "tester", dto);

		// Act
		ValidationResult result =
			validator.Validate(command);

		// Assert
		result.IsValid.ShouldBeTrue();
	}
}