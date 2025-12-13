// <copyright file="test-roles.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Test role constants for spec files.
 * Mirrors role.constants but in testing folder for test isolation.
 */

/** Developer role for test data creation. */
export const TEST_ROLE_DEVELOPER: string = "Developer";

/** Admin role for test data creation. */
export const TEST_ROLE_ADMIN: string = "Admin";

/** User role for test data creation. */
export const TEST_ROLE_USER: string = "User";

/** All test roles array. */
export const TEST_ROLES: readonly string[] =
	[
	TEST_ROLE_DEVELOPER,
	TEST_ROLE_ADMIN,
	TEST_ROLE_USER
] as const;
