/**
 * Auth domain models barrel export.
 * Re-exports authentication DTOs from generated API.
 */

import { components } from "@shared/generated-open-api/generated-open-api";

// Authentication DTOs
export type LoginRequest = components["schemas"]["LoginRequest"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type AuthResponse = components["schemas"]["AuthResponse"];
export type OAuthCodeExchangeRequest = components["schemas"]["OAuthCodeExchangeRequest"];
export type ChangePasswordRequest = components["schemas"]["ChangePasswordRequest"];
export type ForgotPasswordRequest = components["schemas"]["ForgotPasswordRequest"];
export type InitiateRegistrationRequest = components["schemas"]["InitiateRegistrationRequest"];
export type CompleteRegistrationRequest = components["schemas"]["CompleteRegistrationRequest"];
export type SetPasswordRequest = components["schemas"]["SetPasswordRequest"];
