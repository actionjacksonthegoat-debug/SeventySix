// <copyright file="IRecaptchaService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for validating reCAPTCHA v3 tokens.
/// </summary>
public interface IRecaptchaService
{
	/// <summary>
	/// Gets a value indicating whether reCAPTCHA validation is enabled.
	/// </summary>
	public bool IsEnabled { get; }

	/// <summary>
	/// Validates a reCAPTCHA token against Google's verification API.
	/// </summary>
	/// <param name="token">
	/// The reCAPTCHA token from the client.
	/// </param>
	/// <param name="expectedAction">
	/// The expected action name (e.g., "login", "register").
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A result indicating success/failure with score and any errors.
	/// </returns>
	public Task<RecaptchaValidationResult> ValidateAsync(
		string token,
		string expectedAction,
		CancellationToken cancellationToken = default);
}