/**
 * OAuth popup flow service.
 * Manages OAuth popup lifecycle, message listener, and emits events for AuthService to handle.
 *
 * Separation of Concerns:
 * - This service handles popup mechanics (open, poll, close) and the cross-window message protocol.
 * - AuthService subscribes to `events$` to perform token exchange and state updates.
 * - No circular dependency: OAuthFlowService does not inject AuthService.
 */

import {
	DestroyRef,
	inject,
	Injectable,
	signal,
	WritableSignal
} from "@angular/core";
import { environment } from "@environments/environment";
import {
	HTTP_PROTOCOL_PREFIX,
	OAUTH_FLOW_EVENT_TYPE,
	OAUTH_POPUP_NAME,
	OAUTH_POSTMESSAGE_TYPE,
	POLL_INTERVAL,
	STORAGE_KEYS,
	TYPEOF_RESULT
} from "@shared/constants";
import { StorageService, WindowService } from "@shared/services";
import { OAuthEvent, OAuthProvider } from "@shared/services/auth.types";
import { isNullOrUndefined, isPresent } from "@shared/utilities/null-check.utility";
import { sanitizeReturnUrl } from "@shared/utilities/url.utility";
import {
	Observable,
	Subject
} from "rxjs";

/**
 * Manages OAuth popup flow mechanics and cross-window message handling.
 * Emits `events$` when an OAuth popup flow completes.
 * AuthService subscribes to `events$` for token exchange and state updates.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class OAuthFlowService
{
	private readonly windowService: WindowService =
		inject(WindowService);

	private readonly storageService: StorageService =
		inject(StorageService);

	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	private readonly authUrl: string =
		`${environment.apiUrl}/auth`;

	/** Tracks whether an OAuth popup flow is in progress (login or link). */
	readonly isOAuthInProgress: WritableSignal<boolean> =
		signal<boolean>(false);

	/** Poll timer that detects when the user closes the OAuth popup. */
	private activePopupPollTimer: ReturnType<typeof setInterval> | undefined;

	private readonly oauthEventsSubject: Subject<OAuthEvent> =
		new Subject<OAuthEvent>();

	/**
	 * Emits when an OAuth popup flow completes.
	 * AuthService subscribes to handle token exchange and auth state updates.
	 */
	readonly events$: Observable<OAuthEvent> =
		this.oauthEventsSubject.asObservable();

	constructor()
	{
		this.initializeOAuthMessageListener();

		this.destroyRef.onDestroy(
			(): void =>
			{
				this.clearPopupPollTimer();
				this.isOAuthInProgress.set(false);
			});
	}

	/**
	 * Opens an OAuth provider popup window for the login flow.
	 * Validates the return URL before storing it.
	 * Falls back to full-page navigation if the popup is blocked.
	 * @param {OAuthProvider} provider
	 * The OAuth provider to use.
	 * @param {string} returnUrl
	 * Return URL after successful OAuth (default: '/').
	 * @returns {void}
	 */
	openLoginPopup(
		provider: OAuthProvider,
		returnUrl: string = "/"): void
	{
		const validatedUrl: string =
			sanitizeReturnUrl(returnUrl);

		this.storageService.setSessionItem(
			STORAGE_KEYS.AUTH_RETURN_URL,
			validatedUrl);

		this.isOAuthInProgress.set(true);

		const popup: Window | null =
			this.windowService.openWindow(
				`${this.authUrl}/oauth/${provider}`,
				OAUTH_POPUP_NAME.LOGIN);

		if (isNullOrUndefined(popup))
		{
			this.isOAuthInProgress.set(false);

			// Popup blocked — emit error event instead of navigating away.
			// Full-page navigation leaves the user on a dead HTML page
			// because the server's postMessage response has no opener.
			this.oauthEventsSubject.next(
				{
					type: OAUTH_FLOW_EVENT_TYPE.ERROR,
					error: OAUTH_FLOW_EVENT_TYPE.POPUP_BLOCKED
				});

			return;
		}

		this.startPopupPollTimer(popup);
	}

	/**
	 * Opens an OAuth provider popup window for the account-linking flow.
	 * @param {string} authorizationUrl
	 * The provider authorization URL obtained from the link endpoint.
	 * @returns {void}
	 */
	openLinkPopup(authorizationUrl: string): void
	{
		this.isOAuthInProgress.set(true);

		const popup: Window | null =
			this.windowService.openWindow(
				authorizationUrl,
				OAUTH_POPUP_NAME.LINK);

		if (isNullOrUndefined(popup))
		{
			this.isOAuthInProgress.set(false);
			return;
		}

		this.startPopupPollTimer(popup);
	}

	/**
	 * Starts a poll timer that detects when the user closes the OAuth popup.
	 * Clears `isOAuthInProgress` when the popup is closed without completing the flow.
	 * @param {Window} popup
	 * The popup window reference.
	 * @returns {void}
	 */
	private startPopupPollTimer(popup: Window): void
	{
		this.clearPopupPollTimer();

		this.activePopupPollTimer =
			setInterval(
				(): void =>
				{
					if (popup.closed)
					{
						this.clearPopupPollTimer();
						this.isOAuthInProgress.set(false);
					}
				},
				POLL_INTERVAL.POPUP_CLOSED);
	}

	/**
	 * Clears the popup poll timer and resets the OAuth-in-progress state.
	 * @returns {void}
	 */
	private clearPopupPollTimer(): void
	{
		if (isPresent(this.activePopupPollTimer))
		{
			clearInterval(this.activePopupPollTimer);
			this.activePopupPollTimer = undefined;
		}
	}

	/**
	 * Listens for OAuth postMessage from the popup window.
	 * Emits on `events$` when the server sends oauth_success with a one-time code
	 * or oauth_link_success for account-linking flows.
	 * @returns {void}
	 */
	private initializeOAuthMessageListener(): void
	{
		if (typeof window === TYPEOF_RESULT.UNDEFINED)
		{
			return;
		}

		const oauthHandler: (event: MessageEvent) => void =
			(event: MessageEvent): void =>
			{
				if (this.isValidOAuthOrigin(event.origin))
				{
					this.handleOAuthMessage(event.data);
				}
			};

		window.addEventListener("message", oauthHandler);

		this.destroyRef.onDestroy(
			() =>
			{
				window.removeEventListener("message", oauthHandler);
			});
	}

	/**
	 * Validates whether a message origin matches the API server origin.
	 * @param {string} origin
	 * The origin from the MessageEvent.
	 * @returns {boolean}
	 * True if the origin is allowed.
	 * @private
	 */
	private isValidOAuthOrigin(origin: string): boolean
	{
		// Guard against relative apiUrl (production uses '/api/v1') which would
		// throw 'TypeError: Invalid URL' inside new URL(). Fall back to the
		// current window origin when the URL is relative.
		const allowedOrigin: string =
			environment.apiUrl.startsWith(HTTP_PROTOCOL_PREFIX)
				? new URL(environment.apiUrl).origin
				: window.location.origin;

		return origin === allowedOrigin;
	}

	/**
	 * Allowlist of valid OAuth postMessage types.
	 * Only messages whose `type` field matches one of these values are
	 * processed. This prevents user-controlled payloads from bypassing
	 * the security check — CodeQL "User-controlled bypass of security check".
	 */
	private static readonly VALID_OAUTH_MESSAGE_TYPES: ReadonlySet<string> =
		new Set<string>(
			[OAUTH_POSTMESSAGE_TYPE.SUCCESS, OAUTH_POSTMESSAGE_TYPE.LINK_SUCCESS, OAUTH_POSTMESSAGE_TYPE.ERROR]);

	/**
	 * Processes a validated OAuth postMessage payload.
	 * The message type is checked against an explicit allowlist before
	 * dispatching to prevent user-controlled bypass (CodeQL High).
	 * @param {Record<string, unknown>} data
	 * The message event data.
	 * @private
	 */
	private handleOAuthMessage(
		data: Record<string, unknown>): void
	{
		const rawType: unknown =
			data?.["type"];

		// Validate that the message type is a string and belongs to the
		// known allowlist before using it for any security-sensitive branching.
		if (
			typeof rawType !== "string"
				|| !OAuthFlowService.VALID_OAUTH_MESSAGE_TYPES.has(rawType))
		{
			return;
		}

		// `validatedType` is now a known-good value from the allowlist.
		const validatedType: string = rawType;

		if (
			validatedType === OAUTH_POSTMESSAGE_TYPE.SUCCESS
				&& isPresent(data?.["code"]))
		{
			this.completeOAuthFlow(
				{
					type: OAUTH_FLOW_EVENT_TYPE.CODE_RECEIVED,
					code: data["code"] as string
				});
		}
		else if (validatedType === OAUTH_POSTMESSAGE_TYPE.LINK_SUCCESS)
		{
			this.completeOAuthFlow(
				{
					type: OAUTH_FLOW_EVENT_TYPE.LINK_SUCCESS
				});
		}
		else if (validatedType === OAUTH_POSTMESSAGE_TYPE.ERROR)
		{
			this.completeOAuthFlow(
				{
					type: "error",
					error: (data?.["error"] as string)
						?? "OAuth login failed"
				});
		}
	}

	/**
	 * Clears popup state and emits an OAuth event.
	 * @param {OAuthEvent} event
	 * The event to emit.
	 * @private
	 */
	private completeOAuthFlow(event: OAuthEvent): void
	{
		this.clearPopupPollTimer();
		this.isOAuthInProgress.set(false);
		this.oauthEventsSubject.next(event);
	}
}