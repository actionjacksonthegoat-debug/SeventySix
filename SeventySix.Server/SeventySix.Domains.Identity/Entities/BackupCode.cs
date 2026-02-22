// <copyright file="BackupCode.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Represents a one-time backup recovery code for MFA.
/// </summary>
/// <remarks>
/// Backup codes are single-use emergency recovery tokens.
/// They are hashed using Identity's password hasher for security.
/// </remarks>
public sealed class BackupCode : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Gets or sets the user ID this backup code belongs to.
	/// </summary>
	public long UserId { get; set; }

	/// <summary>
	/// Gets or sets the hashed backup code.
	/// </summary>
	/// <remarks>
	/// Hashed using Identity's password hasher for consistency.
	/// </remarks>
	public string CodeHash { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets a value indicating whether the code has been used.
	/// </summary>
	public bool IsUsed { get; set; }

	/// <summary>
	/// Gets or sets when the code was used.
	/// </summary>
	public DateTimeOffset? UsedAt { get; set; }

	/// <summary>
	/// Gets or sets the creation timestamp.
	/// </summary>
	public DateTimeOffset CreateDate { get; set; }

	/// <summary>
	/// Gets or sets whether this backup code is soft-deleted.
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