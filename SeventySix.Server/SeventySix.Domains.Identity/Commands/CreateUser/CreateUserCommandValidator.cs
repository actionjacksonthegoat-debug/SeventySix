// <copyright file="CreateUserCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Commands.CreateUser;

/// <summary>
/// FluentValidation validator for CreateUserRequest.
/// Defines validation rules for creating new users.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Username: Required, 3-50 characters, alphanumeric and underscores only
/// - Email: Required, valid email format, max 255 characters
/// - FullName: Optional, max 100 characters if provided
/// - IsActive: No validation (boolean field)
/// </remarks>
public class CreateUserCommandValidator : AbstractValidator<CreateUserRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreateUserCommandValidator"/> class.
	/// </summary>
	public CreateUserCommandValidator()
	{
		RuleFor(request => request.Username).ApplyUsernameRules();

		RuleFor(request => request.Email).ApplyEmailRules();

		RuleFor(request => request.FullName).ApplyFullNameRules(required: true);
	}
}