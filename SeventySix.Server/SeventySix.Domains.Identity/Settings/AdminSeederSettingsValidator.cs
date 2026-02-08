// <copyright file="AdminSeederSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity.Settings;

/// <summary>
/// Validates <see cref="AdminSeederSettings"/> configuration values.
/// </summary>
public sealed class AdminSeederSettingsValidator : AbstractValidator<AdminSeederSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="AdminSeederSettingsValidator"/> class.
	/// </summary>
	public AdminSeederSettingsValidator()
	{
		When(
			seeder => seeder.Enabled,
			() =>
			{
				RuleFor(seeder => seeder.Username)
					.NotEmpty()
					.WithMessage("AdminSeeder:Username is required when seeder is enabled");

				RuleFor(seeder => seeder.Email)
					.NotEmpty()
					.EmailAddress()
					.WithMessage("AdminSeeder:Email must be a valid email when seeder is enabled");

				RuleFor(seeder => seeder.FullName)
					.NotEmpty()
					.WithMessage("AdminSeeder:FullName is required when seeder is enabled");
			});
	}
}