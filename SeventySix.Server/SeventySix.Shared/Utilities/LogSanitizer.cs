// <copyright file="LogSanitizer.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Utilities;

/// <summary>
/// PII sanitizer for structured log messages.
/// All masking methods remove personally identifiable information (PII)
/// before values reach any external sink (Serilog, structured log streams, SIEM).
/// </summary>
/// <remarks>
/// CodeQL declares these methods as taint-sanitizers via
/// <c>.github/codeql/csharp-sanitizer-models.yml</c> — the output of
/// <see cref="MaskEmail"/>, <see cref="MaskUsername"/>, and
/// <see cref="MaskEmailSubject"/> does not carry sensitive taint.
/// </remarks>
public static class LogSanitizer
{
	/// <summary>
	/// Strips newline and carriage-return characters from a user-controlled value.
	/// Prevents log-injection (log-forging) attacks where embedded newlines could
	/// corrupt structured log streams or spoof log entries in a SIEM.
	/// </summary>
	/// <param name="value">
	/// The user-provided string to sanitize.
	/// </param>
	/// <returns>
	/// The value with CR/LF characters removed; null if the input is null.
	/// </returns>
	public static string? Sanitize(string? value)
	{
		if (value is null)
		{
			return null;
		}

		return value
			.Replace(
				"\n",
				string.Empty,
				StringComparison.Ordinal)
			.Replace(
				"\r",
				string.Empty,
				StringComparison.Ordinal);
	}

	/// <summary>
	/// Masks an email address for safe logging. Shows the first character of the local
	/// part and the full domain — enough for admin triage without exposing the full address.
	/// </summary>
	/// <remarks>
	/// Mask count is always three asterisks (<c>***</c>) regardless of local-part length,
	/// so the mask does not leak length information.
	/// </remarks>
	/// <param name="email">
	/// The email address to mask.
	/// </param>
	/// <returns>
	/// Masked email in the form <c>u***@example.com</c>; <c>***</c> if the input is
	/// null, empty, or does not contain an @ sign.
	/// </returns>
	/// <example>
	/// <c>user@example.com</c> → <c>u***@example.com</c>
	/// </example>
	public static string MaskEmail(string? email)
	{
		if (string.IsNullOrEmpty(email))
		{
			return "***";
		}

		int atIndex =
			email.IndexOf(
				'@',
				StringComparison.Ordinal);

		if (atIndex <= 0)
		{
			return "***";
		}

		// "@domain.com" slice includes the @ character
		string domainPart =
			email[atIndex..];

		return email[0] + "***" + domainPart;
	}

	/// <summary>
	/// Masks a username for safe logging. Shows the first two characters to give admins
	/// a partial identifier without full exposure.
	/// </summary>
	/// <remarks>
	/// Mask count is always three asterisks (<c>***</c>) regardless of username length,
	/// so the mask does not leak length information.
	/// </remarks>
	/// <param name="username">
	/// The username to mask.
	/// </param>
	/// <returns>
	/// Masked username in the form <c>jo***</c>; <c>***</c> if null or empty.
	/// </returns>
	/// <example>
	/// <c>johndoe</c> → <c>jo***</c>, <c>ab</c> → <c>ab***</c>
	/// </example>
	public static string MaskUsername(string? username)
	{
		if (string.IsNullOrEmpty(username))
		{
			return "***";
		}

		int show =
			Math.Min(2, username.Length);

		return username[..show] + "***";
	}

	/// <summary>
	/// Maps an email subject string to a short category label for safe logging.
	/// Prevents <c>cs/cleartext-storage-of-sensitive-information</c> alerts triggered
	/// by sensitive keywords (e.g., <c>Password</c>) appearing in logged subject strings.
	/// </summary>
	/// <remarks>
	/// The mapping is priority-ordered: Welcome is checked before Password because
	/// the Welcome subject contains the word "Password" in its text.
	/// Unknown subjects fall back to a length-only label (does not leak content).
	/// </remarks>
	/// <param name="subject">
	/// The email subject string (typically from <see cref="EmailSubjectConstants"/>).
	/// </param>
	/// <returns>
	/// A short category label such as <c>welcome</c>, <c>password-reset</c>,
	/// <c>email-verification</c>, <c>mfa-code</c>, or <c>[N-char-subject]</c>.
	/// </returns>
	public static string MaskEmailSubject(string? subject)
	{
		if (string.IsNullOrEmpty(subject))
		{
			return "[no-subject]";
		}

		// Priority: Welcome first — its subject also contains the word "Password"
		if (subject.Contains(
			"Welcome",
			StringComparison.OrdinalIgnoreCase))
		{
			return "welcome";
		}

		if (subject.Contains(
			"Password",
			StringComparison.OrdinalIgnoreCase))
		{
			return "password-reset";
		}

		bool isMfaSubject =
			subject.Contains(
				"Verification Code",
				StringComparison.OrdinalIgnoreCase)
			|| subject.Contains(
				"MFA",
				StringComparison.OrdinalIgnoreCase);

		if (isMfaSubject)
		{
			return "mfa-code";
		}

		if (subject.Contains(
			"Verif",
			StringComparison.OrdinalIgnoreCase))
		{
			return "email-verification";
		}

		// Unknown subject constant — log length only, never the content
		return $"[{subject.Length}-char-subject]";
	}
}