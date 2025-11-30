/** Authentication response from API. */
export interface AuthResponse
{
	accessToken: string;
	expiresAt: string;
	/** Whether user must change password before using the app. */
	requiresPasswordChange: boolean;
}
