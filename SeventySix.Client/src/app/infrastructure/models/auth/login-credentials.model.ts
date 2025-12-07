/** Login credentials for local authentication. */
export interface LoginCredentials
{
	usernameOrEmail: string;
	password: string;
	/**
	 * Extends session duration (14 days vs 1 day) when user checks "Remember Me".
	 * Only enable on personal/trusted devices for security.
	 * @default false
	 */
	rememberMe?: boolean;
}
