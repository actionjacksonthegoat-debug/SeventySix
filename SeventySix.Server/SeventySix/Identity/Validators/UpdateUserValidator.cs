// <copyright file="UpdateUserValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validator for <see cref="UpdateUserRequest"/>.
/// Ensures data integrity before updating user records.
/// </summary>
public class UpdateUserValidator : AbstractValidator<UpdateUserRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateUserValidator"/> class.
	/// </summary>
	public UpdateUserValidator()
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