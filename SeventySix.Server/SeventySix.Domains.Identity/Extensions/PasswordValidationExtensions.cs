// <copyright file="PasswordValidationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Extensions;

/// <summary>
/// Extension methods for FluentValidation password rules.
/// Centralizes password validation logic to avoid DRY violations.
/// </summary>
/// <remarks>
/// Password requirements:
/// - Minimum 8 characters
/// - Maximum 100 characters
/// - At least one uppercase letter
/// - At least one lowercase letter
/// - At least one digit
/// </remarks>
public static class PasswordValidationExtensions
{
	/// <summary>
	/// Applies standard password validation rules to a string property.
	/// </summary>
	/// <typeparam name="T">The type being validated.</typeparam>
	/// <param name="ruleBuilder">
	/// The rule builder.
	/// </param>
	/// <returns>
	/// Rule builder options for chaining.
	/// </returns>
	public static IRuleBuilderOptions<T, string> ApplyPasswordRules<T>(
		this IRuleBuilder<T, string> ruleBuilder)
	{
		return ruleBuilder
			.NotEmpty()
			.WithMessage("Password is required")
			.MinimumLength(8)
			.WithMessage("Password must be at least 8 characters")
			.MaximumLength(100)
			.WithMessage("Password must not exceed 100 characters")
			.Matches(@"[A-Z]")
			.WithMessage("Password must contain at least one uppercase letter")
			.Matches(@"[a-z]")
			.WithMessage("Password must contain at least one lowercase letter")
			.Matches(@"\d")
			.WithMessage("Password must contain at least one digit");
	}
}