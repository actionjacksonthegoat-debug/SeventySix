// <copyright file="TotpSetupResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;

namespace SeventySix.Identity;

/// <summary>
/// Response containing TOTP setup information.
/// </summary>
/// <param name="Secret">
/// The base32-encoded TOTP secret.
/// </param>
/// <param name="QrCodeUri">
/// The otpauth:// URI for QR code generation.
/// </param>
[ExcludeFromCodeCoverage]
public record TotpSetupResponse(
	string Secret,
	string QrCodeUri);