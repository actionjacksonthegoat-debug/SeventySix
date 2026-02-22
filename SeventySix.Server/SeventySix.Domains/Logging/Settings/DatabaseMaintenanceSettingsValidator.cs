// <copyright file="DatabaseMaintenanceSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Logging;

/// <summary>
/// Validates <see cref="DatabaseMaintenanceSettings"/> configuration values.
/// </summary>
public sealed class DatabaseMaintenanceSettingsValidator : AbstractValidator<DatabaseMaintenanceSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="DatabaseMaintenanceSettingsValidator"/> class.
	/// </summary>
	public DatabaseMaintenanceSettingsValidator()
	{
		When(
			maintenance => maintenance.Enabled,
			() =>
			{
				RuleFor(maintenance => maintenance.IntervalHours)
					.InclusiveBetween(1, 168)
					.WithMessage("Database:Maintenance:IntervalHours must be between 1 and 168");

				RuleFor(maintenance => maintenance.InitialDelayMinutes)
					.GreaterThan(0)
					.WithMessage("Database:Maintenance:InitialDelayMinutes must be greater than 0");
			});
	}
}