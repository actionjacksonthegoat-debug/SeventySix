// <copyright file="IEmailSendingStrategy.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Strategy interface for sending emails by type.
/// Each implementation handles a specific email type (Welcome, PasswordReset, etc.),
/// encapsulating the template data extraction and service delegation for that type.
/// </summary>
/// <remarks>
/// Implements the Strategy pattern to eliminate the switch statement in
/// <c>EmailQueueProcessJobHandler.SendEmailByTypeAsync</c>, satisfying the Open/Closed Principle.
/// New email types require only a new strategy class and DI registration — no handler modification.
/// </remarks>
public interface IEmailSendingStrategy
{
	/// <summary>
	/// Gets the email type constant this strategy handles.
	/// </summary>
	/// <remarks>
	/// Must match one of the values in <see cref="Shared.Contracts.Emails.EmailTypeConstants"/>.
	/// </remarks>
	public string SupportedType { get; }

	/// <summary>
	/// Sends an email using the type-specific template and data extraction logic.
	/// </summary>
	/// <param name="recipientEmail">
	/// The recipient's email address.
	/// </param>
	/// <param name="templateData">
	/// The template data dictionary containing type-specific keys.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task SendAsync(
		string recipientEmail,
		Dictionary<string, string> templateData,
		CancellationToken cancellationToken);
}