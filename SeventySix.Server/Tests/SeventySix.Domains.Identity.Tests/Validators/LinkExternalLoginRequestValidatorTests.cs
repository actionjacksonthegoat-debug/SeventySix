// <copyright file="LinkExternalLoginRequestValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.TestHelper;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for LinkExternalLoginRequestValidator.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - UserId: must be greater than 0
/// - Provider: required
/// - ProviderUserId: required
/// - Valid request passes validation
/// </remarks>
public sealed class LinkExternalLoginRequestValidatorTests
{
	private readonly LinkExternalLoginRequestValidator Validator = new();

	#region Valid Request Tests

	[Fact]
	public async Task ValidRequest_PassesValidationAsync()
	{
		// Arrange
		LinkExternalLoginCommand command =
			new(
				UserId: 1L,
				Provider: "GitHub",
				ProviderUserId: "gh-user-123",
				FullName: "John Doe");

		// Act
		TestValidationResult<LinkExternalLoginCommand> result =
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
		LinkExternalLoginCommand command =
			new(
				UserId: 0L,
				Provider: "GitHub",
				ProviderUserId: "gh-user-123",
				FullName: null);

		// Act
		TestValidationResult<LinkExternalLoginCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.UserId);
	}

	[Fact]
	public async Task UserId_Negative_FailsValidationAsync()
	{
		// Arrange
		LinkExternalLoginCommand command =
			new(
				UserId: -1L,
				Provider: "GitHub",
				ProviderUserId: "gh-user-123",
				FullName: null);

		// Act
		TestValidationResult<LinkExternalLoginCommand> result =
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
		LinkExternalLoginCommand command =
			new(
				UserId: 1L,
				Provider: "",
				ProviderUserId: "gh-user-123",
				FullName: null);

		// Act
		TestValidationResult<LinkExternalLoginCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.Provider);
	}

	#endregion

	#region ProviderUserId Validation Tests

	[Fact]
	public async Task ProviderUserId_Empty_FailsValidationAsync()
	{
		// Arrange
		LinkExternalLoginCommand command =
			new(
				UserId: 1L,
				Provider: "GitHub",
				ProviderUserId: "",
				FullName: null);

		// Act
		TestValidationResult<LinkExternalLoginCommand> result =
			await Validator.TestValidateAsync(command);

		// Assert
		result
			.ShouldHaveValidationErrorFor(x => x.ProviderUserId);
	}

	#endregion
}