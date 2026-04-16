// <copyright file="WelcomeEmailStrategy.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Contracts.Emails;

namespace SeventySix.ElectronicNotifications.Emails.Strategies;

/// <summary>
/// Sends welcome emails with password setup links to new users.
/// </summary>
/// <param name="emailService">
/// The email sending service for Brevo API calls.
/// </param>
public sealed class WelcomeEmailStrategy(
	IEmailService emailService) : IEmailSendingStrategy
{
	/// <inheritdoc/>
	public string SupportedType => EmailTypeConstants.Welcome;

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