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
/// </remarks>
public sealed record RequestLimitsSettings
{
	/// <summary>
	/// Gets the maximum request body size in bytes.
	/// Default: 10 MB (10,485,760 bytes).
	/// </summary>
	public long MaxRequestBodySizeBytes { get; init; } = 10_485_760;

	/// <summary>
	/// Gets the maximum form buffer length for multipart content.
	/// Default: 4 MB (4,194,304 bytes).
	/// </summary>
	public int MaxFormOptionsBufferLength { get; init; } = 4_194_304;

	/// <summary>
	/// Gets the maximum multipart body length for file uploads.
	/// Default: 100 MB (104,857,600 bytes).
	/// </summary>
	/// <remarks>
	/// Used for endpoints that accept file uploads.
	/// Apply via [RequestSizeLimit] attribute for specific endpoints.
	/// </remarks>
	public long MaxMultipartBodyLengthBytes { get; init; } = 104_857_600;
}
