/**
 * Internal auth types used by AuthService.
 * These are implementation details, not exported from @shared/services.
 */

/**
 * .NET ClaimTypes URI for role claims.
 * ASP.NET Core uses this full URI in JWT tokens.
 * @type {string}
 */
export const DOTNET_ROLE_CLAIM: string = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

/**
 * Standard JWT claims from .NET Identity.
 * Represents the minimal claims used in tests and token parsing.
 */
export interface JwtClaims
{
	/**
	 * Subject identifier (user id).
	 * @type {string}
	 */
	sub: string;

	/**
	 * Username or unique name claim.
	 * @type {string}
	 */
	unique_name: string;

	/**
	 * Expiration time (epoch seconds).
	 * @type {number}
	 */
	exp: number;

	/**
	 * Issued-at time (epoch seconds).
	 * @type {number}
	 */
	iat: number;

	/**
	 * JWT ID (unique token id).
	 * @type {string}
	 */
	jti: string;

	/**
	 * Additional claims by key.
	 * @type {string | number | string[] | undefined}
	 */
	[key: string]: string | number | string[] | undefined;
}

/**
 * OAuth provider type.
 * Add new providers here as they are supported.
 * @type {OAuthProvider}
 */
export type OAuthProvider = "github";

/**
 * Metadata for rendering OAuth provider buttons.
 * @interface OAuthProviderMetadata
 */
export interface OAuthProviderMetadata
{
	/** Provider identifier matching the route parameter. */
	readonly id: OAuthProvider;

	/** Human-readable display name. */
	readonly displayName: string;

	/** Material icon name or registered SVG icon name. */
	readonly icon: string;

	/** Brand color for the button. */
	readonly color: string;
}

/**
 * Configured OAuth providers with UI metadata.
 * Adding a new provider: update OAuthProvider type above + add entry here.
 * @type {readonly OAuthProviderMetadata[]}
 */
export const OAUTH_PROVIDERS: readonly OAuthProviderMetadata[] =
	[
		{
			id: "github",
			displayName: "GitHub",
			icon: "github",
			color: "#24292e"
		}
	] as const;

/**
 * Server response for linked external login.
 * Matches SeventySix.Identity.ExternalLoginDto.
 * @interface ExternalLoginDto
 */
export interface ExternalLoginDto
{
	readonly provider: string;
	readonly providerDisplayName: string;
}

/**
 * Finds provider metadata by ID.
 * @param {OAuthProvider} provider
 * The provider ID to look up.
 * @returns {OAuthProviderMetadata | undefined}
 * The metadata or undefined if not found.
 */
export function getProviderMetadata(
	provider: OAuthProvider): OAuthProviderMetadata | undefined
{
	return OAUTH_PROVIDERS.find(
		(metadata: OAuthProviderMetadata) =>
			metadata.id === provider);
}