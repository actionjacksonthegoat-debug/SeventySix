// <copyright file="UpdateUserRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Request model for updating an existing user.
/// </summary>
public record UpdateUserRequest
{
	/// <summary>
	/// Gets the user ID to update.
	/// </summary>
	public required int Id
	{
		get; init;
	}

	/// <summary>
	/// Gets the username (unique, 3-50 characters).
	/// </summary>
	public required string Username
	{
		get; init;
	}

	/// <summary>
	/// Gets the email address (unique, valid format).
	/// </summary>
	public required string Email
	{
		get; init;
	}

	/// <summary>
	/// Gets the full name (optional, max 100 characters).
	/// </summary>
	public string? FullName
	{
		get; init;
	}

	/// <summary>
	/// Gets a value indicating whether the user account is active.
	/// </summary>
	public bool IsActive
	{
		get; init;
	}
}
