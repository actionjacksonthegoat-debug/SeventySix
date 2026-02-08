// <copyright file="WhitelistedPermissionSettingsValidatorUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Domains.Identity.Tests.Validators;

/// <summary>
/// Unit tests for WhitelistedPermissionSettingsValidator.
/// </summary>
public sealed class WhitelistedPermissionSettingsValidatorUnitTests
{
	private readonly WhitelistedPermissionSettingsValidator Validator = new();

	[Fact]
	public void Validate_EmptyGrants_PassesValidation()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new() { Grants = [] };

		// Act
		TestValidationResult<WhitelistedPermissionSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_ValidGrant_PassesValidation()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			CreateValidSettings();

		// Act
		TestValidationResult<WhitelistedPermissionSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	[Fact]
	public void Validate_GrantWithEmptyEmail_FailsValidation()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new()
			{
				Grants =
					[
						new WhitelistedGrant
						{
							Email = string.Empty,
							Roles = ["Developer"],
						},
					],
			};

		// Act
		TestValidationResult<WhitelistedPermissionSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.IsValid.ShouldBeFalse();
	}

	[Fact]
	public void Validate_GrantWithEmptyRoles_FailsValidation()
	{
		// Arrange
		WhitelistedPermissionSettings settings =
			new()
			{
				Grants =
					[
						new WhitelistedGrant
						{
							Email = "user@test.local",
							Roles = [],
						},
					],
			};

		// Act
		TestValidationResult<WhitelistedPermissionSettings> result =
			Validator.TestValidate(settings);

		// Assert
		result.IsValid.ShouldBeFalse();
	}

	private static WhitelistedPermissionSettings CreateValidSettings() =>
		new()
		{
			Grants =
				[
					new WhitelistedGrant
					{
						Email = "user@test.local",
						Roles = ["Developer"],
					},
				],
		};
}