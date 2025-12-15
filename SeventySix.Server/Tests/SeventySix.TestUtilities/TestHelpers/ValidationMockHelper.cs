// <copyright file="ValidationMockHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using NSubstitute;

namespace SeventySix.TestUtilities.TestHelpers;

/// <summary>
/// Helper methods for mocking FluentValidation validators in tests.
/// </summary>
public static class ValidationMockHelper
{
	/// <summary>
	/// Sets up a validator substitute to return successful validation (no errors).
	/// </summary>
	public static void SetupSuccessfulValidation<T>(
		this IValidator<T> validator)
	{
		ValidationResult successResult = new();

		validator
			.ValidateAsync(
				Arg.Any<ValidationContext<T>>(),
				Arg.Any<CancellationToken>())
			.Returns(successResult);
	}

	/// <summary>
	/// Sets up a validator substitute to return a failed validation with a single error.
	/// </summary>
	public static void SetupFailedValidation<T>(
		this IValidator<T> validator,
		string propertyName,
		string errorMessage)
	{
		List<ValidationFailure> failures =
		[
			new ValidationFailure(propertyName, errorMessage),
		];
		ValidationResult failedResult =
			new(failures);

		validator
			.ValidateAsync(
				Arg.Any<ValidationContext<T>>(),
				Arg.Any<CancellationToken>())
			.Returns(failedResult);
	}

	/// <summary>
	/// Sets up a validator substitute to return a failed validation with multiple errors.
	/// </summary>
	public static void SetupFailedValidation<T>(
		this IValidator<T> validator,
		params ValidationFailure[] failures)
	{
		ValidationResult failedResult =
			new(failures);

		validator
			.ValidateAsync(
				Arg.Any<ValidationContext<T>>(),
				Arg.Any<CancellationToken>())
			.Returns(failedResult);
	}

	/// <summary>
	/// Sets up a validator substitute to return a failed validation with multiple property errors.
	/// </summary>
	public static void SetupFailedValidation<T>(
		this IValidator<T> validator,
		Dictionary<string, string> errors)
	{
		List<ValidationFailure> failures =
			errors
			.Select(kvp => new ValidationFailure(kvp.Key, kvp.Value))
			.ToList();

		ValidationResult failedResult =
			new(failures);

		validator
			.ValidateAsync(
				Arg.Any<ValidationContext<T>>(),
				Arg.Any<CancellationToken>())
			.Returns(failedResult);
	}
}
