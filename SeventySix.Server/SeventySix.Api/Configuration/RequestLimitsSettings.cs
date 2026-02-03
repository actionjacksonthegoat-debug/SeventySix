// <copyright file="RequestLimitsSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Configuration settings for request body size limits.
/// Bound from appsettings.json "RequestLimits" section.
/// </summary>
/// <remarks>
/// Protects against DoS attacks via oversized payloads.
/// Applied via Kestrel configuration in Program.cs.
/// All numeric properties must be configured in appsettings.json.
/// </remarks>
public sealed record RequestLimitsSettings
{
	/// <summary>
	/// Gets the maximum request body size in bytes.
	/// Must be configured in appsettings.json.
	/// </summary>
	public long MaxRequestBodySizeBytes { get; init; }

	/// <summary>
	/// Gets the maximum form buffer length for multipart content.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int MaxFormOptionsBufferLength { get; init; }

	/// <summary>
	/// Gets the maximum multipart body length for file uploads.
	/// Must be configured in appsettings.json.
	/// </summary>
	/// <remarks>
	/// Used for endpoints that accept file uploads.
	/// Apply via [RequestSizeLimit] attribute for specific endpoints.
	/// </remarks>
	public long MaxMultipartBodyLengthBytes { get; init; }
}