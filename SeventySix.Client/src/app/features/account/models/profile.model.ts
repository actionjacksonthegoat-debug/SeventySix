/** Current user's profile data. Maps to UserProfileDto on server. */
export interface Profile
{
	id: number;
	username: string;
	email: string;
	fullName?: string;
	createDate: string;
	roles: string[];
}

/** Request to update current user's profile. */
export interface UpdateProfileRequest
{
	email: string;
	fullName?: string;
}
