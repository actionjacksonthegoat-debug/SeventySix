// <copyright file="ForwardedHeadersSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates <see cref="ForwardedHeadersSettings"/> configuration values.
/// </summary>
public sealed class ForwardedHeadersSettingsValidator : AbstractValidator<ForwardedHeadersSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ForwardedHeadersSettingsValidator"/> class.
	/// </summary>
	public ForwardedHeadersSettingsValidator()
	{
		RuleFor(headers => headers.ForwardLimit)
			.InclusiveBetween(1, 10)
			.WithMessage("ForwardedHeaders:ForwardLimit must be between 1 and 10");
	}
}