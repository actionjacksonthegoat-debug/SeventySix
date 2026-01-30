// <copyright file="InitiateRegistrationCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.InitiateRegistration;

/// <summary>
/// Validates initiate registration requests.
/// </summary>
public class InitiateRegistrationCommandValidator
	: AbstractValidator<InitiateRegistrationRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="InitiateRegistrationCommandValidator"/> class.
	/// </summary>
	public InitiateRegistrationCommandValidator()
	{
		RuleFor(request => request.Email)
			.NotEmpty()
			.WithMessage("Email is required.")
			.EmailAddress()
			.WithMessage("Invalid email format.")
			.MaximumLength(255)
			.WithMessage("Email must not exceed 255 characters.");
	}
}