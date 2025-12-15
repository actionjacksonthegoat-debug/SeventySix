// <copyright file="EmailVerificationToken.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Time-limited token for email verification during self-registration.
/// Account is not created until this token is consumed.
/// </summary>
/// <remarks>
/// Security Design:
/// - 64-byte cryptographically random token (base64 encoded).
/// - 24-hour expiration window.
/// - Single-use enforcement via IsUsed flag.
/// - Old tokens invalidated when new verification is requested.
/// </remarks>
public class EmailVerificationToken : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public int Id { get; set; }

	/// <summary>
	/// Gets or sets the email being verified (account not yet created).
	/// </summary>
	public string Email { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the cryptographically random token (base64, 64 bytes).
	/// </summary>
	public string Token { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the expiration time (24 hours from creation).
	/// </summary>
	public DateTime ExpiresAt { get; set; }

	/// <summary>
	/// Gets or sets the creation timestamp.
	/// </summary>
	public DateTime CreateDate { get; set; }

	/// <summary>
	/// Gets or sets a value indicating whether this token has been used.
	/// </summary>
	public bool IsUsed { get; set; }
}
