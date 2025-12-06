// <copyright file="role.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Role constant strings matching server-side RoleConstants.
 * Used for role-based access control throughout the application.
 */

/** Developer role - highest privilege level. */
export const ROLE_DEVELOPER: string = "Developer";

/** Admin role - administrative privileges. */
export const ROLE_ADMIN: string = "Admin";

/** User role - standard user privileges. */
export const ROLE_USER: string = "User";

/** All valid roles in the system. */
export const ALL_ROLES: readonly string[] = [
	ROLE_DEVELOPER,
	ROLE_ADMIN,
	ROLE_USER
] as const;

/** Roles that can be requested by users via permission requests. */
export const REQUESTABLE_ROLES: readonly string[] = [
	ROLE_DEVELOPER,
	ROLE_ADMIN
] as const;
