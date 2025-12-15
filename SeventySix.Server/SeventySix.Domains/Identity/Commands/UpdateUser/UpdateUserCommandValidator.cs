// <copyright file="UpdateUserCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Commands.UpdateUser;

/// <summary>
/// Validator for <see cref="UpdateUserRequest"/>.
/// Ensures data integrity before updating user records.
/// </summary>
public class UpdateUserCommandValidator : AbstractValidator<UpdateUserRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateUserCommandValidator"/> class.
	/// </summary>
	public UpdateUserCommandValidator()
	{
		RuleFor(request => request.Id)
			.GreaterThan(0)
			.WithMessage("User ID must be greater than 0");

		RuleFor(request => request.Username)
			.ApplyUsernameRules();

		RuleFor(request => request.Email)
			.ApplyEmailRules();

		RuleFor(request => request.FullName)
			.ApplyFullNameRules(required: false);
	}
}