// <copyright file="VerificationEmailStrategy.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Contracts.Emails;

namespace SeventySix.ElectronicNotifications.Emails.Strategies;

/// <summary>
/// Sends email verification emails for self-registration.
/// </summary>
/// <param name="emailService">
/// The email sending service for Brevo API calls.
/// </param>
public sealed class VerificationEmailStrategy(
	IEmailService emailService) : IEmailSendingStrategy
{
	/// <inheritdoc/>
	public string SupportedType => EmailTypeConstants.Verification;

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