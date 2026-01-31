// <copyright file="DisableTotpCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.DisableTotp;

/// <summary>
/// FluentValidation validator for DisableTotpRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Password: Required (OWASP ASVS V2.10.1 - require re-authentication)
/// </remarks>
public sealed class DisableTotpCommandValidator : AbstractValidator<DisableTotpRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="DisableTotpCommandValidator"/> class.
	/// </summary>
	public DisableTotpCommandValidator()
	{
		RuleFor(request => request.Password)
			.NotEmpty()
			.WithMessage("Password is required to disable TOTP")
			.MaximumLength(100)
			.WithMessage("Password must not exceed 100 characters");
	}
}