// <copyright file="EndpointPathConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for API endpoint paths.
/// Single source of truth for route definitions (DRY).
/// </summary>
public static class EndpointPathConstants
{
	/// <summary>
	/// Base API version prefix.
	/// </summary>
	public const string ApiV1 = "api/v1";

	/// <summary>
	/// Health check endpoints.
	/// </summary>
	public static class Health
	{
		/// <summary>
		/// Base health endpoint.
		/// </summary>
		public const string Base = "/health";

		/// <summary>
		/// Detailed health endpoint.
		/// </summary>
		public const string Detailed = "/health/detailed";

		/// <summary>
		/// Ready endpoint for Kubernetes readiness probes.
		/// </summary>
		public const string Ready = "/health/ready";

		/// <summary>
		/// Live endpoint for Kubernetes liveness probes.
		/// </summary>
		public const string Live = "/health/live";
	}

	/// <summary>
	/// Authentication endpoints.
	/// </summary>
	public static class Auth
	{
		/// <summary>
		/// Login endpoint.
		/// </summary>
		public const string Login = "login";

		/// <summary>
		/// Logout endpoint.
		/// </summary>
		public const string Logout = "logout";

		/// <summary>
		/// Token refresh endpoint.
		/// </summary>
		public const string Refresh = "refresh";

		/// <summary>
		/// Register endpoint.
		/// </summary>
		public const string Register = "register";
	}

	/// <summary>
	/// Metrics endpoint.
	/// </summary>
	public const string Metrics = "/metrics";

	/// <summary>
	/// OpenAPI documentation endpoint.
	/// </summary>
	public const string OpenApi = "/openapi";
}