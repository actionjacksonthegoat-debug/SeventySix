// <copyright file="IBreachedPasswordService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service interface for checking passwords against known data breaches.
/// Implements OWASP ASVS V2.1.7 using HaveIBeenPwned k-Anonymity API.
/// </summary>
/// <remarks>
/// <para>
/// Uses k-Anonymity model for privacy: only the first 5 characters of the SHA-1
/// password hash are sent to the external API. The full password never leaves the server.
/// </para>
/// <para>
/// Graceful degradation: If the external API is unavailable or times out,
/// the service fails open (allows the password) and logs a warning.
/// </para>
/// </remarks>
public interface IBreachedPasswordService
{
	/// <summary>
	/// Checks if a password appears in known data breaches.
	/// </summary>
	/// <param name="password">
	/// The plaintext password to check. Never stored or transmitted.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A <see cref="BreachCheckResult"/> containing:
	/// - <see cref="BreachCheckResult.CheckSucceeded"/>: Whether the API check completed successfully
	/// - <see cref="BreachCheckResult.IsBreached"/>: Whether the password was found in breaches
	/// - <see cref="BreachCheckResult.BreachCount"/>: Number of times password appeared in breaches.
	/// </returns>
	/// <remarks>
	/// If <see cref="BreachedPasswordSettings.Enabled"/> is false, returns a result
	/// with CheckSucceeded=true, IsBreached=false, BreachCount=0 immediately without API call.
	/// </remarks>
	public Task<BreachCheckResult> CheckPasswordAsync(
		string password,
		CancellationToken cancellationToken);
}