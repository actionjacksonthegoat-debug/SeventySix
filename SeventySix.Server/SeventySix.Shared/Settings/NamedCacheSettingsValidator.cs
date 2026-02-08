// <copyright file="NamedCacheSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Shared.Settings;

/// <summary>
/// Validates <see cref="NamedCacheSettings"/> configuration values.
/// </summary>
public sealed class NamedCacheSettingsValidator : AbstractValidator<NamedCacheSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="NamedCacheSettingsValidator"/> class.
	/// </summary>
	public NamedCacheSettingsValidator()
	{
		RuleFor(namedCache => namedCache.Duration)
			.GreaterThan(TimeSpan.Zero)
			.WithMessage("NamedCache:Duration must be greater than zero");

		RuleFor(namedCache => namedCache.KeyPrefix)
			.NotEmpty()
			.WithMessage("NamedCache:KeyPrefix is required");
	}
}
