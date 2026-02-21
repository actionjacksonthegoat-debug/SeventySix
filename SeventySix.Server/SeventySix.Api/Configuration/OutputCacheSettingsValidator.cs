// <copyright file="OutputCacheSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates <see cref="OutputCacheSettings"/> configuration values.
/// </summary>
public sealed class OutputCacheSettingsValidator : AbstractValidator<OutputCacheSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="OutputCacheSettingsValidator"/> class.
	/// </summary>
	public OutputCacheSettingsValidator()
	{
		RuleForEach(cache => cache.Policies)
			.Must(policy => policy.Value.DurationSeconds > 0)
			.WithMessage("Cache:OutputCache policy DurationSeconds must be greater than 0");
	}
}