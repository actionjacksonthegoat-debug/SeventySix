/**
 * Authentication service.
 * Manages local and OAuth login flows with in-memory token storage.
 *
 * Security Design:
 * - Access tokens stored in memory only (not localStorage) for XSS protection
 * - Refresh tokens stored in HTTP-only cookies by the server
 * - Token refresh handled transparently by auth interceptor
 */

import {
	Injectable,
	inject,
	signal,
	computed,
	Signal,
	WritableSignal
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, tap, catchError, of } from "rxjs";
import { environment } from "@environments/environment";
import {
	LoginCredentials,
	AuthResponse,
	AuthUser,
	OAuthProvider,
	JwtClaims,
	DOTNET_ROLE_CLAIM
} from "@infrastructure/models";

@Injectable({
	providedIn: "root"
})
export class AuthService
{
	private readonly http: HttpClient = inject(HttpClient);
	private readonly router: Router = inject(Router);

	private readonly authUrl: string = `${environment.apiUrl}/auth`;

	/** Key for tracking if user has logged in before (for session restoration). */
	private static readonly HAS_SESSION_KEY: string = "auth_has_session";

	/** Access token in memory only (XSS protection). */
	private accessToken: string | null = null;

	/** Token expiration timestamp. */
	private tokenExpiresAt: number = 0;

	/** Tracks if initialization has already been attempted. */
	private initialized: boolean = false;

	/** Current authenticated user signal. */
	private readonly userSignal: WritableSignal<AuthUser | null> =
		signal<AuthUser | null>(null);

	/** Whether user must change password before using the app. */
	private readonly requiresPasswordChangeSignal: WritableSignal<boolean> =
		signal<boolean>(false);

	/** Read-only user state. */
	readonly user: Signal<AuthUser | null> = this.userSignal.asReadonly();

	/** Read-only password change requirement state. */
	readonly requiresPasswordChange: Signal<boolean> =
		this.requiresPasswordChangeSignal.asReadonly();

	/** Computed authentication state. */
	readonly isAuthenticated: Signal<boolean> = computed(
		() => this.userSignal() !== null
	);

	/**
	 * Initializes the service: handles OAuth callback and restores session.
	 * Call this from APP_INITIALIZER. Only runs once per app lifecycle.
	 * @returns Observable that completes when initialization is done.
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
	 */
	login(credentials: LoginCredentials): Observable<AuthResponse>
	{
		return this.http
			.post<AuthResponse>(`${this.authUrl}/login`, credentials, {
				withCredentials: true
			})
			.pipe(
				tap((response: AuthResponse) =>
				{
					this.setAccessToken(
						response.accessToken,
						response.expiresAt
					);
					this.requiresPasswordChangeSignal.set(
						response.requiresPasswordChange
					);
					this.markHasSession();
				})
			);
	}

	/**
	 * Initiates OAuth flow with provider.
	 * Server will redirect back with token in URL fragment.
	 */
	loginWithProvider(provider: OAuthProvider, returnUrl: string = "/"): void
	{
		// Store return URL for after OAuth callback
		sessionStorage.setItem("auth_return_url", returnUrl);
		window.location.href = `${this.authUrl}/${provider}`;
	}

	/**
	 * Refreshes the access token using refresh token cookie.
	 */
	refreshToken(): Observable<AuthResponse | null>
	{
		return this.http
			.post<AuthResponse>(
				`${this.authUrl}/refresh`,
				{},
				{ withCredentials: true }
			)
			.pipe(
				tap((response: AuthResponse) =>
				{
					this.setAccessToken(
						response.accessToken,
						response.expiresAt
					);
					this.requiresPasswordChangeSignal.set(
						response.requiresPasswordChange
					);
					this.markHasSession();
				}),
				catchError(() =>
				{
					this.clearAuth();
					return of(null);
				})
			);
	}

	/**
	 * Logs out the current user.
	 */
	logout(): void
	{
		this.http
			.post<void>(`${this.authUrl}/logout`, {}, { withCredentials: true })
			.subscribe({
				complete: () =>
				{
					this.clearAuth();
					this.router.navigate(["/"]);
				},
				error: () =>
				{
					// Clear local state even if server call fails
					this.clearAuth();
					this.router.navigate(["/"]);
				}
			});
	}

	/**
	 * Sets a new password using a reset token.
	 * Used for password reset flow initiated by admin.
	 * @param token - The password reset token from the email link
	 * @param newPassword - The new password to set
	 */
	setPassword(token: string, newPassword: string): Observable<void>
	{
		return this.http.post<void>(`${this.authUrl}/set-password`, {
			token,
			newPassword
		});
	}

	/**
	 * Requests a password reset email for the given email address.
	 * Always succeeds from the client's perspective (prevents email enumeration).
	 * @param email - The email address to send the reset link to.
	 */
	requestPasswordReset(email: string): Observable<void>
	{
		return this.http.post<void>(`${this.authUrl}/forgot-password`, {
			email
		});
	}

	/**
	 * Initiates self-registration by sending verification email.
	 * Always shows success to prevent email enumeration.
	 * @param email - The email address to register.
	 */
	initiateRegistration(email: string): Observable<void>
	{
		return this.http.post<void>(`${this.authUrl}/register/initiate`, {
			email
		});
	}

	/**
	 * Completes self-registration after email verification.
	 * @param token - The verification token from the email link.
	 * @param username - The desired username.
	 * @param password - The desired password.
	 */
	completeRegistration(
		token: string,
		username: string,
		password: string
	): Observable<AuthResponse>
	{
		return this.http
			.post<AuthResponse>(
				`${this.authUrl}/register/complete`,
				{ token, username, password },
				{ withCredentials: true }
			)
			.pipe(
				tap((response: AuthResponse) =>
				{
					this.setAccessToken(
						response.accessToken,
						response.expiresAt
					);
					this.markHasSession();
				})
			);
	}

	/**
	 * Gets the current access token.
	 */
	getAccessToken(): string | null
	{
		return this.accessToken;
	}

	/**
	 * Checks if token is expired or about to expire.
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
		return Date.now() >= this.tokenExpiresAt - bufferMs;
	}

	/**
	 * Checks if current user has specified role.
	 */
	hasRole(role: string): boolean
	{
		const user: AuthUser | null = this.userSignal();
		return user?.roles.includes(role) ?? false;
	}

	/**
	 * Checks if current user has any of the specified roles.
	 */
	hasAnyRole(...roles: string[]): boolean
	{
		return roles.some((role: string) => this.hasRole(role));
	}

	/**
	 * Handles OAuth callback - token in URL fragment.
	 * @returns true if OAuth callback was handled, false otherwise.
	 */
	private handleOAuthCallback(): boolean
	{
		const hash: string = window.location.hash;

		if (!hash.includes("access_token="))
		{
			return false;
		}

		// Parse token from fragment: #access_token=xxx&expires_at=xxx
		const params: URLSearchParams = new URLSearchParams(hash.substring(1));
		const token: string | null = params.get("access_token");
		const expiresAt: string | null = params.get("expires_at");

		if (token && expiresAt)
		{
			this.setAccessToken(token, expiresAt);

			// Clean URL fragment
			window.history.replaceState(
				null,
				"",
				window.location.pathname + window.location.search
			);

			// Navigate to stored return URL
			const returnUrl: string =
				sessionStorage.getItem("auth_return_url") ?? "/";
			sessionStorage.removeItem("auth_return_url");
			this.router.navigateByUrl(returnUrl);
		}

		return true;
	}

	/**
	 * Sets the access token and extracts user info.
	 */
	private setAccessToken(token: string, expiresAt: string): void
	{
		this.accessToken = token;
		this.tokenExpiresAt = new Date(expiresAt).getTime();

		const claims: JwtClaims | null = this.parseJwt(token);

		if (claims)
		{
			// Handle role claim - .NET uses full ClaimTypes URI, can be string or array
			const roleClaim: string | string[] | undefined = claims[
				DOTNET_ROLE_CLAIM
			] as string | string[] | undefined;
			const roles: string[] = Array.isArray(roleClaim)
				? roleClaim
				: roleClaim
					? [roleClaim]
					: [];

			this.userSignal.set({
				id: parseInt(claims.sub, 10),
				username: claims.unique_name,
				email: claims.email,
				roles,
				fullName: claims.given_name || null
			});
		}
	}

	/**
	 * Clears authentication state.
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
	 */
	clearPasswordChangeRequirement(): void
	{
		this.requiresPasswordChangeSignal.set(false);
	}

	/**
	 * Parses JWT token to extract claims.
	 */
	private parseJwt(token: string): JwtClaims | null
	{
		try
		{
			const parts: string[] = token.split(".");

			if (parts.length !== 3)
			{
				return null;
			}

			const base64Url: string = parts[1];
			const base64: string = base64Url
				.replace(/-/g, "+")
				.replace(/_/g, "/");
			const json: string = decodeURIComponent(
				atob(base64)
					.split("")
					.map(
						(c: string) =>
							"%" +
							("00" + c.charCodeAt(0).toString(16)).slice(-2)
					)
					.join("")
			);

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
	 */
	private hasExistingSession(): boolean
	{
		return localStorage.getItem(AuthService.HAS_SESSION_KEY) === "true";
	}

	/**
	 * Marks that user has an active session.
	 * Called on successful login or token refresh.
	 */
	private markHasSession(): void
	{
		localStorage.setItem(AuthService.HAS_SESSION_KEY, "true");
	}

	/**
	 * Clears the session marker.
	 * Called on logout or when refresh token fails.
	 */
	private clearHasSession(): void
	{
		localStorage.removeItem(AuthService.HAS_SESSION_KEY);
	}
}
