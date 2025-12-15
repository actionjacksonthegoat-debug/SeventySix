// <copyright file="ExternalLogin.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// External OAuth provider login record.
/// Links user accounts to external identity providers.
/// </summary>
/// <remarks>
/// Design Principles:
/// - YAGNI: Only GitHub provider supported initially
/// - Stores provider-specific user ID for account linking
/// - Composite unique index on (Provider, ProviderUserId)
/// </remarks>
public class ExternalLogin : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Gets or sets the user ID (FK to identity.users).
	/// </summary>
	public int UserId { get; set; }

	/// <summary>
	/// Gets or sets the OAuth provider name (e.g., "GitHub").
	/// </summary>
	public string Provider { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the user's ID from the external provider.
	/// </summary>
	public string ProviderUserId { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the email from the external provider.
	/// </summary>
	public string? ProviderEmail { get; set; }

	/// <summary>
	/// Gets or sets when this login was created.
	/// </summary>
	public DateTime CreateDate { get; set; }

	/// <summary>
	/// Gets or sets when this login was last used.
	/// </summary>
	public DateTime? LastUsedAt { get; set; }
}
