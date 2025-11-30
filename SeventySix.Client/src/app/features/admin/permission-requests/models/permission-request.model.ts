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
