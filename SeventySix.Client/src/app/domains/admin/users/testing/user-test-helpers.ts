import { UserDto } from "@admin/users/models";

/**
 * Creates a mock UserDto for testing purposes.
 * @param overrides - Optional partial UserDto to override default values
 * @returns A complete UserDto object with sensible defaults
 */
export function createMockUserDto(overrides: Partial<UserDto> = {}): UserDto
{
	return {
		id: 1,
		username: "testuser",
		email: "test@example.com",
		fullName: "Test User",
		createDate: "2024-01-01T00:00:00Z",
		isActive: true,
		createdBy: "system",
		modifiedBy: "system",
		needsPendingEmail: false,
		modifyDate: null,
		lastLoginAt: null,
		isDeleted: false,
		deletedAt: null,
		deletedBy: null,
		...overrides
	};
}
