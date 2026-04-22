// <copyright file="CreateUserCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Commands.CreateUser;

/// <summary>
/// FluentValidation validator for CreateUserRequest.
/// Defines format and length validation rules for creating new users.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Username: Required, 3-50 characters, alphanumeric and underscores only
/// - Email: Required, valid email format, max 255 characters
/// - FullName: Required, max 100 characters
/// - IsActive: No validation (boolean field)
///
/// Email uniqueness is enforced at the database level via unique constraints.
/// The handler catches <c>DuplicateEmail</c> identity errors and <c>DbUpdateException</c>
/// duplicate key violations.
/// </remarks>
public sealed class CreateUserCommandValidator : AbstractValidator<CreateUserRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreateUserCommandValidator"/> class.
	/// </summary>
	public CreateUserCommandValidator()
	{
		RuleFor(request => request.Username).ApplyUsernameRules();

		RuleFor(request => request.Email)
			.ApplyEmailRules();

		RuleFor(request => request.FullName).ApplyFullNameRules(required: true);
	}
}