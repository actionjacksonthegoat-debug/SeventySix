// <copyright file="TokenCleanupService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// Background service that periodically cleans up expired refresh tokens.
/// Prevents RefreshTokens table bloat and improves query performance.
/// </summary>
public class TokenCleanupService(
	IServiceScopeFactory scopeFactory,
	IOptions<AuthSettings> authSettings,
	ILogger<TokenCleanupService> logger) : BackgroundService
{
	/// <inheritdoc/>
	protected override async Task ExecuteAsync(CancellationToken stoppingToken)
	{
		TokenCleanupSettings settings =
			authSettings.Value.TokenCleanup;

		TimeSpan initialDelay =
			TimeSpan.FromMinutes(settings.InitialDelayMinutes);

		TimeSpan cleanupInterval =
			TimeSpan.FromHours(settings.IntervalHours);

		// Initial delay to let app fully start
		await Task.Delay(
			initialDelay,
			stoppingToken);

		while (!stoppingToken.IsCancellationRequested)
		{
			try
			{
				await CleanupExpiredTokensAsync(stoppingToken);
			}
			catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
			{
				// Graceful shutdown - don't log as error
				break;
			}
			catch (Exception ex)
			{
				logger.LogError(
					ex,
					"Error during token cleanup");
			}

			await Task.Delay(
				cleanupInterval,
				stoppingToken);
		}
	}

	private async Task CleanupExpiredTokensAsync(CancellationToken cancellationToken)
	{
		using IServiceScope scope =
			scopeFactory.CreateScope();

		IdentityDbContext db =
			scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

		int retentionDays =
			authSettings.Value.TokenCleanup.RetentionDays;

		DateTime cutoff =
			DateTime.UtcNow.AddDays(-retentionDays);

		int deletedCount =
			await db.RefreshTokens
				.Where(token => token.ExpiresAt < cutoff)
				.ExecuteDeleteAsync(cancellationToken);

		if (deletedCount > 0)
		{
			logger.LogInformation(
				"Cleaned up {DeletedCount} expired tokens older than {CutoffDate:yyyy-MM-dd}",
				deletedCount,
				cutoff);
		}
	}
}