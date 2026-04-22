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
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The plain text device token to store in a cookie.
	/// </returns>
	public Task<string> CreateTrustedDeviceAsync(
		long userId,
		string userAgent,
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