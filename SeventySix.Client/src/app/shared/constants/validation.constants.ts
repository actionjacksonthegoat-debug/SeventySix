/**
 * Shared validation constants for form fields.
 * Mirrors server-side validation rules to prevent client/server drift.
 *
 * Server Source: SeventySix/Identity/Validators/UserFieldValidationExtensions.cs
 * Server Source: SeventySix/Identity/Validators/PasswordValidationExtensions.cs
 *
 * @remarks
 * These constants must match the server-side FluentValidation rules exactly.
 * When updating validation rules on the server, update these constants accordingly.
 */

/**
 * Username validation constants.
 * Server: UserFieldValidationExtensions.ApplyUsernameRules()
 */
export const USERNAME_VALIDATION: {
	readonly MIN_LENGTH: 3;
	readonly MAX_LENGTH: 50;
	readonly PATTERN: RegExp;
	readonly PATTERN_STRING: "^[a-zA-Z0-9_]+$";
} =
	{
		MIN_LENGTH: 3,
		MAX_LENGTH: 50,
		PATTERN: /^[a-zA-Z0-9_]+$/,
		PATTERN_STRING: "^[a-zA-Z0-9_]+$"
	};

/**
 * Email validation constants.
 * Server: UserFieldValidationExtensions.ApplyEmailRules()
 */
export const EMAIL_VALIDATION: {
	readonly MAX_LENGTH: 255;
	readonly PATTERN: RegExp;
	readonly PATTERN_STRING: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
} =
	{
		MAX_LENGTH: 255,
		PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		PATTERN_STRING: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
	};

/**
 * Full name validation constants.
 * Server: UserFieldValidationExtensions.ApplyFullNameRules()
 */
export const FULL_NAME_VALIDATION: {
	readonly MAX_LENGTH: 100;
} =
	{
		MAX_LENGTH: 100
	};

/**
 * Password validation constants.
 * Server: PasswordValidationExtensions.ApplyPasswordRules()
 */
export const PASSWORD_VALIDATION: {
	readonly MIN_LENGTH: 8;
	readonly MAX_LENGTH: 100;
	readonly REQUIRE_UPPERCASE: true;
	readonly REQUIRE_LOWERCASE: true;
	readonly REQUIRE_DIGIT: true;
	readonly UPPERCASE_PATTERN: RegExp;
	readonly LOWERCASE_PATTERN: RegExp;
	readonly DIGIT_PATTERN: RegExp;
} =
	{
		MIN_LENGTH: 8,
		MAX_LENGTH: 100,
		REQUIRE_UPPERCASE: true,
		REQUIRE_LOWERCASE: true,
		REQUIRE_DIGIT: true,
		UPPERCASE_PATTERN: /[A-Z]/,
		LOWERCASE_PATTERN: /[a-z]/,
		DIGIT_PATTERN: /\d/
	};

/**
 * Combined validation for username or email fields (e.g., login).
 * Server: LoginRequestValidator
 */
export const USERNAME_OR_EMAIL_VALIDATION: {
	readonly MAX_LENGTH: 255;
} =
	{
		MAX_LENGTH: 255
	};
