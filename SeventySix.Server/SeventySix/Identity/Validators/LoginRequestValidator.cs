// <copyright file="LoginRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// FluentValidation validator for LoginRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - UsernameOrEmail: Required, max 255 characters
/// - Password: Required
/// </remarks>
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="LoginRequestValidator"/> class.
	/// </summary>
	public LoginRequestValidator()
	{
		RuleFor(x => x.UsernameOrEmail)
			.NotEmpty()
			.WithMessage("Username or email is required")
			.MaximumLength(255)
			.WithMessage("Username or email must not exceed 255 characters");

		RuleFor(x => x.Password)
			.NotEmpty()
			.WithMessage("Password is required")
			.MaximumLength(100)
			.WithMessage("Password must not exceed 100 characters");
	}
}