// <copyright file="AltchaSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// ALTCHA Proof-of-Work captcha configuration settings.
/// Bound from appsettings.json "Altcha" section.
/// All values MUST be configured in appsettings.json.
/// </summary>
/// <remarks>
/// <para>
/// HMAC key is a 64-byte secret used to sign and verify challenges.
/// Must be stored securely in User Secrets and mapped via configuration.
/// </para>
/// <para>
/// NEVER commit actual key values to appsettings.json or source control.
/// Generate using: <c>RandomNumberGenerator.GetBytes(64)</c>
/// </para>
/// </remarks>
public record AltchaSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Altcha";

	/// <summary>
	/// Gets a value indicating whether ALTCHA validation is enabled.
	/// When false, validation is skipped (useful for development/testing).
	/// </summary>
	public bool Enabled { get; init; }

	/// <summary>
	/// Gets the base64-encoded HMAC key (64 bytes) for signing challenges.
	/// Stored in User Secrets as Altcha:HmacKeyBase64.
	/// Generate using: <c>Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))</c>
	/// </summary>
	public string HmacKeyBase64 { get; init; } = string.Empty;

	/// <summary>
	/// Gets the minimum complexity for PoW challenges.
	/// Higher values = more computational work for clients.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int ComplexityMin { get; init; }

	/// <summary>
	/// Gets the maximum complexity for PoW challenges.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int ComplexityMax { get; init; }

	/// <summary>
	/// Gets the challenge expiry duration in seconds.
	/// Challenges older than this are rejected.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int ExpirySeconds { get; init; }
}