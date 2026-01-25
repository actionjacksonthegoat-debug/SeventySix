// <copyright file="ITrustedDeviceService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for trusted device (Remember This Device) operations.
/// </summary>
public interface ITrustedDeviceService
{
	/// <summary>
	/// Creates a trusted device token after successful MFA verification.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="userAgent">
	/// The browser's User-Agent string for fingerprinting.
	/// </param>
	/// <param name="ipAddress">
	/// The client's IP address for fingerprinting.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The plain text device token to store in a cookie.
	/// </returns>
	public Task<string> CreateTrustedDeviceAsync(
		long userId,
		string userAgent,
		string? ipAddress,
		CancellationToken cancellationToken);

	/// <summary>
	/// Validates a trusted device token and fingerprint.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="token">
	/// The device token from the cookie.
	/// </param>
	/// <param name="userAgent">
	/// The browser's User-Agent string for fingerprint verification.
	/// </param>
	/// <param name="ipAddress">
	/// The client's IP address for fingerprint verification.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the device is trusted and fingerprint matches.
	/// </returns>
	public Task<bool> ValidateTrustedDeviceAsync(
		long userId,
		string token,
		string userAgent,
		string? ipAddress,
		CancellationToken cancellationToken);

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
	/// True if the device was found and revoked.
	/// </returns>
	public Task<bool> RevokeDeviceAsync(
		long userId,
		long deviceId,
		CancellationToken cancellationToken);

	/// <summary>
	/// Lists user's trusted devices.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A list of trusted device DTOs for display.
	/// </returns>
	public Task<IReadOnlyList<TrustedDeviceDto>> GetUserDevicesAsync(
		long userId,
		CancellationToken cancellationToken);
}