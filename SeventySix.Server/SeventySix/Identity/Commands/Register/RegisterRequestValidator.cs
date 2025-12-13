// <copyright file="RegisterRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Commands.Register;

/// <summary>
/// FluentValidation validator for RegisterRequest.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Username: Required, 3-50 characters, alphanumeric and underscores
/// - Email: Required, valid email format, max 255 characters
/// - Password: Required, min 8 characters, complexity requirements
/// - FullName: Optional, max 100 characters
/// </remarks>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="RegisterRequestValidator"/> class.
	/// </summary>
	public RegisterRequestValidator()
	{
		RuleFor(request => request.Username)
			.ApplyUsernameRules();

		RuleFor(request => request.Email)
			.ApplyEmailRules();

		RuleFor(request => request.Password)
			.ApplyPasswordRules();

		RuleFor(request => request.FullName)
			.ApplyFullNameRules(required: false);
	}
}