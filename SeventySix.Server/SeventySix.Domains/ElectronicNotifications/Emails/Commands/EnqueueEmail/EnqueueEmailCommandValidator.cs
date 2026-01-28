// <copyright file="EnqueueEmailCommandValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// FluentValidation validator for EnqueueEmailCommand.
/// Validates email enqueue requests for injection prevention.
/// </summary>
public class EnqueueEmailCommandValidator : AbstractValidator<EnqueueEmailCommand>
{
	/// <summary>
	/// Valid email types from constants.
	/// </summary>
	private static readonly HashSet<string> ValidEmailTypes =
		[
			EmailType.Welcome,
			EmailType.PasswordReset,
			EmailType.Verification,
			EmailType.MfaVerification,
		];

	/// <summary>
	/// Initializes a new instance of the <see cref="EnqueueEmailCommandValidator"/> class.
	/// </summary>
	public EnqueueEmailCommandValidator()
	{
		RuleFor(command => command.EmailType)
			.NotEmpty()
			.WithMessage("Email type is required")
			.Must(IsValidEmailType)
			.WithMessage("Email type must be a valid email type");

		RuleFor(command => command.RecipientEmail)
			.NotEmpty()
			.WithMessage("Recipient email is required")
			.EmailAddress()
			.WithMessage("Recipient email must be a valid email address");

		RuleFor(command => command.TemplateData)
			.NotNull()
			.WithMessage("Template data is required");
	}

	/// <summary>
	/// Validates the email type against known valid types.
	/// </summary>
	/// <param name="emailType">
	/// The email type to validate.
	/// </param>
	/// <returns>
	/// True if valid; otherwise false.
	/// </returns>
	private static bool IsValidEmailType(string? emailType) =>
		!string.IsNullOrWhiteSpace(emailType)
		&& ValidEmailTypes.Contains(emailType);
}