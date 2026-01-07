// <copyright file="CreatePermissionRequestValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.Results;
using SeventySix.Identity;
using SeventySix.Identity.Commands.CreatePermissionRequest;
using SeventySix.Identity.Constants;
using Shouldly;
using Xunit;

namespace SeventySix.Domains.Tests.Identity.Validators;

public class CreatePermissionRequestValidatorTests
{
	[Fact]
	public void Validate_ReturnsFailure_ForInvalidRoleName()
	{
		// Arrange
		CreatePermissionRequestValidator validator = new();
		CreatePermissionRequestDto dto =
			new(["NotARole"], null);
		CreatePermissionRequestCommand command =
			new(1, "tester", dto);

		// Act
		ValidationResult result =
			validator.Validate(command);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(e =>
			e.ErrorMessage.Contains("Invalid role"));
	}

	[Fact]
	public void Validate_ReturnsSuccess_ForValidRoles()
	{
		// Arrange
		CreatePermissionRequestValidator validator = new();
		CreatePermissionRequestDto dto =
			new([RoleConstants.Developer], null);
		CreatePermissionRequestCommand command =
			new(1, "tester", dto);

		// Act
		ValidationResult result =
			validator.Validate(command);

		// Assert
		result.IsValid.ShouldBeTrue();
	}
}