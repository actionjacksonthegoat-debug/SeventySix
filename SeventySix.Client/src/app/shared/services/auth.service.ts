/**
 * Authentication service.
 * Manages local and OAuth login flows with in-memory token storage.
 *
 * Security Design:
 * - Access tokens stored in memory only (not localStorage) for XSS protection
 * - Refresh tokens stored in HTTP-only cookies by the server
 * - Token refresh handled transparently by auth interceptor
 *
 * Implementation Note:
 * Auth services use HttpClient directly (not ApiService) because:
 * 1. Requires withCredentials for HTTP-only cookie refresh tokens
 * 2. Uses Observable-based patterns for login flows
 * 3. Has domain-specific error handling via auth-error.utility.ts
 */

import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
	computed,
	DestroyRef,
	effect,
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "@environments/environment";
import { APP_ROUTES, POLL_INTERVAL, STORAGE_KEYS } from "@shared/constants";
import {
	AuthResponse,
	LoginRequest,
	UserProfileDto
} from "@shared/models";
import { DateService, StorageService, TokenService, WindowService } from "@shared/services";
import {
	JwtClaims,
	OAuthProvider
} from "@shared/services/auth.types";
import { FeatureFlagsService } from "@shared/services/feature-flags.service";
import { IdleDetectionService } from "@shared/services/idle-detection.service";
import { isNullOrEmpty, isNullOrUndefined, isPresent } from "@shared/utilities/null-check.utility";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import { QueryClient } from "@tanstack/angular-query-experimental";
import {
	catchError,
	finalize,
	Observable,
	of,
	shareReplay,
	tap
} from "rxjs";

/**
 * Provides authentication flows (local and OAuth), session restoration, and in-memory token management.
 * Handles access token lifecycle and integrates with the auth interceptor for transparent refresh behavior.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class AuthService
{
	private readonly httpClient: HttpClient =
		inject(HttpClient);

	private readonly router: Router =
		inject(Router);

	private readonly dateService: DateService =
		inject(DateService);

	private readonly storageService: StorageService =
		inject(StorageService);

	private readonly tokenService: TokenService =
		inject(TokenService);

	private readonly windowService: WindowService =
		inject(WindowService);

	private readonly idleDetectionService: IdleDetectionService =
		inject(IdleDetectionService);

	private readonly featureFlagsService: FeatureFlagsService =
		inject(FeatureFlagsService);

	/** Clears cached queries on logout to prevent data leakage between users. */
	private readonly queryClient: QueryClient =
		inject(QueryClient);

	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	private readonly authUrl: string =
		`${environment.apiUrl}/auth`;

	/** Tracks whether an OAuth popup flow is in progress (login or link). */
	readonly isOAuthInProgress: WritableSignal<boolean> =
		signal<boolean>(false);

	/** Access token stored in memory only for XSS protection. */
	private accessToken: string | null = null;

	private tokenExpiresAt: number = 0;

	private initialized: boolean = false;

	/** Poll timer that detects when the user closes the OAuth popup. */
	private activePopupPollTimer: ReturnType<typeof setInterval> | undefined;

	/** In-flight refresh observable for single-flight pattern. */
	private refreshInProgress: Observable<AuthResponse | null> | null = null;

	private readonly userSignal: WritableSignal<UserProfileDto | null> =
		signal<UserProfileDto | null>(null);

	private readonly requiresPasswordChangeSignal: WritableSignal<boolean> =
		signal<boolean>(false);

	/** Read-only user state. */
	readonly user: Signal<UserProfileDto | null> =
		this.userSignal.asReadonly();

	/** Read-only password change requirement state. */
	readonly requiresPasswordChange: Signal<boolean> =
		this.requiresPasswordChangeSignal.asReadonly();

	/** Computed authentication state. */
	readonly isAuthenticated: Signal<boolean> =
		computed(
			() => this.userSignal() !== null);

	constructor()
	{
		/** Watches idle signal and triggers inactivity logout. */
		effect(
			() =>
			{
				if (this.idleDetectionService.isIdle())
				{
					this.handleInactivityLogout();
				}
			});

		this.destroyRef.onDestroy(
			(): void =>
			{
				this.clearPopupPollTimer();
			});
	}

	/**
	 * Initializes the service: handles OAuth callback and restores session.
	 * Call this from APP_INITIALIZER. Only runs once per app lifecycle.
	 * @returns {Observable<AuthResponse|null>}
	 * Observable that completes when initialization is done.
	 */
	initialize(): Observable<AuthResponse | null>
	{
		// Only run once - prevent repeated refresh attempts on navigation
		if (this.initialized)
		{
			return of(null);
		}
		this.initialized = true;

		this.initializeCrossTabLogout();
		this.initializeOAuthMessageListener();

		// Only attempt session restoration if user has logged in before
		// This prevents unnecessary refresh attempts for users who never logged in
		if (!this.hasExistingSession())
		{
			return of(null);
		}

		// Try to restore session using refresh token cookie
		// This handles page refresh without requiring re-login
		return this.refreshToken();
	}

	/**
	 * Local username/password login.
	 * @param {LoginRequest} credentials
	 * The login request payload.
	 * @returns {Observable<AuthResponse>}
	 * Observable that emits AuthResponse on success or MFA required.
	 */
	login(credentials: LoginRequest): Observable<AuthResponse>
	{
		return this
			.httpClient
			.post<AuthResponse>(`${this.authUrl}/login`, credentials,
				{
					withCredentials: true
				})
			.pipe(
				tap(
					(response: AuthResponse) =>
					{
						// Skip token handling when MFA is required
						if (response.requiresMfa)
						{
							return;
						}

						// When MFA is not required, token fields are guaranteed non-null
						this.setAccessToken(
							response.accessToken!,
							response.expiresAt!,
							response.email!,
							response.fullName);
						this.requiresPasswordChangeSignal.set(
							response.requiresPasswordChange);
						this.markHasSession();
						this.invalidatePostLogin();
						this.startIdleDetection(response);
					}));
	}

	/**
	 * Initiates OAuth flow with provider.
	 * Opens provider in popup; server returns postMessage with one-time code.
	 * Parent exchanges code for tokens via /oauth/exchange endpoint.
	 * @param {OAuthProvider} provider
	 * The OAuth provider to use.
	 * @param {string} returnUrl
	 * Return URL after successful OAuth (default: '/').
	 * @returns {void}
	 */
	loginWithProvider(
		provider: OAuthProvider,
		returnUrl: string = "/"): void
	{
		// Validate returnUrl is relative or same-origin (XSS protection)
		const validatedUrl: string =
			this.validateReturnUrl(returnUrl);

		// Use StorageService for SSR-safe session storage access
		this.storageService.setSessionItem(
			STORAGE_KEYS.AUTH_RETURN_URL,
			validatedUrl);

		this.isOAuthInProgress.set(true);

		// Open OAuth provider in popup (server returns postMessage HTML)
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
	 * Initiates OAuth link flow to connect an external provider to the current account.
	 * POSTs to the link endpoint with the bearer token, receives an authorization URL,
	 * and opens a popup to the provider for account linking.
	 * @param {OAuthProvider} provider
	 * The OAuth provider to link.
	 * @returns {void}
	 */
	linkProvider(provider: OAuthProvider): void
	{
		this.isOAuthInProgress.set(true);

		this
			.httpClient
			.post<{ authorizationUrl: string; }>(
				`${this.authUrl}/oauth/link/${provider}`,
				{})
			.subscribe(
				{
					next: (response: { authorizationUrl: string; }) =>
					{
						const popup: Window | null =
							this.windowService.openWindow(
								response.authorizationUrl,
								"oauth_link_popup");

						if (isNullOrUndefined(popup))
						{
							this.isOAuthInProgress.set(false);
							return;
						}

						this.startPopupPollTimer(popup);
					},
					error: () =>
					{
						this.isOAuthInProgress.set(false);
					}
				});
	}

	/**
	 * Validates OAuth return URL to prevent open redirect vulnerabilities.
	 * Only allows relative URLs that don't start with protocol-relative syntax.
	 * @param {string} url
	 * The URL to validate.
	 * @returns {string}
	 * The validated URL if safe, or '/' as fallback.
	 */
	private validateReturnUrl(url: string): string
	{
		// Only allow relative URLs starting with single slash
		// Reject absolute URLs and protocol-relative URLs (//evil.com)
		if (url.startsWith("/") && !url.startsWith("//"))
		{
			return url;
		}
		return "/";
	}

	/**
	 * Refreshes the access token using refresh token cookie.
	 * Implements single-flight pattern: concurrent calls share one HTTP request.
	 * Only clears auth on 401 (invalid token), NOT on 429 (rate limited).
	 * @returns {Observable<AuthResponse|null>}
	 * Observable that emits AuthResponse on success or null on failure.
	 */
	refreshToken(): Observable<AuthResponse | null>
	{
		// If refresh already in progress, return the same observable
		// This prevents concurrent requests from exhausting rate limits
		if (this.refreshInProgress)
		{
			return this.refreshInProgress;
		}

		this.refreshInProgress =
			this
				.httpClient
				.post<AuthResponse>(
					`${this.authUrl}/refresh`,
					{},
					{ withCredentials: true })
				.pipe(
					tap(
						(response: AuthResponse) =>
						{
						// Refresh always returns token fields (no MFA on refresh)
							this.setAccessToken(
								response.accessToken!,
								response.expiresAt!,
								response.email!,
								response.fullName);
							this.requiresPasswordChangeSignal.set(
								response.requiresPasswordChange);
							this.markHasSession();
							this.startIdleDetection(response);
						}),
					catchError(
						(error: HttpErrorResponse) =>
						{
						// Only clear auth on 401 (invalid/expired refresh token)
						// Do NOT clear on 429 (rate limited) - try again later
							if (error.status === 401)
							{
								this.clearAuth();
							}
							return of(null);
						}),
					finalize(
						() =>
						{
						// Clear the in-progress marker after completion
							this.refreshInProgress = null;
						}),
					// Share the same observable among all concurrent subscribers
					shareReplay(1));

		return this.refreshInProgress;
	}

	/**
	 * Logs out the current user.
	 * @returns {void}
	 */
	logout(): void
	{
		this
			.httpClient
			.post<void>(`${this.authUrl}/logout`, {},
				{ withCredentials: true })
			.subscribe(
				{
					complete: () =>
					{
						this.clearAuth();
						this.router.navigate(
							[APP_ROUTES.HOME]);
					},
					error: () =>
					{
						// Clear local state even if server call fails
						this.clearAuth();
						this.router.navigate(
							[APP_ROUTES.HOME]);
					}
				});
	}

	/**
	 * Sets a new password using a reset token.
	 * Used for password reset flow initiated by admin.
	 * @param {string} token
	 * The password reset token from the email link.
	 * @param {string} newPassword
	 * The new password to set.
	 * @returns {Observable<void>}
	 * Observable that completes when the password has been set.
	 */
	setPassword(token: string, newPassword: string): Observable<void>
	{
		return this.httpClient.post<void>(`${this.authUrl}/password/set`,
			{
				token,
				newPassword
			});
	}

	/**
	 * Requests a password reset email for the given email address.
	 * Always succeeds from the client's perspective (prevents email enumeration).
	 * @param {string} email
	 * The email address to send the reset link to.
	 * @param {string | null} altchaPayload
	 * ALTCHA verification payload for bot protection (null if disabled).
	 * @returns {Observable<void>}
	 * Observable that completes when the request is accepted.
	 */
	requestPasswordReset(
		email: string,
		altchaPayload: string | null = null): Observable<void>
	{
		return this.httpClient.post<void>(`${this.authUrl}/password/forgot`,
			{
				email,
				altchaPayload
			});
	}

	/**
	 * Initiates self-registration by sending verification email.
	 * Always shows success to prevent email enumeration.
	 * @param {string} email
	 * The email address to register.
	 * @param {string | null} altchaPayload
	 * The ALTCHA payload for bot protection (null when disabled).
	 * @returns {Observable<void>}
	 * Observable that completes when the request is accepted.
	 */
	initiateRegistration(
		email: string,
		altchaPayload: string | null = null): Observable<void>
	{
		return this.httpClient.post<void>(
			`${this.authUrl}/register/initiate`,
			{
				email,
				altchaPayload
			});
	}

	/**
	 * Completes self-registration after email verification.
	 *
	 * @param {string} token
	 * The verification token from the email link.
	 *
	 * @param {string} username
	 * The desired username.
	 *
	 * @param {string} password
	 * The desired password.
	 *
	 * @returns {Observable<AuthResponse>}
	 * Observable that resolves to authentication response on success.
	 */
	completeRegistration(
		token: string,
		username: string,
		password: string): Observable<AuthResponse>
	{
		return this
			.httpClient
			.post<AuthResponse>(
				`${this.authUrl}/register/complete`,
				{ token, username, password },
				{ withCredentials: true })
			.pipe(
				tap(
					(response: AuthResponse) =>
					{
						// Registration complete always returns token fields
						this.setAccessToken(
							response.accessToken!,
							response.expiresAt!,
							response.email!,
							response.fullName);
						this.markHasSession();
					}));
	}

	/**
	 * Gets the current access token.
	 * @returns {string|null}
	 * The current access token or null.
	 */
	getAccessToken(): string | null
	{
		return this.accessToken;
	}

	/**
	 * Checks if token is expired or about to expire.
	 * @returns {boolean}
	 * True when token is expired or within refresh buffer.
	 */
	isTokenExpired(): boolean
	{
		if (isNullOrEmpty(this.accessToken))
		{
			return true;
		}

		// Expired if within buffer seconds of expiry
		const bufferMs: number =
			this.featureFlagsService.tokenRefreshBufferSeconds() * 1000;
		return this.dateService.nowTimestamp() >= this.tokenExpiresAt - bufferMs;
	}

	/**
	 * Checks if current user has specified role.
	 * @param {string} role
	 * The role to check for.
	 * @returns {boolean}
	 * True when the current user has the specified role.
	 */
	hasRole(role: string): boolean
	{
		const user: UserProfileDto | null =
			this.userSignal();
		return user?.roles.includes(role) ?? false;
	}

	/**
	 * Checks if current user has any of the specified roles.
	 * @param {string[]} roles
	 * The roles to check for.
	 * @returns {boolean}
	 * True when the current user has any of the provided roles.
	 */
	hasAnyRole(...roles: string[]): boolean
	{
		return roles.some(
			(role: string) => this.hasRole(role));
	}

	/**
	 * Listens for OAuth postMessage from the popup window.
	 * The server sends oauth_success with a one-time code,
	 * which is exchanged for tokens via /oauth/exchange.
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
					this.exchangeOAuthCode(event.data.code);
				}

				if (event.data?.type === "oauth_link_success")
				{
					this.clearPopupPollTimer();
					this.queryClient.invalidateQueries(
						{
							queryKey: QueryKeys.account.all
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

	/**
	 * Exchanges a one-time OAuth code for tokens.
	 * Called after receiving postMessage from the OAuth popup.
	 * @param {string} code
	 * The one-time code from the OAuth provider.
	 * @returns {void}
	 */
	private exchangeOAuthCode(code: string): void
	{
		this
			.httpClient
			.post<AuthResponse>(
				`${this.authUrl}/oauth/exchange`,
				{ code },
				{ withCredentials: true })
			.subscribe(
				{
					next: (response: AuthResponse) =>
					{
						this.setAccessToken(
							response.accessToken!,
							response.expiresAt!,
							response.email!,
							response.fullName);
						this.requiresPasswordChangeSignal.set(
							response.requiresPasswordChange);
						this.markHasSession();
						this.invalidatePostLogin();
						this.startIdleDetection(response);

						// Navigate to stored return URL
						const returnUrl: string =
							this.storageService.getSessionItem(
								STORAGE_KEYS.AUTH_RETURN_URL) ?? "/";
						this.storageService.removeSessionItem(
							STORAGE_KEYS.AUTH_RETURN_URL);
						this.router.navigateByUrl(returnUrl);
					},
					error: () =>
					{
						this.router.navigate(
							[APP_ROUTES.AUTH.LOGIN]);
					}
				});
	}

	/**
	 * Handles successful MFA verification by storing tokens.
	 * Called by MfaService after successful code verification.
	 * @param {AuthResponse} response
	 * The auth response from MFA verification.
	 */
	handleMfaSuccess(response: AuthResponse): void
	{
		// MFA success always returns token fields
		this.setAccessToken(
			response.accessToken!,
			response.expiresAt!,
			response.email!,
			response.fullName);
		this.requiresPasswordChangeSignal.set(
			response.requiresPasswordChange);
		this.markHasSession();
		this.invalidatePostLogin();
		this.startIdleDetection(response);
	}

	/**
	 * Sets the access token and user info from response.
	 * Email and fullName are now in the response body, not JWT claims.
	 * @param {string} token
	 * The JWT access token.
	 * @param {string} expiresAt
	 * Token expiration time.
	 * @param {string} email
	 * User's email from response (required).
	 * @param {string|null} fullName
	 * User's full name from response (optional).
	 * @returns {void}
	 */
	private setAccessToken(
		token: string,
		expiresAt: string,
		email: string,
		fullName: string | null): void
	{
		this.accessToken = token;
		this.tokenExpiresAt =
			this
				.dateService
				.parseUTC(expiresAt)
				.getTime();

		const claims: JwtClaims | null =
			this.tokenService.parseJwt(token);

		if (claims)
		{
			const roles: string[] =
				this.tokenService.extractRoles(token);

			// Email and fullName now come from response body, not JWT claims
			this.userSignal.set(
				{
					id: parseInt(claims.sub, 10),
					username: claims.unique_name,
					email,
					roles,
					fullName,
					hasPassword: true,
					linkedProviders: [],
					lastLoginAt: null
				});
		}
	}

	/**
	 * Clears authentication state and all cached query data.
	 * Prevents data leakage between users on shared devices.
	 * @returns {void}
	 */
	private clearAuth(): void
	{
		this.idleDetectionService.stop();
		this.accessToken = null;
		this.tokenExpiresAt = 0;
		this.userSignal.set(null);
		this.requiresPasswordChangeSignal.set(false);
		this.clearHasSession();

		// Clear error queue to prevent data leakage between users
		this.storageService.removeItem(STORAGE_KEYS.ERROR_QUEUE);

		// Clear all cached queries to prevent data leakage between users
		this.queryClient.clear();
	}

	/**
	 * Starts idle detection if the server has it enabled.
	 *
	 * @param {AuthResponse} response
	 * Auth response containing session inactivity configuration.
	 */
	private startIdleDetection(response: AuthResponse): void
	{
		const inactivityMinutes: number =
			Number(response.sessionInactivityMinutes);
		const warningSeconds: number =
			Number(response.sessionWarningSeconds);

		if (inactivityMinutes > 0)
		{
			this.idleDetectionService.start(inactivityMinutes, warningSeconds);
		}
	}

	/**
	 * Handles logout triggered by inactivity timeout.
	 * Sets a sessionStorage flag so the login page can display the inactivity banner.
	 */
	private handleInactivityLogout(): void
	{
		this.clearAuth();

		this.storageService.setSessionItem(
			STORAGE_KEYS.AUTH_INACTIVITY_LOGOUT,
			"true");

		this.router.navigate(
			[APP_ROUTES.AUTH.LOGIN]);
	}

	/**
	 * Invalidates stale caches after successful login.
	 * Ensures user sees their own fresh data, not cached data from previous session.
	 * Eagerly fetches the user profile to replace hardcoded defaults
	 * (hasPassword, linkedProviders, lastLoginAt) set during setAccessToken.
	 * @returns {void}
	 */
	private invalidatePostLogin(): void
	{
		this.queryClient.invalidateQueries(
			{
				queryKey: QueryKeys.account.all
			});
		this.queryClient.invalidateQueries(
			{
				queryKey: QueryKeys.permissionRequests.all
			});

		// Eagerly fetch the full profile to replace JWT-derived defaults.
		// Best-effort: failure is silently ignored since the profile page
		// will fetch fresh data when visited.
		this
			.httpClient
			.get<UserProfileDto>(`${environment.apiUrl}/auth/me`)
			.pipe(
				catchError(
					() => of(null)))
			.subscribe(
				(profile: UserProfileDto | null) =>
				{
					if (isPresent(profile))
					{
						this.userSignal.set(profile);
					}
				});
	}

	/**
	 * Marks the user as requiring a password change.
	 * Called when the server returns 403 PASSWORD_CHANGE_REQUIRED.
	 * @returns {void}
	 */
	markPasswordChangeRequired(): void
	{
		this.requiresPasswordChangeSignal.set(true);
	}

	/**
	 * Clears the password change requirement (call after successful password change).
	 * @returns {void}
	 */
	clearPasswordChangeRequirement(): void
	{
		this.requiresPasswordChangeSignal.set(false);
	}

	/**
	 * Forces a local logout by clearing all client-side authentication state.
	 * Use this when the server has already invalidated refresh tokens (e.g., password change).
	 * This does NOT call the server logout endpoint.
	 * @returns {void}
	 */
	forceLogoutLocally(): void
	{
		this.clearAuth();
	}

	/**
	 * Checks if user has an existing session marker (has logged in before).
	 * Used to avoid unnecessary refresh token attempts for users who never logged in.
	 * @returns {boolean}
	 * True when user has a session marker in localStorage.
	 */
	private hasExistingSession(): boolean
	{
		const marker: boolean | string | null =
			this.storageService.getItem<boolean | string>(
				STORAGE_KEYS.AUTH_HAS_SESSION);
		// Handle both boolean (from JSON.parse) and string (legacy) formats
		return marker === true || marker === "true";
	}

	/**
	 * Marks that user has an active session.
	 * Called on successful login or token refresh.
	 * @returns {void}
	 */
	private markHasSession(): void
	{
		this.storageService.setItem(STORAGE_KEYS.AUTH_HAS_SESSION, "true");
	}

	/**
	 * Clears the session marker.
	 * Called on logout or when refresh token fails.
	 * @returns {void}
	 */
	private clearHasSession(): void
	{
		this.storageService.removeItem(STORAGE_KEYS.AUTH_HAS_SESSION);
	}

	/**
	 * Starts a poll timer that detects when the user closes the OAuth popup.
	 * Resets `isOAuthInProgress` so the UI can remove loading state.
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

		this.isOAuthInProgress.set(false);
	}

	/**
	 * Listens for cross-tab logout via StorageEvent.
	 * When another tab removes the session marker, forces local logout and navigates home.
	 * StorageEvent only fires in non-originating tabs, so no circular trigger risk.
	 * @returns {void}
	 */
	private initializeCrossTabLogout(): void
	{
		if (typeof window === "undefined")
		{
			return;
		}

		const storageHandler: (storageEvent: StorageEvent) => void =
			(storageEvent: StorageEvent): void =>
			{
				if (
					storageEvent.key === STORAGE_KEYS.AUTH_HAS_SESSION
						&& storageEvent.newValue === null)
				{
					this.forceLogoutLocally();
					this.router.navigateByUrl("/");
				}
			};

		window.addEventListener("storage", storageHandler);

		this.destroyRef.onDestroy(
			() =>
			{
				window.removeEventListener("storage", storageHandler);
			});
	}
}