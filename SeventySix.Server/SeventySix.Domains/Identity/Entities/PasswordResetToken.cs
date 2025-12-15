// <copyright file="PasswordResetToken.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Represents a time-limited token for password reset or initial password set.
/// Single-use: marked IsUsed after consumption.
/// </summary>
/// <remarks>
/// Security Design:
/// - 64-byte cryptographically random token (base64 encoded)
/// - 24-hour expiration window
/// - Single-use enforcement via IsUsed flag
/// - Old tokens invalidated when new reset is requested.
/// </remarks>
public class PasswordResetToken : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public int Id
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the user this token belongs to.
	/// </summary>
	public int UserId
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the cryptographically random token (base64 encoded, 64 bytes).
	/// </summary>
	public string Token { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets when this token expires (24 hours from creation).
	/// </summary>
	public DateTime ExpiresAt
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets when this token was created.
	/// </summary>
	public DateTime CreateDate
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets whether this token has been used.
	/// </summary>
	public bool IsUsed
	{
		get; set;
	}
}