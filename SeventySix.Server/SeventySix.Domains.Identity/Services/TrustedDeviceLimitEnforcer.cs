// <copyright file="TrustedDeviceLimitEnforcer.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// Enforces the maximum trusted device limit per user by removing oldest devices.
/// </summary>
/// <remarks>
/// Single responsibility: device count enforcement.
/// When a user is at or above the configured maximum, the oldest devices
/// (ordered by last-used or creation date) are deleted to make room for a new device.
/// </remarks>
/// <param name="context">
/// The Identity database context.
/// </param>
/// <param name="settings">
/// Trusted device configuration settings.
/// </param>
public sealed class TrustedDeviceLimitEnforcer(
	IdentityDbContext context,
	IOptions<TrustedDeviceSettings> settings)
	: ITrustedDeviceLimitEnforcer
{
	/// <inheritdoc/>
	public async Task EnforceDeviceLimitAsync(
		long userId,
		CancellationToken cancellationToken)
	{
		int currentCount =
			await context
				.TrustedDevices
				.CountAsync(
					device => device.UserId == userId,
					cancellationToken);

		if (currentCount >= settings.Value.MaxDevicesPerUser)
		{
			// Delete oldest device(s) to make room
			List<long> oldestDeviceIds =
				await context
					.TrustedDevices
					.Where(device => device.UserId == userId)
					.OrderBy(device => device.LastUsedAt ?? device.CreateDate)
					.Take(currentCount - settings.Value.MaxDevicesPerUser + 1)
					.Select(device => device.Id)
					.ToListAsync(cancellationToken);

			await context
				.TrustedDevices
				.Where(device => oldestDeviceIds.Contains(device.Id))
				.ExecuteDeleteAsync(cancellationToken);
		}
	}
}
