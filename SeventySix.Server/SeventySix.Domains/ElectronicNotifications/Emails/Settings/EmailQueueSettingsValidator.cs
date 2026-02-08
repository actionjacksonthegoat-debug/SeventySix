// <copyright file="EmailQueueSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Validates <see cref="EmailQueueSettings"/> configuration values.
/// </summary>
public sealed class EmailQueueSettingsValidator : AbstractValidator<EmailQueueSettings>
{
	/// <summary>
	/// Initializes a new instance of the <see cref="EmailQueueSettingsValidator"/> class.
	/// </summary>
	public EmailQueueSettingsValidator()
	{
		When(
			queue => queue.Enabled,
			() =>
			{
				RuleFor(queue => queue.ProcessingIntervalSeconds)
					.InclusiveBetween(1, 300)
					.WithMessage("Email:Queue:ProcessingIntervalSeconds must be between 1 and 300");

				RuleFor(queue => queue.BatchSize)
					.InclusiveBetween(1, 500)
					.WithMessage("Email:Queue:BatchSize must be between 1 and 500");

				RuleFor(queue => queue.MaxAttempts)
					.InclusiveBetween(1, 10)
					.WithMessage("Email:Queue:MaxAttempts must be between 1 and 10");

				RuleFor(queue => queue.RetryDelayMinutes)
					.InclusiveBetween(1, 60)
					.WithMessage("Email:Queue:RetryDelayMinutes must be between 1 and 60");

				RuleFor(queue => queue.DeadLetterAfterHours)
					.InclusiveBetween(1, 168)
					.WithMessage("Email:Queue:DeadLetterAfterHours must be between 1 and 168");
			});
	}
}
