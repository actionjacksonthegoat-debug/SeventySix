// <copyright file="InitiatePasswordResetByEmailCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.InitiatePasswordResetByEmail;

/// <summary>
/// FluentValidation validator for ForgotPasswordRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Email: Required, valid email format, max 255 characters.
/// </remarks>
public class InitiatePasswordResetByEmailCommandValidator : AbstractValidator<ForgotPasswordRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="InitiatePasswordResetByEmailCommandValidator"/> class.
	/// </summary>
	public InitiatePasswordResetByEmailCommandValidator()
	{
		RuleFor(request => request.Email)
			.Cascade(CascadeMode.Stop)
			.NotEmpty()
			.WithMessage("Email is required")
			.MaximumLength(255)
			.WithMessage("Email must not exceed 255 characters")
			.EmailAddress()
			.WithMessage("Email must be a valid email address");
	}
}