// <copyright file="IEmailService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Unified email sending service.
/// </summary>
/// <remarks>
/// Design Notes:
/// - Service-only bounded context (no database)
/// - Sends transactional emails via Brevo HTTP API.
/// - A single method handles all email types via <paramref name="emailType"/> dispatch.
/// </remarks>
public interface IEmailService
{
	/// <summary>
	/// Sends an email of the specified type with the provided template data.
	/// </summary>
	/// <param name="emailType">
	/// The email type (see <c>EmailTypeConstants</c>).
	/// </param>
	/// <param name="recipientEmail">
	/// The recipient's email address.
	/// </param>
	/// <param name="templateData">
	/// Key-value pairs for email template rendering.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task SendEmailAsync(
		string emailType,
		string recipientEmail,
		Dictionary<string, string> templateData,
		CancellationToken cancellationToken = default);
}