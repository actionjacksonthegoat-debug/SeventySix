// <copyright file="UserQueryRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>Request DTO for querying users with pagination and filtering.</summary>
public record UserQueryRequest : BaseQueryRequest
{
	public bool? IsActive
	{
		get; init;
	}

	public bool IncludeDeleted { get; init; } = false;
}
