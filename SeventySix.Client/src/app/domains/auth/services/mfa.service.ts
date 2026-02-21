/**
 * MFA Service for handling multi-factor authentication flows.
 * Domain-scoped service - must be provided in route providers.
 *
 * **Design Note:** This service uses HttpClient directly instead of ApiService
 * because MFA verification requires `withCredentials: true` for cookie-based
 * authentication. ApiService is designed for standard API calls that don't
 * need credential forwarding.
 *
 * @see {@link ApiService} for documentation on when to use HttpClient directly
 */

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { STORAGE_KEYS } from "@shared/constants";
import {
	AuthResponse,
	MfaState,
	ResendMfaCodeRequest,
	VerifyBackupCodeRequest,
	VerifyMfaRequest,
	VerifyTotpRequest
} from "@shared/models";
import { StorageService } from "@shared/services";
import { Observable, tap } from "rxjs";

/**
 * Service for MFA verification operations.
 * Handles code verification, resend, and state management.
 *
 * **Note:** This is a domain-scoped service provided via route providers.
 * Uses HttpClient directly for `withCredentials` support required by auth flows.
 */
@Injectable()
export class MfaService
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
	 * Storage service for session storage access.
	 * @type {StorageService}
	 * @private
	 * @readonly
	 */
	private readonly storageService: StorageService =
		inject(StorageService);

	/**
	 * Base auth API URL.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly authUrl: string =
		`${environment.apiUrl}/auth`;

	/**
	 * Verifies MFA code.
	 * @param {VerifyMfaRequest} request
	 * The MFA verification request.
	 * @returns {Observable<AuthResponse>}
	 * Observable that emits AuthResponse on success.
	 */
	verifyMfa(request: VerifyMfaRequest): Observable<AuthResponse>
	{
		return this
			.httpClient
			.post<AuthResponse>(`${this.authUrl}/mfa/verify`, request,
				{
					withCredentials: true
				})
			.pipe(
				tap(
					() => this.clearMfaState()));
	}

	/**
	 * Requests a new MFA verification code.
	 * @param {ResendMfaCodeRequest} request
	 * The resend request.
	 * @returns {Observable<void>}
	 * Observable that completes when the code is sent.
	 */
	resendMfaCode(request: ResendMfaCodeRequest): Observable<void>
	{
		return this
			.httpClient
			.post<void>(
				`${this.authUrl}/mfa/resend`,
				request,
				{
					withCredentials: true
				});
	}

	/**
	 * Verifies TOTP code during MFA.
	 * @param {VerifyTotpRequest} request
	 * The TOTP verification request.
	 * @returns {Observable<AuthResponse>}
	 * Observable that emits AuthResponse on success.
	 */
	verifyTotp(request: VerifyTotpRequest): Observable<AuthResponse>
	{
		return this
			.httpClient
			.post<AuthResponse>(
				`${this.authUrl}/mfa/verify-totp`,
				request,
				{ withCredentials: true })
			.pipe(
				tap(
					() => this.clearMfaState()));
	}

	/**
	 * Verifies backup code during MFA.
	 * @param {VerifyBackupCodeRequest} request
	 * The backup code verification request.
	 * @returns {Observable<AuthResponse>}
	 * Observable that emits AuthResponse on success.
	 */
	verifyBackupCode(request: VerifyBackupCodeRequest): Observable<AuthResponse>
	{
		return this
			.httpClient
			.post<AuthResponse>(
				`${this.authUrl}/mfa/verify-backup`,
				request,
				{ withCredentials: true })
			.pipe(
				tap(
					() => this.clearMfaState()));
	}

	/**
	 * Stores MFA state for the verification flow.
	 * StorageService.setSessionItem handles JSON stringification internally.
	 * @param {MfaState} state
	 * The MFA state to store.
	 */
	setMfaState(state: MfaState): void
	{
		this.storageService.setSessionItem(
			STORAGE_KEYS.AUTH_MFA_STATE,
			state);
	}

	/**
	 * Retrieves MFA state from session storage.
	 * StorageService.getSessionItem handles JSON parsing internally.
	 * @returns {MfaState | null}
	 * The stored MFA state or null if not found.
	 */
	getMfaState(): MfaState | null
	{
		return this
			.storageService
			.getSessionItem<MfaState>(STORAGE_KEYS.AUTH_MFA_STATE);
	}

	/**
	 * Clears MFA state from session storage.
	 */
	clearMfaState(): void
	{
		this.storageService.removeSessionItem(STORAGE_KEYS.AUTH_MFA_STATE);
	}
}