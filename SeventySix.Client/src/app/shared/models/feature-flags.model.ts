/**
 * Feature flags returned by the API to gate client-side capabilities.
 * Reflects server-side settings — the client trusts this response and adjusts UI accordingly.
 */
export interface FeatureFlags
{
	/** Whether email/code-based MFA is enabled. */
	mfaEnabled: boolean;

	/** Whether TOTP (authenticator app) MFA is enabled. */
	totpEnabled: boolean;

	/** Whether OAuth social login is enabled. */
	oAuthEnabled: boolean;

	/** Names of configured OAuth providers (empty when OAuth is disabled). */
	oAuthProviders: string[];

	/** Whether ALTCHA proof-of-work bot protection is enabled. */
	altchaEnabled: boolean;

	/**
	 * Seconds before access token expiry at which the client should proactively refresh.
	 * Sourced from server-side JwtSettings so client refresh timing stays in sync with
	 * the server-configured token lifetime.
	 */
	tokenRefreshBufferSeconds: number;
}