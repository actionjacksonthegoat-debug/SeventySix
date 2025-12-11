// <copyright file="UpdateProfileRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// FluentValidation validator for <see cref="UpdateProfileRequest"/>.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Email: Required, valid email format, max 255 characters
/// - FullName: Optional, max 100 characters if provided
/// </remarks>
public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateProfileRequestValidator"/> class.
	/// </summary>
	public UpdateProfileRequestValidator()
	{
		RuleFor(request => request.Email)
			.Cascade(CascadeMode.Stop)
			.NotEmpty()
			.WithMessage("Email is required")
			.MaximumLength(255)
			.WithMessage("Email must not exceed 255 characters")
			.EmailAddress()
			.WithMessage("Email must be a valid email address");

		RuleFor(request => request.FullName)
			.MaximumLength(100)
			.WithMessage("Full name must not exceed 100 characters")
			.When(request => request.FullName != null);
	}
}