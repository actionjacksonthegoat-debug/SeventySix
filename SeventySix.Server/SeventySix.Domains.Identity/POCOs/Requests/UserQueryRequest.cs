// <copyright file="UserQueryRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

/// <summary>
/// Request DTO for querying users with pagination and filtering.
/// </summary>
public record UserQueryRequest : BaseQueryRequest
{
	/// <summary>
	/// Filter by active status (true=active, false=inactive, null=any).
	/// </summary>
	public bool? IsActive { get; init; }

	/// <summary>
	/// Whether to include soft-deleted users in results.
	/// </summary>
	public bool IncludeDeleted { get; init; } = false;
}