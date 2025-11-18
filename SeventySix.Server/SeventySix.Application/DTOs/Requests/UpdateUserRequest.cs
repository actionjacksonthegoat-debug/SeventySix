// <copyright file="UpdateUserRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.DTOs.Requests;

/// <summary>
/// Request model for updating an existing user.
/// Includes RowVersion for optimistic concurrency control.
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

	/// <summary>
	/// Gets the row version for concurrency control.
	/// Must match the current database value to prevent lost updates.
	/// </summary>
	public uint? RowVersion
	{
		get; init;
	}
}
