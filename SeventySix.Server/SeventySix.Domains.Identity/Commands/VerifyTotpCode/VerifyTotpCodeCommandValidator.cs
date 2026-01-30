// <copyright file="VerifyTotpCodeCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.VerifyTotpCode;

/// <summary>
/// FluentValidation validator for VerifyTotpRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Email: Required, valid email format
/// - Code: Required, exactly 6 digits
/// </remarks>
public sealed class VerifyTotpCodeCommandValidator : AbstractValidator<VerifyTotpRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="VerifyTotpCodeCommandValidator"/> class.
	/// </summary>
	public VerifyTotpCodeCommandValidator()
	{
		RuleFor(request => request.Email)
			.NotEmpty()
			.WithMessage("Email is required")
			.EmailAddress()
			.WithMessage("A valid email address is required");

		RuleFor(request => request.Code)
			.NotEmpty()
			.WithMessage("TOTP code is required")
			.Length(6)
			.WithMessage("TOTP code must be 6 digits")
			.Matches(@"^\d{6}$")
			.WithMessage("TOTP code must contain only digits");
	}
}