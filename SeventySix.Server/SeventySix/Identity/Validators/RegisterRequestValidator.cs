// <copyright file="RegisterRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// FluentValidation validator for RegisterRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Username: Required, 3-50 characters, alphanumeric and underscores
/// - Email: Required, valid email format, max 255 characters
/// - Password: Required, min 8 characters, complexity requirements
/// - FullName: Optional, max 100 characters
/// </remarks>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="RegisterRequestValidator"/> class.
	/// </summary>
	public RegisterRequestValidator()
	{
		RuleFor(request => request.Username)
			.NotEmpty()
			.WithMessage("Username is required")
			.Length(3, 50)
			.WithMessage("Username must be between 3 and 50 characters")
			.Matches(@"^[a-zA-Z0-9_]+$")
			.WithMessage("Username must contain only alphanumeric characters and underscores");

		RuleFor(request => request.Email)
			.Cascade(CascadeMode.Stop)
			.NotEmpty()
			.WithMessage("Email is required")
			.MaximumLength(255)
			.WithMessage("Email must not exceed 255 characters")
			.EmailAddress()
			.WithMessage("Email must be a valid email address");

		RuleFor(request => request.Password)
			.ApplyPasswordRules();

		RuleFor(request => request.FullName)
			.MaximumLength(100)
			.WithMessage("Full name must not exceed 100 characters")
			.When(request => request.FullName != null);
	}
}