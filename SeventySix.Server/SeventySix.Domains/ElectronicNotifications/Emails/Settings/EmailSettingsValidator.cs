// <copyright file="EmailSettingsValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// FluentValidation validator for EmailSettings.
/// Ensures email configuration is valid when email sending is enabled.
/// </summary>
/// <remarks>
/// Validates:
/// - SmtpHost is configured when email is enabled
/// - FromAddress is a valid email address when enabled
/// - ClientBaseUrl is a valid absolute URI when enabled
/// - SmtpPort is within valid range
///
/// This validator is used at application startup to fail fast
/// if email configuration is invalid.
/// </remarks>
public sealed class EmailSettingsValidator : AbstractValidator<EmailSettings>
{
	/// <summary>
	/// Minimum valid SMTP port.
	/// </summary>
	public const int MinSmtpPort = 1;

	/// <summary>
	/// Maximum valid SMTP port.
	/// </summary>
	public const int MaxSmtpPort = 65535;

	/// <summary>
	/// Initializes a new instance of the <see cref="EmailSettingsValidator"/> class.
	/// </summary>
	public EmailSettingsValidator()
	{
		When(
			settings => settings.Enabled,
			() =>
			{
				RuleFor(settings => settings.SmtpHost)
					.NotEmpty()
					.WithMessage("SmtpHost is required when email is enabled");

				RuleFor(settings => settings.SmtpPort)
					.InclusiveBetween(
						MinSmtpPort,
						MaxSmtpPort)
					.WithMessage($"SmtpPort must be between {MinSmtpPort} and {MaxSmtpPort}");

				RuleFor(settings => settings.FromAddress)
					.NotEmpty()
					.EmailAddress()
					.WithMessage("Valid FromAddress is required when email is enabled");

				RuleFor(settings => settings.FromName)
					.NotEmpty()
					.WithMessage("FromName is required when email is enabled");

				RuleFor(settings => settings.ClientBaseUrl)
					.NotEmpty()
					.Must(IsValidAbsoluteUri)
					.WithMessage("Valid ClientBaseUrl URI is required when email is enabled");
			});
	}

	/// <summary>
	/// Validates that a string is a valid absolute URI.
	/// </summary>
	/// <param name="url">
	/// The URL to validate.
	/// </param>
	/// <returns>
	/// True if the URL is a valid absolute URI; otherwise false.
	/// </returns>
	private static bool IsValidAbsoluteUri(string url)
	{
		return Uri.TryCreate(
			url,
			UriKind.Absolute,
			out Uri? result)
			&& (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
	}
}