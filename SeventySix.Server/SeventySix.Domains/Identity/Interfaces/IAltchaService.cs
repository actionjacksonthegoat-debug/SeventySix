// <copyright file="IAltchaService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for ALTCHA Proof-of-Work captcha operations.
/// </summary>
public interface IAltchaService
{
	/// <summary>
	/// Gets a value indicating whether ALTCHA validation is enabled.
	/// </summary>
	public bool IsEnabled { get; }

	/// <summary>
	/// Generates a new ALTCHA challenge for the client.
	/// </summary>
	/// <returns>
	/// A challenge object that can be serialized to JSON for the client widget.
	/// </returns>
	public AltchaChallengeDto GenerateChallenge();

	/// <summary>
	/// Validates an ALTCHA response payload from the client.
	/// </summary>
	/// <param name="payload">
	/// The base64-encoded payload from the altcha form field.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A result indicating success or failure with error details.
	/// </returns>
	public Task<AltchaValidationResult> ValidateAsync(
		string payload,
		CancellationToken cancellationToken = default);
}