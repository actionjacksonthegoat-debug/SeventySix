// <copyright file="test-users.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Test user constants for spec files.
 * Centralized test data to prevent DRY violations.
 */

/** Default test email for user creation. */
export const TEST_EMAIL: string = "test@example.com";

/** Default test username. */
export const TEST_USERNAME: string = "testuser";

/** Default test password. */
export const TEST_PASSWORD: string = "TestPassword123!";

/** System user for audit fields. */
export const TEST_SYSTEM_USER: string = "System";

/** Admin user for test scenarios. */
export const TEST_ADMIN_USER: string = "admin";

/** Updated email for testing email changes. */
export const TEST_UPDATED_EMAIL: string = "updated@example.com";

/** User-specific test emails. */
export const TEST_USER_EMAILS: {
	readonly USER_1: string;
	readonly USER_2: string;
} =
	{
		USER_1: "user1@example.com",
		USER_2: "user2@example.com"
	} as const;