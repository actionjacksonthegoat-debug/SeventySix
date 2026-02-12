/**
 * Auth domain models barrel export.
 * Re-exports authentication DTOs - shared types from @shared/models,
 * domain-specific types from generated API.
 */

import { components } from "@shared/generated-open-api/generated-open-api";

// Re-export shared auth types (single source of truth in @shared/models)
export type {
	AuthResponse,
	LoginRequest,
	MfaMethod,
	MfaState,
	ResendMfaCodeRequest,
	VerifyMfaRequest
} from "@shared/models";

// Auth-domain-specific request types (only used by auth pages)
export type ChangePasswordRequest = components["schemas"]["ChangePasswordRequest"];
export type ForgotPasswordRequest = components["schemas"]["ForgotPasswordRequest"];
export type InitiateRegistrationRequest = components["schemas"]["InitiateRegistrationRequest"];
export type CompleteRegistrationRequest = components["schemas"]["CompleteRegistrationRequest"];
export type SetPasswordRequest = components["schemas"]["SetPasswordRequest"];

// Validation models (auth-domain-specific)
export type { ValidationResult } from "./validation-result.model";
