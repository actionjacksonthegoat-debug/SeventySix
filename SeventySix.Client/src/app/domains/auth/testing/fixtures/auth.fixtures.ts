/**
 * Auth Test Fixtures.
 * Centralized test data for authentication entities.
 * Eliminates duplication across 8+ auth test files.
 */

import {
	AuthResponse,
	ChangePasswordRequest,
	CompleteRegistrationRequest,
	ForgotPasswordRequest,
	LoginRequest,
	RegisterRequest,
	SetPasswordRequest
} from "@auth/models";
import { DateService } from "@shared/services";

/**
 * Shared DateService instance for fixture date calculations.
 */
const dateService: DateService =
	new DateService();

/**
 * Auth response fixture factory.
 * Provides consistent test data for authentication responses.
 */
export class AuthFixtures
{
	/**
	 * Standard successful auth response.
	 * Active session with standard token expiry (1 hour from now).
	 *
	 * @returns {AuthResponse}
	 * Fresh auth response with current timestamps.
	 */
	static get SUCCESS_RESPONSE(): AuthResponse
	{
		return {
			accessToken: "test-access-token-12345",
			expiresAt: dateService
				.fromMillis(dateService.nowTimestamp() + 3600000)
				.toISOString(),
			email: "test@example.com",
			fullName: "Test User",
			requiresPasswordChange: false,
			requiresMfa: false
		};
	}

	/**
	 * Auth response requiring password change.
	 * Used for testing forced password reset flows.
	 *
	 * @returns {AuthResponse}
	 * Fresh auth response requiring password change.
	 */
	static get REQUIRES_PASSWORD_CHANGE(): AuthResponse
	{
		return {
			accessToken: "test-access-token-needs-change",
			expiresAt: dateService
				.fromMillis(dateService.nowTimestamp() + 3600000)
				.toISOString(),
			email: "expired@example.com",
			fullName: "Expired Password User",
			requiresPasswordChange: true,
			requiresMfa: false
		};
	}

	/**
	 * Create a custom auth response with optional overrides.
	 *
	 * @param {Partial<AuthResponse>} overrides
	 * Partial auth response properties to override.
	 * @returns {AuthResponse}
	 * Auth response with merged properties.
	 *
	 * @example
	 * const expiredToken = AuthFixtures.createResponse({ expiresAt: dateService.now() });
	 */
	static createResponse(overrides?: Partial<AuthResponse>): AuthResponse
	{
		return { ...AuthFixtures.SUCCESS_RESPONSE, ...overrides };
	}
}

/**
 * Login request fixture factory.
 * Provides consistent test data for login flows.
 */
export class LoginFixtures
{
	/**
	 * Standard valid login request.
	 *
	 * @type {LoginRequest}
	 */
	static readonly VALID_REQUEST: LoginRequest =
		{
			usernameOrEmail: "testuser",
			password: "ValidP@ssw0rd!",
			rememberMe: false
		};

	/**
	 * Login request with remember me enabled.
	 *
	 * @type {LoginRequest}
	 */
	static readonly REMEMBER_ME_REQUEST: LoginRequest =
		{
			usernameOrEmail: "testuser",
			password: "ValidP@ssw0rd!",
			rememberMe: true
		};

	/**
	 * Create a custom login request with optional overrides.
	 *
	 * @param {Partial<LoginRequest>} overrides
	 * Partial login request properties to override.
	 * @returns {LoginRequest}
	 * Login request with merged properties.
	 */
	static create(overrides?: Partial<LoginRequest>): LoginRequest
	{
		return { ...LoginFixtures.VALID_REQUEST, ...overrides };
	}
}

/**
 * Registration request fixture factory.
 * Provides consistent test data for registration flows.
 */
export class RegisterFixtures
{
	/**
	 * Standard valid registration request.
	 *
	 * @type {RegisterRequest}
	 */
	static readonly VALID_REQUEST: RegisterRequest =
		{
			username: "newuser",
			email: "newuser@example.com",
			fullName: "New User",
			password: "ValidP@ssw0rd!"
		};

	/**
	 * Create a custom registration request with optional overrides.
	 *
	 * @param {Partial<RegisterRequest>} overrides
	 * Partial registration request properties to override.
	 * @returns {RegisterRequest}
	 * Registration request with merged properties.
	 */
	static create(overrides?: Partial<RegisterRequest>): RegisterRequest
	{
		return { ...RegisterFixtures.VALID_REQUEST, ...overrides };
	}
}

/**
 * Complete registration fixture factory.
 * Provides test data for completing registration after email verification.
 */
export class CompleteRegistrationFixtures
{
	/**
	 * Standard valid completion request.
	 *
	 * @type {CompleteRegistrationRequest}
	 */
	static readonly VALID_REQUEST: CompleteRegistrationRequest =
		{
			token: "valid-registration-token-12345",
			username: "newuser",
			password: "ValidP@ssw0rd!"
		};

	/**
	 * Create a custom completion request with optional overrides.
	 *
	 * @param {Partial<CompleteRegistrationRequest>} overrides
	 * Partial completion request properties to override.
	 * @returns {CompleteRegistrationRequest}
	 * Completion request with merged properties.
	 */
	static create(overrides?: Partial<CompleteRegistrationRequest>): CompleteRegistrationRequest
	{
		return { ...CompleteRegistrationFixtures.VALID_REQUEST, ...overrides };
	}
}

/**
 * Password change request fixture factory.
 * Provides test data for password change flows.
 */
export class ChangePasswordFixtures
{
	/**
	 * Standard valid password change request.
	 *
	 * @type {ChangePasswordRequest}
	 */
	static readonly VALID_REQUEST: ChangePasswordRequest =
		{
			currentPassword: "OldP@ssw0rd!",
			newPassword: "NewP@ssw0rd!"
		};

	/**
	 * Create a custom password change request with optional overrides.
	 *
	 * @param {Partial<ChangePasswordRequest>} overrides
	 * Partial change password request properties to override.
	 * @returns {ChangePasswordRequest}
	 * Change password request with merged properties.
	 */
	static create(overrides?: Partial<ChangePasswordRequest>): ChangePasswordRequest
	{
		return { ...ChangePasswordFixtures.VALID_REQUEST, ...overrides };
	}
}

/**
 * Forgot password request fixture factory.
 * Provides test data for password reset flows.
 */
export class ForgotPasswordFixtures
{
	/**
	 * Standard valid forgot password request.
	 *
	 * @type {ForgotPasswordRequest}
	 */
	static readonly VALID_REQUEST: ForgotPasswordRequest =
		{
			email: "test@example.com"
		};

	/**
	 * Create a custom forgot password request with optional overrides.
	 *
	 * @param {Partial<ForgotPasswordRequest>} overrides
	 * Partial forgot password request properties to override.
	 * @returns {ForgotPasswordRequest}
	 * Forgot password request with merged properties.
	 */
	static create(overrides?: Partial<ForgotPasswordRequest>): ForgotPasswordRequest
	{
		return { ...ForgotPasswordFixtures.VALID_REQUEST, ...overrides };
	}
}

/**
 * Set password request fixture factory.
 * Provides test data for setting password with reset token.
 */
export class SetPasswordFixtures
{
	/**
	 * Standard valid set password request.
	 *
	 * @type {SetPasswordRequest}
	 */
	static readonly VALID_REQUEST: SetPasswordRequest =
		{
			token: "valid-reset-token-12345",
			newPassword: "NewP@ssw0rd!"
		};

	/**
	 * Create a custom set password request with optional overrides.
	 *
	 * @param {Partial<SetPasswordRequest>} overrides
	 * Partial set password request properties to override.
	 * @returns {SetPasswordRequest}
	 * Set password request with merged properties.
	 */
	static create(overrides?: Partial<SetPasswordRequest>): SetPasswordRequest
	{
		return { ...SetPasswordFixtures.VALID_REQUEST, ...overrides };
	}
}
