// <copyright file="BackupCodeSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>
/// Validates <see cref="BackupCodeSettings"/> configuration values.
/// </summary>
public sealed class BackupCodeSettingsValidator : AbstractValidator<BackupCodeSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="BackupCodeSettingsValidator"/> class.
	/// </summary>
	public BackupCodeSettingsValidator()
	{
		RuleFor(backup => backup.CodeCount)
			.InclusiveBetween(5, 20)
			.WithMessage("BackupCodes:CodeCount must be between 5 and 20");

		RuleFor(backup => backup.CodeLength)
			.InclusiveBetween(6, 16)
			.WithMessage("BackupCodes:CodeLength must be between 6 and 16");
	}
}
