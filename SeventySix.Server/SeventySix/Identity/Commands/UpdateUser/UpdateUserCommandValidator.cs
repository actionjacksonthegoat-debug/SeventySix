// <copyright file="UpdateUserCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validator for <see cref="UpdateUserCommand"/>.
/// </summary>
/// <remarks>
/// Delegates validation to the existing <see cref="UpdateUserRequest"/> validator.
/// Wolverine validates the command message, not nested DTOs.
/// </remarks>
public class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateUserCommandValidator"/> class.
	/// </summary>
	/// <param name="requestValidator">Validator for the request DTO.</param>
	public UpdateUserCommandValidator(IValidator<UpdateUserRequest> requestValidator)
	{
		RuleFor(command => command.Request)
			.SetValidator(requestValidator);
	}
}
