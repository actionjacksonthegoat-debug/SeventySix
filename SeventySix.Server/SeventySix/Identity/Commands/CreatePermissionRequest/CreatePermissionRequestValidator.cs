// <copyright file="CreatePermissionRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Commands.CreatePermissionRequest;

/// <summary>Validator for <see cref="CreatePermissionRequestCommand"/>.</summary>
internal class CreatePermissionRequestValidator
	: AbstractValidator<CreatePermissionRequestCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreatePermissionRequestValidator"/> class.
	/// </summary>
	public CreatePermissionRequestValidator()
	{
		RuleFor(command => command.Request.RequestedRoles)
			.NotEmpty()
			.WithMessage("At least one role must be selected.");

		RuleFor(command => command.Request.RequestMessage)
			.MaximumLength(500)
			.WithMessage("Request message cannot exceed 500 characters.");
	}
}