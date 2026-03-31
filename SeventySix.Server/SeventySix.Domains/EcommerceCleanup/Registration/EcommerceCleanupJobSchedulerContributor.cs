// <copyright file="EcommerceCleanupJobSchedulerContributor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using SeventySix.EcommerceCleanup.Jobs;
using SeventySix.EcommerceCleanup.Settings;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Exceptions;

namespace SeventySix.EcommerceCleanup.Registration;

/// <summary>
/// Schedules EcommerceCleanup-specific recurring jobs.
/// Contributes to the application's job scheduling without cross-domain dependencies.
/// </summary>
/// <param name="configuration">
/// Application configuration for reading job settings.
/// </param>
[ExcludeFromCodeCoverage]
public sealed class EcommerceCleanupJobSchedulerContributor(
	IConfiguration configuration) : IJobSchedulerContributor
{
	/// <inheritdoc />
	public async Task ScheduleJobsAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		await ScheduleCartSessionCleanupJobAsync(
			recurringJobService,
			cancellationToken);
	}

	/// <summary>
	/// Schedules the cart session cleanup job if ecommerce cleanup is enabled.
	/// </summary>
	/// <param name="recurringJobService">
	/// The recurring job service for scheduling.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ScheduleCartSessionCleanupJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		EcommerceCleanupSettings settings =
			configuration
				.GetSection(EcommerceCleanupSettings.SectionName)
				.Get<EcommerceCleanupSettings>()
			?? throw new RequiredConfigurationException(EcommerceCleanupSettings.SectionName);

		if (!settings.Enabled)
		{
			return;
		}

		TimeOnly preferredTimeUtc =
			new(
				settings.CartSessions.PreferredStartHourUtc,
				settings.CartSessions.PreferredStartMinuteUtc);

		TimeSpan interval =
			TimeSpan.FromHours(settings.CartSessions.IntervalHours);

		await recurringJobService.EnsureScheduledAtPreferredTimeAsync<CartSessionCleanupJob>(
			nameof(CartSessionCleanupJob),
			preferredTimeUtc,
			interval,
			cancellationToken);
	}
}