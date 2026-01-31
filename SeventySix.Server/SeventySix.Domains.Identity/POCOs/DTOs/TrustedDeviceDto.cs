// <copyright file="TrustedDeviceDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Trusted device data transfer object for display in user security settings.
/// </summary>
/// <remarks>
/// This DTO provides a user-friendly view of trusted devices.
/// Sensitive data (token hash, fingerprint) is not exposed.
/// </remarks>
/// <param name="Id">
/// The unique identifier for the trusted device.
/// </param>
/// <param name="DeviceName">
/// A friendly name for the device (derived from User-Agent or user-provided).
/// </param>
/// <param name="CreatedAt">
/// When the device was trusted (UTC).
/// </param>
/// <param name="LastUsedAt">
/// When the device was last used to skip MFA (UTC). Null if never used.
/// </param>
/// <param name="ExpiresAt">
/// When the device trust expires (UTC).
/// </param>
/// <param name="IsCurrentDevice">
/// True if this is the device making the request.
/// </param>
public record TrustedDeviceDto(
	long Id,
	string? DeviceName,
	DateTime CreatedAt,
	DateTime? LastUsedAt,
	DateTime ExpiresAt,
	bool IsCurrentDevice);