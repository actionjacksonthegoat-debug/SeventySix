// <copyright file="ITrustedDeviceRevocationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handles single and bulk revocation of trusted devices.
/// </summary>
public interface ITrustedDeviceRevocationService
{
	/// <summary>
	/// Revokes all trusted devices for a user.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task RevokeAllAsync(
		long userId,
		CancellationToken cancellationToken);

	/// <summary>
	/// Revokes a specific trusted device.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="deviceId">
	/// The device ID to revoke.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the device was found and deleted; false if not found.
	/// </returns>
	public Task<bool> RevokeDeviceAsync(
		long userId,
		long deviceId,
		CancellationToken cancellationToken);
}