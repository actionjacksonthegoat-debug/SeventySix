/**
 * Password reset service.
 * Handles HTTP operations for password management flows.
 */

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { Observable } from "rxjs";

/**
 * Provides HTTP operations for password reset and set-password flows.
 * Extracted from AuthService for single-responsibility compliance.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class PasswordResetService
{
	private readonly httpClient: HttpClient =
		inject(HttpClient);

	private readonly authUrl: string =
		`${environment.apiUrl}/auth`;

	/**
	 * Sets a new password using a reset token.
	 * Used for password reset flow initiated by admin or forgot-password.
	 * @param {string} token
	 * The password reset token from the email link.
	 * @param {string} newPassword
	 * The new password to set.
	 * @returns {Observable<void>}
	 * Observable that completes when the password has been set.
	 */
	setPassword(
		token: string,
		newPassword: string): Observable<void>
	{
		return this.httpClient.post<void>(
			`${this.authUrl}/password/set`,
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
		return this.httpClient.post<void>(
			`${this.authUrl}/password/forgot`,
			{
				email,
				altchaPayload
			});
	}
}