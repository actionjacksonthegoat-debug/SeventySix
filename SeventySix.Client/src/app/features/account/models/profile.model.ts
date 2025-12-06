/** Current user's profile data. Maps to UserProfileDto on server. */
export interface Profile
{
	id: number;
	username: string;
	email: string;
	fullName?: string;
	roles: string[];
	hasPassword: boolean;
	linkedProviders: string[];
	lastLoginAt?: string;
}

/** Request to update current user's profile. */
export interface UpdateProfileRequest
{
	email: string;
	fullName?: string;
}
