// <copyright file="LinkExternalLoginRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="LinkExternalLoginCommand"/>.
/// </summary>
public sealed class LinkExternalLoginRequestValidator
	: AbstractValidator<LinkExternalLoginCommand>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="LinkExternalLoginRequestValidator"/> class.
	/// </summary>
	public LinkExternalLoginRequestValidator()
	{
		RuleFor(command => command.UserId)
			.GreaterThan(0);

		RuleFor(command => command.Provider)
			.NotEmpty();

		RuleFor(command => command.ProviderUserId)
			.NotEmpty();
	}
}