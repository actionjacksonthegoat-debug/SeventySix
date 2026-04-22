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
/// <remarks>
/// Email uniqueness is enforced at the database level via unique constraints.
/// The handler catches duplicate identity errors and <c>DbUpdateException</c>
/// duplicate key violations.
/// </remarks>
public sealed class UpdateUserCommandValidator : AbstractValidator<UpdateUserRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateUserCommandValidator"/> class.
	/// </summary>
	public UpdateUserCommandValidator()
	{
		RuleFor(request => request.Id)
			.GreaterThan(0)
			.WithMessage("User ID must be greater than 0");

		RuleFor(request => request.Username).ApplyUsernameRules();

		RuleFor(request => request.Email)
			.ApplyEmailRules();

		RuleFor(request => request.FullName)
			.ApplyFullNameRules(required: false);
	}
}