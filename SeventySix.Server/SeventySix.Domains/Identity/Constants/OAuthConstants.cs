// <copyright file="OAuthConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Constants for OAuth configuration.
/// Single source of truth for OAuth timing and cookie settings (DRY).
/// </summary>
public static class OAuthConstants
{
	/// <summary>
	/// State cookie expiration in minutes.
	/// OAuth state cookies should expire quickly to prevent replay attacks.
	/// </summary>
	public const int StateCookieExpirationMinutes = 5;

	/// <summary>
	/// Code verifier cookie expiration in minutes (PKCE flow).
	/// Matches state cookie expiration for consistent OAuth flow timing.
	/// </summary>
	public const int CodeVerifierCookieExpirationMinutes = 5;
}
