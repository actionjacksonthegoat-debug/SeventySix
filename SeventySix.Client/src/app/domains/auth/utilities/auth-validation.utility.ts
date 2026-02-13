import { ValidationResult } from "@auth/models";
import {
	EMAIL_VALIDATION,
	PASSWORD_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants";
import { isNullOrUndefined, isNullOrWhitespace } from "@shared/utilities/null-check.utility";

/**
 * Validates an email address format.
 *
 * @param {string | undefined} email
 * The email address to validate.
 *
 * @returns {ValidationResult}
 * Validation result with error message if invalid.
 */
export function validateEmail(email: string | undefined): ValidationResult
{
	if (isNullOrWhitespace(email))
	{
		return {
			valid: false,
			errorMessage: "Email is required."
		};
	}

	if (!EMAIL_VALIDATION.PATTERN.test(email!))
	{
		return {
			valid: false,
			errorMessage: "Please enter a valid email address."
		};
	}

	return { valid: true };
}

/**
 * Validates a username against the auth domain rules.
 */
export function validateUsername(username: string | undefined): ValidationResult
{
	if (isNullOrUndefined(username) || username.length < USERNAME_VALIDATION.MIN_LENGTH)
	{
		return {
			valid: false,
			errorMessage: `Username must be at least ${USERNAME_VALIDATION.MIN_LENGTH} characters.`
		};
	}

	if (!USERNAME_VALIDATION.PATTERN.test(username))
	{
		return {
			valid: false,
			errorMessage: "Username can only contain letters, numbers, and underscores."
		};
	}

	return { valid: true };
}

/**
 * Validates a password meets the auth domain requirements.
 * Rules match server-side PasswordValidationExtensions.ApplyPasswordRules().
 *
 * @param {string | undefined} password
 * The password to validate.
 *
 * @returns {ValidationResult}
 * Validation result with the first failing rule's error message, or valid.
 */
export function validatePassword(password: string | undefined): ValidationResult
{
	if (isNullOrUndefined(password) || password.length < PASSWORD_VALIDATION.MIN_LENGTH)
	{
		return {
			valid: false,
			errorMessage: `Password must be at least ${PASSWORD_VALIDATION.MIN_LENGTH} characters.`
		};
	}

	if (password.length > PASSWORD_VALIDATION.MAX_LENGTH)
	{
		return {
			valid: false,
			errorMessage: `Password must not exceed ${PASSWORD_VALIDATION.MAX_LENGTH} characters.`
		};
	}

	if (PASSWORD_VALIDATION.REQUIRE_UPPERCASE && !PASSWORD_VALIDATION.UPPERCASE_PATTERN.test(password))
	{
		return {
			valid: false,
			errorMessage: "Password must contain at least one uppercase letter."
		};
	}

	if (PASSWORD_VALIDATION.REQUIRE_LOWERCASE && !PASSWORD_VALIDATION.LOWERCASE_PATTERN.test(password))
	{
		return {
			valid: false,
			errorMessage: "Password must contain at least one lowercase letter."
		};
	}

	if (PASSWORD_VALIDATION.REQUIRE_DIGIT && !PASSWORD_VALIDATION.DIGIT_PATTERN.test(password))
	{
		return {
			valid: false,
			errorMessage: "Password must contain at least one digit."
		};
	}

	if (PASSWORD_VALIDATION.REQUIRE_SPECIAL_CHAR && !PASSWORD_VALIDATION.SPECIAL_CHAR_PATTERN.test(password))
	{
		return {
			valid: false,
			errorMessage: "Password must contain at least one special character."
		};
	}

	return { valid: true };
}

/**
 * Validates that two password entries match.
 */
export function validatePasswordsMatch(password: string, confirmPassword: string): ValidationResult
{
	if (password !== confirmPassword)
	{
		return {
			valid: false,
			errorMessage: "Passwords do not match."
		};
	}

	return { valid: true };
}

/**
 * Validates a registration form: username + password + confirmPassword.
 * Returns the first failing validation result, or valid if all pass.
 */
export function validateRegistrationForm(
	username: string | undefined,
	password: string | undefined,
	confirmPassword: string): ValidationResult
{
	const usernameResult: ValidationResult =
		validateUsername(username);
	if (!usernameResult.valid)
	{
		return usernameResult;
	}

	const passwordResult: ValidationResult =
		validatePassword(password);
	if (!passwordResult.valid)
	{
		return passwordResult;
	}

	return validatePasswordsMatch(
		password ?? "",
		confirmPassword);
}
