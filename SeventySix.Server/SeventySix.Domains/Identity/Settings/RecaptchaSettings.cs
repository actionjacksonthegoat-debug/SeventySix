// <copyright file="RecaptchaSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// reCAPTCHA v3 configuration settings.
/// Bound from appsettings.json "Recaptcha" section.
/// </summary>
/// <remarks>
/// <para>
/// Site key is public (sent to client via API endpoint).
/// Secret key is private (server-side only).
/// </para>
/// <para>
/// Both keys must be stored in .env file and mapped via environment variables.
/// NEVER commit actual key values to appsettings.json or source control.
/// </para>
/// </remarks>
public record RecaptchaSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SECTION_NAME = "Recaptcha";

	/// <summary>
	/// Gets a value indicating whether reCAPTCHA validation is enabled.
	/// When false, validation is skipped (useful for development/testing).
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Gets the reCAPTCHA site key (public, sent to client via secure endpoint).
	/// Stored in .env as RECAPTCHA_SITE_KEY.
	/// </summary>
	public string SiteKey { get; init; } = string.Empty;

	/// <summary>
	/// Gets the reCAPTCHA secret key (private, server-only).
	/// Stored in .env as RECAPTCHA_SECRET_KEY.
	/// NEVER expose this value to clients or logs.
	/// </summary>
	public string SecretKey { get; init; } = string.Empty;

	/// <summary>
	/// Gets the minimum score threshold (0.0 to 1.0).
	/// Requests with scores below this are rejected.
	/// Default: 0.5 (Google's recommended threshold).
	/// </summary>
	public double MinimumScore { get; init; } = 0.5;

	/// <summary>
	/// Gets the Google reCAPTCHA verification endpoint.
	/// </summary>
	public string VerifyUrl { get; init; } =
		"https://www.google.com/recaptcha/api/siteverify";
}