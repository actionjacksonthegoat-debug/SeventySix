// <copyright file="RecaptchaValidationResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of reCAPTCHA token validation.
/// </summary>
public record RecaptchaValidationResult
{
	/// <summary>
	/// Gets a value indicating whether validation succeeded.
	/// </summary>
	public bool Success { get; init; }

	/// <summary>
	/// Gets the risk score (0.0 = likely bot, 1.0 = likely human).
	/// </summary>
	public double Score { get; init; }

	/// <summary>
	/// Gets the action name returned by reCAPTCHA.
	/// </summary>
	public string Action { get; init; } = string.Empty;

	/// <summary>
	/// Gets any error codes from Google's response.
	/// </summary>
	public IReadOnlyList<string> ErrorCodes { get; init; } = [];

	/// <summary>
	/// Gets a value indicating whether reCAPTCHA was bypassed (disabled in settings).
	/// </summary>
	public bool WasBypassed { get; init; }

	/// <summary>
	/// Creates a successful validation result.
	/// </summary>
	/// <param name="score">
	/// The validation score.
	/// </param>
	/// <param name="action">
	/// The action name.
	/// </param>
	/// <returns>
	/// A successful result.
	/// </returns>
	public static RecaptchaValidationResult Succeeded(
		double score,
		string action) =>
		new()
		{
			Success = true,
			Score = score,
			Action = action
		};

	/// <summary>
	/// Creates a bypassed result (when reCAPTCHA is disabled).
	/// </summary>
	/// <returns>
	/// A bypassed result.
	/// </returns>
	public static RecaptchaValidationResult Bypassed() =>
		new()
		{
			Success = true,
			WasBypassed = true
		};

	/// <summary>
	/// Creates a failed validation result.
	/// </summary>
	/// <param name="errorCodes">
	/// The error codes from Google.
	/// </param>
	/// <returns>
	/// A failed result.
	/// </returns>
	public static RecaptchaValidationResult Failed(
		IReadOnlyList<string>? errorCodes = null) =>
		new()
		{
			Success = false,
			ErrorCodes =
				errorCodes ?? []
		};
}