// <copyright file="IpAnonymizationService.cs" company="SeventySix">
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
/// Background service that periodically anonymizes old IP addresses for GDPR compliance.
/// </summary>
/// <remarks>
/// Anonymizes User.LastLoginIp where LastLoginAt is older than RetentionDays (default: 90).
/// Runs every IntervalDays (default: 7 days).
/// </remarks>
public class IpAnonymizationService(
	IServiceScopeFactory scopeFactory,
	IOptions<IpAnonymizationSettings> settings,
	ILogger<IpAnonymizationService> logger,
	TimeProvider timeProvider) : BackgroundService
{
	/// <summary>
	/// Executes the background anonymization job on a periodic timer.
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
			TimeSpan.FromDays(settings.Value.IntervalDays);

		using PeriodicTimer timer =
			new(interval);

		while (!stoppingToken.IsCancellationRequested)
		{
			await this.AnonymizeIpAddressesInternalAsync(stoppingToken);

			await timer.WaitForNextTickAsync(stoppingToken);
		}
	}

	/// <summary>
	/// Public method for testing purposes - delegates to internal anonymization with default cancellation.
	/// </summary>
	/// <returns>
	/// A task that represents the asynchronous operation.
	/// </returns>
	public async Task AnonymizeIpAddressesAsync()
	{
		await this.AnonymizeIpAddressesInternalAsync(CancellationToken.None);
	}

	/// <summary>
	/// Performs the IP anonymization operation for users older than retention cutoff.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for the operation.
	/// </param>
	private async Task AnonymizeIpAddressesInternalAsync(
		CancellationToken cancellationToken)
	{
		await using AsyncServiceScope scope =
			scopeFactory.CreateAsyncScope();

		IdentityDbContext dbContext =
			scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

		DateTime cutoff =
			timeProvider
				.GetUtcNow()
				.AddDays(-settings.Value.RetentionDays)
				.UtcDateTime;

		// Anonymize User.LastLoginIp where LastLoginAt is at or older than cutoff
		int anonymizedCount =
			await dbContext
				.Users
				.Where(user => user.LastLoginIp != null)
				.Where(user => user.LastLoginAt <= cutoff)
				.ExecuteUpdateAsync(
					setter =>
						setter.SetProperty(user => user.LastLoginIp, (string?)null),
					cancellationToken);

		// Log summary (Information level - background job completion)
		if (anonymizedCount > 0)
		{
			logger.LogInformation(
				"IP anonymization completed. Anonymized {Count} user IP addresses",
				anonymizedCount);
		}
	}
}