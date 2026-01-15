// <copyright file="ThirdPartyApiRequestDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using MemoryPack;
using SeventySix.Shared.Interfaces;

namespace SeventySix.ApiTracking;

/// <summary>
/// DTO for third-party API request tracking record.
/// </summary>
/// <remarks>
/// Represents a single API usage tracking record for a specific API on a specific date.
/// Used for displaying API call statistics in the admin dashboard.
/// Cached in distributed cache for dashboard queries.
/// </remarks>
[MemoryPackable]
public partial class ThirdPartyApiRequestDto : ICacheable
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Gets or sets the name of the external API.
	/// </summary>
	/// <example>ExternalAPI</example>
	public string ApiName { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the base URL of the external API.
	/// </summary>
	/// <example>https://api.example.com</example>
	public string BaseUrl { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the number of API calls made on the ResetDate.
	/// </summary>
	public int CallCount { get; set; }

	/// <summary>
	/// Gets or sets the timestamp of the most recent API call.
	/// </summary>
	public DateTime? LastCalledAt { get; set; }

	/// <summary>
	/// Gets or sets the date for which this counter is tracking.
	/// </summary>
	public DateOnly ResetDate { get; set; }
}
