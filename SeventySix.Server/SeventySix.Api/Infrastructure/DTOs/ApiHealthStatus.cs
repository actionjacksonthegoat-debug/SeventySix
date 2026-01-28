// <copyright file="ApiHealthStatus.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents the health status of a single external API.
/// </summary>
public class ApiHealthStatus
{
	/// <summary>
	/// Gets or sets the name of the API.
	/// </summary>
	public string ApiName { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets a value indicating whether the API is available.
	/// </summary>
	public bool IsAvailable { get; set; }

	/// <summary>
	/// Gets or sets the API response time in milliseconds.
	/// </summary>
	public double ResponseTimeMs { get; set; }

	/// <summary>
	/// Gets or sets the timestamp of the last health check.
	/// </summary>
	/// <value>
	/// Null if the API has never been checked.
	/// </value>
	public DateTime? LastChecked { get; set; }
}
