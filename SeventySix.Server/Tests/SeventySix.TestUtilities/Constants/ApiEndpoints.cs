// <copyright file="ApiEndpoints.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.TestUtilities.Constants;

/// <summary>
/// Centralized API endpoint constants for integration tests.
/// Prevents DRY violations and typos in endpoint URLs.
/// </summary>
public static class ApiEndpoints
{
	/// <summary>Authentication endpoints.</summary>
	public static class Auth
	{
		/// <summary>Base auth endpoint.</summary>
		public const string Base = "/api/v1/auth";

		/// <summary>Login endpoint.</summary>
		public const string Login = "/api/v1/auth/login";

		/// <summary>Logout endpoint.</summary>
		public const string Logout = "/api/v1/auth/logout";

		/// <summary>Token refresh endpoint.</summary>
		public const string Refresh = "/api/v1/auth/refresh";

		/// <summary>Current user endpoint.</summary>
		public const string Me = "/api/v1/auth/me";

		/// <summary>Change password endpoint.</summary>
		public const string ChangePassword = "/api/v1/auth/change-password";

		/// <summary>GitHub OAuth start endpoint.</summary>
		public const string GitHub = "/api/v1/auth/github";

		/// <summary>GitHub OAuth callback endpoint.</summary>
		public const string GitHubCallback = "/api/v1/auth/github/callback";

		/// <summary>OAuth code exchange endpoint.</summary>
		public const string OAuthExchange = "/api/v1/auth/oauth/exchange";

		/// <summary>Initiate registration endpoint.</summary>
		public const string RegisterInitiate = "/api/v1/auth/register/initiate";

		/// <summary>Complete registration endpoint.</summary>
		public const string RegisterComplete = "/api/v1/auth/register/complete";

		/// <summary>Legacy register endpoint.</summary>
		public const string Register = "/api/v1/auth/register";

		/// <summary>
		/// Builds GitHub callback URL with query parameters.
		/// </summary>
		/// <param name="code">OAuth code.</param>
		/// <param name="state">OAuth state.</param>
		/// <returns>Full callback URL with query string.</returns>
		public static string GitHubCallbackWithParams(
			string code,
			string state) => $"{GitHubCallback}?code={code}&state={state}";
	}

	/// <summary>User management endpoints.</summary>
	public static class Users
	{
		/// <summary>Base users endpoint.</summary>
		public const string Base = "/api/v1/users";

		/// <summary>Current user endpoint.</summary>
		public const string Me = "/api/v1/users/me";

		/// <summary>Permission requests list endpoint (admin).</summary>
		public const string PermissionRequests =
			"/api/v1/users/permission-requests";

		/// <summary>Available roles for current user.</summary>
		public const string MeAvailableRoles =
			"/api/v1/users/me/available-roles";

		/// <summary>Current user's permission requests.</summary>
		public const string MePermissionRequests =
			"/api/v1/users/me/permission-requests";

		/// <summary>
		/// Gets user by ID endpoint.
		/// </summary>
		/// <param name="id">User ID.</param>
		/// <returns>Endpoint URL.</returns>
		public static string ById(int id) => $"{Base}/{id}";

		/// <summary>
		/// Gets user roles endpoint.
		/// </summary>
		/// <param name="id">User ID.</param>
		/// <returns>Endpoint URL.</returns>
		public static string Roles(int id) => $"{Base}/{id}/roles";

		/// <summary>
		/// Gets approve permission request endpoint.
		/// </summary>
		/// <param name="requestId">Permission request ID.</param>
		/// <returns>Endpoint URL.</returns>
		public static string ApprovePermission(int requestId) =>
			$"{PermissionRequests}/{requestId}/approve";

		/// <summary>
		/// Gets deny permission request endpoint.
		/// </summary>
		/// <param name="requestId">Permission request ID.</param>
		/// <returns>Endpoint URL.</returns>
		public static string DenyPermission(int requestId) =>
			$"{PermissionRequests}/{requestId}/deny";
	}

	/// <summary>Log management endpoints.</summary>
	public static class Logs
	{
		/// <summary>Base logs endpoint.</summary>
		public const string Base = "/api/v1/logs";

		/// <summary>Client-side log endpoint.</summary>
		public const string Client = "/api/v1/logs/client";

		/// <summary>Client-side batch log endpoint.</summary>
		public const string ClientBatch = "/api/v1/logs/client/batch";

		/// <summary>Batch delete endpoint.</summary>
		public const string Batch = "/api/v1/logs/batch";

		/// <summary>Cleanup endpoint.</summary>
		public const string Cleanup = "/api/v1/logs/cleanup";

		/// <summary>
		/// Gets log by ID endpoint.
		/// </summary>
		/// <param name="id">Log ID.</param>
		/// <returns>Endpoint URL.</returns>
		public static string ById(int id) => $"{Base}/{id}";

		/// <summary>
		/// Gets cleanup endpoint with cutoff date.
		/// </summary>
		/// <param name="cutoffDate">Cutoff date.</param>
		/// <returns>Endpoint URL with query string.</returns>
		public static string CleanupWithDate(DateTime cutoffDate) =>
			$"{Cleanup}?cutoffDate={cutoffDate:O}";
	}

	/// <summary>Third-party API request endpoints.</summary>
	public static class ThirdPartyRequests
	{
		/// <summary>Base endpoint.</summary>
		public const string Base = "/api/v1/thirdpartyrequests";
	}
}