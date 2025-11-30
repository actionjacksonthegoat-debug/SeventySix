// <copyright file="CreatePermissionRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

using FluentValidation;

/// <summary>Validator for <see cref="CreatePermissionRequestDto"/>.</summary>
internal class CreatePermissionRequestValidator
	: AbstractValidator<CreatePermissionRequestDto>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreatePermissionRequestValidator"/> class.
	/// </summary>
	public CreatePermissionRequestValidator()
	{
		RuleFor(request => request.RequestedRoles)
			.NotEmpty()
			.WithMessage("At least one role must be selected.");

		RuleFor(request => request.RequestMessage)
			.MaximumLength(500)
			.WithMessage("Request message cannot exceed 500 characters.");
	}
}
