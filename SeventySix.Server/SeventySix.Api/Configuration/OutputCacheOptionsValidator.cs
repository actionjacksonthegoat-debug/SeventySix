// <copyright file="OutputCacheOptionsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Validates <see cref="OutputCacheOptions"/> configuration values.
/// </summary>
public sealed class OutputCacheOptionsValidator : AbstractValidator<OutputCacheOptions>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="OutputCacheOptionsValidator"/> class.
	/// </summary>
	public OutputCacheOptionsValidator()
	{
		RuleForEach(cache => cache.Policies)
			.Must(policy => policy.Value.DurationSeconds > 0)
			.WithMessage("Cache:OutputCache policy DurationSeconds must be greater than 0");
	}
}