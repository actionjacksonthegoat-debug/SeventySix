// <copyright file="query-params.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Query parameter name constants used in route navigation.
 */
export const QUERY_PARAMS: Readonly<{
	/** Return URL parameter for post-login/post-action redirects. */
	RETURN_URL: "returnUrl";
	/** Required flag parameter (e.g. required password change). */
	REQUIRED: "required";
}> =
	{
		RETURN_URL: "returnUrl",
		REQUIRED: "required"
	} as const;

/**
 * Query parameter value constants.
 */
export const QUERY_PARAM_VALUES: Readonly<{
	/** Boolean true as a query string value. */
	TRUE: "true";
}> =
	{
		TRUE: "true"
	} as const;