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
/// - Implemented as a record for immutability and value equality
/// - Uses init-only properties (C# 9+) for immutable state
/// - Contains no business logic (pure data container)
/// - Excludes sensitive information (passwords, etc.)
///
/// This record is serialized to JSON for HTTP responses.
/// </remarks>
public record UserDto
{
	/// <summary>
	/// Gets the unique identifier for the user.
	/// </summary>
	/// <value>
	/// An integer representing the user's unique ID.
	/// </value>
	public int Id
	{
		get; init;
	}

	/// <summary>
	/// Gets the username.
	/// </summary>
	/// <value>
	/// A string representing the user's username.
	/// </value>
	public string Username { get; init; } = string.Empty;

	/// <summary>
	/// Gets the user's email address.
	/// </summary>
	/// <value>
	/// A string representing the user's email.
	/// </value>
	public string Email { get; init; } = string.Empty;

	/// <summary>
	/// Gets the user's full name.
	/// </summary>
	/// <value>
	/// A string representing the user's full name.
	/// Null if not provided.
	/// </value>
	public string? FullName
	{
		get; init;
	}

	/// <summary>
	/// Gets the date and time when the user was created.
	/// </summary>
	/// <value>
	/// A DateTime value representing when the user account was created.
	/// </value>
	/// <remarks>
	/// Uses UTC time for consistency across time zones.
	/// </remarks>
	public DateTime CreateDate
	{
		get; init;
	}

	/// <summary>
	/// Gets a value indicating whether the user account is active.
	/// </summary>
	/// <value>
	/// True if the user account is active; otherwise, false.
	/// </value>
	public bool IsActive
	{
		get; init;
	}

	/// <summary>
	/// Gets the username of the user who created this user.
	/// </summary>
	public required string CreatedBy
	{
		get; init;
	}

	/// <summary>
	/// Gets the date and time when the user was last modified.
	/// </summary>
	public DateTime? ModifyDate
	{
		get; init;
	}

	/// <summary>
	/// Gets the username of the user who last modified this user.
	/// </summary>
	public required string ModifiedBy
	{
		get; init;
	}

	/// <summary>
	/// Gets the date and time of the user's last login.
	/// </summary>
	public DateTime? LastLoginAt
	{
		get; init;
	}
}