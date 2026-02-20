// <copyright file="InitiateRegistrationCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.InitiateRegistration;

/// <summary>
/// Validates initiate registration requests.
/// </summary>
public sealed class InitiateRegistrationCommandValidator
	: AbstractValidator<InitiateRegistrationRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="InitiateRegistrationCommandValidator"/> class.
	/// </summary>
	public InitiateRegistrationCommandValidator()
	{
		// NOTE: Email existence is NOT validated here intentionally.
		// The handler silently returns for existing emails (anti-enumeration pattern).
		// See OWASP Testing Guide v4.0 — OTG-IDENT-002.

		RuleFor(request => request.Email)
			.NotEmpty()
			.WithMessage("Email is required.")
			.EmailAddress()
			.WithMessage("Invalid email format.")
			.MaximumLength(255)
			.WithMessage("Email must not exceed 255 characters.");
	}
}