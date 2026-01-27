// <copyright file="TrustedDeviceService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SeventySix.Shared.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Service for trusted device (Remember This Device) operations.
/// </summary>
/// <param name="context">
/// The Identity database context.
/// </param>
/// <param name="settings">
/// Trusted device configuration settings.
/// </param>
/// <param name="timeProvider">
/// Time provider for timestamps.
/// </param>
public sealed class TrustedDeviceService(
	IdentityDbContext context,
	IOptions<TrustedDeviceSettings> settings,
	TimeProvider timeProvider)
	: ITrustedDeviceService
{
	/// <summary>
	/// Token length in bytes (256 bits for strong randomness).
	/// </summary>
	private const int TokenLengthBytes = 32;

	/// <inheritdoc/>
	public async Task<string> CreateTrustedDeviceAsync(
		long userId,
		string userAgent,
		string? ipAddress,
		CancellationToken cancellationToken)
	{
		// Remove oldest devices if at limit
		await EnforceDeviceLimitAsync(
			userId,
			cancellationToken);

		string plainToken =
			GenerateSecureToken();
		string tokenHash =
			ComputeSha256Hash(plainToken);
		string deviceFingerprint =
			ComputeDeviceFingerprint(userAgent, ipAddress);
		string? deviceName =
			ExtractDeviceName(userAgent);

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		TrustedDevice trustedDevice =
			new()
			{
				UserId = userId,
				TokenHash = tokenHash,
				DeviceFingerprint = deviceFingerprint,
				DeviceName = deviceName,
				ExpiresAt = now.AddDays(settings.Value.TokenLifetimeDays),
				CreateDate = now,
				CreatedBy = AuditConstants.SystemUser
			};

		context.TrustedDevices.Add(trustedDevice);
		await context.SaveChangesAsync(cancellationToken);

		return plainToken;
	}

	/// <inheritdoc/>
	public async Task<bool> ValidateTrustedDeviceAsync(
		long userId,
		string token,
		string userAgent,
		string? ipAddress,
		CancellationToken cancellationToken)
	{
		if (string.IsNullOrEmpty(token))
		{
			return false;
		}

		string tokenHash =
			ComputeSha256Hash(token);
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		TrustedDevice? device =
			await context
				.TrustedDevices
				.FirstOrDefaultAsync(
					trustedDevice =>
						trustedDevice.UserId == userId
						&& trustedDevice.TokenHash == tokenHash
						&& trustedDevice.ExpiresAt > now,
					cancellationToken);

		if (device is null)
		{
			return false;
		}

		// Verify device fingerprint matches
		string currentFingerprint =
			ComputeDeviceFingerprint(userAgent, ipAddress);

		// Use timing-safe comparison
		bool fingerprintMatches =
			CryptographicOperations.FixedTimeEquals(
				Encoding.UTF8.GetBytes(device.DeviceFingerprint),
				Encoding.UTF8.GetBytes(currentFingerprint));

		if (!fingerprintMatches)
		{
			return false;
		}

		// Update last used timestamp
		device.LastUsedAt =
			now;
		device.ModifyDate =
			now;
		device.ModifiedBy =
			AuditConstants.SystemUser;

		await context.SaveChangesAsync(cancellationToken);

		return true;
	}

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

	/// <inheritdoc/>
	public async Task<IReadOnlyList<TrustedDeviceDto>> GetUserDevicesAsync(
		long userId,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		List<TrustedDeviceDto> devices =
			await context
				.TrustedDevices
				.Where(device =>
					device.UserId == userId
					&& device.ExpiresAt > now)
				.OrderByDescending(device => device.LastUsedAt ?? device.CreateDate)
				.Select(device =>
					new TrustedDeviceDto(
						device.Id,
						device.DeviceName,
						device.CreateDate,
						device.LastUsedAt,
						device.ExpiresAt,
						IsCurrentDevice: false))
				.ToListAsync(cancellationToken);

		return devices.AsReadOnly();
	}

	/// <summary>
	/// Enforces the maximum device limit by removing oldest devices.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	private async Task EnforceDeviceLimitAsync(
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

	/// <summary>
	/// Generates a cryptographically secure random token.
	/// </summary>
	/// <returns>
	/// A hex-encoded token.
	/// </returns>
	private static string GenerateSecureToken()
	{
		byte[] tokenBytes =
			new byte[TokenLengthBytes];
		RandomNumberGenerator.Fill(tokenBytes);

		return Convert.ToHexString(tokenBytes).ToLowerInvariant();
	}

	/// <summary>
	/// Computes SHA256 hash of the input.
	/// </summary>
	/// <param name="input">
	/// The string to hash.
	/// </param>
	/// <returns>
	/// Lowercase hex-encoded hash.
	/// </returns>
	private static string ComputeSha256Hash(string input)
	{
		byte[] hashBytes =
			SHA256.HashData(Encoding.UTF8.GetBytes(input));

		return Convert.ToHexString(hashBytes).ToLowerInvariant();
	}

	/// <summary>
	/// Computes a device fingerprint from User-Agent and IP prefix.
	/// </summary>
	/// <param name="userAgent">
	/// The User-Agent header.
	/// </param>
	/// <param name="ipAddress">
	/// The client IP address.
	/// </param>
	/// <returns>
	/// A SHA256 hash of the fingerprint data.
	/// </returns>
	private static string ComputeDeviceFingerprint(
		string userAgent,
		string? ipAddress)
	{
		// Use first three octets of IP (for IPv4) to allow for DHCP changes
		string ipPrefix =
			ExtractIpPrefix(ipAddress);

		string fingerprintData =
			$"{userAgent}|{ipPrefix}";

		return ComputeSha256Hash(fingerprintData);
	}

	/// <summary>
	/// Extracts IP prefix for fingerprinting (first 3 octets for IPv4).
	/// </summary>
	/// <param name="ipAddress">
	/// The full IP address.
	/// </param>
	/// <returns>
	/// The IP prefix or empty string if null.
	/// </returns>
	private static string ExtractIpPrefix(string? ipAddress)
	{
		if (string.IsNullOrEmpty(ipAddress))
		{
			return string.Empty;
		}

		// For IPv4: take first 3 octets
		string[] parts =
			ipAddress.Split('.');

		if (parts.Length >= 3)
		{
			return $"{parts[0]}.{parts[1]}.{parts[2]}";
		}

		// For IPv6 or other: use first half
		if (ipAddress.Contains(':'))
		{
			int colonIndex =
				ipAddress.LastIndexOf(':');

			if (colonIndex > 0)
			{
				return ipAddress[..colonIndex];
			}
		}

		return ipAddress;
	}

	/// <summary>
	/// Extracts a friendly device name from the User-Agent string.
	/// </summary>
	/// <param name="userAgent">
	/// The User-Agent header.
	/// </param>
	/// <returns>
	/// A user-friendly device name or null.
	/// </returns>
	private static string? ExtractDeviceName(string? userAgent)
	{
		if (string.IsNullOrEmpty(userAgent))
		{
			return null;
		}

		// Simple heuristic for device name extraction
		if (userAgent.Contains(
			"Windows",
			StringComparison.OrdinalIgnoreCase))
		{
			return "Windows PC";
		}

		if (userAgent.Contains(
			"Mac OS",
			StringComparison.OrdinalIgnoreCase))
		{
			return "Mac";
		}

		if (userAgent.Contains(
			"iPhone",
			StringComparison.OrdinalIgnoreCase))
		{
			return "iPhone";
		}

		if (userAgent.Contains(
			"iPad",
			StringComparison.OrdinalIgnoreCase))
		{
			return "iPad";
		}

		if (userAgent.Contains(
			"Android",
			StringComparison.OrdinalIgnoreCase))
		{
			return "Android Device";
		}

		if (userAgent.Contains(
			"Linux",
			StringComparison.OrdinalIgnoreCase))
		{
			return "Linux PC";
		}

		return "Unknown Device";
	}
}