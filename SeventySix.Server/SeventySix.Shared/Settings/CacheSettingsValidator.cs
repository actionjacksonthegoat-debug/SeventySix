// <copyright file="CacheSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Shared.Settings;

/// <summary>
/// Validates <see cref="CacheSettings"/> configuration values.
/// </summary>
public sealed class CacheSettingsValidator : AbstractValidator<CacheSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="CacheSettingsValidator"/> class.
	/// </summary>
	public CacheSettingsValidator()
	{
		RuleFor(cache => cache.DefaultDuration)
			.GreaterThan(TimeSpan.Zero)
			.WithMessage("Cache:DefaultDuration must be greater than zero");

		RuleFor(cache => cache.FailSafeMaxDuration)
			.GreaterThan(TimeSpan.Zero)
			.WithMessage("Cache:FailSafeMaxDuration must be greater than zero");

		RuleFor(cache => cache.FailSafeThrottleDuration)
			.GreaterThan(TimeSpan.Zero)
			.WithMessage("Cache:FailSafeThrottleDuration must be greater than zero");

		RuleFor(cache => cache.DefaultKeyPrefix)
			.NotEmpty()
			.WithMessage("Cache:DefaultKeyPrefix is required");

		RuleFor(cache => cache.Valkey)
			.SetValidator(new ValkeySettingsValidator());

		RuleFor(cache => cache.Identity)
			.SetValidator(new NamedCacheSettingsValidator());

		RuleFor(cache => cache.Logging)
			.SetValidator(new NamedCacheSettingsValidator());

		RuleFor(cache => cache.ApiTracking)
			.SetValidator(new NamedCacheSettingsValidator());
	}
}
