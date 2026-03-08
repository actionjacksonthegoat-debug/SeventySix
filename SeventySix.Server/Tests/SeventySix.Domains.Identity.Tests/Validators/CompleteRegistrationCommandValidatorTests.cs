// <copyright file="CompleteRegistrationCommandValidatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.Results;
using SeventySix.Identity.Commands.CompleteRegistration;
using Shouldly;

namespace SeventySix.Identity.Tests.Validators;

/// <summary>
/// Unit tests for <see cref="CompleteRegistrationCommandValidator"/>.
/// </summary>
public sealed class CompleteRegistrationCommandValidatorTests
{
	private static readonly PasswordSettings TestPasswordSettings =
		new()
		{
			MinLength = 12,
		};

	private readonly CompleteRegistrationCommandValidator Validator =
		new(TestPasswordSettings);

	[Fact]
	public async Task ValidateAsync_ReturnsValid_WhenAllFieldsValidAsync()
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "valid-token-123",
				Username: "testuser",
				Password: "longpassword1");

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeTrue();
	}

	[Theory]
	[InlineData("")]
	[InlineData(null)]
	public async Task ValidateAsync_ReturnsInvalid_WhenTokenIsEmptyAsync(
		string? token)
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: token!,
				Username: "testuser",
				Password: "longpassword1");

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Token");
	}

	[Theory]
	[InlineData("")]
	[InlineData(null)]
	public async Task ValidateAsync_ReturnsInvalid_WhenUsernameIsEmptyAsync(
		string? username)
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "valid-token",
				Username: username!,
				Password: "longpassword1");

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Username");
	}

	[Theory]
	[InlineData("ab")]
	[InlineData("a")]
	public async Task ValidateAsync_ReturnsInvalid_WhenUsernameTooShortAsync(
		string username)
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "valid-token",
				Username: username,
				Password: "longpassword1");

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Username");
	}

	[Fact]
	public async Task ValidateAsync_ReturnsInvalid_WhenUsernameTooLongAsync()
	{
		// Arrange
		string longUsername =
			new string('a', 51);

		CompleteRegistrationRequest request =
			new(
				Token: "valid-token",
				Username: longUsername,
				Password: "longpassword1");

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Username");
	}

	[Theory]
	[InlineData("user name")]
	[InlineData("user-name")]
	[InlineData("user@name")]
	[InlineData("user.name")]
	public async Task ValidateAsync_ReturnsInvalid_WhenUsernameContainsInvalidCharactersAsync(
		string username)
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "valid-token",
				Username: username,
				Password: "longpassword1");

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Username");
	}

	[Theory]
	[InlineData("testuser")]
	[InlineData("test_user")]
	[InlineData("TestUser123")]
	[InlineData("_underscore_")]
	public async Task ValidateAsync_ReturnsValid_ForVariousValidUsernamesAsync(
		string username)
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "valid-token",
				Username: username,
				Password: "longpassword1");

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeTrue();
	}

	[Theory]
	[InlineData("")]
	[InlineData(null)]
	public async Task ValidateAsync_ReturnsInvalid_WhenPasswordIsEmptyAsync(
		string? password)
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "valid-token",
				Username: "testuser",
				Password: password!);

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Password");
	}

	[Theory]
	[InlineData("ShortPass1")]
	[InlineData("12345678901")]
	public async Task ValidateAsync_ReturnsInvalid_WhenPasswordTooShortAsync(
		string password)
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "valid-token",
				Username: "testuser",
				Password: password);

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldContain(error => error.PropertyName == "Password");
	}

	[Fact]
	public async Task ValidateAsync_ReturnsValid_WhenPasswordMeetsLengthRequirementAsync()
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "valid-token",
				Username: "testuser",
				Password: "lowercase123");

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeTrue();
	}

	[Theory]
	[InlineData("SecurePass123!")]
	[InlineData("MyP@ssw0rd12")]
	[InlineData("Test_User_123!")]
	[InlineData("VeryL0ng&SecurePassword!")]
	[InlineData("lowercase123")]
	public async Task ValidateAsync_ReturnsValid_ForVariousValidPasswordsAsync(
		string password)
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "valid-token",
				Username: "testuser",
				Password: password);

		// Act
		ValidationResult result =
			await Validator.ValidateAsync(request);

		// Assert
		result.IsValid.ShouldBeTrue();
	}
}