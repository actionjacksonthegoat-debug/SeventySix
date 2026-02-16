// <copyright file="TrustedDevice.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Represents a trusted device for MFA bypass.
/// </summary>
/// <remarks>
/// Trusted devices allow users to skip MFA verification on recognized devices.
/// Security is maintained through token hashing and device fingerprinting.
/// </remarks>
public class TrustedDevice : ICreatableEntity, IAuditableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Gets or sets the user ID this device belongs to.
	/// </summary>
	public long UserId { get; set; }

	/// <summary>
	/// Gets or sets the hashed device token.
	/// </summary>
	/// <remarks>
	/// Hashed using SHA256. Plain token stored only in cookie.
	/// </remarks>
	public string TokenHash { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the device fingerprint for binding.
	/// </summary>
	/// <remarks>
	/// SHA256(UserAgent + IP prefix). Not PII since hashed.
	/// </remarks>
	public string DeviceFingerprint { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets a friendly device name for user display.
	/// </summary>
	public string? DeviceName { get; set; }

	/// <summary>
	/// Gets or sets when the trusted device token expires.
	/// </summary>
	public DateTimeOffset ExpiresAt { get; set; }

	/// <summary>
	/// Gets or sets when the device was last used for MFA bypass.
	/// </summary>
	public DateTimeOffset? LastUsedAt { get; set; }

	/// <summary>
	/// Gets or sets the creation timestamp.
	/// </summary>
	public DateTimeOffset CreateDate { get; set; }

	/// <summary>
	/// Gets or sets who created this record.
	/// </summary>
	public string CreatedBy { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the last modification timestamp.
	/// </summary>
	public DateTimeOffset? ModifyDate { get; set; }

	/// <summary>
	/// Gets or sets who last modified this record.
	/// </summary>
	public string ModifiedBy { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets whether this trusted device is soft-deleted.
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