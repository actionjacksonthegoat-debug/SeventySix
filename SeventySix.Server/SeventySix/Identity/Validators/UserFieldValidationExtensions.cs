// <copyright file="UserFieldValidationExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Extension methods for FluentValidation user field rules.
/// Centralizes username, email, and full name validation logic (DRY principle).
/// </summary>
/// <remarks>
/// These extension methods eliminate duplicated validation rules across multiple validators.
/// Each method encapsulates the complete set of validation rules for a specific user field.
///
/// Usage:
/// <code>
/// RuleFor(request => request.Username).ApplyUsernameRules();
/// RuleFor(request => request.Email).ApplyEmailRules();
/// RuleFor(request => request.FullName).ApplyFullNameRules(required: true);
/// </code>
/// </remarks>
public static class UserFieldValidationExtensions
{
	/// <summary>
	/// Applies standard username validation rules.
	/// </summary>
	/// <typeparam name="T">The type being validated.</typeparam>
	/// <param name="ruleBuilder">The rule builder.</param>
	/// <returns>Rule builder options for chaining.</returns>
	/// <remarks>
	/// Validation rules:
	/// - Required (not empty)
	/// - Length: 3-50 characters
	/// - Format: Only letters, numbers, and underscores
	/// </remarks>
	public static IRuleBuilderOptions<T, string> ApplyUsernameRules<T>(
		this IRuleBuilder<T, string> ruleBuilder)
	{
		return ruleBuilder
			.NotEmpty()
			.WithMessage("Username is required")
			.Length(3, 50)
			.WithMessage("Username must be between 3 and 50 characters")
			.Matches(@"^[a-zA-Z0-9_]+$")
			.WithMessage("Username must contain only alphanumeric characters and underscores");
	}

	/// <summary>
	/// Applies standard email validation rules.
	/// </summary>
	/// <typeparam name="T">The type being validated.</typeparam>
	/// <param name="ruleBuilder">The rule builder.</param>
	/// <returns>Rule builder options for chaining.</returns>
	/// <remarks>
	/// Validation rules:
	/// - Required (not empty)
	/// - Maximum length: 255 characters
	/// - Valid email format (both built-in and regex validation)
	/// - Cascade mode: Stop on first failure to avoid redundant error messages
	/// </remarks>
	public static IRuleBuilderOptions<T, string> ApplyEmailRules<T>(
		this IRuleBuilder<T, string> ruleBuilder)
	{
		return ruleBuilder
			.NotEmpty()
			.WithMessage("Email is required")
			.MaximumLength(255)
			.WithMessage("Email must not exceed 255 characters")
			.EmailAddress()
			.WithMessage("Email must be a valid email address")
			.Matches(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")
			.WithMessage("Email must be a valid email address");
	}

	/// <summary>
	/// Applies standard full name validation rules.
	/// </summary>
	/// <typeparam name="T">The type being validated.</typeparam>
	/// <param name="ruleBuilder">The rule builder.</param>
	/// <param name="required">If true, field is required; if false, field is optional.</param>
	/// <returns>Rule builder options for chaining.</returns>
	/// <remarks>
	/// Validation rules:
	/// - Optional or required based on parameter
	/// - Maximum length: 100 characters
	/// - Only validated when not null or whitespace (for optional fields)
	/// </remarks>
	public static IRuleBuilderOptions<T, string?> ApplyFullNameRules<T>(
		this IRuleBuilder<T, string?> ruleBuilder,
		bool required = false)
	{
		if (required)
		{
			return ruleBuilder
				.NotEmpty()
				.WithMessage("Display name is required")
				.MaximumLength(100)
				.WithMessage("Display name must not exceed 100 characters");
		}

		return ruleBuilder
			.MaximumLength(100)
			.WithMessage("Full name must not exceed 100 characters");
	}
}