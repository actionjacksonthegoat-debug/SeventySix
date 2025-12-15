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
	/// <param name="stoppingToken">Cancellation token for graceful shutdown.</param>
	/// <returns>A task that represents the asynchronous operation.</returns>
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
	/// <returns>A task that represents the asynchronous operation.</returns>
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

		DateTime cutoffDate =
			timeProvider
			.GetUtcNow()
			.AddDays(-settings.Value.RetentionDays)
			.UtcDateTime;

		int deletedCount =
			await dbContext
				.RefreshTokens
				.Where(rt => rt.ExpiresAt < cutoffDate)
				.ExecuteDeleteAsync(cancellationToken);

		if (deletedCount > 0)
		{
			logger.LogWarning(
				"Cleaned up {Count} expired refresh tokens older than {CutoffDate}",
				deletedCount,
				cutoffDate);
		}
	}
}
