// <copyright file="BreachCheckResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of a password breach check against HaveIBeenPwned.
/// </summary>
/// <param name="CheckSucceeded">
/// Indicates whether the API check completed successfully.
/// False if the API was unavailable, timed out, or an error occurred.
/// When false, IsBreached and BreachCount should be ignored (fail-open behavior).
/// </param>
/// <param name="IsBreached">
/// Indicates whether the password was found in known data breaches.
/// Only valid when CheckSucceeded is true.
/// </param>
/// <param name="BreachCount">
/// The number of times this password has appeared in data breaches.
/// Zero if not found or if CheckSucceeded is false.
/// </param>
public record BreachCheckResult(
	bool CheckSucceeded,
	bool IsBreached,
	int BreachCount)
{
	/// <summary>
	/// Creates a result for when the password is not found in any breaches.
	/// </summary>
	/// <returns>
	/// A safe result with CheckSucceeded=true, IsBreached=false, BreachCount=0.
	/// </returns>
	public static BreachCheckResult NotBreached()
	{
		return new BreachCheckResult(
			CheckSucceeded: true,
			IsBreached: false,
			BreachCount: 0);
	}

	/// <summary>
	/// Creates a result for when the password was found in breaches.
	/// </summary>
	/// <param name="breachCount">
	/// The number of times the password appeared in breaches.
	/// </param>
	/// <returns>
	/// A breached result with CheckSucceeded=true, IsBreached=true.
	/// </returns>
	public static BreachCheckResult Breached(int breachCount)
	{
		return new BreachCheckResult(
			CheckSucceeded: true,
			IsBreached: breachCount > 0,
			BreachCount: breachCount);
	}

	/// <summary>
	/// Creates a result for when the API check failed (timeout, network error, etc.).
	/// Represents graceful degradation - fail open and allow the password.
	/// </summary>
	/// <returns>
	/// A failed check result with CheckSucceeded=false, IsBreached=false, BreachCount=0.
	/// </returns>
	public static BreachCheckResult CheckFailed()
	{
		return new BreachCheckResult(
			CheckSucceeded: false,
			IsBreached: false,
			BreachCount: 0);
	}
}