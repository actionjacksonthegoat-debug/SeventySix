/**
 * User Test Fixtures
 * Centralized test data for User entities
 * Eliminates duplication across 7+ test files
 */

import { User } from "@admin/users/models";

/**
 * User fixture factory
 * Provides consistent test data across all user-related tests
 */
export class UserFixtures
{
	/**
	 * Standard test user - John Doe
	 * Active user with admin privileges
	 */
	static readonly JOHN_DOE: User = {
		id: 1,
		username: "john_doe",
		email: "john@example.com",
		fullName: "John Doe",
		createDate: "2024-01-01T00:00:00Z",
		isActive: true,
		createdBy: "admin",
		modifyDate: "2024-01-02T00:00:00Z",
		modifiedBy: "admin",
		lastLoginAt: "2024-01-03T00:00:00Z"
	};

	/**
	 * Standard test user - Jane Smith
	 * Inactive user for testing filter states
	 */
	static readonly JANE_SMITH: User = {
		id: 2,
		username: "jane_smith",
		email: "jane@example.com",
		fullName: "Jane Smith",
		createDate: "2024-01-02T00:00:00Z",
		isActive: false,
		createdBy: "system",
		modifyDate: "2024-01-03T00:00:00Z",
		modifiedBy: "system",
		lastLoginAt: "2024-01-04T00:00:00Z"
	};

	/**
	 * Create a custom user with optional overrides
	 * Uses JOHN_DOE as base template
	 *
	 * @param overrides - Partial user properties to override
	 * @returns User object with merged properties
	 *
	 * @example
	 * const inactiveUser = UserFixtures.createUser({ isActive: false });
	 * const adminUser = UserFixtures.createUser({ createdBy: 'admin' });
	 */
	static createUser(overrides?: Partial<User>): User
	{
		return { ...UserFixtures.JOHN_DOE, ...overrides };
	}

	/**
	 * Create multiple users with incremental IDs
	 * Useful for testing pagination and lists
	 *
	 * @param count - Number of users to create
	 * @returns Array of user objects
	 *
	 * @example
	 * const users = UserFixtures.createUsers(50); // For pagination tests
	 */
	static createUsers(count: number): User[]
	{
		return Array.from({ length: count }, (_, i) =>
			UserFixtures.createUser({
				id: i + 1,
				username: `user_${i + 1}`,
				email: `user${i + 1}@example.com`,
				fullName: `User ${i + 1}`
			})
		);
	}

	/**
	 * Get array of predefined test users
	 * Includes both active and inactive users
	 *
	 * @returns Array containing JOHN_DOE and JANE_SMITH
	 */
	static getAll(): User[]
	{
		return [UserFixtures.JOHN_DOE, UserFixtures.JANE_SMITH];
	}
}
