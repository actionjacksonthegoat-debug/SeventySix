// <copyright file="RecaptchaVerifyResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Identity;

/// <summary>
/// Google reCAPTCHA v3 verification API response.
/// </summary>
/// <remarks>
/// Internal DTO for deserializing Google's response.
/// See: https://developers.google.com/recaptcha/docs/v3#site_verify_response
/// </remarks>
internal record RecaptchaVerifyResponse
{
	/// <summary>
	/// Gets a value indicating whether the token is valid.
	/// </summary>
	[JsonPropertyName("success")]
	public bool Success { get; init; }

	/// <summary>
	/// Gets the score for this request (0.0 - 1.0).
	/// </summary>
	[JsonPropertyName("score")]
	public double Score { get; init; }

	/// <summary>
	/// Gets the action name for this request.
	/// </summary>
	[JsonPropertyName("action")]
	public string Action { get; init; } = string.Empty;

	/// <summary>
	/// Gets the timestamp of the challenge load.
	/// </summary>
	[JsonPropertyName("challenge_ts")]
	public string? ChallengeTimestamp { get; init; }

	/// <summary>
	/// Gets the hostname of the site where reCAPTCHA was solved.
	/// </summary>
	[JsonPropertyName("hostname")]
	public string? Hostname { get; init; }

	/// <summary>
	/// Gets the error codes if validation failed.
	/// </summary>
	[JsonPropertyName("error-codes")]
	public List<string>? ErrorCodes { get; init; }
}