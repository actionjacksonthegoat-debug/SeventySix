// <copyright file="TrustedDeviceRevocationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

/// <summary>
/// Handles single and bulk revocation of trusted devices.
/// </summary>
/// <remarks>
/// Single responsibility: device revocation operations.
/// Separated from device authentication to keep each service focused.
/// </remarks>
/// <param name="context">
/// The Identity database context.
/// </param>
public sealed class TrustedDeviceRevocationService(
	IdentityDbContext context)
	: ITrustedDeviceRevocationService
{
	/// <inheritdoc/>
	public async Task RevokeAllAsync(
		long userId,
		CancellationToken cancellationToken)
	{
		await context
			.TrustedDevices
			.Where(device => device.UserId == userId)
			.ExecuteDeleteAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> RevokeDeviceAsync(
		long userId,
		long deviceId,
		CancellationToken cancellationToken)
	{
		int deleted =
			await context
				.TrustedDevices
				.Where(device =>
					device.Id == deviceId
					&& device.UserId == userId)
				.ExecuteDeleteAsync(cancellationToken);

		return deleted > 0;
	}
}
