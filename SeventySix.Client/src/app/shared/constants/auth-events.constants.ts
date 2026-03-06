// <copyright file="auth-events.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * BroadcastChannel name for cross-tab auth coordination.
 */
export const BROADCAST_CHANNEL_NAME: string = "seventysix_auth_refresh";

/**
 * Message types sent over the auth BroadcastChannel.
 */
export const BROADCAST_MESSAGE_TYPE: Readonly<{
	/** Signals that a tab successfully refreshed its token. */
	TOKEN_REFRESHED: "token_refreshed";
	/** Signals that a tab logged out (token family revoked). */
	LOGOUT: "logout";
}> =
	{
		TOKEN_REFRESHED: "token_refreshed",
		LOGOUT: "logout"
	} as const;