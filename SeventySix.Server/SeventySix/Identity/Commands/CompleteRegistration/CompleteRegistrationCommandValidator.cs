// <copyright file="CompleteRegistrationCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Commands.CompleteRegistration;

/// <summary>
/// Validates complete registration requests.
/// </summary>
public class CompleteRegistrationCommandValidator : AbstractValidator<CompleteRegistrationRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CompleteRegistrationCommandValidator"/> class.
	/// </summary>
	public CompleteRegistrationCommandValidator()
	{
		RuleFor(request => request.Token)
			.NotEmpty()
			.WithMessage("Verification token is required.");

		RuleFor(request => request.Username)
			.ApplyUsernameRules();

		RuleFor(request => request.Password)
			.ApplyPasswordRules();
	}
}