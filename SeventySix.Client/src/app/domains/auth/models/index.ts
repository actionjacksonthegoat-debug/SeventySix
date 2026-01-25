/**
 * Auth domain models barrel export.
 * Re-exports authentication DTOs from generated API.
 */

import { components } from "@shared/generated-open-api/generated-open-api";

// Authentication DTOs
export type LoginRequest = components["schemas"]["LoginRequest"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type OAuthCodeExchangeRequest = components["schemas"]["OAuthCodeExchangeRequest"];
export type ChangePasswordRequest = components["schemas"]["ChangePasswordRequest"];
export type ForgotPasswordRequest = components["schemas"]["ForgotPasswordRequest"];
export type InitiateRegistrationRequest = components["schemas"]["InitiateRegistrationRequest"];
export type CompleteRegistrationRequest = components["schemas"]["CompleteRegistrationRequest"];
export type SetPasswordRequest = components["schemas"]["SetPasswordRequest"];

// MFA types
export type MfaMethod = components["schemas"]["MfaMethod"];

// Auth response from API - now fully typed from OpenAPI
export type AuthResponse = components["schemas"]["AuthResponse"];

/**
 * Request to verify an MFA code (email-based).
 */
export interface VerifyMfaRequest
{
	/**
	 * The challenge token from the login response.
	 */
	challengeToken: string;

	/**
	 * The 6-digit verification code.
	 */
	code: string;
}

/**
 * Request to resend an MFA verification code.
 */
export interface ResendMfaCodeRequest
{
	/**
	 * The challenge token from the login response.
	 */
	challengeToken: string;
}

/**
 * MFA state stored during the verification flow.
 */
export interface MfaState
{
	/**
	 * The challenge token.
	 */
	challengeToken: string;

	/**
	 * The masked email displayed to user.
	 */
	email: string;

	/**
	 * The return URL after successful MFA.
	 */
	returnUrl: string;

	/**
	 * The MFA method in use (Email = 0, Totp = 1).
	 */
	mfaMethod?: MfaMethod | null;

	/**
	 * Available MFA methods for this user.
	 */
	availableMfaMethods?: MfaMethod[] | null;
}

// Validation models
export type { ValidationResult } from "./validation-result.model";
