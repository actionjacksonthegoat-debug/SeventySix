/** Authenticated user decoded from JWT. */
export interface AuthUser
{
	id: number;
	username: string;
	email: string;
	fullName: string | null;
	roles: string[];
}
