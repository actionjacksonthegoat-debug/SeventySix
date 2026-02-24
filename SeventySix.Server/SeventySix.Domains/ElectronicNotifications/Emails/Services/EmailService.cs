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
/// <para>
/// When Enabled=false, logs email details without sending (development mode).
/// When Enabled=true, sends via configured SMTP server.
/// Enforces daily rate limit via IRateLimitingService to prevent exceeding external API quotas.
/// </para>
/// <para>
/// <strong>Template Extraction Threshold:</strong>
/// Email templates are currently inline HTML strings. Consider extracting to embedded resources
/// or using a template engine (e.g., Scriban) if templates exceed:
/// - 10+ different email templates, OR
/// - 100+ lines per individual template.
/// </para>
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
public sealed class EmailService(
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

		string subject =
			EmailSubjectConstants.Welcome;

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

		string subject =
			EmailSubjectConstants.PasswordReset;

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

		string subject =
			EmailSubjectConstants.EmailVerification;

		string body =
			BuildVerificationEmailBody(verificationUrl);

		await SendEmailAsync(email, subject, body, cancellationToken);
	}

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
	public async Task SendMfaCodeEmailAsync(
		string email,
		string code,
		int expirationMinutes,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(email);
		ArgumentException.ThrowIfNullOrWhiteSpace(code);
		ArgumentOutOfRangeException.ThrowIfNegativeOrZero(expirationMinutes);

		string subject =
			EmailSubjectConstants.MfaVerification;

		string body =
			BuildMfaCodeEmailBody(
				code,
				expirationMinutes);

		await SendEmailAsync(
			email,
			subject,
			body,
			cancellationToken);
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
	/// <exception cref="EmailRateLimitException">Thrown when email daily limit is exceeded.</exception>
	/// <remarks>
	/// <para>
	/// Uses a reserve-then-execute pattern to guarantee the rate limit count is always
	/// greater than or equal to the number of actual SMTP sends:
	/// </para>
	/// <list type="number">
	/// <item>Reserve a rate limit slot (atomic increment via transaction with retry)</item>
	/// <item>Send the email via SMTP</item>
	/// <item>On SMTP failure: best-effort decrement (count staying 1 too high is safe)</item>
	/// </list>
	/// </remarks>
	private async Task SendEmailAsync(
		string to,
		string subject,
		string htmlBody,
		CancellationToken cancellationToken)
	{
		if (!settings.Value.Enabled)
		{
			// codeql[cs/exposure-of-sensitive-information] -- email masked via MaskEmail (first char + domain), subject mapped to category label by MaskEmailSubject
			logger.LogWarning(
				"[EMAIL DISABLED] Would send to {To}: {Subject}",
				LogSanitizer.MaskEmail(to),
				LogSanitizer.MaskEmailSubject(subject));
			return;
		}

		// RESERVE the rate limit slot BEFORE sending — atomic, transactional with retry
		await ReserveRateLimitSlotAsync(cancellationToken);

		try
		{
			using MimeMessage message =
				BuildMimeMessage(to, subject, htmlBody);
			await SendViaSMtpAsync(message, cancellationToken);
		}
		catch (Exception exception)
		{
			// SMTP failed — release the reserved slot (best-effort)
			await TryReleaseRateLimitSlotAsync(cancellationToken);

			// codeql[cs/exposure-of-sensitive-information] -- email masked via MaskEmail (first char + domain), subject mapped to category label by MaskEmailSubject
			logger.LogError(
				exception,
				"SMTP send failed for {To}: {Subject}. Rate limit slot released.",
				LogSanitizer.MaskEmail(to),
				LogSanitizer.MaskEmailSubject(subject));
			throw;
		}

		// codeql[cs/exposure-of-sensitive-information] -- email masked via MaskEmail (first char + domain), subject mapped to category label by MaskEmailSubject
		logger.LogWarning(
			"Email sent to {To}: {Subject}",
			LogSanitizer.MaskEmail(to),
			LogSanitizer.MaskEmailSubject(subject));
	}

	/// <summary>
	/// Atomically reserves a rate limit slot. Throws if the limit is reached.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <exception cref="EmailRateLimitException">
	/// Thrown when the configured daily quota has been reached.
	/// </exception>
	private async Task ReserveRateLimitSlotAsync(
		CancellationToken cancellationToken)
	{
		bool reserved =
			await rateLimitingService.TryIncrementRequestCountAsync(
				BREVO_API_NAME,
				BREVO_BASE_URL,
				cancellationToken);

		if (!reserved)
		{
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
	}

	/// <summary>
	/// Best-effort release of a previously reserved rate limit slot.
	/// If this fails, the count stays 1 too high (conservative/safe).
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	private async Task TryReleaseRateLimitSlotAsync(
		CancellationToken cancellationToken)
	{
		try
		{
			await rateLimitingService.TryDecrementRequestCountAsync(
				BREVO_API_NAME,
				cancellationToken);
		}
		catch (Exception decrementException)
		{
			// Log but don't throw — the email wasn't sent, count is 1 too high, which is safe
			logger.LogWarning(
				decrementException,
				"Failed to release rate limit slot for {ApiName}. Count may be 1 too high (safe/conservative).",
				BREVO_API_NAME);
		}
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
		BuildEmailHtml(
			"Welcome to SeventySix!",
			$$"""
			<p>Hello {{username}},</p>
			<p>Your account has been created. Please set your password to complete registration:</p>
			{{BuildButtonHtml(resetUrl, "Set Your Password")}}
			<p>This link expires in 24 hours.</p>
			<p>If you did not request this account, please ignore this email.</p>
			""");

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
		BuildEmailHtml(
			"Password Reset Request",
			$$"""
			<p>Hello {{username}},</p>
			<p>We received a request to reset your password. Click the button below to set a new password:</p>
			{{BuildButtonHtml(resetUrl, "Reset Password")}}
			<p>This link expires in 24 hours.</p>
			<p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
			""");

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
		BuildEmailHtml(
			"Verify Your Email",
			$$"""
			<p>Thank you for registering with SeventySix!</p>
			<p>Please click the button below to verify your email address and complete your registration:</p>
			{{BuildButtonHtml(verificationUrl, "Verify Email")}}
			<p>This link expires in 24 hours.</p>
			<p>If you did not create an account with SeventySix, please ignore this email.</p>
			""");

	/// <summary>
	/// Builds HTML body for MFA verification code email.
	/// </summary>
	/// <param name="code">
	/// The 6-digit verification code.
	/// </param>
	/// <param name="expirationMinutes">
	/// Number of minutes until the code expires.
	/// </param>
	/// <returns>
	/// The HTML string for the MFA verification email body.
	/// </returns>
	private static string BuildMfaCodeEmailBody(
		string code,
		int expirationMinutes) =>
		BuildEmailHtml(
			"Your Verification Code",
			$$"""
			<p>Use the following code to complete your sign-in:</p>
			<p style="margin: 24px 0; text-align: center;">
				<span style="display: inline-block; background: #f5f5f5; padding: 16px 32px; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace; border-radius: 4px;">
					{{code}}
				</span>
			</p>
			<p>This code expires in {{expirationMinutes}} minutes.</p>
			<p><strong>Security tip:</strong> Never share this code with anyone. SeventySix will never ask for your verification code.</p>
			<p>If you did not attempt to sign in, please secure your account immediately by changing your password.</p>
			""");

	/// <summary>
	/// Builds an HTML email body with the shared template structure.
	/// </summary>
	/// <param name="title">
	/// The email title/header displayed in the body.
	/// </param>
	/// <param name="bodyContent">
	/// The HTML content for the email body section.
	/// </param>
	/// <returns>
	/// Complete HTML email string with consistent styling.
	/// </returns>
	private static string BuildEmailHtml(
		string title,
		string bodyContent) =>
		$$"""
		<!DOCTYPE html>
		<html>
		<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h1>{{title}}</h1>
			{{bodyContent}}
			<hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
			<p style="color: #666; font-size: 12px;">SeventySix Team</p>
		</body>
		</html>
		""";

	/// <summary>
	/// Builds an HTML button with consistent styling for email CTAs.
	/// </summary>
	/// <param name="url">
	/// The URL the button links to.
	/// </param>
	/// <param name="text">
	/// The button text.
	/// </param>
	/// <returns>
	/// HTML string containing a styled button paragraph.
	/// </returns>
	private static string BuildButtonHtml(
		string url,
		string text) =>
		$$"""
		<p style="margin: 24px 0;">
			<a href="{{url}}"
		   style="display: inline-block; background: #2196F3; color: white; padding: 12px 24px; border: 1px solid #2196F3; font-weight: 600; text-decoration: none; border-radius: 4px;">
				{{text}}
			</a>
		</p>
		""";
}