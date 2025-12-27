/**
 * AuthService test helpers
 * Small utilities extracted from the main spec to keep file sizes under the architecture threshold.
 */

import { AuthResponse } from "@shared/models";

/** Default JWT payload for test user */
const DEFAULT_JWT_PAYLOAD: Record<string, string | string[]> =
	{
		sub: "1",
		unique_name: "testuser",
		email: "test@example.com"
	};

/**
 * Creates a mock JWT token for testing.
 * @param {Record<string, string | string[] | number>} payload
 * JWT payload with claims
 * @returns {string}
 * Base64-encoded JWT string
 */
function createMockJwt(payload: Record<string, string | string[] | number>): string
{
	const header: string =
		btoa(
			JSON.stringify(
				{
					alg: "HS256",
					typ: "JWT"
				}));
	const body: string =
		btoa(
			JSON.stringify(
				{
					exp: 9999999999,
					iat: 9999990000,
					...payload
				}));
	return `${header}.${body}.signature`;
}

/**
 * Creates a standard mock auth response for testing.
 * @param {Record<string, string | string[]>} jwtOverrides
 * Optional JWT payload overrides
 * @param {Partial<Omit<AuthResponse, "accessToken">>} responseOverrides
 * Optional response field overrides
 * @returns {AuthResponse}
 * AuthResponse with default test values
 */
export function createMockAuthResponse(
	jwtOverrides: Record<string, string | string[]> = {},
	responseOverrides: Partial<Omit<AuthResponse, "accessToken">> = {}): AuthResponse
{
	return {
		accessToken: createMockJwt(
			{ ...DEFAULT_JWT_PAYLOAD, ...jwtOverrides }),
		expiresAt: "2030-01-01T00:00:00.000Z",
		email: "test@example.com",
		fullName: "Test User",
		requiresPasswordChange: false,
		...responseOverrides
	};
}