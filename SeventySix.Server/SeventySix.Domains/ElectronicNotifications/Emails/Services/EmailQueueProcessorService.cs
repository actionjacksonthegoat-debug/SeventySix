// <copyright file="EmailQueueProcessorService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Wolverine;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Background service that processes the email queue.
/// </summary>
/// <remarks>
/// Runs on a configurable interval (default: 30 seconds).
/// Processes pending and failed emails up to MaxAttempts.
/// Marks emails as DeadLetter after exceeding retry limit.
/// </remarks>
/// <param name="scopeFactory">
/// Factory used to create DI scopes.
/// </param>
/// <param name="emailSettings">
/// Settings for email delivery.
/// </param>
/// <param name="queueSettings">
/// Settings for queue processing.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class EmailQueueProcessorService(
	IServiceScopeFactory scopeFactory,
	IOptions<EmailSettings> emailSettings,
	IOptions<EmailQueueSettings> queueSettings,
	ILogger<EmailQueueProcessorService> logger) : BackgroundService
{
	/// <inheritdoc/>
	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		if (!emailSettings.Value.Enabled || !queueSettings.Value.Enabled)
		{
			logger.LogWarning("Email queue processor disabled");
			return;
		}

		TimeSpan interval =
			TimeSpan.FromSeconds(
				queueSettings.Value.ProcessingIntervalSeconds);

		using PeriodicTimer timer =
			new(interval);

		while (!stoppingToken.IsCancellationRequested)
		{
			try
			{
				await ProcessQueueAsync(stoppingToken);
			}
			catch (OperationCanceledException)
			{
				break;
			}
			catch (Exception exception)
			{
				logger.LogError(exception, "Error processing email queue");
			}

			await timer.WaitForNextTickAsync(stoppingToken);
		}
	}

	/// <summary>
	/// Processes a batch of pending emails from the queue.
	/// </summary>
	private async Task ProcessQueueAsync(CancellationToken cancellationToken)
	{
		await using AsyncServiceScope scope =
			scopeFactory.CreateAsyncScope();

		IMessageBus messageBus =
			scope.ServiceProvider.GetRequiredService<IMessageBus>();

		IReadOnlyList<EmailQueueEntry> pendingEmails =
			await messageBus.InvokeAsync<IReadOnlyList<EmailQueueEntry>>(
				new GetPendingEmailsQuery(queueSettings.Value.BatchSize),
				cancellationToken);

		if (pendingEmails.Count == 0)
		{
			return;
		}

		int successCount = 0;
		int failCount = 0;

		foreach (EmailQueueEntry entry in pendingEmails)
		{
			bool success =
				await ProcessSingleEmailAsync(
					entry,
					scope.ServiceProvider,
					messageBus,
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
			"Email queue batch processed. Sent: {Sent}, Failed: {Failed}",
			successCount,
			failCount);
	}

	/// <summary>
	/// Processes a single email queue entry.
	/// </summary>
	private async Task<bool> ProcessSingleEmailAsync(
		EmailQueueEntry entry,
		IServiceProvider serviceProvider,
		IMessageBus messageBus,
		CancellationToken cancellationToken)
	{
		try
		{
			IEmailService emailService =
				serviceProvider.GetRequiredService<IEmailService>();

			Dictionary<string, string> templateData =
				JsonSerializer.Deserialize<Dictionary<string, string>>(
					entry.TemplateData) ?? [];

			await SendEmailByTypeAsync(
				entry.EmailType,
				entry.RecipientEmail,
				templateData,
				emailService,
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
	private static async Task SendEmailByTypeAsync(
		string emailType,
		string recipientEmail,
		Dictionary<string, string> templateData,
		IEmailService emailService,
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

			default:
				throw new ArgumentException(
					$"Unknown email type: {emailType}",
					nameof(emailType));
		}
	}
}