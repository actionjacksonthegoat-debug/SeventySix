// <copyright file="http-status.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * HTTP status code constants for readable error handling.
 * Named for semantic clarity in conditional logic.
 */
export const HTTP_STATUS: Readonly<
	{
		NETWORK_ERROR: 0;
		BAD_REQUEST: 400;
		UNAUTHORIZED: 401;
		FORBIDDEN: 403;
		NOT_FOUND: 404;
		CONFLICT: 409;
		INTERNAL_SERVER_ERROR: 500;
		BAD_GATEWAY: 502;
		SERVICE_UNAVAILABLE: 503;
	}> =
	{
		NETWORK_ERROR: 0,
		BAD_REQUEST: 400,
		UNAUTHORIZED: 401,
		FORBIDDEN: 403,
		NOT_FOUND: 404,
		CONFLICT: 409,
		INTERNAL_SERVER_ERROR: 500,
		BAD_GATEWAY: 502,
		SERVICE_UNAVAILABLE: 503
	} as const;