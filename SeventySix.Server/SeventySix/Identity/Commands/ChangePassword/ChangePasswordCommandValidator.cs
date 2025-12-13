// <copyright file="ChangePasswordCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Commands.ChangePassword;

/// <summary>
/// FluentValidation validator for ChangePasswordRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - NewPassword: Required, min 8 characters, complexity requirements
/// - CurrentPassword: Optional (only required if user has existing password)
/// </remarks>
public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ChangePasswordCommandValidator"/> class.
	/// </summary>
	public ChangePasswordCommandValidator()
	{
		RuleFor(request => request.NewPassword)
			.ApplyPasswordRules();
	}
}