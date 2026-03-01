// <copyright file="SiteSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Api.Configuration;

/// <summary>
/// FluentValidation validator for <see cref="SiteSettings"/>.
/// Ensures site configuration is valid at startup.
/// </summary>
/// <remarks>
/// Validates:
/// - Site:Email is non-empty
/// - Site:Email is a valid email address format
/// </remarks>
public sealed class SiteSettingsValidator : AbstractValidator<SiteSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="SiteSettingsValidator"/> class.
	/// </summary>
	public SiteSettingsValidator()
	{
		RuleFor(settings => settings.Email)
			.NotEmpty()
			.WithMessage("Site:Email must be configured");

		RuleFor(settings => settings.Email)
			.EmailAddress()
			.When(settings => !string.IsNullOrEmpty(settings.Email))
			.WithMessage("Site:Email must be a valid email address");
	}
}