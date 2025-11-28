// <copyright file="LogFilterRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Logging;

/// <summary>Request DTO for filtering log entries.</summary>
public record LogFilterRequest : BaseQueryRequest
{
	public string? LogLevel
	{
		get; init;
	}
}
