// <copyright file="UpdateProfileCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validator for <see cref="UpdateProfileCommand"/>.
/// </summary>
/// <remarks>
/// Delegates validation to the existing <see cref="UpdateProfileRequest"/> validator.
/// Wolverine validates the command message, not nested DTOs.
/// </remarks>
public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UpdateProfileCommandValidator"/> class.
	/// </summary>
	/// <param name="requestValidator">Validator for the request DTO.</param>
	public UpdateProfileCommandValidator(IValidator<UpdateProfileRequest> requestValidator)
	{
		RuleFor(command => command.Request)
			.SetValidator(requestValidator);
	}
}
