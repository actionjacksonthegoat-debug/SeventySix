// <copyright file="auth-error.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * API error codes returned by auth endpoints.
 * Maps to server-side error codes from Identity domain.
 */
export const AUTH_ERROR_CODE: Readonly<
	{
		INVALID_TOKEN: "INVALID_TOKEN";
		TOKEN_EXPIRED: "TOKEN_EXPIRED";
		USERNAME_EXISTS: "USERNAME_EXISTS";
		BREACHED_PASSWORD: "BREACHED_PASSWORD";
	}> =
	{
		INVALID_TOKEN: "INVALID_TOKEN",
		TOKEN_EXPIRED: "TOKEN_EXPIRED",
		USERNAME_EXISTS: "USERNAME_EXISTS",
		BREACHED_PASSWORD: "BREACHED_PASSWORD"
	} as const;
