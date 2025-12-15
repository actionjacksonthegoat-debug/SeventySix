// <copyright file="UpdateProfileCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using SeventySix.Identity.Extensions;

namespace SeventySix.Identity.Commands.UpdateProfile;

/// <summary>
/// FluentValidation validator for <see cref="UpdateProfileRequest"/>.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Email: Required, valid email format, max 255 characters
/// - FullName: Optional, max 100 characters if provided
/// </remarks>
public class UpdateProfileCommandValidator
	: AbstractValidator<UpdateProfileRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateProfileCommandValidator"/> class.
	/// </summary>
	public UpdateProfileCommandValidator()
	{
		RuleFor(request => request.Email).ApplyEmailRules();

		RuleFor(request => request.FullName)
			.ApplyFullNameRules(required: false);
	}
}
