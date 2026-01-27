// <copyright file="TrustedDeviceBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using System.Text;
using SeventySix.Identity;
using SeventySix.Shared.Constants;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating TrustedDevice test instances.
/// </summary>
public sealed class TrustedDeviceBuilder
{
	private readonly TimeProvider TimeProviderField;
	private long UserId = 1;
	private string Token = "test-token-12345";
	private string UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
	private string? IpAddress = "192.168.1.100";
	private string? DeviceName = "Windows PC";
	private int ExpirationDays = 30;

	/// <summary>
	/// Initializes a new instance of the <see cref="TrustedDeviceBuilder"/> class.
	/// </summary>
	/// <param name="timeProvider">
	/// Time provider for timestamps.
	/// </param>
	public TrustedDeviceBuilder(TimeProvider timeProvider)
	{
		TimeProviderField = timeProvider;
	}

	/// <summary>
	/// Sets the user ID for the trusted device.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public TrustedDeviceBuilder WithUserId(long userId)
	{
		UserId = userId;
		return this;
	}

	/// <summary>
	/// Sets the plain text token (will be hashed).
	/// </summary>
	/// <param name="token">
	/// The plain text token.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public TrustedDeviceBuilder WithToken(string token)
	{
		Token = token;
		return this;
	}

	/// <summary>
	/// Sets the User-Agent for fingerprinting.
	/// </summary>
	/// <param name="userAgent">
	/// The User-Agent string.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public TrustedDeviceBuilder WithUserAgent(string userAgent)
	{
		UserAgent = userAgent;
		return this;
	}

	/// <summary>
	/// Sets the IP address for fingerprinting.
	/// </summary>
	/// <param name="ipAddress">
	/// The IP address.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public TrustedDeviceBuilder WithIpAddress(string? ipAddress)
	{
		IpAddress = ipAddress;
		return this;
	}

	/// <summary>
	/// Sets the friendly device name.
	/// </summary>
	/// <param name="deviceName">
	/// The device name.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public TrustedDeviceBuilder WithDeviceName(string? deviceName)
	{
		DeviceName = deviceName;
		return this;
	}

	/// <summary>
	/// Sets the expiration in days from now.
	/// </summary>
	/// <param name="days">
	/// Days until expiration.
	/// </param>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public TrustedDeviceBuilder WithExpirationDays(int days)
	{
		ExpirationDays = days;
		return this;
	}

	/// <summary>
	/// Sets the device as expired.
	/// </summary>
	/// <returns>
	/// The builder instance.
	/// </returns>
	public TrustedDeviceBuilder AsExpired()
	{
		ExpirationDays = -1;
		return this;
	}

	/// <summary>
	/// Builds the TrustedDevice instance.
	/// </summary>
	/// <returns>
	/// A configured TrustedDevice.
	/// </returns>
	public TrustedDevice Build()
	{
		DateTime now =
			TimeProviderField.GetUtcNow().UtcDateTime;

		string tokenHash =
			ComputeSha256Hash(Token);
		string deviceFingerprint =
			ComputeDeviceFingerprint(UserAgent, IpAddress);

		return new TrustedDevice
		{
			UserId = UserId,
			TokenHash = tokenHash,
			DeviceFingerprint = deviceFingerprint,
			DeviceName = DeviceName,
			ExpiresAt = now.AddDays(ExpirationDays),
			CreateDate = now,
			CreatedBy = AuditConstants.SystemUser
		};
	}

	/// <summary>
	/// Gets the plain text token for test verification.
	/// </summary>
	/// <returns>
	/// The plain text token.
	/// </returns>
	public string GetPlainToken()
	{
		return Token;
	}

	private static string ComputeSha256Hash(string input)
	{
		byte[] hashBytes =
			SHA256.HashData(Encoding.UTF8.GetBytes(input));

		return Convert.ToHexString(hashBytes).ToLowerInvariant();
	}

	private static string ComputeDeviceFingerprint(
		string userAgent,
		string? ipAddress)
	{
		string ipPrefix =
			ExtractIpPrefix(ipAddress);

		string fingerprintData =
			$"{userAgent}|{ipPrefix}";

		return ComputeSha256Hash(fingerprintData);
	}

	private static string ExtractIpPrefix(string? ipAddress)
	{
		if (string.IsNullOrEmpty(ipAddress))
		{
			return string.Empty;
		}

		string[] parts =
			ipAddress.Split('.');

		if (parts.Length >= 3)
		{
			return $"{parts[0]}.{parts[1]}.{parts[2]}";
		}

		return ipAddress;
	}
}