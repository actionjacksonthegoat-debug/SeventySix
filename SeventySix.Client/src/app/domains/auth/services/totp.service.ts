/**
 * TOTP Service for authenticator app enrollment operations.
 * Domain-scoped service - must be provided in route providers.
 *
 * **Design Note:** Uses HttpClient directly (not ApiService) because TOTP
 * operations require `withCredentials: true` for secure cookie handling.
 *
 * @see {@link ApiService} for documentation on when to use HttpClient directly
 */

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import {
	ConfirmTotpEnrollmentRequest,
	DisableTotpRequest,
	TotpSetupResponse
} from "@shared/models";
import { Observable } from "rxjs";

/**
 * Service for TOTP (authenticator app) operations.
 * Handles enrollment, confirmation, and disabling.
 *
 * **Note:** This is a domain-scoped service provided via route providers.
 * Uses HttpClient directly for `withCredentials` support required by auth flows.
 */
@Injectable()
export class TotpService
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
	 * Base MFA TOTP API URL.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly mfaUrl: string =
		`${environment.apiUrl}/auth/mfa`;

	/**
	 * Initiates TOTP enrollment.
	 * @returns {Observable<TotpSetupResponse>}
	 * Observable with secret and QR code URI.
	 */
	initiateSetup(): Observable<TotpSetupResponse>
	{
		return this
			.httpClient
			.post<TotpSetupResponse>(
				`${this.mfaUrl}/totp/setup`,
				{},
				{ withCredentials: true });
	}

	/**
	 * Confirms TOTP enrollment with verification code.
	 * @param {ConfirmTotpEnrollmentRequest} request
	 * The confirmation request with code.
	 * @returns {Observable<void>}
	 * Observable that completes on success.
	 */
	confirmSetup(request: ConfirmTotpEnrollmentRequest): Observable<void>
	{
		return this
			.httpClient
			.post<void>(
				`${this.mfaUrl}/totp/confirm`,
				request,
				{ withCredentials: true });
	}

	/**
	 * Disables TOTP authentication.
	 * @param {DisableTotpRequest} request
	 * The request with password verification.
	 * @returns {Observable<void>}
	 * Observable that completes on success.
	 */
	disable(request: DisableTotpRequest): Observable<void>
	{
		return this
			.httpClient
			.post<void>(
				`${this.mfaUrl}/totp/disable`,
				request,
				{ withCredentials: true });
	}
}