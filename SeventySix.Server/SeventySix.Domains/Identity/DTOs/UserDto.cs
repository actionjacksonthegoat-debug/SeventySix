// <copyright file="UserDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User data transfer object for API responses.
/// Represents a read-only snapshot of user data.
/// </summary>
/// <remarks>
/// This DTO implements the DTO (Data Transfer Object) pattern to:
/// - Separate the domain model from API contracts
/// - Control what data is exposed to clients
/// - Enable API versioning without affecting domain models
/// - Provide a stable interface for clients
///
/// Design Notes:
/// - Implemented as a positional record for immutability and concise syntax
/// - Contains no business logic (pure data container)
/// - Excludes sensitive information (passwords, etc.)
///
/// This record is serialized to JSON for HTTP responses.
/// </remarks>
/// <param name="Id">
/// The unique identifier for the user.
/// </param>
/// <param name="Username">
/// The username.
/// </param>
/// <param name="Email">
/// The user's email address.
/// <para>
/// PII Classification: Personal Data (GDPR Article 4)
/// Data Protection: Retention (30 days post-deletion), Encryption (TLS, at-rest), Access (Admin-only)
/// </para>
/// </param>
/// <param name="FullName">
/// The user's full name (null if not provided).
/// <para>
/// PII Classification: Personal Data (GDPR Article 4)
/// Data Protection: Retention (30 days post-deletion), Encryption (TLS, at-rest), Access (Admin + Self)
/// </para>
/// </param>
/// <param name="CreateDate">
/// The date and time when the user was created (UTC).
/// </param>
/// <param name="IsActive">
/// Whether the user account is active.
/// </param>
/// <param name="CreatedBy">
/// The username of the user who created this user.
/// </param>
/// <param name="ModifyDate">
/// The date and time when the user was last modified.
/// </param>
/// <param name="ModifiedBy">
/// The username of the user who last modified this user.
/// </param>
/// <param name="LastLoginAt">
/// The date and time of the user's last login.
/// </param>
/// <param name="IsDeleted">
/// Whether the user has been soft-deleted.
/// </param>
/// <param name="DeletedAt">
/// The date and time when the user was soft-deleted.
/// </param>
/// <param name="DeletedBy">
/// The username of the user who deleted this user.
/// </param>
public record UserDto(
	long Id,
	string Username,
	string Email,
	string? FullName,
	DateTime CreateDate,
	bool IsActive,
	bool NeedsPendingEmail,
	string CreatedBy,
	DateTime? ModifyDate,
	string ModifiedBy,
	DateTime? LastLoginAt,
	bool IsDeleted,
	DateTime? DeletedAt,
	string? DeletedBy);