// <copyright file="AltchaErrorCodes.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Error codes for ALTCHA validation failures.
/// Used by <see cref="AltchaValidationResult"/> to indicate failure reasons.
/// </summary>
public static class AltchaErrorCodes
{
	/// <summary>
	/// The ALTCHA payload was missing or empty.
	/// </summary>
	public const string MissingPayload = "missing-payload";

	/// <summary>
	/// The ALTCHA validation failed (invalid signature, expired, or replay attack).
	/// </summary>
	public const string ValidationFailed = "validation-failed";

	/// <summary>
	/// An internal error occurred during validation.
	/// </summary>
	public const string InternalError = "internal-error";
}
