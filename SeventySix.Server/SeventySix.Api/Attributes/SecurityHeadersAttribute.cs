// <copyright file="SecurityHeadersAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Attributes;

/// <summary>
/// Attribute to configure security headers for a controller or action.
/// </summary>
/// <remarks>
/// Allows customization of Content Security Policy and other security headers
/// on a per-controller or per-action basis. Useful when different endpoints
/// have different security requirements (e.g., file uploads, iframe embedding).
///
/// <para>Examples:</para>
/// <code>
/// // Allow iframe embedding for specific endpoint
/// [SecurityHeaders(XFrameOptions = "SAMEORIGIN")]
/// public class EmbeddableController : ControllerBase { }
///
/// // Custom CSP for file upload endpoint
/// [SecurityHeaders(ContentSecurityPolicy = "default-src 'self'; img-src 'self' data: *")]
/// public async Task&lt;IActionResult&gt; UploadImage() { }
/// </code>
/// </remarks>
[AttributeUsage(
	AttributeTargets.Class | AttributeTargets.Method,
	AllowMultiple = false,
	Inherited = true
)]
public sealed class SecurityHeadersAttribute : Attribute
{
	/// <summary>
	/// Gets or sets the Content Security Policy header value.
	/// Set to null to use the default global CSP.
	/// </summary>
	public string? ContentSecurityPolicy { get; set; }

	/// <summary>
	/// Gets or sets the X-Frame-Options header value.
	/// </summary>
	/// <value>Default: "DENY".</value>
	public string XFrameOptions { get; set; } = "DENY";

	/// <summary>
	/// Gets or sets the X-Content-Type-Options header value.
	/// </summary>
	/// <value>Default: "nosniff".</value>
	public string XContentTypeOptions { get; set; } = "nosniff";

	/// <summary>
	/// Gets or sets the Referrer-Policy header value.
	/// </summary>
	/// <value>Default: "strict-origin-when-cross-origin".</value>
	public string ReferrerPolicy { get; set; } =
		"strict-origin-when-cross-origin";

	/// <summary>
	/// Gets or sets the Permissions-Policy header value.
	/// </summary>
	/// <value>Default: "geolocation=(), microphone=(), camera=()".</value>
	public string PermissionsPolicy { get; set; } =
		"geolocation=(), microphone=(), camera=()";

	/// <summary>
	/// Gets or sets a value indicating whether HSTS should be enabled.
	/// Only applies in production environments.
	/// </summary>
	/// <value>Default: true.</value>
	public bool EnableHsts { get; set; } = true;

	/// <summary>
	/// Gets or sets the HSTS max-age value in seconds.
	/// </summary>
	/// <value>Default: 31536000 (1 year).</value>
	public int HstsMaxAge { get; set; } = 31536000;

	/// <summary>
	/// Gets or sets a value indicating whether to include subdomains in HSTS.
	/// </summary>
	/// <value>Default: true.</value>
	public bool HstsIncludeSubDomains { get; set; } = true;

	/// <summary>
	/// Initializes a new instance of the <see cref="SecurityHeadersAttribute"/> class.
	/// </summary>
	public SecurityHeadersAttribute() { }
}