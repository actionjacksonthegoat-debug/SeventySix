// <copyright file="CreateUserRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request DTO for creating a new user.
/// Encapsulates all required data for user creation.
/// </summary>
/// <remarks>
/// This request DTO implements the Command pattern, representing an intent
/// to create a new user in the system.
///
/// Design Benefits:
/// - Separates API contracts from domain models
/// - Enables request-specific validation rules
/// - Provides a clear contract for clients
/// - Supports API versioning
///
/// Validation:
/// - Username: Required, 3-50 characters, alphanumeric and underscores only
/// - Email: Required, valid email format, max 255 characters
/// - FullName: Optional, max 100 characters if provided
/// - IsActive: Optional, defaults to true
///
/// Validation is performed by CreateUserValidator using FluentValidation.
///
/// Note: Id and CreateDate are not included as they are auto-generated.
/// </remarks>
public record CreateUserRequest
{
	/// <summary>
	/// Gets the username for the new user.
	/// </summary>
	/// <value>
	/// A string representing the desired username.
	/// </value>
	/// <remarks>
	/// Required field (C# 11+ required modifier).
	/// Must be unique across all users (validated by business logic).
	/// Must be 3-50 characters long (validated by FluentValidation).
	/// Should contain only alphanumeric characters and underscores.
	/// </remarks>
	public required string Username
	{
		get; init;
	}

	/// <summary>
	/// Gets the email address for the new user.
	/// </summary>
	/// <value>
	/// A string representing the user's email address.
	/// </value>
	/// <remarks>
	/// Required field (C# 11+ required modifier).
	/// Must be a valid email format (validated by FluentValidation).
	/// Maximum length: 255 characters (validated by FluentValidation).
	/// </remarks>
	public required string Email
	{
		get; init;
	}

	/// <summary>
	/// Gets the full name for the new user.
	/// </summary>
	/// <value>
	/// A string representing the user's full name.
	/// Null if not provided.
	/// </value>
	/// <remarks>
	/// Optional field.
	/// If provided, must not exceed 100 characters (validated by FluentValidation).
	/// </remarks>
	public string? FullName
	{
		get; init;
	}

	/// <summary>
	/// Gets a value indicating whether the user account should be active.
	/// </summary>
	/// <value>
	/// True if the account should be active; otherwise, false.
	/// Defaults to true if not specified.
	/// </value>
	/// <remarks>
	/// Optional field with default value.
	/// Allows creating inactive accounts if needed.
	/// </remarks>
	public bool IsActive { get; init; } = true;
}
