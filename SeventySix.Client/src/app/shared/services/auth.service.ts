/**
 * Authentication service.
 * Manages local and OAuth login flows with in-memory token storage.
 *
 * Security Design:
 * - Access tokens stored in memory only (not localStorage) for XSS protection
 * - Refresh tokens stored in HTTP-only cookies by the server
 * - Token refresh handled transparently by auth interceptor
 */

import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
	computed,
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "@environments/environment";
import {
	AuthResponse,
	LoginRequest,
	UserProfileDto
} from "@shared/models";
import { DateService } from "@shared/services";
import {
	DOTNET_ROLE_CLAIM,
	JwtClaims,
	OAuthProvider
} from "@shared/services/auth.types";
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
	/**
	 * HTTP client for API calls.
	 * @type {HttpClient}
	 * @private
	 * @readonly
	 */
	private readonly httpClient: HttpClient =
		inject(HttpClient);

	/**
	 * Angular Router for navigation.
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Date service for timestamp/formatting utilities.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Base auth API URL.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly authUrl: string =
		`${environment.apiUrl}/auth`;

	/**
	 * Key for tracking if user has logged in before (for session restoration).
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private static readonly HAS_SESSION_KEY: string = "auth_has_session";

	/**
	 * Key for storing return URL in session storage.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private static readonly RETURN_URL_KEY: string = "auth_return_url";

	/**
	 * Access token stored in memory only for XSS protection.
	 * @type {string | null}
	 * @private
	 */
	private accessToken: string | null = null;

	/**
	 * Token expiration timestamp (epoch millis).
	 * @type {number}
	 * @private
	 */
	private tokenExpiresAt: number = 0;

	/**
	 * Tracks if initialization has already been attempted.
	 * @type {boolean}
	 * @private
	 */
	private initialized: boolean = false;

	/**
	 * In-flight refresh request observable for single-flight pattern.
	 * Prevents concurrent refresh requests from exhausting rate limits.
	 * @type {Observable<AuthResponse | null> | null}
	 * @private
	 */
	private refreshInProgress: Observable<AuthResponse | null> | null = null;

	/**
	 * Current authenticated user signal.
	 * @type {WritableSignal<UserProfileDto | null>}
	 * @private
	 * @readonly
	 */
	private readonly userSignal: WritableSignal<UserProfileDto | null> =
		signal<UserProfileDto | null>(null);

	/**
	 * Whether user must change password before using the app.
	 * @type {WritableSignal<boolean>}
	 * @private
	 * @readonly
	 */
	private readonly requiresPasswordChangeSignal: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Read-only user state.
	 * @type {Signal<UserProfileDto | null>}
	 * @readonly
	 */
	readonly user: Signal<UserProfileDto | null> =
		this.userSignal.asReadonly();

	/**
	 * Read-only password change requirement state.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly requiresPasswordChange: Signal<boolean> =
		this.requiresPasswordChangeSignal.asReadonly();

	/**
	 * Computed authentication state.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isAuthenticated: Signal<boolean> =
		computed(
			() => this.userSignal() !== null);

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

		// Handle OAuth callback if present
		if (this.handleOAuthCallback())
		{
			this.markHasSession();
			return of(null);
		}

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
	 * Observable that emits AuthResponse on success.
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
					this.setAccessToken(
						response.accessToken,
						response.expiresAt,
						response.email,
						response.fullName);
					this.requiresPasswordChangeSignal.set(
						response.requiresPasswordChange);
					this.markHasSession();
				}));
	}

	/**
	 * Initiates OAuth flow with provider.
	 * Server will redirect back with token in URL fragment.
	 * @param {OAuthProvider} provider
	 * The OAuth provider to use.
	 * @param {string} returnUrl
	 * Return URL after successful OAuth (default: '/').
	 * @returns {void}
	 */
	loginWithProvider(provider: OAuthProvider, returnUrl: string = "/"): void
	{
		// Store return URL for after OAuth callback
		sessionStorage.setItem(AuthService.RETURN_URL_KEY, returnUrl);
		window.location.href =
			`${this.authUrl}/${provider}`;
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
						this.setAccessToken(
							response.accessToken,
							response.expiresAt,
							response.email,
							response.fullName);
						this.requiresPasswordChangeSignal.set(
							response.requiresPasswordChange);
						this.markHasSession();
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
						["/"]);
				},
				error: () =>
				{
					// Clear local state even if server call fails
					this.clearAuth();
					this.router.navigate(
						["/"]);
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
		return this.httpClient.post<void>(`${this.authUrl}/set-password`,
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
	 * @returns {Observable<void>}
	 * Observable that completes when the request is accepted.
	 */
	requestPasswordReset(email: string): Observable<void>
	{
		return this.httpClient.post<void>(`${this.authUrl}/forgot-password`,
			{
				email
			});
	}

	/**
	 * Initiates self-registration by sending verification email.
	 * Always shows success to prevent email enumeration.
	 * @param {string} email
	 * The email address to register.
	 * @returns {Observable<void>}
	 * Observable that completes when the request is accepted.
	 */
	initiateRegistration(email: string): Observable<void>
	{
		return this.httpClient.post<void>(`${this.authUrl}/register/initiate`,
			{
				email
			});
	}

	/**
	 * Completes self-registration after email verification.
	 * @param {string} token
	 * The verification token from the email link.
	 * @param {string} username
	 * The desired username.
	 * @param {string} password
	 * The desired password.
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
					this.setAccessToken(
						response.accessToken,
						response.expiresAt,
						response.email,
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
		if (!this.accessToken)
		{
			return true;
		}

		// Expired if within buffer seconds of expiry
		const bufferMs: number =
			environment.auth.tokenRefreshBufferSeconds * 1000;
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
	 * Handles OAuth callback - token in URL fragment.
	 * @returns {boolean}
	 * True if OAuth callback was handled, false otherwise.
	 * @remarks The server may also provide email and fullName in the hash params.
	 */
	private handleOAuthCallback(): boolean
	{
		const hash: string =
			window.location.hash;

		if (!hash.includes("access_token="))
		{
			return false;
		}

		// Parse token from fragment: #access_token=xxx&expires_at=xxx&email=xxx&full_name=xxx
		const params: URLSearchParams =
			new URLSearchParams(hash.substring(1));
		const token: string | null =
			params.get("access_token");
		const expiresAt: string | null =
			params.get("expires_at");
		const email: string | null =
			params.get("email");
		const fullName: string | null =
			params.get("full_name");

		if (token && expiresAt && email)
		{
			this.setAccessToken(
				token,
				expiresAt,
				email,
				fullName);

			// Clean URL fragment
			window.history.replaceState(
				null,
				"",
				window.location.pathname + window.location.search);

			// Navigate to stored return URL
			const returnUrl: string =
				sessionStorage.getItem(AuthService.RETURN_URL_KEY) ?? "/";
			sessionStorage.removeItem(AuthService.RETURN_URL_KEY);
			this.router.navigateByUrl(returnUrl);
		}

		return true;
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
			this.parseJwt(token);

		if (claims)
		{
			// Handle role claim - .NET uses full ClaimTypes URI, can be string or array
			const roleClaim: string | string[] | undefined =
				claims[
				DOTNET_ROLE_CLAIM
				] as string | string[] | undefined;
			const roles: string[] =
				Array.isArray(roleClaim)
					? roleClaim
					: roleClaim
						? [roleClaim]
						: [];

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
	 * Clears authentication state.
	 * @returns {void}
	 */
	private clearAuth(): void
	{
		this.accessToken = null;
		this.tokenExpiresAt = 0;
		this.userSignal.set(null);
		this.requiresPasswordChangeSignal.set(false);
		this.clearHasSession();
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
	 * Parses JWT token to extract claims.
	 * @param {string} token
	 * The JWT token string to parse.
	 * @returns {JwtClaims|null}
	 * The decoded JWT claims or null when parsing fails or token is invalid.
	 */
	private parseJwt(token: string): JwtClaims | null
	{
		try
		{
			const parts: string[] =
				token.split(".");

			if (parts.length !== 3)
			{
				return null;
			}

			const base64Url: string =
				parts[1];
			const base64: string =
				base64Url
				.replace(/-/g, "+")
				.replace(/_/g, "/");
			const json: string =
				decodeURIComponent(
					atob(base64)
					.split("")
					.map(
						(c: string) =>
							"%"
								+ ("00" + c
								.charCodeAt(0)
								.toString(16))
								.slice(-2))
					.join(""));

			return JSON.parse(json);
		}
		catch
		{
			return null;
		}
	}

	/**
	 * Checks if user has an existing session marker (has logged in before).
	 * Used to avoid unnecessary refresh token attempts for users who never logged in.
	 * @returns {boolean}
	 * True when user has a session marker in localStorage.
	 */
	private hasExistingSession(): boolean
	{
		return localStorage.getItem(AuthService.HAS_SESSION_KEY) === "true";
	}

	/**
	 * Marks that user has an active session.
	 * Called on successful login or token refresh.
	 * @returns {void}
	 */
	private markHasSession(): void
	{
		localStorage.setItem(AuthService.HAS_SESSION_KEY, "true");
	}

	/**
	 * Clears the session marker.
	 * Called on logout or when refresh token fails.
	 * @returns {void}
	 */
	private clearHasSession(): void
	{
		localStorage.removeItem(AuthService.HAS_SESSION_KEY);
	}
}
