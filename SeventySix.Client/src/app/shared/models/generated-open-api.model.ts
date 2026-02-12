/**
 * Shared API DTOs - types used by shared/ services.
 * These are the only DTOs that belong in shared/models.
 * Domain-specific DTOs should be in their domain's models/index.ts.
 */

import { components } from "@shared/generated-open-api/generated-open-api";

// Auth types - used by AuthService (shared)
export type LoginRequest = components["schemas"]["LoginRequest"];
export type UserProfileDto = components["schemas"]["UserProfileDto"];

// MFA types - used across auth flows
export type MfaMethod = components["schemas"]["MfaMethod"];

// Auth response - now fully typed from OpenAPI
export type AuthResponse = components["schemas"]["AuthResponse"];

// TOTP types - used by TotpService
export type TotpSetupResponse = components["schemas"]["TotpSetupResponse"];
export type ConfirmTotpEnrollmentRequest = components["schemas"]["ConfirmTotpEnrollmentRequest"];
export type DisableTotpRequest = components["schemas"]["DisableTotpRequest"];

// MFA verification types - now fully typed from OpenAPI (includes trustDevice)
export type VerifyTotpRequest = components["schemas"]["VerifyTotpRequest"];
export type VerifyBackupCodeRequest = components["schemas"]["VerifyBackupCodeRequest"];
export type VerifyMfaRequest = components["schemas"]["VerifyMfaRequest"];
export type ResendMfaCodeRequest = components["schemas"]["ResendMfaCodeRequest"];

// Trusted device types - used by TrustedDeviceService
export type TrustedDeviceDto =
	& Omit<components["schemas"]["TrustedDeviceDto"], "id">
	& { id: number; };

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
	 * The user's email for MFA verification.
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

// Error logging types - used by ClientErrorLoggerService, LoggerService (shared)
export type CreateLogRequest =
	& Omit<
		components["schemas"]["CreateLogRequest"],
		"additionalContext" | "statusCode">
	& {
		additionalContext?: Record<string, unknown> | null;
		statusCode?: number | null;
	};

// Error handling - used app-wide
export type ProblemDetails = components["schemas"]["ProblemDetails"];
