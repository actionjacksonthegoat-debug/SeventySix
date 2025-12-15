// <copyright file="CommandValidatorFactoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using SeventySix.Shared.Validators;

namespace SeventySix.Shared.Tests.Validators;

/// <summary>
/// Unit tests for <see cref="CommandValidatorFactory"/>.
/// Verifies factory correctly delegates validation to request validators.
/// </summary>
public class CommandValidatorFactoryTests
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
		IValidator<TestRequest> requestValidator =
			new TestRequestValidator();

		IValidator<TestCommand> commandValidator =
			CommandValidatorFactory.CreateFor<TestCommand, TestRequest>(
				requestValidator,
				command => command.Request);

		TestCommand validCommand =
			new(new TestRequest("valid"));

		// Act
		ValidationResult result =
			await commandValidator.ValidateAsync(validCommand);

		// Assert
		Assert.True(result.IsValid);
	}

	[Fact]
	public async Task CreateFor_ReturnsValidator_ThatFailsWhenRequestInvalidAsync()
	{
		// Arrange
		IValidator<TestRequest> requestValidator =
			new TestRequestValidator();

		IValidator<TestCommand> commandValidator =
			CommandValidatorFactory.CreateFor<TestCommand, TestRequest>(
				requestValidator,
				command => command.Request);

		TestCommand invalidCommand =
			new(new TestRequest(string.Empty));

		// Act
		ValidationResult result =
			await commandValidator.ValidateAsync(invalidCommand);

		// Assert
		Assert.False(result.IsValid);
		Assert.Single(result.Errors);
		Assert.Equal("Value is required", result.Errors[0].ErrorMessage);
		Assert.Equal("Request.Value", result.Errors[0].PropertyName);
	}

	[Fact]
	public async Task CreateFor_PreservesValidationContext_WithNestedPropertyPathAsync()
	{
		// Arrange
		IValidator<TestRequest> requestValidator =
			new TestRequestValidator();

		IValidator<TestCommand> commandValidator =
			CommandValidatorFactory.CreateFor<TestCommand, TestRequest>(
				requestValidator,
				command => command.Request);

		TestCommand invalidCommand =
			new(new TestRequest(string.Empty));

		// Act
		ValidationResult result =
			await commandValidator.ValidateAsync(invalidCommand);

		// Assert
		// Property path should be "Request.Value" not just "Value"
		Assert.Equal("Request.Value", result.Errors[0].PropertyName);
	}
}
