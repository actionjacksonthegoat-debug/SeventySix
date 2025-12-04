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
		/// <summary>Google user info endpoint URL.</summary>
		public const string GoogleUserInfo = "https://www.googleapis.com/oauth2/v2/userinfo";
	}
}
