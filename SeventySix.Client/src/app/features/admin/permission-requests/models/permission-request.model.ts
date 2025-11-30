/**
 * Permission request models.
 * Matches backend DTO structures for API interop.
 */

/** Permission request from API. Matches backend PermissionRequestDto. */
export interface PermissionRequest
{
	id: number;
	userId: number;
	username: string;
	requestedRole: string;
	requestMessage?: string;
	createDate: string;
	createdBy: string;
}

/** Available role for permission request. Matches backend AvailableRoleDto. */
export interface AvailableRole
{
	name: string;
	description: string;
}

/** Create permission request DTO. Matches backend CreatePermissionRequestDto. */
export interface CreatePermissionRequestDto
{
	requestedRoles: string[];
	requestMessage?: string;
}
