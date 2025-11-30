/**
 * .NET ClaimTypes URI for role claims.
 * ASP.NET Core uses this full URI in JWT tokens.
 */
export const DOTNET_ROLE_CLAIM: string =
	"http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

/** Standard JWT claims from .NET Identity. */
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
