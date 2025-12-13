// <copyright file="UpdateProfileRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// FluentValidation validator for <see cref="UpdateProfileRequest"/>.
/// </summary>
/// <remarks>
/// Validation Rules:
/// - Email: Required, valid email format, max 255 characters
/// - FullName: Optional, max 100 characters if provided
/// </remarks>
public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateProfileRequestValidator"/> class.
	/// </summary>
	public UpdateProfileRequestValidator()
	{
		RuleFor(request => request.Email)
			.ApplyEmailRules();

		RuleFor(request => request.FullName)
			.ApplyFullNameRules(required: false);
	}
}