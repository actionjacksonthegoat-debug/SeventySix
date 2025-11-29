/**
 * Authentication models.
 * Defines types for login, OAuth, and user state.
 */

/**
 * Login credentials for local authentication.
 */
export interface LoginCredentials
{
	usernameOrEmail: string;
	password: string;
}

/**
 * Authentication response from API.
 */
export interface AuthResponse
{
	accessToken: string;
	expiresAt: string;
	/** Whether user must change password before using the app. */
	requiresPasswordChange: boolean;
}

/**
 * Authenticated user decoded from JWT.
 */
export interface AuthUser
{
	id: number;
	username: string;
	email: string;
	fullName: string | null;
	roles: string[];
}

/**
 * OAuth provider type.
 * GitHub only - add others when needed (YAGNI).
 */
export type OAuthProvider = "github";

/**
 * .NET ClaimTypes URI for role claims.
 * ASP.NET Core uses this full URI in JWT tokens.
 */
export const DOTNET_ROLE_CLAIM: string =
	"http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

/**
 * Standard JWT claims from .NET Identity.
 * Note: Role claims use the full .NET ClaimTypes URI as the key.
 */
export interface JwtClaims
{
	sub: string;
	unique_name: string;
	email: string;
	given_name?: string;
	exp: number;
	iat: number;
	jti: string;
	[key: string]: string | number | string[] | undefined;
}
