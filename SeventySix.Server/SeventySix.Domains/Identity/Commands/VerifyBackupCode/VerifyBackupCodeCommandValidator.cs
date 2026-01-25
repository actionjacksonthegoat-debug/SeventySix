// <copyright file="VerifyBackupCodeCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.VerifyBackupCode;

/// <summary>
/// FluentValidation validator for VerifyBackupCodeRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Email: Required, valid email format
/// - Code: Required, 8-10 characters (allows for dash separator)
/// </remarks>
public sealed class VerifyBackupCodeCommandValidator : AbstractValidator<VerifyBackupCodeRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="VerifyBackupCodeCommandValidator"/> class.
	/// </summary>
	public VerifyBackupCodeCommandValidator()
	{
		RuleFor(request => request.Email)
			.NotEmpty()
			.WithMessage("Email is required")
			.EmailAddress()
			.WithMessage("A valid email address is required");

		RuleFor(request => request.Code)
			.NotEmpty()
			.WithMessage("Backup code is required")
			.Length(8, 10)
			.WithMessage("Backup code must be 8-10 characters");
	}
}