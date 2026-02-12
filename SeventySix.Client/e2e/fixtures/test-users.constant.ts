// <copyright file="test-users.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Test user configuration for E2E authentication.
 * Matches seeded users in test database.
 */
export interface TestUser
{
	/**
	 * Username for login.
	 */
	readonly username: string;

	/**
	 * Password for login.
	 */
	readonly password: string;

	/**
	 * User's role in the system.
	 */
	readonly role: "User" | "Admin" | "Developer" | "MfaUser";

	/**
	 * Email address for the test user.
	 */
	readonly email: string;

	/**
	 * Whether MFA is enabled for this user.
	 */
	readonly mfaEnabled?: boolean;
}

/**
 * Seeded test users available in the E2E environment.
 * These users are created by the E2ETestSeeder in the API.
 */
export const TEST_USERS: readonly TestUser[] =
	[
		{
			username: "e2e_user",
			password: "E2E_User_Password_123!",
			role: "User",
			email: "e2e_user@test.local"
		},
		{
			username: "e2e_admin",
			password: "E2E_Admin_Password_123!",
			role: "Admin",
			email: "e2e_admin@test.local"
		},
		{
			username: "e2e_developer",
			password: "E2E_Developer_Password_123!",
			role: "Developer",
			email: "e2e_developer@test.local"
		},
		{
			username: "e2e_mfa_user",
			password: "E2E_Mfa_Password_123!",
			role: "MfaUser",
			email: "e2e_mfa_user@test.local",
			mfaEnabled: true
		}
	] as const;

/**
 * Test user with forced password change flag.
 * Seeded with RequiresPasswordChange = true for forced password change E2E tests.
 */
export const FORCE_PASSWORD_CHANGE_USER: TestUser =
	{
		username: "e2e_force_pw",
		password: "E2E_ForcePw_Password_123!",
		role: "User",
		email: "e2e_force_pw@test.local"
	} as const;

/**
 * Dedicated test user for password change flow E2E tests.
 * Separate from other users to avoid breaking shared auth state.
 */
export const PASSWORD_CHANGE_USER: TestUser =
	{
		username: "e2e_pw_change",
		password: "E2E_PwChange_Password_123!",
		role: "User",
		email: "e2e_pw_change@test.local"
	} as const;

/**
 * Dedicated test user for TOTP enrollment E2E tests.
 * Isolated so TOTP enable/disable doesn't affect shared auth state.
 */
export const TOTP_ENROLL_USER: TestUser =
	{
		username: "e2e_totp_enroll",
		password: "E2E_TotpEnroll_Password_123!",
		role: "User",
		email: "e2e_totp_enroll@test.local"
	} as const;

/**
 * Dedicated test user for forgot-password reset E2E tests.
 * Isolated from password-change user to prevent parallel security stamp conflicts.
 */
export const FORGOT_PASSWORD_USER: TestUser =
	{
		username: "e2e_forgot_pw",
		password: "E2E_ForgotPw_Password_123!",
		role: "User",
		email: "e2e_forgot_pw@test.local"
	} as const;

/**
 * Dedicated test user for account lockout E2E tests.
 * Isolated so failed login attempts don't affect other tests' shared users.
 */
export const LOCKOUT_USER: TestUser =
	{
		username: "e2e_lockout",
		password: "E2E_Lockout_Password_123!",
		role: "User",
		email: "e2e_lockout@test.local"
	} as const;

/**
 * Dedicated test user for concurrent session E2E tests.
 * Isolated so multi-context login doesn't conflict with shared auth state.
 */
export const CONCURRENT_USER: TestUser =
	{
		username: "e2e_concurrent",
		password: "E2E_Concurrent_Password_123!",
		role: "User",
		email: "e2e_concurrent@test.local"
	} as const;

/**
 * Dedicated test user for cross-tab logout E2E tests.
 * Isolated so logout in one context doesn't affect other parallel tests.
 */
export const CROSSTAB_USER: TestUser =
	{
		username: "e2e_crosstab",
		password: "E2E_CrossTab_Password_123!",
		role: "User",
		email: "e2e_crosstab@test.local"
	} as const;

/**
 * Known backup codes for the MFA test user.
 * Must match E2ESeederConstants.MfaBackupCodes in the server seeder.
 */
export const MFA_BACKUP_CODES: readonly string[] =
	["E2EBAK01", "E2EBAK02", "E2EBAK03", "E2EBAK04", "E2EBAK05"] as const;

/**
 * Gets test user by role.
 * @param role
 * The role to find.
 * @returns
 * The test user with the specified role.
 * @throws
 * Error if role not found.
 */
export function getTestUserByRole(role: TestUser["role"]): TestUser
{
	const foundUser: TestUser | undefined =
		TEST_USERS.find(
			(testUser) => testUser.role === role);

	if (!foundUser)
	{
		throw new Error(`Test user with role '${role}' not found`);
	}

	return foundUser;
}
