// <copyright file="RefreshToken.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Refresh token for persistent authentication.
/// Enables token rotation for enhanced security.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Token is hashed (SHA256) before storage - never store plaintext tokens
/// - Token rotation: old token revoked when new one issued
/// - Token families: FamilyId tracks chains of rotated tokens for reuse detection
/// - Tracks creation IP for security auditing
/// </remarks>
public class RefreshToken : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Gets or sets the hashed token value (SHA256).
	/// </summary>
	public string TokenHash { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the token family identifier.
	/// All tokens in a rotation chain share the same FamilyId.
	/// Used to detect token reuse attacks - if a revoked token is used,
	/// revoke the entire family.
	/// </summary>
	public Guid FamilyId { get; set; }

	/// <summary>
	/// Gets or sets the user ID (FK to identity.users).
	/// </summary>
	public long UserId { get; set; }

	/// <summary>
	/// Gets or sets the expiration date.
	/// </summary>
	public DateTimeOffset ExpiresAt { get; set; }

	/// <summary>
	/// Gets or sets the session start date.
	/// Used to enforce absolute session timeout regardless of token rotation.
	/// </summary>
	public DateTimeOffset SessionStartedAt { get; set; }

	/// <summary>
	/// Gets or sets the creation date.
	/// </summary>
	public DateTimeOffset CreateDate { get; set; }

	/// <summary>
	/// Gets or sets a value indicating whether this token is revoked.
	/// </summary>
	public bool IsRevoked { get; set; }

	/// <summary>
	/// Gets or sets when this token was revoked.
	/// </summary>
	public DateTimeOffset? RevokedAt { get; set; }

	/// <summary>
	/// Gets or sets the client IP that created this token.
	/// </summary>
	/// <remarks>
	/// <para>
	/// PII Classification: Personal Data (GDPR Article 4 - IP addresses)
	/// </para>
	/// <para>
	/// Data Protection:
	/// - Retention: Tied to token lifetime (30 days), automatically deleted with parent token
	/// - Storage: Plaintext (required for security monitoring and anomaly detection)
	/// - Purpose: Security auditing, suspicious login detection, device fingerprinting
	/// - Access Control: Admin-only, used for security incident investigation
	/// </para>
	/// </remarks>
	public string? CreatedByIp { get; set; }
}