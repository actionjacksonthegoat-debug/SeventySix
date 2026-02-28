// <copyright file="FeatureFlagsResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Feature flags response for client-side feature detection.
/// </summary>
/// <param name="MfaEnabled">
/// Whether email/code-based MFA is enabled.
/// </param>
/// <param name="TotpEnabled">
/// Whether TOTP (authenticator app) MFA is enabled.
/// </param>
/// <param name="OAuthEnabled">
/// Whether OAuth social login is enabled.
/// </param>
/// <param name="OAuthProviders">
/// Names of configured OAuth providers (empty when OAuth is disabled).
/// </param>
/// <param name="AltchaEnabled">
/// Whether ALTCHA proof-of-work bot protection is enabled.
/// </param>
/// <param name="TokenRefreshBufferSeconds">
/// Seconds before access token expiry at which the client should proactively refresh.
/// Derived from server-side JWT settings so the client stays in sync with the token lifetime.
/// </param>
/// <param name="SiteEmail">
/// Public contact email shown on legal pages (Privacy Policy, Terms of Service).
/// Sourced from <c>Site:Email</c> configuration — never hardcoded.
/// </param>
public record FeatureFlagsResponse(
	bool MfaEnabled,
	bool TotpEnabled,
	bool OAuthEnabled,
	IReadOnlyList<string> OAuthProviders,
	bool AltchaEnabled,
	int TokenRefreshBufferSeconds,
	string SiteEmail);