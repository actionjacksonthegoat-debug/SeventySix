// <copyright file="CompleteRegistrationRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates complete registration requests.
/// </summary>
public class CompleteRegistrationRequestValidator : AbstractValidator<CompleteRegistrationRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CompleteRegistrationRequestValidator"/> class.
	/// </summary>
	public CompleteRegistrationRequestValidator()
	{
		RuleFor(request => request.Token)
			.NotEmpty()
			.WithMessage("Verification token is required.");

		RuleFor(request => request.Username)
			.NotEmpty()
			.WithMessage("Username is required.")
			.MinimumLength(3)
			.WithMessage("Username must be at least 3 characters.")
			.MaximumLength(50)
			.WithMessage("Username must not exceed 50 characters.")
			.Matches("^[a-zA-Z0-9_]+$")
			.WithMessage("Username can only contain letters, numbers, and underscores.");

		RuleFor(request => request.Password)
			.NotEmpty()
			.WithMessage("Password is required.")
			.MinimumLength(8)
			.WithMessage("Password must be at least 8 characters.")
			.Matches("[A-Z]")
			.WithMessage("Password must contain at least one uppercase letter.")
			.Matches("[a-z]")
			.WithMessage("Password must contain at least one lowercase letter.")
			.Matches("[0-9]")
			.WithMessage("Password must contain at least one digit.")
			.Matches("[^a-zA-Z0-9]")
			.WithMessage("Password must contain at least one special character.");
	}
}