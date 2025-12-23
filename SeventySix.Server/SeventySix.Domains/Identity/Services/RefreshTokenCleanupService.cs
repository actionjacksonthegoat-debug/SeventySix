// <copyright file="RefreshTokenCleanupJob.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Settings;

namespace SeventySix.Identity;

/// <summary>
/// Background service that periodically removes expired refresh tokens from the database.
/// </summary>
/// <remarks>
/// Deletes tokens expired more than RetentionDays ago.
/// Runs every IntervalHours (default: 24 hours).
/// </remarks>
public class RefreshTokenCleanupService(
	IServiceScopeFactory scopeFactory,
	IOptions<RefreshTokenCleanupSettings> settings,
	ILogger<RefreshTokenCleanupService> logger,
	TimeProvider timeProvider) : BackgroundService
{
	/// <summary>
	/// Executes the background cleanup job on a periodic timer.
	/// </summary>
	/// <param name="stoppingToken">
	/// Cancellation token for graceful shutdown.
	/// </param>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// </returns>
	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		TimeSpan interval =
			TimeSpan.FromHours(settings.Value.IntervalHours);

		using PeriodicTimer timer =
			new(interval);

		while (!stoppingToken.IsCancellationRequested)
		{
			await this.CleanupExpiredTokensAsync(stoppingToken);

			await timer.WaitForNextTickAsync(stoppingToken);
		}
	}

	/// <summary>
	/// Public method for testing purposes - delegates to internal cleanup with default cancellation.
	/// </summary>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// </returns>
	public async Task CleanupExpiredTokensAsync()
	{
		try
		{
			await this.CleanupExpiredTokensInternalAsync(
				CancellationToken.None);
		}
		catch (Exception exception)
		{
			logger.LogError(exception, "Error during refresh token cleanup");
		}
	}

	private async Task CleanupExpiredTokensAsync(
		CancellationToken cancellationToken)
	{
		try
		{
			await this.CleanupExpiredTokensInternalAsync(cancellationToken);
		}
		catch (Exception exception)
		{
			logger.LogError(exception, "Error during refresh token cleanup");
		}
	}

	private async Task CleanupExpiredTokensInternalAsync(
		CancellationToken cancellationToken)
	{
		await using AsyncServiceScope scope =
			scopeFactory.CreateAsyncScope();

		IdentityDbContext dbContext =
			scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		// Delete expired refresh tokens older than retention period
		DateTime expiredTokenCutoff =
			now.AddDays(
				-settings.Value.RetentionDays);

		int deletedRefreshTokens =
			await dbContext
				.RefreshTokens
				.Where(refreshToken =>
					refreshToken.ExpiresAt < expiredTokenCutoff)
				.ExecuteDeleteAsync(cancellationToken);

		// Delete used password reset tokens older than retention period
		DateTime usedTokenCutoff =
			now.AddHours(
				-settings.Value.UsedTokenRetentionHours);

		int deletedResetTokens =
			await dbContext
				.PasswordResetTokens
				.Where(passwordResetToken =>
					passwordResetToken.IsUsed)
				.Where(passwordResetToken =>
					passwordResetToken.CreateDate < usedTokenCutoff)
				.ExecuteDeleteAsync(cancellationToken);

		// Delete used email verification tokens older than retention period
		int deletedVerificationTokens =
			await dbContext
				.EmailVerificationTokens
				.Where(emailVerificationToken =>
					emailVerificationToken.IsUsed)
				.Where(emailVerificationToken =>
					emailVerificationToken.CreateDate < usedTokenCutoff)
				.ExecuteDeleteAsync(cancellationToken);

		// Log summary (Information level - background job completion)
		if (
			deletedRefreshTokens > 0
			|| deletedResetTokens > 0
			|| deletedVerificationTokens > 0)
		{
			logger.LogInformation(
				"Token cleanup completed. Deleted: {RefreshTokens} refresh, "
					+ "{ResetTokens} password reset, {VerificationTokens} email verification",
				deletedRefreshTokens,
				deletedResetTokens,
				deletedVerificationTokens);
		}
	}
}