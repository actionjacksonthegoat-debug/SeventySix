// <copyright file="ValidationMockHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using Moq;

namespace SeventySix.TestUtilities.TestHelpers;

/// <summary>
/// Helper methods for mocking FluentValidation validators in tests.
/// </summary>
/// <remarks>
/// Provides convenient extension methods to reduce boilerplate code when setting up
/// validator mocks. Eliminates repetitive validation mock configuration across test classes.
///
/// Usage:
/// <code>
/// Mock&lt;IValidator&lt;CreateUserRequest&gt;&gt; mockValidator = new();
/// mockValidator.SetupSuccessfulValidation();
///
/// // Or with failures:
/// mockValidator.SetupFailedValidation("Username", "Username is required");
/// </code>
///
/// Design Patterns:
/// - Extension Methods: Adds functionality to Mock&lt;IValidator&lt;T&gt;&gt;
/// - Test Helper: Simplifies test setup
/// </remarks>
public static class ValidationMockHelper
{
	/// <summary>
	/// Sets up a validator mock to return successful validation (no errors).
	/// </summary>
	/// <typeparam name="T">The type being validated.</typeparam>
	/// <param name="validatorMock">The validator mock.</param>
	public static void SetupSuccessfulValidation<T>(this Mock<IValidator<T>> validatorMock)
	{
		ValidationResult successResult = new();

		validatorMock
			.Setup(v => v.ValidateAsync(
				It.IsAny<ValidationContext<T>>(),
				It.IsAny<CancellationToken>()))
			.ReturnsAsync(successResult);
	}

	/// <summary>
	/// Sets up a validator mock to return a failed validation with a single error.
	/// </summary>
	/// <typeparam name="T">The type being validated.</typeparam>
	/// <param name="validatorMock">The validator mock.</param>
	/// <param name="propertyName">The property that failed validation.</param>
	/// <param name="errorMessage">The validation error message.</param>
	public static void SetupFailedValidation<T>(
		this Mock<IValidator<T>> validatorMock,
		string propertyName,
		string errorMessage)
	{
		List<ValidationFailure> failures =
		[
			new ValidationFailure(propertyName, errorMessage),
		];

		ValidationResult failedResult = new(failures);

		validatorMock
			.Setup(v => v.ValidateAsync(
				It.IsAny<ValidationContext<T>>(),
				It.IsAny<CancellationToken>()))
			.ReturnsAsync(failedResult);
	}

	/// <summary>
	/// Sets up a validator mock to return a failed validation with multiple errors.
	/// </summary>
	/// <typeparam name="T">The type being validated.</typeparam>
	/// <param name="validatorMock">The validator mock.</param>
	/// <param name="failures">The validation failures.</param>
	public static void SetupFailedValidation<T>(
		this Mock<IValidator<T>> validatorMock,
		params ValidationFailure[] failures)
	{
		ValidationResult failedResult = new(failures);

		validatorMock
			.Setup(v => v.ValidateAsync(
				It.IsAny<ValidationContext<T>>(),
				It.IsAny<CancellationToken>()))
			.ReturnsAsync(failedResult);
	}

	/// <summary>
	/// Sets up a validator mock to return a failed validation with multiple property errors.
	/// </summary>
	/// <typeparam name="T">The type being validated.</typeparam>
	/// <param name="validatorMock">The validator mock.</param>
	/// <param name="errors">Dictionary of property names and their error messages.</param>
	public static void SetupFailedValidation<T>(
		this Mock<IValidator<T>> validatorMock,
		Dictionary<string, string> errors)
	{
		List<ValidationFailure> failures = errors
			.Select(kvp => new ValidationFailure(kvp.Key, kvp.Value))
			.ToList();

		ValidationResult failedResult = new(failures);

		validatorMock
			.Setup(v => v.ValidateAsync(
				It.IsAny<ValidationContext<T>>(),
				It.IsAny<CancellationToken>()))
			.ReturnsAsync(failedResult);
	}
}