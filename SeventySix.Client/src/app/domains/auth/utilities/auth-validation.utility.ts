import { ValidationResult } from "@auth/models";
import {
	PASSWORD_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

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
