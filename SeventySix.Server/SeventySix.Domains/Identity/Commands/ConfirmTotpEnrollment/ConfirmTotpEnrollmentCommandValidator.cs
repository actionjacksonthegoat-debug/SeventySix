// <copyright file="ConfirmTotpEnrollmentCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.ConfirmTotpEnrollment;

/// <summary>
/// FluentValidation validator for ConfirmTotpEnrollmentRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Code: Required, exactly 6 digits
/// </remarks>
public sealed class ConfirmTotpEnrollmentCommandValidator : AbstractValidator<ConfirmTotpEnrollmentRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ConfirmTotpEnrollmentCommandValidator"/> class.
	/// </summary>
	public ConfirmTotpEnrollmentCommandValidator()
	{
		RuleFor(request => request.Code)
			.NotEmpty()
			.WithMessage("TOTP code is required")
			.Length(6)
			.WithMessage("TOTP code must be 6 digits")
			.Matches(@"^\d{6}$")
			.WithMessage("TOTP code must contain only digits");
	}
}