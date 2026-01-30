// <copyright file="MfaChallenge.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Represents an MFA verification challenge.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Short TTL: Challenges expire after 5 minutes (OWASP ASVS V2.8.1)
/// - Rate Limited: Max 5 attempts per challenge
/// - Audit Trail: Track attempts for security forensics
/// - One-Time Use: Challenge invalidated after successful verification
/// </remarks>
public class MfaChallenge : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Gets or sets the challenge token (GUID) used to identify this challenge.
	/// </summary>
	/// <remarks>
	/// This is the value returned to the client, NOT the verification code.
	/// </remarks>
	public string Token { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the user ID this challenge belongs to.
	/// </summary>
	public long UserId { get; set; }

	/// <summary>
	/// Gets or sets the hashed verification code.
	/// </summary>
	/// <remarks>
	/// Code is hashed using SHA256 to prevent exposure in database.
	/// </remarks>
	public string CodeHash { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets when the challenge expires.
	/// </summary>
	public DateTime ExpiresAt { get; set; }

	/// <summary>
	/// Gets or sets the number of verification attempts made.
	/// </summary>
	public int Attempts { get; set; }

	/// <summary>
	/// Gets or sets a value indicating whether the challenge has been used.
	/// </summary>
	public bool IsUsed { get; set; }

	/// <summary>
	/// Gets or sets the client IP that initiated the challenge.
	/// </summary>
	/// <remarks>
	/// <para>
	/// PII Classification: Personal Data (GDPR Article 4 - IP addresses).
	/// </para>
	/// <para>
	/// Stored for security auditing purposes only.
	/// </para>
	/// </remarks>
	public string? ClientIp { get; set; }

	/// <summary>
	/// Gets or sets the creation timestamp.
	/// </summary>
	public DateTime CreateDate { get; set; }

	/// <summary>
	/// Gets or sets whether this MFA challenge is soft-deleted.
	/// </summary>
	/// <remarks>
	/// Matches ApplicationUser's IsDeleted filter to prevent orphan records
	/// when parent user is soft-deleted.
	/// </remarks>
	public bool IsDeleted { get; set; }

	/// <summary>
	/// Navigation property to the user.
	/// </summary>
	public ApplicationUser? User { get; set; }
}