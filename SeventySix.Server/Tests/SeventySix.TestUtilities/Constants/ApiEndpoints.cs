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

		/// <summary>OAuth code exchange endpoint.</summary>
		public const string OAuthExchange = "/api/v1/auth/oauth/exchange";

		/// <summary>Initiate registration endpoint.</summary>
		public const string RegisterInitiate = "/api/v1/auth/register/initiate";

		/// <summary>Complete registration endpoint.</summary>
		public const string RegisterComplete = "/api/v1/auth/register/complete";

		/// <summary>Legacy register endpoint.</summary>
		public const string Register = "/api/v1/auth/register";

		/// <summary>MFA endpoints.</summary>
		public static class Mfa
		{
			/// <summary>MFA verify endpoint.</summary>
			public const string Verify = "/api/v1/auth/mfa/verify";

			/// <summary>MFA resend endpoint.</summary>
			public const string Resend = "/api/v1/auth/mfa/resend";

			/// <summary>TOTP verify endpoint.</summary>
			public const string VerifyTotp = "/api/v1/auth/mfa/verify-totp";

			/// <summary>Backup code verify endpoint.</summary>
			public const string VerifyBackup = "/api/v1/auth/mfa/verify-backup";

			/// <summary>TOTP setup endpoint.</summary>
			public const string TotpSetup = "/api/v1/auth/mfa/totp/setup";

			/// <summary>TOTP confirm endpoint.</summary>
			public const string TotpConfirm = "/api/v1/auth/mfa/totp/confirm";

			/// <summary>TOTP disable endpoint.</summary>
			public const string TotpDisable = "/api/v1/auth/mfa/totp/disable";

			/// <summary>Generate backup codes endpoint.</summary>
			public const string BackupCodes = "/api/v1/auth/mfa/backup-codes";

			/// <summary>Remaining backup codes endpoint.</summary>
			public const string BackupCodesRemaining = "/api/v1/auth/mfa/backup-codes/remaining";
		}

		/// <summary>Password management endpoints.</summary>
		public static class Password
		{
			/// <summary>Change password endpoint.</summary>
			public const string Change = "/api/v1/auth/password/change";

			/// <summary>Forgot password endpoint.</summary>
			public const string Forgot = "/api/v1/auth/password/forgot";

			/// <summary>Set password endpoint.</summary>
			public const string Set = "/api/v1/auth/password/set";
		}

		/// <summary>Trusted device management endpoints.</summary>
		public static class TrustedDevices
		{
			/// <summary>List trusted devices endpoint.</summary>
			public const string List = "/api/v1/auth/trusted-devices";

			/// <summary>Revoke all trusted devices endpoint.</summary>
			public const string RevokeAll = "/api/v1/auth/trusted-devices";

			/// <summary>
			/// Builds the revoke device endpoint for a specific device.
			/// </summary>
			/// <param name="deviceId">
			/// The device ID.
			/// </param>
			/// <returns>
			/// The formatted endpoint URL.
			/// </returns>
			public static string Revoke(long deviceId) =>
				$"/api/v1/auth/trusted-devices/{deviceId}";
		}

		/// <summary>OAuth provider endpoints.</summary>
		public static class OAuth
		{
			/// <summary>GitHub OAuth start endpoint.</summary>
			public const string GitHub = "/api/v1/auth/oauth/github";

			/// <summary>GitHub OAuth callback endpoint.</summary>
			public const string GitHubCallback = "/api/v1/auth/oauth/github/callback";

			/// <summary>
			/// Builds GitHub callback URL with query parameters.
			/// </summary>
			/// <param name="code">
			/// OAuth code.
			/// </param>
			/// <param name="state">
			/// OAuth state.
			/// </param>
			/// <returns>
			/// Full callback URL with query string.
			/// </returns>
			public static string GitHubCallbackWithParams(
				string code,
				string state) => $"{GitHubCallback}?code={code}&state={state}";
		}
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
		/// <param name="id">
		/// User ID.
		/// </param>
		/// <returns>
		/// Endpoint URL.
		/// </returns>
		public static string ById(long id) => $"{Base}/{id}";

		/// <summary>
		/// Gets user roles endpoint.
		/// </summary>
		/// <param name="id">
		/// User ID.
		/// </param>
		/// <returns>
		/// Endpoint URL.
		/// </returns>
		public static string Roles(long id) => $"{Base}/{id}/roles";

		/// <summary>
		/// Gets approve permission request endpoint.
		/// </summary>
		/// <param name="requestId">
		/// Permission request ID.
		/// </param>
		/// <returns>
		/// Endpoint URL.
		/// </returns>
		public static string ApprovePermission(long requestId) =>
			$"{PermissionRequests}/{requestId}/approve";

		/// <summary>
		/// Gets deny permission request endpoint.
		/// </summary>
		/// <param name="requestId">
		/// Permission request ID.
		/// </param>
		/// <returns>
		/// Endpoint URL.
		/// </returns>
		public static string DenyPermission(long requestId) =>
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
		/// <param name="id">
		/// Log ID.
		/// </param>
		/// <returns>
		/// Endpoint URL.
		/// </returns>
		public static string ById(long id) => $"{Base}/{id}";

		/// <summary>
		/// Gets cleanup endpoint with cutoff date.
		/// </summary>
		/// <param name="cutoffDate">
		/// Cutoff date.
		/// </param>
		/// <returns>
		/// Endpoint URL with query string.
		/// </returns>
		public static string CleanupWithDate(DateTimeOffset cutoffDate) =>
			$"{Cleanup}?cutoffDate={Uri.EscapeDataString(cutoffDate.ToString("O"))}";
	}

	/// <summary>Third-party API request endpoints.</summary>
	public static class ThirdPartyRequests
	{
		/// <summary>Base endpoint.</summary>
		public const string Base = "/api/v1/thirdpartyrequests";
	}

	/// <summary>Health check endpoints.</summary>
	public static class Health
	{
		/// <summary>Base health endpoint.</summary>
		public const string Base = "/api/v1/health";

		/// <summary>Scheduled jobs status endpoint.</summary>
		public const string ScheduledJobs = "/api/v1/health/scheduled-jobs";
	}

	/// <summary>Altcha challenge endpoints.</summary>
	public static class Altcha
	{
		/// <summary>Challenge generation endpoint.</summary>
		public const string Challenge = "/api/v1/altcha/challenge";
	}

	/// <summary>Permission request endpoints (admin).</summary>
	public static class PermissionRequests
	{
		/// <summary>Base permission requests endpoint.</summary>
		public const string Base = "/api/v1/users/permission-requests";

		/// <summary>
		/// Gets approve endpoint for a permission request.
		/// </summary>
		/// <param name="id">
		/// The permission request ID.
		/// </param>
		/// <returns>
		/// The approve endpoint URL.
		/// </returns>
		public static string Approve(long id) => $"{Base}/{id}/approve";

		/// <summary>
		/// Gets reject endpoint for a permission request.
		/// </summary>
		/// <param name="id">
		/// The permission request ID.
		/// </param>
		/// <returns>
		/// The reject endpoint URL.
		/// </returns>
		public static string Reject(long id) => $"{Base}/{id}/reject";

		/// <summary>Bulk approve endpoint.</summary>
		public const string BulkApprove = "/api/v1/users/permission-requests/bulk/approve";

		/// <summary>Bulk reject endpoint.</summary>
		public const string BulkReject = "/api/v1/users/permission-requests/bulk/reject";
	}

	/// <summary>User role management endpoints.</summary>
	public static class UserRoles
	{
		/// <summary>
		/// Gets user roles endpoint.
		/// </summary>
		/// <param name="userId">
		/// The user ID.
		/// </param>
		/// <returns>
		/// The roles endpoint URL.
		/// </returns>
		public static string ById(long userId) => $"/api/v1/users/{userId}/roles";

		/// <summary>
		/// Gets add role endpoint.
		/// </summary>
		/// <param name="userId">
		/// The user ID.
		/// </param>
		/// <param name="role">
		/// The role name.
		/// </param>
		/// <returns>
		/// The add role endpoint URL.
		/// </returns>
		public static string AddRole(long userId, string role) =>
			$"/api/v1/users/{userId}/roles/{role}";

		/// <summary>
		/// Gets remove role endpoint.
		/// </summary>
		/// <param name="userId">
		/// The user ID.
		/// </param>
		/// <param name="role">
		/// The role name.
		/// </param>
		/// <returns>
		/// The remove role endpoint URL.
		/// </returns>
		public static string RemoveRole(long userId, string role) =>
			$"/api/v1/users/{userId}/roles/{role}";
	}
}