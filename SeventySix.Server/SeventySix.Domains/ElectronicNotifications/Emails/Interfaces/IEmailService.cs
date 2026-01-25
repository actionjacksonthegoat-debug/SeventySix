// <copyright file="IEmailService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Service for sending email notifications.
/// </summary>
/// <remarks>
/// Design Notes:
/// - Service-only bounded context (no database)
/// - Current implementation is a stub that logs emails
/// - Future: Will integrate with SMTP provider (SendGrid, AWS SES, etc.).
/// </remarks>
public interface IEmailService
{
	/// <summary>
	/// Sends a welcome email with password setup link to a new user.
	/// </summary>
	/// <param name="email">
	/// The recipient's email address.
	/// </param>
	/// <param name="username">
	/// The user's username.
	/// </param>
	/// <param name="resetToken">
	/// The password reset token for the setup link.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task SendWelcomeEmailAsync(
		string email,
		string username,
		string resetToken,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Sends a password reset email with reset link.
	/// </summary>
	/// <param name="email">
	/// The recipient's email address.
	/// </param>
	/// <param name="username">
	/// The user's username.
	/// </param>
	/// <param name="resetToken">
	/// The password reset token for the reset link.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task SendPasswordResetEmailAsync(
		string email,
		string username,
		string resetToken,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Sends email verification link for self-registration.
	/// </summary>
	/// <param name="email">
	/// The email address to verify.
	/// </param>
	/// <param name="verificationToken">
	/// The verification token for the link.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task SendVerificationEmailAsync(
		string email,
		string verificationToken,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Sends a multi-factor authentication verification code email.
	/// </summary>
	/// <param name="email">
	/// The recipient's email address.
	/// </param>
	/// <param name="code">
	/// The 6-digit verification code.
	/// </param>
	/// <param name="expirationMinutes">
	/// Number of minutes until the code expires.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task SendMfaCodeEmailAsync(
		string email,
		string code,
		int expirationMinutes,
		CancellationToken cancellationToken = default);
}