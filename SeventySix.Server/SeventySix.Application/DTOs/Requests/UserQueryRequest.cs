// <copyright file="UserQueryRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.DTOs.Requests;

/// <summary>
/// Request model for querying users with pagination and filtering.
/// </summary>
public record UserQueryRequest
{
	/// <summary>
	/// Gets the page number (1-based).
	/// </summary>
	public int Page { get; init; } = 1;

	/// <summary>
	/// Gets the page size (max 100).
	/// </summary>
	public int PageSize { get; init; } = 20;

	/// <summary>
	/// Gets the search term to filter by username, email, or full name.
	/// </summary>
	public string? SearchTerm
	{
		get; init;
	}

	/// <summary>
	/// Gets a value indicating whether to filter by active status.
	/// Null returns all users regardless of status.
	/// </summary>
	public bool? IsActive
	{
		get; init;
	}

	/// <summary>
	/// Gets a value indicating whether to include soft-deleted users.
	/// </summary>
	public bool IncludeDeleted { get; init; } = false;

	/// <summary>
	/// Gets the field to sort by (username, email, createdat, modifiedat).
	/// </summary>
	public string SortBy { get; init; } = "username";

	/// <summary>
	/// Gets a value indicating whether to sort in descending order.
	/// </summary>
	public bool SortDescending { get; init; } = false;
}
