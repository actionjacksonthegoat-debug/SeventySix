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
 * Currently only 'github' is supported.
 * @type {OAuthProvider}
 */
export type OAuthProvider = "github";
