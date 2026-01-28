// <copyright file="EmailQueueProcessJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared.BackgroundJobs;
using Wolverine;

namespace SeventySix.ElectronicNotifications.Emails.Jobs;

/// <summary>
/// Handles periodic processing of the email queue.
/// </summary>
/// <param name="messageBus">
/// The Wolverine message bus for invoking queries/commands.
/// </param>
/// <param name="emailService">
/// The email sending service.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="emailSettings">
/// Configuration for email delivery.
/// </param>
/// <param name="queueSettings">
/// Configuration for queue processing behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for execution tracking.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class EmailQueueProcessJobHandler(
	IMessageBus messageBus,
	IEmailService emailService,
	IRecurringJobService recurringJobService,
	IOptions<EmailSettings> emailSettings,
	IOptions<EmailQueueSettings> queueSettings,
	TimeProvider timeProvider,
	ILogger<EmailQueueProcessJobHandler> logger)
{
	/// <summary>
	/// Handles the email queue processing job.
	/// </summary>
	/// <param name="job">
	/// The job message (marker type).
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task HandleAsync(
		EmailQueueProcessJob job,
		CancellationToken cancellationToken)
	{
		EmailSettings emailConfig =
			emailSettings.Value;

		EmailQueueSettings queueConfig =
			queueSettings.Value;

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		if (emailConfig.Enabled && queueConfig.Enabled)
		{
			IReadOnlyList<EmailQueueEntry> pendingEmails =
				await messageBus.InvokeAsync<IReadOnlyList<EmailQueueEntry>>(
					new GetPendingEmailsQuery(
						queueConfig.BatchSize,
						queueConfig.RetryDelayMinutes),
					cancellationToken);

			if (pendingEmails.Count > 0)
			{
				int successCount = 0;
				int failCount = 0;

				foreach (EmailQueueEntry entry in pendingEmails)
				{
					bool success =
						await ProcessSingleEmailAsync(
							entry,
							cancellationToken);

					if (success)
					{
						successCount++;
					}
					else
					{
						failCount++;
					}
				}

				logger.LogInformation(
					"Email queue batch processed. Sent: {SuccessCount}, Failed: {FailCount}",
					successCount,
					failCount);
			}
		}

		TimeSpan interval =
			TimeSpan.FromSeconds(queueConfig.ProcessingIntervalSeconds);

		await recurringJobService.RecordAndScheduleNextAsync<EmailQueueProcessJob>(
			nameof(EmailQueueProcessJob),
			now,
			interval,
			cancellationToken);
	}

	/// <summary>
	/// Processes a single email queue entry by sending the email and updating its status.
	/// </summary>
	/// <param name="entry">
	/// The email queue entry to process.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// True if the email was sent successfully; otherwise false.
	/// </returns>
	private async Task<bool> ProcessSingleEmailAsync(
		EmailQueueEntry entry,
		CancellationToken cancellationToken)
	{
		try
		{
			Dictionary<string, string> templateData =
				JsonSerializer.Deserialize<Dictionary<string, string>>(
					entry.TemplateData) ?? [];

			await SendEmailByTypeAsync(
				entry.EmailType,
				entry.RecipientEmail,
				templateData,
				cancellationToken);

			await messageBus.InvokeAsync(
				new MarkEmailSentCommand(entry.Id),
				cancellationToken);

			return true;
		}
		catch (EmailRateLimitException)
		{
			logger.LogWarning(
				"Rate limited while sending email {EmailId}",
				entry.Id);

			await messageBus.InvokeAsync(
				new MarkEmailFailedCommand(
					entry.Id,
					"Rate limited - will retry"),
				cancellationToken);

			return false;
		}
		catch (Exception exception)
		{
			logger.LogError(
				exception,
				"Failed to send email {EmailId} to {Recipient}",
				entry.Id,
				entry.RecipientEmail);

			await messageBus.InvokeAsync(
				new MarkEmailFailedCommand(entry.Id, exception.Message),
				cancellationToken);

			return false;
		}
	}

	/// <summary>
	/// Sends an email based on its type using the appropriate service method.
	/// </summary>
	/// <param name="emailType">
	/// The type of email to send (Welcome, PasswordReset, Verification, MfaVerification).
	/// </param>
	/// <param name="recipientEmail">
	/// The recipient's email address.
	/// </param>
	/// <param name="templateData">
	/// Template data for email personalization.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task SendEmailByTypeAsync(
		string emailType,
		string recipientEmail,
		Dictionary<string, string> templateData,
		CancellationToken cancellationToken)
	{
		switch (emailType)
		{
			case EmailType.Welcome:
				await emailService.SendWelcomeEmailAsync(
					recipientEmail,
					templateData.GetValueOrDefault("username", "User"),
					templateData.GetValueOrDefault("resetToken", ""),
					cancellationToken);
				break;

			case EmailType.PasswordReset:
				await emailService.SendPasswordResetEmailAsync(
					recipientEmail,
					templateData.GetValueOrDefault("username", "User"),
					templateData.GetValueOrDefault("resetToken", ""),
					cancellationToken);
				break;

			case EmailType.Verification:
				await emailService.SendVerificationEmailAsync(
					recipientEmail,
					templateData.GetValueOrDefault("verificationToken", ""),
					cancellationToken);
				break;

			case EmailType.MfaVerification:
				int expirationMinutes =
					int.TryParse(
						templateData.GetValueOrDefault("expirationMinutes", "5"),
						out int minutes)
						? minutes
						: 5;

				await emailService.SendMfaCodeEmailAsync(
					recipientEmail,
					templateData.GetValueOrDefault("code", ""),
					expirationMinutes,
					cancellationToken);
				break;

			default:
				throw new ArgumentException(
					$"Unknown email type: {emailType}",
					nameof(emailType));
		}
	}
}