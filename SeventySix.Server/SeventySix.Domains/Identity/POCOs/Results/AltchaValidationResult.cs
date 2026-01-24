// <copyright file="AltchaValidationResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of ALTCHA payload validation.
/// </summary>
public record AltchaValidationResult
{
	/// <summary>
	/// Gets a value indicating whether validation succeeded.
	/// </summary>
	public bool Success { get; init; }

	/// <summary>
	/// Gets the error code if validation failed.
	/// Uses values from <see cref="AltchaErrorCodes"/>.
	/// </summary>
	public string? ErrorCode { get; init; }

	/// <summary>
	/// Gets a value indicating whether ALTCHA was bypassed (disabled in settings).
	/// </summary>
	public bool WasBypassed { get; init; }

	/// <summary>
	/// Creates a successful validation result.
	/// </summary>
	/// <returns>
	/// A successful result.
	/// </returns>
	public static AltchaValidationResult Succeeded() =>
		new()
		{
			Success = true
		};

	/// <summary>
	/// Creates a bypassed validation result.
	/// </summary>
	/// <returns>
	/// A bypassed result (ALTCHA disabled).
	/// </returns>
	public static AltchaValidationResult Bypassed() =>
		new()
		{
			Success = true,
			WasBypassed = true
		};

	/// <summary>
	/// Creates a failed validation result.
	/// </summary>
	/// <param name="errorCode">
	/// The error code from <see cref="AltchaErrorCodes"/>.
	/// </param>
	/// <returns>
	/// A failed result.
	/// </returns>
	public static AltchaValidationResult Failed(string errorCode) =>
		new()
		{
			Success = false,
			ErrorCode = errorCode
		};
}
