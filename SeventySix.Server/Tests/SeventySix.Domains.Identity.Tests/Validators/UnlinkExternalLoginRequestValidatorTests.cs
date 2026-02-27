// <copyright file="UnlinkExternalLoginRequestValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for UnlinkExternalLoginRequestValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - UserId: must be greater than 0
/// - Provider: required
/// - Valid request passes validation
/// </remarks>
public sealed class UnlinkExternalLoginRequestValidatorTests
{
	private readonly UnlinkExternalLoginRequestValidator Validator = new();

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		UnlinkExternalLoginCommand command =
			new(
				UserId: 5L,
				Provider: "GitHub");

		// Act
		TestValidationResult<UnlinkExternalLoginCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result.ShouldNotHaveAnyValidationErrors();
	}

	#endregion

	#region UserId Validation Tests

	[Fact]
	public async Task UserId_Zero_FailsValidationAsync()
	{
		// Arrange
		UnlinkExternalLoginCommand command =
			new(
				UserId: 0L,
				Provider: "GitHub");

		// Act
		TestValidationResult<UnlinkExternalLoginCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.UserId);
	}

	[Fact]
	public async Task UserId_Negative_FailsValidationAsync()
	{
		// Arrange
		UnlinkExternalLoginCommand command =
			new(
				UserId: -5L,
				Provider: "GitHub");

		// Act
		TestValidationResult<UnlinkExternalLoginCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.UserId);
	}

	#endregion

	#region Provider Validation Tests

	[Fact]
	public async Task Provider_Empty_FailsValidationAsync()
	{
		// Arrange
		UnlinkExternalLoginCommand command =
			new(
				UserId: 5L,
				Provider: "");

		// Act
		TestValidationResult<UnlinkExternalLoginCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Provider);
	}

	#endregion
}