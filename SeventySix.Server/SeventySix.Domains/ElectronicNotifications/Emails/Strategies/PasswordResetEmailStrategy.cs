// <copyright file="PasswordResetEmailStrategy.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Contracts.Emails;

namespace SeventySix.ElectronicNotifications.Emails.Strategies;

/// <summary>
/// Sends password reset emails with reset links.
/// </summary>
/// <param name="emailService">
/// The email sending service for Brevo API calls.
/// </param>
public sealed class PasswordResetEmailStrategy(
	IEmailService emailService) : IEmailSendingStrategy
{
	/// <inheritdoc/>
	public string SupportedType => EmailTypeConstants.PasswordReset;

	/// <inheritdoc/>
	public async Task SendAsync(
		string recipientEmail,
		Dictionary<string, string> templateData,
		CancellationToken cancellationToken) =>
		await emailService.SendEmailAsync(
			SupportedType,
			recipientEmail,
			templateData,
			cancellationToken);
}