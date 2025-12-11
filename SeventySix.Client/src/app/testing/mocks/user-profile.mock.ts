/**
 * Test helpers for creating UserProfileDto mock data.
 * Provides default values matching the generated API types.
 */

import { UserProfileDto } from "@infrastructure/api";

/**
 * Creates a mock UserProfileDto with sensible defaults.
 * Override any fields as needed in your tests.
 */
export function createMockUserProfile(
	overrides?: Partial<UserProfileDto>
): UserProfileDto
{
	return {
		id: 1,
		username: "testuser",
		email: "test@example.com",
		fullName: "Test User",
		roles: [],
		hasPassword: true,
		linkedProviders: [],
		lastLoginAt: null,
		...overrides
	};
}
