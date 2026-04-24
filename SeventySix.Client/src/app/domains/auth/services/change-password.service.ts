/**
 * Change Password Service for authenticated password change operations.
 * Domain-scoped service — must be provided in route providers.
 *
 * **Design Note:** Uses HttpClient directly (not ApiService) because password
 * change requires `withCredentials: true` for secure cookie handling.
 *
 * @see {@link ApiService} for documentation on when to use HttpClient directly
 */

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ChangePasswordRequest } from "@auth/models";
import { environment } from "@environments/environment";
import { Observable } from "rxjs";

/**
 * Service for authenticated password change operations.
 * Handles the HTTP call to update a user's password.
 *
 * **Note:** This is a domain-scoped service provided via route providers.
 * Uses HttpClient directly for `withCredentials` support required by auth flows.
 */
@Injectable()
export class ChangePasswordService
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
	 * Base auth API URL.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly authUrl: string =
		`${environment.apiUrl}/auth`;

	/**
	 * Changes the authenticated user's password.
	 * @param {ChangePasswordRequest} request
	 * The change password request containing current and new passwords.
	 * @returns {Observable<void>}
	 * Observable that completes when the password has been changed.
	 */
	changePassword(request: ChangePasswordRequest): Observable<void>
	{
		return this
			.httpClient
			.post<void>(
				`${this.authUrl}/password/change`,
				request,
				{ withCredentials: true });
	}
}