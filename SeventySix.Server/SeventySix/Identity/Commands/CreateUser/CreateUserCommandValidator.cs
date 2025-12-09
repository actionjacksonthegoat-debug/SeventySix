// <copyright file="CreateUserCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validator for <see cref="CreateUserCommand"/>.
/// </summary>
/// <remarks>
/// Delegates validation to the existing <see cref="CreateUserRequest"/> validator.
/// Wolverine validates the command message, not nested DTOs.
/// </remarks>
public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CreateUserCommandValidator"/> class.
	/// </summary>
	/// <param name="requestValidator">Validator for the request DTO.</param>
	public CreateUserCommandValidator(IValidator<CreateUserRequest> requestValidator)
	{
		RuleFor(command => command.Request)
			.SetValidator(requestValidator);
	}
}