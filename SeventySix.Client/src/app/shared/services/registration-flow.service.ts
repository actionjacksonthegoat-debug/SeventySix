/**
 * Self-registration flow service.
 * Handles HTTP operations for user self-registration flows.
 */

import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { AuthResponse } from "@shared/models";
import { Observable } from "rxjs";

/**
 * Provides HTTP operations for the self-registration flow.
 * Extracted from AuthService for single-responsibility compliance.
 * AuthService retains the token lifecycle (setAccessToken, markHasSession)
 * after completeRegistration resolves.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class RegistrationFlowService
{
	private readonly httpClient: HttpClient =
		inject(HttpClient);

	private readonly authUrl: string =
		`${environment.apiUrl}/auth`;

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
	 * Returns the raw AuthResponse; callers (AuthService) handle token storage.
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
		return this.httpClient.post<AuthResponse>(
			`${this.authUrl}/register/complete`,
			{
				token,
				username,
				password
			},
			{
				withCredentials: true
			});
	}
}
