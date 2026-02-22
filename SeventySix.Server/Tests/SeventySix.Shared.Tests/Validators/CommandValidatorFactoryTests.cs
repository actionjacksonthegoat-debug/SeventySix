// <copyright file="CommandValidatorFactoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using SeventySix.Shared.Validators;
using Shouldly;

namespace SeventySix.Shared.Tests.Validators;

/// <summary>
/// Unit tests for <see cref="CommandValidatorFactory"/>.
/// Verifies factory correctly delegates validation to request validators.
/// </summary>
public sealed class CommandValidatorFactoryTests
{
	/// <summary>
	/// Test command with nested request.
	/// </summary>
	private record TestCommand(TestRequest Request);

	/// <summary>
	/// Test request DTO.
	/// </summary>
	private record TestRequest(string Value);

	/// <summary>
	/// Validator for test request.
	/// </summary>
	private class TestRequestValidator : AbstractValidator<TestRequest>
	{
		public TestRequestValidator()
		{
			RuleFor(request => request.Value)
				.NotEmpty()
				.WithMessage("Value is required");
		}
	}

	[Fact]
	public async Task CreateFor_ReturnsValidator_ThatValidatesRequestAsync()
	{
		// Arrange
		IValidator<TestRequest> requestValidator = new TestRequestValidator();

		IValidator<TestCommand> commandValidator =
			CommandValidatorFactory.CreateFor<TestCommand, TestRequest>(
				requestValidator,
				command => command.Request);

		TestCommand validCommand =
			new(new TestRequest("valid"));

		// Act
		ValidationResult result =
			await commandValidator.ValidateAsync(
			validCommand);

		// Assert
		result.IsValid.ShouldBeTrue();
	}

	[Fact]
	public async Task CreateFor_ReturnsValidator_ThatFailsWhenRequestInvalidAsync()
	{
		// Arrange
		IValidator<TestRequest> requestValidator = new TestRequestValidator();

		IValidator<TestCommand> commandValidator =
			CommandValidatorFactory.CreateFor<TestCommand, TestRequest>(
				requestValidator,
				command => command.Request);

		TestCommand invalidCommand =
			new(new TestRequest(string.Empty));

		// Act
		ValidationResult result =
			await commandValidator.ValidateAsync(
			invalidCommand);

		// Assert
		result.IsValid.ShouldBeFalse();
		result.Errors.ShouldHaveSingleItem();
		result.Errors[0].ErrorMessage.ShouldBe("Value is required");
		result.Errors[0].PropertyName.ShouldBe("Request.Value");
	}

	[Fact]
	public async Task CreateFor_PreservesValidationContext_WithNestedPropertyPathAsync()
	{
		// Arrange
		IValidator<TestRequest> requestValidator = new TestRequestValidator();

		IValidator<TestCommand> commandValidator =
			CommandValidatorFactory.CreateFor<TestCommand, TestRequest>(
				requestValidator,
				command => command.Request);

		TestCommand invalidCommand =
			new(new TestRequest(string.Empty));

		// Act
		ValidationResult result =
			await commandValidator.ValidateAsync(
			invalidCommand);

		// Assert
		// Property path should be "Request.Value" not just "Value"
		result.Errors[0].PropertyName.ShouldBe("Request.Value");
	}
}