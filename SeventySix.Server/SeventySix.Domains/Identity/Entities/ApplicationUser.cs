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
public class ApplicationUser : IdentityUser<long>, IAuditableEntity
{
	/// <summary>
	/// Gets or sets the user's full name.
	/// </summary>
	public string? FullName { get; set; }

	/// <summary>
	/// Gets or sets the creation timestamp.
	/// </summary>
	public DateTime CreateDate { get; set; }

	/// <summary>
	/// Gets or sets who created this user.
	/// </summary>
	public string CreatedBy { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the last modification timestamp.
	/// </summary>
	public DateTime? ModifyDate { get; set; }

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
	public DateTime? DeletedAt { get; set; }

	/// <summary>
	/// Gets or sets who deleted this user.
	/// </summary>
	public string? DeletedBy { get; set; }

	/// <summary>
	/// Gets or sets the last login timestamp.
	/// </summary>
	public DateTime? LastLoginAt { get; set; }

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
	/// Gets or sets whether pending email notification is needed.
	/// </summary>
	public bool NeedsPendingEmail { get; set; }

	/// <summary>
	/// Gets or sets user preferences as JSON.
	/// </summary>
	public string? Preferences { get; set; }

	/// <summary>
	/// Gets or sets the row version for concurrency.
	/// </summary>
	public uint? RowVersion { get; set; }
}