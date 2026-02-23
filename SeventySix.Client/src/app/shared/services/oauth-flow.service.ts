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
import { POLL_INTERVAL, STORAGE_KEYS } from "@shared/constants";
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
				"oauth_popup");

		if (isNullOrUndefined(popup))
		{
			this.isOAuthInProgress.set(false);

			// Popup blocked — fall back to full-page navigation
			this.windowService.navigateTo(
				`${this.authUrl}/oauth/${provider}`);

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
				"oauth_link_popup");

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
		if (typeof window === "undefined")
		{
			return;
		}

		const oauthHandler: (event: MessageEvent) => void =
			(event: MessageEvent): void =>
			{
			// Validate origin matches our API
				const allowedOrigin: string =
					new URL(environment.apiUrl).origin;

				if (event.origin !== allowedOrigin)
				{
					return;
				}

				if (
					event.data?.type === "oauth_success"
						&& isPresent(event.data?.code))
				{
					this.clearPopupPollTimer();
					this.isOAuthInProgress.set(false);
					this.oauthEventsSubject.next(
						{
							type: "code_received",
							code: event.data.code as string
						});
				}

				if (event.data?.type === "oauth_link_success")
				{
					this.clearPopupPollTimer();
					this.isOAuthInProgress.set(false);
					this.oauthEventsSubject.next(
						{
							type: "link_success"
						});
				}
			};

		window.addEventListener("message", oauthHandler);

		this.destroyRef.onDestroy(
			() =>
			{
				window.removeEventListener("message", oauthHandler);
			});
	}
}