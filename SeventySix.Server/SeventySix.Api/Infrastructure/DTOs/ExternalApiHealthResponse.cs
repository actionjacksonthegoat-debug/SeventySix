// <copyright file="ExternalApiHealthResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Represents external APIs health status.
/// </summary>
public class ExternalApiHealthResponse
{
	/// <summary>
	/// Gets or sets the dictionary of API health statuses keyed by API name.
	/// </summary>
	public Dictionary<string, ApiHealthStatus> Apis { get; set; } = [];
}
