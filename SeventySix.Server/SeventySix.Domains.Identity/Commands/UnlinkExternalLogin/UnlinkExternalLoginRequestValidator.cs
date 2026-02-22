// <copyright file="UnlinkExternalLoginRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="UnlinkExternalLoginCommand"/>.
/// </summary>
public sealed class UnlinkExternalLoginRequestValidator
	: AbstractValidator<UnlinkExternalLoginCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UnlinkExternalLoginRequestValidator"/> class.
	/// </summary>
	public UnlinkExternalLoginRequestValidator()
	{
		RuleFor(command => command.UserId)
			.GreaterThan(0);

		RuleFor(command => command.Provider)
			.NotEmpty();
	}
}