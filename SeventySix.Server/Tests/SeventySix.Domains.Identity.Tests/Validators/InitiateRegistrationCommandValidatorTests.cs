// <copyright file="InitiateRegistrationCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.Results;
using SeventySix.Identity.Commands.InitiateRegistration;
using Shouldly;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for <see cref="InitiateRegistrationCommandValidator"/>.
/// </summary>
public sealed class InitiateRegistrationCommandValidatorTests
{
	private readonly InitiateRegistrationCommandValidator Validator = new();

	[Fact]
	public async Task ValidateAsync_ReturnsValid_WhenEmailIsValidAsync()
	{
		// Arrange
		InitiateRegistrationRequest request =
			new("test@example.com");

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeTrue();
	}

	[Theory]
	[InlineData("")]
	[InlineData(null)]
	public async Task ValidateAsync_ReturnsInvalid_WhenEmailIsEmptyAsync(
		string? email)
	{
		// Arrange
		InitiateRegistrationRequest request =
			new(email!);

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Email");
	}

	[Theory]
	[InlineData("invalid-email")]
	[InlineData("@nodomain.com")]
	public async Task ValidateAsync_ReturnsInvalid_WhenEmailFormatIsInvalidAsync(
		string email)
	{
		// Arrange
		InitiateRegistrationRequest request =
			new(email);

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Email");
	}

	[Fact]
	public async Task ValidateAsync_ReturnsInvalid_WhenEmailExceedsMaxLengthAsync()
	{
		// Arrange
		string longEmail =
			$"{new string('a', 250)}@test.com";

		InitiateRegistrationRequest request =
			new(longEmail);

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Email");
	}

	[Theory]
	[InlineData("user@example.com")]
	[InlineData("user.name@domain.org")]
	[InlineData("user+tag@subdomain.domain.co.uk")]
	public async Task ValidateAsync_ReturnsValid_ForVariousValidEmailFormatsAsync(
		string email)
	{
		// Arrange
		InitiateRegistrationRequest request =
			new(email);

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeTrue();
	}
}