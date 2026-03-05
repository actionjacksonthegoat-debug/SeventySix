// <copyright file="oauth-events.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Event types emitted by OAuthFlowService on the `events$` stream.
 * Used as discriminators in the OAuthEvent union type.
 */
export const OAUTH_FLOW_EVENT_TYPE: Readonly<{
	/** Server sent a one-time code for token exchange. */
	CODE_RECEIVED: "code_received";
	/** Account-linking flow completed successfully. */
	LINK_SUCCESS: "link_success";
	/** OAuth flow encountered an error. */
	ERROR: "error";
	/** Browser blocked the popup window. */
	POPUP_BLOCKED: "popup_blocked";
}> =
	{
		CODE_RECEIVED: "code_received",
		LINK_SUCCESS: "link_success",
		ERROR: "error",
		POPUP_BLOCKED: "popup_blocked"
	} as const;

/**
 * PostMessage types sent by the server OAuth callback page.
 * Only messages with these types are processed by OAuthFlowService.
 */
export const OAUTH_POSTMESSAGE_TYPE: Readonly<{
	/** Login flow succeeded — payload includes one-time code. */
	SUCCESS: "oauth_success";
	/** Account-link flow succeeded. */
	LINK_SUCCESS: "oauth_link_success";
	/** OAuth flow failed — payload includes error message. */
	ERROR: "oauth_error";
}> =
	{
		SUCCESS: "oauth_success",
		LINK_SUCCESS: "oauth_link_success",
		ERROR: "oauth_error"
	} as const;

/**
 * Window names used for OAuth popup windows.
 */
export const OAUTH_POPUP_NAME: Readonly<{
	/** Login flow popup. */
	LOGIN: "oauth_popup";
	/** Account-linking flow popup. */
	LINK: "oauth_link_popup";
}> =
	{
		LOGIN: "oauth_popup",
		LINK: "oauth_link_popup"
	} as const;