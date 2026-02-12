// <copyright file="HttpHeaderConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// HTTP header constants for custom headers used across the application.
/// </summary>
public static class HttpHeaderConstants
{
	/// <summary>
	/// Authorization header name.
	/// </summary>
	public const string Authorization = "Authorization";

	/// <summary>
	/// Content-Type header name.
	/// </summary>
	public const string ContentType = "Content-Type";

	/// <summary>
	/// Accept header name.
	/// </summary>
	public const string Accept = "Accept";

	/// <summary>
	/// X-Requested-With header name for AJAX detection.
	/// </summary>
	public const string XRequestedWith = "X-Requested-With";

	/// <summary>
	/// Header indicating the JWT token has expired.
	/// Set by JwtBearerEvents when SecurityTokenExpiredException occurs.
	/// </summary>
	public const string TokenExpired = "X-Token-Expired";

	/// <summary>
	/// Cache-Control header name for cache directives.
	/// Used by clients to request cache bypass on force-refresh operations.
	/// </summary>
	public const string CacheControl = "Cache-Control";

	/// <summary>
	/// Pragma header name for HTTP/1.0 cache control.
	/// Legacy header used alongside Cache-Control for backwards compatibility.
	/// </summary>
	public const string Pragma = "Pragma";

	/// <summary>
	/// W3C Trace Context traceparent header for distributed tracing.
	/// Used by OpenTelemetry and other tracing systems to propagate trace context.
	/// </summary>
	public const string TraceParent = "traceparent";

	/// <summary>
	/// W3C Trace Context tracestate header for distributed tracing.
	/// Optional vendor-specific trace state information for OpenTelemetry and tracing systems.
	/// </summary>
	public const string TraceState = "tracestate";
}