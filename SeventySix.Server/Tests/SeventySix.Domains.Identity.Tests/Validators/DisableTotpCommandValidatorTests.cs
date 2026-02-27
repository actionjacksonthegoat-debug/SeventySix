// <copyright file="DisableTotpCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;
using SeventySix.Identity.Commands.DisableTotp;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for DisableTotpCommandValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - Password: required, max 100 chars
/// - Valid request passes validation
/// </remarks>
public sealed class DisableTotpCommandValidatorTests
{
	private readonly DisableTotpCommandValidator Validator = new();

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		DisableTotpRequest request =
			new("MySecureP@ss123");

		// Act
		TestValidationResult<DisableTotpRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion

	#region Password Validation Tests

	[Fact]
	public async Task Password_Empty_FailsValidationAsync()
	{
		// Arrange
		DisableTotpRequest request =
			new("");

		// Act
		TestValidationResult<DisableTotpRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password is required to disable TOTP");
	}

	[Fact]
	public async Task Password_ExceedsMaxLength_FailsValidationAsync()
	{
		// Arrange
		DisableTotpRequest request =
			new(new string('a', 101));

		// Act
		TestValidationResult<DisableTotpRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Password)
			.WithErrorMessage("Password must not exceed 100 characters");
	}

	[Fact]
	public async Task Password_AtMaxLength_PassesValidationAsync()
	{
		// Arrange
		DisableTotpRequest request =
			new(new string('a', 100));

		// Act
		TestValidationResult<DisableTotpRequest> result =
			await Validator.TestValidateAsync(request);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion
}