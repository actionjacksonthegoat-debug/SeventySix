// <copyright file="PasswordValidationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Settings;

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
		IRuleBuilderOptions<T, string> rules =
			ruleBuilder
				.NotEmpty()
				.WithMessage("Password is required")
				.MinimumLength(passwordSettings.MinLength)
				.WithMessage(
					$"Password must be at least {passwordSettings.MinLength} characters")
				.MaximumLength(100)
				.WithMessage("Password must not exceed 100 characters");

		if (passwordSettings.RequireUppercase)
		{
			rules =
				rules
					.Matches(@"[A-Z]")
					.WithMessage(
						"Password must contain at least one uppercase letter");
		}

		if (passwordSettings.RequireLowercase)
		{
			rules =
				rules
					.Matches(@"[a-z]")
					.WithMessage(
						"Password must contain at least one lowercase letter");
		}

		if (passwordSettings.RequireDigit)
		{
			rules =
				rules
					.Matches(@"\d")
					.WithMessage(
						"Password must contain at least one digit");
		}

		if (passwordSettings.RequireSpecialChar)
		{
			rules =
				rules
					.Matches(@"[^a-zA-Z\d]")
					.WithMessage(
						"Password must contain at least one special character");
		}

		return rules;
	}
}