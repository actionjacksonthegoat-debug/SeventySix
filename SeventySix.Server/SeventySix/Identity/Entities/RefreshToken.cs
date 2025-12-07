// <copyright file="RefreshToken.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

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
	public int Id
	{
		get; set;
	}

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
	public Guid FamilyId
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the user ID (FK to identity.users).
	/// </summary>
	public int UserId
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the expiration date.
	/// </summary>
	public DateTime ExpiresAt
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the session start date.
	/// Used to enforce absolute session timeout regardless of token rotation.
	/// </summary>
	public DateTime SessionStartedAt
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the creation date.
	/// </summary>
	public DateTime CreateDate
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets a value indicating whether this token is revoked.
	/// </summary>
	public bool IsRevoked
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets when this token was revoked.
	/// </summary>
	public DateTime? RevokedAt
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the client IP that created this token.
	/// </summary>
	public string? CreatedByIp
	{
		get; set;
	}
}