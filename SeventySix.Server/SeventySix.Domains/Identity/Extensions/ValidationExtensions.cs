// <copyright file="ValidationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation.Results;

namespace SeventySix.Identity.Extensions;

/// <summary>
/// Extension methods for FluentValidation results.
/// Provides reusable error message formatting (DRY).
/// </summary>
public static class ValidationExtensions
{
	/// <summary>
	/// Converts validation errors to single error message string.
	/// </summary>
	/// <param name="result">
	/// The validation result containing errors.
	/// </param>
	/// <returns>
	/// Space-separated error messages from all validation failures.
	/// </returns>
	/// <example>
	/// <code>
	/// ValidationResult result = await validator.ValidateAsync(request);
	/// if (!result.IsValid)
	/// {
	///     return AuthResult.Failed(result.ToErrorMessage(), "VALIDATION_ERROR");
	/// }
	/// </code>
	/// </example>
	public static string ToErrorMessage(this ValidationResult result) =>
		string.Join(
			" ",
			result.Errors.Select(error => error.ErrorMessage));
}