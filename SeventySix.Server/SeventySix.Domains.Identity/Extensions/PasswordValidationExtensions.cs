// <copyright file="PasswordValidationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Extensions;

/// <summary>
/// Extension methods for FluentValidation password rules.
/// Centralizes password validation logic to avoid DRY violations.
/// Rules are driven by <see cref="PasswordSettings"/> configuration.
/// </summary>
public static class PasswordValidationExtensions
{
	/// <summary>
	/// Applies standard password validation rules to a string property.
	/// Rules are driven by <see cref="PasswordSettings"/> for DRY compliance
	/// with ASP.NET Identity configuration.
	/// </summary>
	/// <typeparam name="T">
	/// The type being validated.
	/// </typeparam>
	///
	/// <param name="ruleBuilder">
	/// The rule builder.
	/// </param>
	///
	/// <param name="passwordSettings">
	/// The password configuration settings.
	/// </param>
	///
	/// <returns>
	/// Rule builder options for chaining.
	/// </returns>
	public static IRuleBuilderOptions<T, string> ApplyPasswordRules<T>(
		this IRuleBuilder<T, string> ruleBuilder,
		PasswordSettings passwordSettings)
	{
		return ruleBuilder
			.NotEmpty()
			.WithMessage("Password is required")
			.MinimumLength(passwordSettings.MinLength)
			.WithMessage(
				$"Password must be at least {passwordSettings.MinLength} characters")
			.MaximumLength(100)
			.WithMessage("Password must not exceed 100 characters");
	}
}