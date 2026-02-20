// <copyright file="AltchaChallenge.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Entity for tracking used ALTCHA challenges.
/// Prevents replay attacks by storing verified challenge hashes.
/// </summary>
public sealed class AltchaChallenge
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Gets or sets the challenge string (base64 hash).
	/// </summary>
	public string Challenge { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the UTC expiry time.
	/// Challenges past this time can be purged.
	/// </summary>
	public DateTimeOffset ExpiryUtc { get; set; }
}