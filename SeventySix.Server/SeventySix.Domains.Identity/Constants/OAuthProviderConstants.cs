// <copyright file="OAuthProviderConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Constants for OAuth provider names, endpoints, and error messages.
/// </summary>
public static class OAuthProviderConstants
{
	/// <summary>
	/// GitHub OAuth provider name.
	/// </summary>
	public const string GitHub = "GitHub";

	/// <summary>
	/// Google OAuth provider name.
	/// </summary>
	public const string Google = "Google";

	/// <summary>
	/// Default placeholder email domain format for OAuth users without public email.
	/// </summary>
	private const string PlaceholderEmailDomainSuffix = ".oauth.placeholder";

	/// <summary>
	/// Gets the placeholder email domain for a given provider.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name.
	/// </param>
	/// <returns>
	/// A placeholder email domain (e.g., "@github.oauth.placeholder").
	/// </returns>
	public static string GetPlaceholderEmailDomain(string provider) =>
		$"@{provider.ToLowerInvariant()}{PlaceholderEmailDomainSuffix}";

	/// <summary>
	/// Gets the audit source string for a given provider.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name.
	/// </param>
	/// <returns>
	/// An audit source string (e.g., "GitHub OAuth").
	/// </returns>
	public static string GetAuditSource(string provider) =>
		$"{provider} OAuth";

	/// <summary>
	/// OAuth provider endpoint URLs.
	/// </summary>
	public static class Endpoints
	{
		/// <summary>
		/// GitHub user API endpoint URL.
		/// </summary>
		public const string GitHubUserApi = "https://api.github.com/user";

		/// <summary>
		/// Google user info endpoint URL.
		/// </summary>
		public const string GoogleUserInfo =
			"https://www.googleapis.com/oauth2/v2/userinfo";
	}

	/// <summary>
	/// GitHub-specific JSON property names from the user API response.
	/// </summary>
	public static class GitHubJsonProperties
	{
		/// <summary>
		/// The access token property name.
		/// </summary>
		public const string AccessToken = "access_token";

		/// <summary>
		/// The user ID property name.
		/// </summary>
		public const string Id = "id";

		/// <summary>
		/// The username property name.
		/// </summary>
		public const string Login = "login";

		/// <summary>
		/// The email property name.
		/// </summary>
		public const string Email = "email";

		/// <summary>
		/// The display name property name.
		/// </summary>
		public const string Name = "name";

		/// <summary>
		/// The avatar URL property name.
		/// </summary>
		public const string AvatarUrl = "avatar_url";
	}

	/// <summary>
	/// HTTP user agent values for OAuth API calls.
	/// </summary>
	public static class UserAgent
	{
		/// <summary>
		/// Product name for User-Agent header.
		/// </summary>
		public const string ProductName = "SeventySix";

		/// <summary>
		/// Product version for User-Agent header.
		/// </summary>
		public const string ProductVersion = "1.0";
	}

	/// <summary>
	/// HTTP authentication scheme constants.
	/// </summary>
	public static class AuthScheme
	{
		/// <summary>
		/// Bearer token authentication scheme.
		/// </summary>
		public const string Bearer = "Bearer";
	}

	/// <summary>
	/// Provider-agnostic OAuth error messages.
	/// </summary>
	public static class ErrorMessages
	{
		/// <summary>
		/// Gets the error message for a provider that is not configured.
		/// </summary>
		/// <param name="provider">
		/// The OAuth provider name.
		/// </param>
		/// <returns>
		/// Error message string.
		/// </returns>
		public static string ProviderNotConfigured(string provider) =>
			$"OAuth provider '{provider}' is not configured.";

		/// <summary>
		/// Gets the error message for a failed authentication.
		/// </summary>
		/// <param name="provider">
		/// The OAuth provider name.
		/// </param>
		/// <returns>
		/// Error message string.
		/// </returns>
		public static string AuthenticationFailed(string provider) =>
			$"{provider} authentication failed.";

		/// <summary>
		/// Gets the log message for a failed OAuth callback.
		/// </summary>
		/// <param name="provider">
		/// The OAuth provider name.
		/// </param>
		/// <returns>
		/// Log message string.
		/// </returns>
		public static string CallbackFailed(string provider) =>
			$"{provider} OAuth callback failed.";

		/// <summary>
		/// Error message when external login is already linked to another user.
		/// </summary>
		public const string ExternalLoginAlreadyLinked =
			"This external account is already linked to another user.";

		/// <summary>
		/// Error message when unlinking would lock out the user.
		/// </summary>
		public const string CannotUnlinkLastAuthMethod =
			"Cannot disconnect the only authentication method. Set a password first or link another provider.";

		/// <summary>
		/// Error message when an external login is not found for unlinking.
		/// </summary>
		public const string ExternalLoginNotFound =
			"External login not found for this provider.";

		/// <summary>
		/// Error message when OAuth state validation fails.
		/// </summary>
		public const string InvalidOAuthState =
			"Invalid OAuth state";

		/// <summary>
		/// Error message when PKCE code verifier is missing.
		/// </summary>
		public const string MissingCodeVerifier =
			"Missing code verifier";

		/// <summary>
		/// Error message when no access token is found in the provider response.
		/// </summary>
		public const string NoAccessTokenInResponse =
			"No access_token in response";

		/// <summary>
		/// Error message when account linking fails (safe for ProblemDetails).
		/// </summary>
		public const string FailedToLinkAccount =
			"Failed to link account.";
	}
}