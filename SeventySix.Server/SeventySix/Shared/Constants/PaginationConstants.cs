// <copyright file="PaginationConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>
/// Constants for pagination defaults and limits.
/// </summary>
public static class PaginationConstants
{
	/// <summary>Default page size for queries.</summary>
	public const int DefaultPageSize = 50;

	/// <summary>Minimum allowed page size.</summary>
	public const int MinPageSize = 1;

	/// <summary>Maximum allowed page size.</summary>
	public const int MaxPageSize = 100;

	/// <summary>Small page size for limited result sets.</summary>
	public const int SmallPageSize = 10;
}