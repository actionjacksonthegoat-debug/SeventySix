/**
 * Key-based property redaction for structured log payloads.
 * Mirrors the server-side `SensitiveFieldRedactor` — any property whose
 * key matches a known sensitive field name has its value replaced with
 * `[REDACTED]` before the payload reaches an external sink.
 *
 * @module redact
 */

/** Constant replacement value for redacted properties. */
export const REDACTED_VALUE: string = "[REDACTED]";

/**
 * Property names whose values must never appear in logs.
 * Comparison is case-insensitive (keys are lowered before lookup).
 */
const SENSITIVE_KEYS: ReadonlySet<string> =
	new Set(
		[
			"password",
			"newpassword",
			"currentpassword",
			"confirmpassword",
			"refreshtoken",
			"refresh_token",
			"accesstoken",
			"access_token",
			"totpsecret",
			"totp_secret",
			"mfacode",
			"mfa_code",
			"backupcode",
			"backup_code",
			"secretkey",
			"apikey",
			"api_key",
			"connectionstring",
			"token"
		]);

/**
 * Redacts sensitive fields in a shallow object payload.
 * Non-sensitive fields pass through unchanged.
 *
 * @param payload - The structured log payload to redact.
 * @returns A new object with sensitive values replaced by `[REDACTED]`.
 */
export function redactPayload(
	payload: Record<string, unknown>): Record<string, unknown>
{
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(payload))
	{
		result[key] =
			SENSITIVE_KEYS.has(key.toLowerCase())
				? REDACTED_VALUE
				: value;
	}

	return result;
}