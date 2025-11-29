// <copyright file="UserCredential.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User credentials for local authentication.
/// One-to-one relationship with User entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Separate from User entity for security (credentials are loaded separately)
/// - BCrypt password hash with configurable work factor
/// - PasswordChangedAt = null forces password change on first login
/// </remarks>
public class UserCredential
{
	/// <summary>
	/// Gets or sets the user ID (FK to identity.users).
	/// </summary>
	public int UserId
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the password hash.
	/// Stored using BCrypt with configurable work factor.
	/// </summary>
	public string PasswordHash { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets when the password was last changed.
	/// Null = force password change on first login.
	/// </summary>
	public DateTime? PasswordChangedAt
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets when this credential was created.
	/// </summary>
	public DateTime CreatedAt
	{
		get; set;
	}
}