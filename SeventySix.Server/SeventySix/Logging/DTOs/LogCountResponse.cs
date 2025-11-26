// <copyright file="LogCountResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Response DTO containing the total count of logs.
/// </summary>
/// <remarks>
/// Used for pagination calculations in the log management page.
/// Returns the total number of logs matching the applied filters.
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API response
///
/// SOLID Principles:
/// - SRP: Single responsibility - represents count response
/// - ISP: Minimal interface with only necessary data
/// </remarks>
public record LogCountResponse
{
	/// <summary>
	/// Gets or sets the total number of logs matching the filter criteria.
	/// </summary>
	public required int Total
	{
		get; init;
	}
}
