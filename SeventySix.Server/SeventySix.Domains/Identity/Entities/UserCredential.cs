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
/// - Argon2id password hash (OWASP 2024 recommended)
/// - PasswordChangedAt = null forces password change on first login
/// </remarks>
public class UserCredential
{
	/// <summary>
	/// Gets or sets the user ID (FK to identity.users).
	/// </summary>
	public int UserId { get; set; }

	/// <summary>
	/// Gets or sets the password hash.
	/// Stored using Argon2id with configurable parameters.
	/// </summary>
	/// <remarks>
	/// Format: $argon2id$v=19$m={memory},t={iterations},p={parallelism}${salt}${hash}
	/// </remarks>
	public string PasswordHash { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets when the password was last changed.
	/// Null = force password change on first login.
	/// </summary>
	public DateTime? PasswordChangedAt { get; set; }

	/// <summary>
	/// Gets or sets when this credential was created.
	/// </summary>
	public DateTime CreateDate { get; set; }
}