/**
 * Backup Codes Service for emergency MFA recovery.
 * Domain-scoped service - must be provided in route providers.
 *
 * **Design Note:** Uses HttpClient directly (not ApiService) because backup
 * code operations require `withCredentials: true` for secure cookie handling.
 *
 * @see {@link ApiService} for documentation on when to use HttpClient directly
 */

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { Observable } from "rxjs";

/**
 * Service for backup code operations.
 * Handles generation and count retrieval.
 *
 * **Note:** This is a domain-scoped service provided via route providers.
 * Uses HttpClient directly for `withCredentials` support required by auth flows.
 */
@Injectable()
export class BackupCodesService
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
	 * Base MFA backup codes API URL.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly mfaUrl: string =
		`${environment.apiUrl}/auth/mfa`;

	/**
	 * Generates new backup codes (invalidates existing).
	 * @returns {Observable<string[]>}
	 * Observable with new backup codes.
	 */
	generate(): Observable<string[]>
	{
		return this
			.httpClient
			.post<string[]>(
				`${this.mfaUrl}/backup-codes`,
				{},
				{ withCredentials: true });
	}

	/**
	 * Gets count of remaining unused backup codes.
	 * @returns {Observable<number>}
	 * Observable with remaining count.
	 */
	getRemainingCount(): Observable<number>
	{
		return this
			.httpClient
			.get<number>(
				`${this.mfaUrl}/backup-codes/remaining`,
				{ withCredentials: true });
	}
}