/**
 * Profile Test Fixtures.
 * Centralized test data for account profile entities.
 * Eliminates duplication across account test files.
 */

import {
	AvailableRoleDto,
	CreatePermissionRequestDto,
	UpdateProfileRequest,
	UserProfileDto
} from "@account/models";

/**
 * User profile fixture factory.
 * Provides consistent test data for profile-related tests.
 */
export class ProfileFixtures
{
	/**
	 * Standard test user profile.
	 * Active user with standard permissions.
	 *
	 * @type {UserProfileDto}
	 */
	static readonly STANDARD_USER: UserProfileDto =
		{
			id: 1,
			username: "testuser",
			email: "test@example.com",
			fullName: "Test User",
			roles: ["User"],
			hasPassword: true,
			linkedProviders: [],
			lastLoginAt: "2024-01-15T12:00:00Z"
		};

	/**
	 * Admin user profile.
	 * User with admin role for permission tests.
	 *
	 * @type {UserProfileDto}
	 */
	static readonly ADMIN_USER: UserProfileDto =
		{
			id: 2,
			username: "adminuser",
			email: "admin@example.com",
			fullName: "Admin User",
			roles: ["User", "Admin"],
			hasPassword: true,
			linkedProviders: [],
			lastLoginAt: "2024-01-20T10:30:00Z"
		};

	/**
	 * OAuth-only user profile.
	 * User without password, linked via provider.
	 *
	 * @type {UserProfileDto}
	 */
	static readonly OAUTH_USER: UserProfileDto =
		{
			id: 3,
			username: "oauthuser",
			email: "oauth@example.com",
			fullName: "OAuth User",
			roles: ["User"],
			hasPassword: false,
			linkedProviders: ["Google"],
			lastLoginAt: "2024-01-22T14:45:00Z"
		};

	/**
	 * Create a custom user profile with optional overrides.
	 *
	 * @param {Partial<UserProfileDto>} overrides
	 * Partial profile properties to override.
	 * @returns {UserProfileDto}
	 * User profile with merged properties.
	 *
	 * @example
	 * const developerUser = ProfileFixtures.create({ roles: ["User", "Developer"] });
	 */
	static create(overrides?: Partial<UserProfileDto>): UserProfileDto
	{
		return { ...ProfileFixtures.STANDARD_USER, ...overrides };
	}
}

/**
 * Update profile request fixture factory.
 * Provides test data for profile update operations.
 */
export class UpdateProfileFixtures
{
	/**
	 * Standard valid update request.
	 *
	 * @type {UpdateProfileRequest}
	 */
	static readonly VALID_REQUEST: UpdateProfileRequest =
		{
			fullName: "Updated Name",
			email: "updated@example.com"
		};

	/**
	 * Create a custom update request with optional overrides.
	 *
	 * @param {Partial<UpdateProfileRequest>} overrides
	 * Partial update request properties to override.
	 * @returns {UpdateProfileRequest}
	 * Update request with merged properties.
	 */
	static create(overrides?: Partial<UpdateProfileRequest>): UpdateProfileRequest
	{
		return { ...UpdateProfileFixtures.VALID_REQUEST, ...overrides };
	}
}

/**
 * Available role fixture factory.
 * Provides test data for permission request flows.
 */
export class AvailableRoleFixtures
{
	/**
	 * Admin role.
	 *
	 * @type {AvailableRoleDto}
	 */
	static readonly ADMIN: AvailableRoleDto =
		{
			name: "Admin",
			description: "Administrator access"
		};

	/**
	 * Developer role.
	 *
	 * @type {AvailableRoleDto}
	 */
	static readonly DEVELOPER: AvailableRoleDto =
		{
			name: "Developer",
			description: "Developer access"
		};

	/**
	 * Get array of all predefined roles.
	 *
	 * @returns {AvailableRoleDto[]}
	 * Array of available roles.
	 */
	static getAll(): AvailableRoleDto[]
	{
		return [
			AvailableRoleFixtures.ADMIN,
			AvailableRoleFixtures.DEVELOPER
		];
	}
}

/**
 * Permission request fixture factory.
 * Provides test data for creating permission requests.
 */
export class PermissionRequestFixtures
{
	/**
	 * Standard valid permission request.
	 *
	 * @type {CreatePermissionRequestDto}
	 */
	static readonly VALID_REQUEST: CreatePermissionRequestDto =
		{
			requestedRoles: ["Developer"],
			requestMessage: "Need developer access for project work"
		};

	/**
	 * Create a custom permission request with optional overrides.
	 *
	 * @param {Partial<CreatePermissionRequestDto>} overrides
	 * Partial permission request properties to override.
	 * @returns {CreatePermissionRequestDto}
	 * Permission request with merged properties.
	 */
	static create(overrides?: Partial<CreatePermissionRequestDto>): CreatePermissionRequestDto
	{
		return { ...PermissionRequestFixtures.VALID_REQUEST, ...overrides };
	}
}