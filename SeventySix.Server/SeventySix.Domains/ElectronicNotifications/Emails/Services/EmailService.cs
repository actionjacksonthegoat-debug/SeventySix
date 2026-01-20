// <copyright file="EmailService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Utilities;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Email service implementation using MailKit.
/// </summary>
/// <remarks>
/// When Enabled=false, logs email details without sending (development mode).
/// When Enabled=true, sends via configured SMTP server.
/// Enforces daily rate limit via IRateLimitingService to prevent exceeding external API quotas.
/// </remarks>
/// <param name="settings">
/// Email configuration settings.
/// </param>
/// <param name="rateLimitingService">
/// Rate limiting service for API quota management.
/// </param>
/// <param name="logger">
/// Logger for email operations.
/// </param>
public class EmailService(
	IOptions<EmailSettings> settings,
	IRateLimitingService rateLimitingService,
	ILogger<EmailService> logger) : IEmailService
{
	private const string BREVO_API_NAME = "BrevoEmail";
	private const string BREVO_BASE_URL = "smtp-relay.brevo.com";

	/// <summary>
	/// Sends a welcome email with a password setup link to the specified user.
	/// </summary>
	/// <param name="email">
	/// The recipient's email address.
	/// </param>
	/// <param name="username">
	/// The recipient's username used in the email body.
	/// </param>
	/// <param name="resetToken">
	/// The password reset token to build the setup link.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public async Task SendWelcomeEmailAsync(
		string email,
		string username,
		string resetToken,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(email);
		ArgumentException.ThrowIfNullOrWhiteSpace(username);
		ArgumentException.ThrowIfNullOrWhiteSpace(resetToken);

		string resetUrl =
			BuildPasswordResetUrl(resetToken);

		string subject = "Welcome to SeventySix - Set Your Password";

		string body =
			BuildWelcomeEmailBody(username, resetUrl);

		await SendEmailAsync(email, subject, body, cancellationToken);
	}

	/// <summary>
	/// Sends a password reset email containing a reset link for the user.
	/// </summary>
	/// <param name="email">
	/// The recipient's email address.
	/// </param>
	/// <param name="username">
	/// The recipient's username used in the email body.
	/// </param>
	/// <param name="resetToken">
	/// The password reset token to build the reset link.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public async Task SendPasswordResetEmailAsync(
		string email,
		string username,
		string resetToken,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(email);
		ArgumentException.ThrowIfNullOrWhiteSpace(username);
		ArgumentException.ThrowIfNullOrWhiteSpace(resetToken);

		string resetUrl =
			BuildPasswordResetUrl(resetToken);

		string subject = "SeventySix - Password Reset Request";

		string body =
			BuildPasswordResetEmailBody(username, resetUrl);

		await SendEmailAsync(email, subject, body, cancellationToken);
	}

	/// <summary>
	/// Sends an email with a verification link for self-registration.
	/// </summary>
	/// <param name="email">
	/// The recipient's email address.
	/// </param>
	/// <param name="verificationToken">
	/// The verification token used to build the verification URL.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public async Task SendVerificationEmailAsync(
		string email,
		string verificationToken,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(email);
		ArgumentException.ThrowIfNullOrWhiteSpace(verificationToken);

		string verificationUrl =
			BuildEmailVerificationUrl(
				email,
				verificationToken);

		string subject = "SeventySix - Verify Your Email";

		string body =
			BuildVerificationEmailBody(verificationUrl);

		await SendEmailAsync(email, subject, body, cancellationToken);
	}

	/// <summary>
	/// Builds the password reset URL with encoded token.
	/// </summary>
	/// <param name="resetToken">
	/// The reset token.
	/// </param>
	/// <returns>
	/// Full URL for password reset.
	/// </returns>
	private string BuildPasswordResetUrl(string resetToken) =>
		$"{settings.Value.ClientBaseUrl}/auth/set-password?token={Uri.EscapeDataString(resetToken)}";

	/// <summary>
	/// Builds the email verification URL with a combined token that encodes the email
	/// and the verification token into a URL-safe string.
	/// </summary>
	/// <param name="email">
	/// The recipient email address.
	/// </param>
	/// <param name="verificationToken">
	/// The verification token.
	/// </param>
	/// <returns>
	/// Full URL for email verification.
	/// </returns>
	private string BuildEmailVerificationUrl(
		string email,
		string verificationToken)
	{
		string combinedToken =
			RegistrationTokenService.Encode(
				email,
				verificationToken);

		return $"{settings.Value.ClientBaseUrl}/auth/register/complete?token={Uri.EscapeDataString(combinedToken)}";
	}

	/// <summary>
	/// Sends an email with the specified parameters.
	/// </summary>
	/// <param name="to">
	/// Recipient email address.
	/// </param>
	/// <param name="subject">
	/// Email subject.
	/// </param>
	/// <param name="htmlBody">
	/// HTML email body.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <exception cref="InvalidOperationException">Thrown when email daily limit is exceeded.</exception>
	private async Task SendEmailAsync(
		string to,
		string subject,
		string htmlBody,
		CancellationToken cancellationToken)
	{
		if (!settings.Value.Enabled)
		{
			logger.LogWarning(
				"[EMAIL DISABLED] Would send to {To}: {Subject}",
				to,
				subject);
			return;
		}

		await EnsureRateLimitNotExceededAsync(cancellationToken);

		using MimeMessage message =
			BuildMimeMessage(to, subject, htmlBody);
		await SendViaSMtpAsync(message, cancellationToken);
		await TrackRateLimitAsync(cancellationToken);

		logger.LogWarning(
			"Email sent to {To}: {Subject}",
			to,
			subject);
	}

	/// <summary>
	/// Ensures the daily email rate limit has not been exceeded.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <exception cref="EmailRateLimitException">
	/// Thrown when the configured daily quota has been reached.
	/// </exception>
	private async Task EnsureRateLimitNotExceededAsync(
		CancellationToken cancellationToken)
	{
		bool canSend =
			await rateLimitingService.CanMakeRequestAsync(
				BREVO_API_NAME,
				cancellationToken);
		if (canSend)
		{
			return;
		}

		int remaining =
			await rateLimitingService.GetRemainingQuotaAsync(
				BREVO_API_NAME,
				cancellationToken);
		TimeSpan resetTime =
			rateLimitingService.GetTimeUntilReset();

		logger.LogError(
			"Email daily limit exceeded. Remaining: {Remaining}. Resets in: {TimeUntilReset}",
			remaining,
			resetTime);
		throw new EmailRateLimitException(resetTime, remaining);
	}

	/// <summary>
	/// Builds a <see cref="MimeMessage"/> with the configured sender, recipient, subject and HTML body.
	/// </summary>
	/// <param name="to">
	/// Recipient email address.
	/// </param>
	/// <param name="subject">
	/// Email subject.
	/// </param>
	/// <param name="htmlBody">
	/// HTML body content for the email.
	/// </param>
	/// <returns>
	/// A populated <see cref="MimeMessage"/> ready for sending.
	/// </returns>
	private MimeMessage BuildMimeMessage(
		string to,
		string subject,
		string htmlBody)
	{
		MimeMessage message = new();
		message.From.Add(
			new MailboxAddress(
				settings.Value.FromName,
				settings.Value.FromAddress));
		message.To.Add(MailboxAddress.Parse(to));
		message.Subject = subject;
		message.Body =
			new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();
		return message;
	}

	/// <summary>
	/// Sends the provided <see cref="MimeMessage"/> via SMTP using the configured <see cref="EmailSettings"/>.
	/// </summary>
	/// <param name="message">
	/// The message to send.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <exception cref="Exception">
	/// Thrown when SMTP connection, authentication or send operations fail.
	/// </exception>
	private async Task SendViaSMtpAsync(
		MimeMessage message,
		CancellationToken cancellationToken)
	{
		using SmtpClient client = new();
		SecureSocketOptions securityOptions =
			settings.Value.UseSsl
			? SecureSocketOptions.StartTls
			: SecureSocketOptions.None;

		await client.ConnectAsync(
			settings.Value.SmtpHost,
			settings.Value.SmtpPort,
			securityOptions,
			cancellationToken);

		if (!string.IsNullOrEmpty(settings.Value.SmtpUsername))
		{
			await client.AuthenticateAsync(
				settings.Value.SmtpUsername,
				settings.Value.SmtpPassword,
				cancellationToken);
		}

		await client.SendAsync(message, cancellationToken);
		await client.DisconnectAsync(quit: true, cancellationToken);
	}

	/// <summary>
	/// Attempts to increment the external API rate limit counter and logs a warning if it fails.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	private async Task TrackRateLimitAsync(CancellationToken cancellationToken)
	{
		bool success =
			await rateLimitingService.TryIncrementRequestCountAsync(
				BREVO_API_NAME,
				BREVO_BASE_URL,
				cancellationToken);
		if (!success)
		{
			logger.LogWarning(
				"Email sent successfully but failed to increment rate limit counter for {ApiName}",
				BREVO_API_NAME);
		}
	}

	/// <summary>
	/// Builds HTML body for welcome email.
	/// </summary>
	/// <param name="username">
	/// The recipient's username to personalize the message.
	/// </param>
	/// <param name="resetUrl">
	/// The password reset URL included in the email.
	/// </param>
	/// <returns>
	/// The HTML string for the welcome email body.
	/// </returns>
	private static string BuildWelcomeEmailBody(
		string username,
		string resetUrl) =>
		$$"""
			<!DOCTYPE html>
			<html>
			<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1>Welcome to SeventySix!</h1>
				<p>Hello {{username}},</p>
				<p>Your account has been created. Please set your password to complete registration:</p>
				<p style="margin: 24px 0;">
					<a href="{{resetUrl}}"
				   style="display: inline-block; background: #2196F3; color: white; padding: 12px 24px; border: 1px solid #2196F3; font-weight: 600; text-decoration: none; border-radius: 4px;">
						Set Your Password
					</a>
				</p>
				<p>This link expires in 24 hours.</p>
				<p>If you did not request this account, please ignore this email.</p>
				<hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
				<p style="color: #666; font-size: 12px;">SeventySix Team</p>
			</body>
			</html>
			""";

	/// <summary>
	/// Builds HTML body for password reset email.
	/// </summary>
	/// <param name="username">
	/// The recipient's username to personalize the message.
	/// </param>
	/// <param name="resetUrl">
	/// The password reset URL included in the email.
	/// </param>
	/// <returns>
	/// The HTML string for the password reset email body.
	/// </returns>
	private static string BuildPasswordResetEmailBody(
		string username,
		string resetUrl) =>
		$$"""
			<!DOCTYPE html>
			<html>
			<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1>Password Reset Request</h1>
				<p>Hello {{username}},</p>
				<p>We received a request to reset your password. Click the button below to set a new password:</p>
				<p style="margin: 24px 0;">
					<a href="{{resetUrl}}"
				   style="display: inline-block; background: #2196F3; color: white; padding: 12px 24px; border: 1px solid #2196F3; font-weight: 600; text-decoration: none; border-radius: 4px;">
						Reset Password
					</a>
				</p>
				<p>This link expires in 24 hours.</p>
				<p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
				<hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
				<p style="color: #666; font-size: 12px;">SeventySix Team</p>
			</body>
			</html>
			""";

	/// <summary>
	/// Builds HTML body for email verification email.
	/// </summary>
	/// <param name="verificationUrl">
	/// The email verification URL included in the message.
	/// </param>
	/// <returns>
	/// The HTML string for the verification email body.
	/// </returns>
	private static string BuildVerificationEmailBody(string verificationUrl) =>
		$$"""
			<!DOCTYPE html>
			<html>
			<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1>Verify Your Email</h1>
				<p>Thank you for registering with SeventySix!</p>
				<p>Please click the button below to verify your email address and complete your registration:</p>
				<p style="margin: 24px 0;">
					<a href="{{verificationUrl}}"
				   style="display: inline-block; background: #2196F3; color: white; padding: 12px 24px; border: 1px solid #2196F3; font-weight: 600; text-decoration: none; border-radius: 4px;">
						Verify Email
					</a>
				</p>
				<p>This link expires in 24 hours.</p>
				<p>If you did not create an account with SeventySix, please ignore this email.</p>
				<hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
				<p style="color: #666; font-size: 12px;">SeventySix Team</p>
			</body>
			</html>
			""";
}