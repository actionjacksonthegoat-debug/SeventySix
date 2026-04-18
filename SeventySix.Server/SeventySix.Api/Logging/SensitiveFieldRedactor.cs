// <copyright file="SensitiveFieldRedactor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Logging;

/// <summary>
/// Key-based property redactor for structured logging. When a property name
/// matches a known sensitive field, the value is replaced with
/// <c>[REDACTED]</c> before reaching any log sink. This prevents accidental
/// PII/secret exposure via destructured objects.
/// </summary>
/// <remarks>
/// Comparison is ordinal-case-insensitive so it catches variants like
/// <c>password</c>, <c>Password</c>, and <c>PASSWORD</c>.
/// </remarks>
public static class SensitiveFieldRedactor
{
	/// <summary>Constant replacement value for redacted properties.</summary>
	public const string RedactedValue = "[REDACTED]";

	/// <summary>
	/// Property names whose values must never appear in logs.
	/// </summary>
	public static readonly IReadOnlySet<string> SensitiveKeys =
		new HashSet<string>(StringComparer.OrdinalIgnoreCase)
		{
			"password",
			"newPassword",
			"currentPassword",
			"confirmPassword",
			"refreshToken",
			"refresh_token",
			"accessToken",
			"access_token",
			"totpSecret",
			"totp_secret",
			"mfaCode",
			"mfa_code",
			"backupCode",
			"backup_code",
			"secretKey",
			"apiKey",
			"api_key",
			"connectionString",
			"token",
		};

	/// <summary>
	/// Returns the original value when the key is not sensitive,
	/// or <see cref="RedactedValue"/> when it is.
	/// </summary>
	/// <param name="key">
	/// The structured-logging property name.
	/// </param>
	/// <param name="value">
	/// The property value (passed through unchanged if not sensitive).
	/// </param>
	/// <returns>
	/// The original <paramref name="value"/> or <c>[REDACTED]</c>.
	/// </returns>
	public static object? Redact(string key, object? value)
	{
		return SensitiveKeys.Contains(key) ? RedactedValue : value;
	}
}
