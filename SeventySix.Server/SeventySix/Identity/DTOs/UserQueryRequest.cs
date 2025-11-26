// <copyright file="UserQueryRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// Request model for querying users with pagination and filtering.
/// </summary>
/// <remarks>
/// Inherits common query properties from BaseQueryRequest.
/// ONLY adds domain-specific IsActive and IncludeDeleted filters.
/// Uses base defaults: PageSize=50, SortBy="Id", StartDate=1 hour ago.
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API request
/// - Template: Inherits from BaseQueryRequest
///
/// SOLID Principles:
/// - SRP: Only responsible for user-specific filter criteria
/// - OCP: Extends base without modification
///
/// Searches across: Username, Email, FullName (partial match).
/// </remarks>
public record UserQueryRequest : BaseQueryRequest
{
	/// <summary>
	/// Gets a value indicating whether to filter by active status.
	/// </summary>
	/// <remarks>
	/// UserQueryRequest-specific property - custom value for Users domain.
	/// Null returns all users regardless of status.
	/// </remarks>
	public bool? IsActive
	{
		get; init;
	}

	/// <summary>
	/// Gets a value indicating whether to include soft-deleted users.
	/// </summary>
	/// <remarks>
	/// UserQueryRequest-specific property - custom value for Users domain.
	/// </remarks>
	public bool IncludeDeleted
	{
		get; init;
	} = false;
}
