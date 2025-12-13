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
			.ApplyUsernameRules();

		RuleFor(request => request.Password)
			.ApplyPasswordRules();
	}
}