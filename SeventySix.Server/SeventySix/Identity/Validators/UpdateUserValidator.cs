// <copyright file="UpdateUserValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validator for <see cref="UpdateUserRequest"/>.
/// Ensures data integrity before updating user records.
/// </summary>
public class UpdateUserValidator : AbstractValidator<UpdateUserRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateUserValidator"/> class.
	/// </summary>
	public UpdateUserValidator()
	{
		RuleFor(request => request.Id)
			.GreaterThan(0)
			.WithMessage("User ID must be greater than 0");

		RuleFor(request => request.Username)
			.NotEmpty()
			.WithMessage("Username is required")
			.Length(3, 50)
			.WithMessage("Username must be between 3 and 50 characters")
			.Matches(@"^[a-zA-Z0-9_]+$")
			.WithMessage("Username can only contain letters, numbers, and underscores");

		RuleFor(request => request.Email)
			.NotEmpty()
			.WithMessage("Email is required")
			.MaximumLength(255)
			.WithMessage("Email cannot exceed 255 characters")
			.EmailAddress()
			.WithMessage("Email must be a valid email address");

		RuleFor(request => request.FullName)
			.MaximumLength(100)
			.WithMessage("Full name cannot exceed 100 characters")
			.When(request => !string.IsNullOrWhiteSpace(request.FullName));
	}
}