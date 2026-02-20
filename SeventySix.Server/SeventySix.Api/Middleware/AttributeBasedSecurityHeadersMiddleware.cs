// <copyright file="AttributeBasedSecurityHeadersMiddleware.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc.Controllers;
using SeventySix.Api.Attributes;

namespace SeventySix.Api.Middleware;

/// <summary>
/// Attribute-aware security headers middleware that respects [SecurityHeaders] attributes.
/// </summary>
/// <remarks>
/// This middleware reads security header configuration from [SecurityHeaders] attributes
/// applied to controllers or actions. Falls back to secure defaults when no attribute is present.
///
/// <para>Priority (highest to lowest):</para>
/// <list type="number">
/// <item>Action-level [SecurityHeaders] attribute</item>
/// <item>Controller-level [SecurityHeaders] attribute</item>
/// <item>Global secure defaults</item>
/// </list>
///
/// <para>Default Security Headers:</para>
/// <list type="bullet">
/// <item>X-Content-Type-Options: nosniff</item>
/// <item>X-Frame-Options: DENY</item>
/// <item>X-XSS-Protection: 1; mode=block</item>
/// <item>Referrer-Policy: strict-origin-when-cross-origin</item>
/// <item>Permissions-Policy: geolocation=(), microphone=(), camera=()</item>
/// <item>Content-Security-Policy: Configured for Angular + Material + Google Fonts</item>
/// <item>Strict-Transport-Security: Only in production</item>
/// </list>
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="AttributeBasedSecurityHeadersMiddleware"/> class.
/// </remarks>
/// <param name="next">
/// The next middleware in the pipeline.
/// </param>
/// <param name="environment">
/// The web host environment.
/// </param>
public sealed class AttributeBasedSecurityHeadersMiddleware(
	RequestDelegate next,
	IWebHostEnvironment environment)
{
	// Production CSP: Strict policy without unsafe-eval
	// - script-src 'self': No inline scripts or eval needed for Angular AOT builds
	// - style-src 'unsafe-inline': Required for Angular style bindings ([style.x])
	// - frame-src: Allows Grafana dashboard embeds via HTTPS proxy
	// - upgrade-insecure-requests: Auto-upgrade any accidental HTTP to HTTPS
	private const string ProductionCsp =
		"default-src 'self'; "
		+ "script-src 'self'; "
		+ "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
		+ "font-src 'self' https://fonts.gstatic.com; "
		+ "img-src 'self' data: https:; "
		+ "connect-src 'self' wss:; "
		+ "frame-src 'self' https://localhost:3443; "
		+ "frame-ancestors 'none'; "
		+ "base-uri 'self'; "
		+ "form-action 'self'; "
		+ "upgrade-insecure-requests";

	// Development CSP: Relaxed for debugging, hot reload, etc.
	// frame-src allows Grafana iframe embedding via HTTPS proxy
	// upgrade-insecure-requests auto-upgrades any accidental HTTP requests
	private const string DevelopmentCsp =
		"default-src 'self'; "
		+ "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
		+ "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
		+ "font-src 'self' https://fonts.gstatic.com; "
		+ "img-src 'self' data: https:; "
		+ "connect-src 'self' wss: https://localhost:7074 https://localhost:4319; "
		+ "frame-src 'self' https://localhost:3443; "
		+ "frame-ancestors 'none'; "
		+ "base-uri 'self'; "
		+ "form-action 'self'; "
		+ "upgrade-insecure-requests";

	/// <summary>
	/// Invokes the security headers middleware.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task InvokeAsync(HttpContext context)
	{
		// Get security header configuration from attributes
		SecurityHeadersAttribute config =
			GetSecurityHeadersConfig(context);

		// Apply security headers
		context.Response.Headers.XContentTypeOptions =
			config.XContentTypeOptions;
		context.Response.Headers.XFrameOptions = config.XFrameOptions;
		context.Response.Headers.XXSSProtection = "1; mode=block";
		context.Response.Headers["Referrer-Policy"] = config.ReferrerPolicy;
		context.Response.Headers["Permissions-Policy"] =
			config.PermissionsPolicy;
		context.Response.Headers.CacheControl = "no-store";
		context.Response.Headers.Pragma = "no-cache";

		// Content Security Policy - use environment-appropriate default
		string defaultCsp =
			environment.IsDevelopment()
			? DevelopmentCsp
			: ProductionCsp;
		string csp =
			config.ContentSecurityPolicy ?? defaultCsp;
		context.Response.Headers.ContentSecurityPolicy = csp;

		// HSTS only in production to avoid development certificate issues
		if (config.EnableHsts && !environment.IsDevelopment())
		{
			string hstsValue =
				$"max-age={config.HstsMaxAge}";
			if (config.HstsIncludeSubDomains)
			{
				hstsValue += "; includeSubDomains";
			}
			context.Response.Headers.StrictTransportSecurity = hstsValue;
		}

		await next(context);
	}

	/// <summary>
	/// Gets security headers configuration from attributes or defaults.
	/// </summary>
	/// <param name="context">
	/// The HTTP context.
	/// </param>
	/// <returns>
	/// Security headers configuration.
	/// </returns>
	private static SecurityHeadersAttribute GetSecurityHeadersConfig(
		HttpContext context)
	{
		Endpoint? endpoint = context.GetEndpoint();
		if (endpoint == null)
		{
			return new SecurityHeadersAttribute();
		}

		// Check for action-level attribute first
		ControllerActionDescriptor? actionDescriptor =
			endpoint.Metadata.GetMetadata<ControllerActionDescriptor>();

		if (
			actionDescriptor
				?.MethodInfo
				.GetCustomAttributes(
					typeof(SecurityHeadersAttribute),
					true)
				.FirstOrDefault()
			is SecurityHeadersAttribute actionAttribute)
		{
			return actionAttribute;
		}

		// Check for controller-level attribute

		if (
			actionDescriptor
				?.ControllerTypeInfo
				.GetCustomAttributes(
					typeof(SecurityHeadersAttribute),
					true)
				.FirstOrDefault()
			is SecurityHeadersAttribute controllerAttribute)
		{
			return controllerAttribute;
		}

		// Use defaults
		return new SecurityHeadersAttribute();
	}
}