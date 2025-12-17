// <copyright file="OAuthProviderConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Constants for OAuth provider names and endpoints.
/// </summary>
public static class OAuthProviderConstants
{
	/// <summary>GitHub OAuth provider name.</summary>
	public const string GitHub = "GitHub";

	/// <summary>Google OAuth provider name.</summary>
	public const string Google = "Google";

	/// <summary>
	/// OAuth provider endpoint URLs.
	/// </summary>
	public static class Endpoints
	{
		/// <summary>GitHub user API endpoint URL.</summary>
		public const string GitHubUserApi = "https://api.github.com/user";

		/// <summary>Google user info endpoint URL.</summary>
		public const string GoogleUserInfo =
			"https://www.googleapis.com/oauth2/v2/userinfo";
	}

	/// <summary>
	/// OAuth error messages.
	/// </summary>
	public static class ErrorMessages
	{
		/// <summary>GitHub OAuth provider not configured error message.</summary>
		public const string GitHubNotConfigured =
			"GitHub OAuth provider is not configured.";

		/// <summary>GitHub OAuth disabled error message.</summary>
		public const string GitHubOAuthDisabled =
			"GitHub OAuth is not configured.";

		/// <summary>GitHub authentication failed error message.</summary>
		public const string GitHubAuthenticationFailed =
			"GitHub authentication failed.";

		/// <summary>GitHub OAuth callback failed log message.</summary>
		public const string GitHubCallbackFailed =
			"GitHub OAuth callback failed.";
	}

	/// <summary>
	/// OAuth-related audit values.
	/// </summary>
	public static class AuditValues
	{
		/// <summary>GitHub OAuth created by value.</summary>
		public const string GitHubOAuthCreatedBy = "GitHub OAuth";

		/// <summary>Placeholder email domain for GitHub users without public email.</summary>
		public const string GitHubPlaceholderEmailDomain =
			"@github.placeholder";
	}
}