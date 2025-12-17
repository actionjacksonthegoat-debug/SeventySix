// <copyright file="ApiVersionConfig.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Centralized API versioning configuration.
/// </summary>
/// <remarks>
/// This provides a single source of truth for API versions across the application.
/// Best Practices:
/// - Version format: v{major} (e.g., v1, v2)
/// - Routes use constants to avoid hardcoding
/// - Easy to support multiple concurrent versions
/// - Can be extended to read from configuration
/// </remarks>
public static class ApiVersionConfig
{
	/// <summary>
	/// Current API version prefix (e.g., "v1").
	/// </summary>
	public const string CurrentVersion = "v1";

	/// <summary>
	/// Full API route prefix including version (e.g., "api/v1").
	/// </summary>
	public const string VersionedRoutePrefix =
		$"api/{CurrentVersion}";

	/// <summary>
	/// All supported API versions (for future multi-version support).
	/// </summary>
	public static readonly string[] SupportedVersions =
		{ "v1" };

	/// <summary>
	/// Gets the route template for versioned controllers.
	/// </summary>
	/// <param name="controllerName">Optional controller name placeholder. Default is [controller].</param>
	/// <returns>The route template (e.g., "api/v1/[controller]").</returns>
	public static string GetVersionedRoute(
		string controllerName = "[controller]")
	{
		return $"{VersionedRoutePrefix}/{controllerName}";
	}
}