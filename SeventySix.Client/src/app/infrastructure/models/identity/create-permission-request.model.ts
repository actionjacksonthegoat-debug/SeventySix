/**
 * Request payload for creating a permission/role request.
 * Used by account (self-request) and admin (on-behalf request).
 * Maps to server CreatePermissionRequestDto.
 */
export interface CreatePermissionRequest
{
	requestedRoles: string[];
	requestMessage?: string;
}
