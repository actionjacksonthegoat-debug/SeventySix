// <copyright file="MfaCodeEmailStrategy.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Contracts.Emails;

namespace SeventySix.ElectronicNotifications.Emails.Strategies;

/// <summary>
/// Sends multi-factor authentication code emails.
/// </summary>
/// <param name="emailService">
/// The email sending service for Brevo API calls.
/// </param>
public sealed class MfaCodeEmailStrategy(
	IEmailService emailService) : IEmailSendingStrategy
{
	/// <inheritdoc/>
	public string SupportedType => EmailTypeConstants.MfaVerification;

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