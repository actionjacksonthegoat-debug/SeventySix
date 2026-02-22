// <copyright file="ApplicationUser.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Application user extending ASP.NET Core Identity.
/// Contains app-specific profile and audit fields.
/// </summary>
/// <remarks>
/// Stores PII cautiously; follow GDPR retention and anonymization policies in the domain settings.
/// Use `LastLoginIp` and `LastLoginAt` for security telemetry only; ensure cleanup per settings.
/// </remarks>
public sealed class ApplicationUser : IdentityUser<long>, IAuditableEntity
{
	/// <summary>
	/// Gets or sets the user's full name.
	/// </summary>
	public string? FullName { get; set; }

	/// <summary>
	/// Gets or sets the creation timestamp.
	/// </summary>
	public DateTimeOffset CreateDate { get; set; }

	/// <summary>
	/// Gets or sets who created this user.
	/// </summary>
	public string CreatedBy { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the last modification timestamp.
	/// </summary>
	public DateTimeOffset? ModifyDate { get; set; }

	/// <summary>
	/// Gets or sets who last modified this user.
	/// </summary>
	public string ModifiedBy { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets whether the user is active.
	/// </summary>
	public bool IsActive { get; set; } = true;

	/// <summary>
	/// Gets or sets whether the user is soft deleted.
	/// </summary>
	public bool IsDeleted { get; set; }

	/// <summary>
	/// Gets or sets when the user was deleted.
	/// </summary>
	public DateTimeOffset? DeletedAt { get; set; }

	/// <summary>
	/// Gets or sets who deleted this user.
	/// </summary>
	public string? DeletedBy { get; set; }

	/// <summary>
	/// Gets or sets the last login timestamp.
	/// </summary>
	public DateTimeOffset? LastLoginAt { get; set; }

	/// <summary>
	/// Gets or sets the last login IP address.
	/// </summary>
	public string? LastLoginIp { get; set; }

	/// <summary>
	/// Gets or sets whether the user must change their password on next login.
	/// Stored in the DB as a non-nullable boolean with default false.
	/// </summary>
	public bool RequiresPasswordChange { get; set; } = false;

	/// <summary>
	/// Gets or sets whether multi-factor authentication is enabled for this user.
	/// </summary>
	/// <remarks>
	/// Defaults to true (security-first). When RequiredForAllUsers is false,
	/// this per-user flag determines whether MFA is required after password authentication.
	/// </remarks>
	public bool MfaEnabled { get; set; } = true;

	/// <summary>
	/// Gets or sets the TOTP authenticator secret (encrypted at rest).
	/// </summary>
	/// <remarks>
	/// Base32-encoded 160-bit secret. Null if TOTP not enrolled.
	/// </remarks>
	public string? TotpSecret { get; set; }

	/// <summary>
	/// Gets or sets when TOTP was enrolled.
	/// </summary>
	public DateTimeOffset? TotpEnrolledAt { get; set; }

	/// <summary>
	/// Gets or sets user preferences as JSON.
	/// </summary>
	public string? Preferences { get; set; }

	/// <summary>
	/// Gets or sets the row version for concurrency.
	/// </summary>
	public uint? RowVersion { get; set; }
}