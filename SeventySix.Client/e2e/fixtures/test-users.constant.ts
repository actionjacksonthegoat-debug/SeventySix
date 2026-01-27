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
	readonly role: "User" | "Admin" | "Developer";

	/**
	 * Email address for the test user.
	 */
	readonly email: string;
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
		}
	] as const;

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
