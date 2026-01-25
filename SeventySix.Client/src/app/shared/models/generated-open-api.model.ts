/**
 * Shared API DTOs - types used by shared/ services.
 * These are the only DTOs that belong in shared/models.
 * Domain-specific DTOs should be in their domain's models/index.ts.
 */

import { components } from "@shared/generated-open-api/generated-open-api";

// Auth types - used by AuthService (shared)
export type LoginRequest = components["schemas"]["LoginRequest"];
export type UserProfileDto = components["schemas"]["UserProfileDto"];

/**
 * Extended auth response that includes MFA fields.
 * Once OpenAPI is regenerated, this can be simplified to the generated type.
 */
export type AuthResponse = components["schemas"]["AuthResponse"] & {
	/**
	 * Whether MFA verification is required to complete authentication.
	 */
	requiresMfa?: boolean;

	/**
	 * Temporary token identifying the MFA challenge.
	 */
	mfaChallengeToken?: string | null;
};

/**
 * Request to verify an MFA code.
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
