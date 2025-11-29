// <copyright file="ChangePasswordRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// FluentValidation validator for ChangePasswordRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - NewPassword: Required, min 8 characters, complexity requirements
/// - CurrentPassword: Optional (only required if user has existing password)
/// </remarks>
public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ChangePasswordRequestValidator"/> class.
	/// </summary>
	public ChangePasswordRequestValidator()
	{
		RuleFor(x => x.NewPassword)
			.ApplyPasswordRules();
	}
}