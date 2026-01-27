// <copyright file="IMfaService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for MFA operations including code generation and verification.
/// </summary>
public interface IMfaService
{
	/// <summary>
	/// Generates a new verification code.
	/// </summary>
	/// <returns>
	/// A numeric verification code.
	/// </returns>
	public string GenerateCode();

	/// <summary>
	/// Creates a new MFA challenge for a user.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="clientIp">
	/// The client's IP address.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A tuple containing the challenge token and plain text code.
	/// </returns>
	public Task<(string ChallengeToken, string Code)> CreateChallengeAsync(
		long userId,
		string? clientIp,
		CancellationToken cancellationToken);

	/// <summary>
	/// Verifies an MFA code.
	/// </summary>
	/// <param name="challengeToken">
	/// The challenge token to verify against.
	/// </param>
	/// <param name="code">
	/// The verification code provided by the user.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Verification result indicating success or failure reason.
	/// </returns>
	public Task<MfaVerificationResult> VerifyCodeAsync(
		string challengeToken,
		string code,
		CancellationToken cancellationToken);

	/// <summary>
	/// Refreshes an MFA challenge (for resend functionality).
	/// </summary>
	/// <param name="challengeToken">
	/// The existing challenge token.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Refresh result with new code or error.
	/// </returns>
	public Task<MfaChallengeRefreshResult> RefreshChallengeAsync(
		string challengeToken,
		CancellationToken cancellationToken);
}