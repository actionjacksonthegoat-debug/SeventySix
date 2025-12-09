// <copyright file="PendingEmailBackgroundService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
using Wolverine;

namespace SeventySix.Identity;

/// <summary>
/// Background service that processes pending welcome emails for users.
/// Runs daily at 00:05 UTC (5 minutes after rate limit reset).
/// </summary>
public class PendingEmailBackgroundService(
	IServiceScopeFactory scopeFactory,
	IOptions<EmailSettings> emailSettings,
	TimeProvider timeProvider,
	ILogger<PendingEmailBackgroundService> logger) : BackgroundService
{
	private static readonly TimeOnly RunTime =
		new(0, 5, 0);

	/// <inheritdoc/>
	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		if (!emailSettings.Value.Enabled)
		{
			return;
		}

		while (!stoppingToken.IsCancellationRequested)
		{
			TimeSpan delay =
				CalculateDelayUntilNextRun();

			try
			{
				await Task.Delay(
					delay,
					stoppingToken);

				await ProcessPendingEmailsAsync(stoppingToken);
			}
			catch (OperationCanceledException)
			{
				break;
			}
			catch (Exception ex)
			{
				logger.LogError(
					ex,
					"Error in PendingEmailBackgroundService");

				await Task.Delay(
					TimeSpan.FromHours(1),
					stoppingToken);
			}
		}
	}

	private TimeSpan CalculateDelayUntilNextRun()
	{
		DateTime now =
			timeProvider
				.GetUtcNow()
				.UtcDateTime;
		DateTime todayRun =
			now.Date.Add(RunTime.ToTimeSpan());
		DateTime nextRun =
			now < todayRun
			? todayRun
			: todayRun.AddDays(1);

		return nextRun - now;
	}

	private async Task ProcessPendingEmailsAsync(CancellationToken cancellationToken)
	{
		await using AsyncServiceScope scope =
			scopeFactory.CreateAsyncScope();

		IMessageBus messageBus =
			scope.ServiceProvider.GetRequiredService<IMessageBus>();

		IEnumerable<UserDto> pendingUsers =
			await messageBus.InvokeAsync<IEnumerable<UserDto>>(
				new GetUsersNeedingEmailQuery(),
				cancellationToken); int successCount = 0;
		int failCount = 0;

		foreach (UserDto user in pendingUsers)
		{
			try
			{
				await messageBus.InvokeAsync(
					new InitiatePasswordResetCommand(
						user.Id,
						IsNewUser: true),
					cancellationToken);

				await messageBus.InvokeAsync(
					new ClearPendingEmailFlagCommand(user.Id),
					cancellationToken); successCount++;
			}
			catch (EmailRateLimitException)
			{
				failCount++;
				logger.LogWarning(
					"Still rate limited for user {UserId}",
					user.Id);
			}
			catch (Exception ex)
			{
				failCount++;
				logger.LogError(
					ex,
					"Failed to send pending email to user {UserId}",
					user.Id);
			}
		}

		if (
			successCount > 0
			|| failCount > 0)
		{
			logger.LogWarning(
				"Pending email processing complete. Success: {Success}, Failed: {Failed}",
				successCount,
				failCount);
		}
	}
}