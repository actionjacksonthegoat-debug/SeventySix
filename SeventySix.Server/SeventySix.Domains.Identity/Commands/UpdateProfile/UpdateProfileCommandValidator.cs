// <copyright file="UpdateProfileCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Commands.UpdateProfile;

/// <summary>
/// FluentValidation validator for <see cref="UpdateProfileCommand"/>.
/// Validates email format and full name rules.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Email: Required, valid email format, max 255 characters
/// - FullName: Optional, max 100 characters if provided
///
/// Email uniqueness is enforced at the database level via unique constraints.
/// The handler catches duplicate key violations.
/// </remarks>
public sealed class UpdateProfileCommandValidator
	: AbstractValidator<UpdateProfileCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateProfileCommandValidator"/> class.
	/// </summary>
	public UpdateProfileCommandValidator()
	{
		RuleFor(command => command.Request.Email)
			.ApplyEmailRules();

		RuleFor(command => command.Request.FullName)
			.ApplyFullNameRules(required: false);
	}
}