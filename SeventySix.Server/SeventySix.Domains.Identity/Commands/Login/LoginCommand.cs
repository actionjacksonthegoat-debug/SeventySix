// <copyright file="LoginCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Command to authenticate a user with username/email and password.
/// </summary>
/// <param name="Request">
/// Login credentials.
/// </param>
/// <param name="ClientIp">
/// Client IP for token tracking.
/// </param>
/// <param name="TrustedDeviceToken">
/// Trusted device cookie token (null if not present).
/// </param>
/// <param name="UserAgent">
/// Browser User-Agent header for device fingerprinting.
/// </param>
public record LoginCommand(
	LoginRequest Request,
	string? ClientIp,
	string? TrustedDeviceToken = null,
	string? UserAgent = null);