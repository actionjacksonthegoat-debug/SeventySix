import { ValidationResult } from "@auth/models/validation-result.model";
import {
	PASSWORD_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants";
import {
	describe,
	expect,
	it
} from "vitest";
import {
	validateEmail,
	validatePassword,
	validatePasswordsMatch,
	validateRegistrationForm,
	validateUsername
} from "./auth-validation.utility";

describe("validateEmail",
	() =>
	{
		it("should return invalid when email is undefined",
			() =>
			{
				const result: ValidationResult =
					validateEmail(undefined);

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe("Email is required.");
			});

		it("should return invalid when email is whitespace",
			() =>
			{
				const result: ValidationResult =
					validateEmail("   ");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe("Email is required.");
			});

		it("should return invalid when email format is incorrect",
			() =>
			{
				const result: ValidationResult =
					validateEmail("invalid-email");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe("Please enter a valid email address.");
			});

		it("should return valid for a correctly formatted email",
			() =>
			{
				const result: ValidationResult =
					validateEmail("user@example.com");

				expect(result.valid)
					.toBe(true);
				expect(result.errorMessage)
					.toBeUndefined();
			});
	});

describe("validateUsername",
	() =>
	{
		it("should return invalid when username is undefined",
			() =>
			{
				const result: ValidationResult =
					validateUsername(undefined);

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe(
						`Username must be at least ${USERNAME_VALIDATION.MIN_LENGTH} characters.`);
			});

		it("should return invalid when username is too short",
			() =>
			{
				const result: ValidationResult =
					validateUsername("ab");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe(
						`Username must be at least ${USERNAME_VALIDATION.MIN_LENGTH} characters.`);
			});

		it("should return invalid when username has invalid characters",
			() =>
			{
				const result: ValidationResult =
					validateUsername("user@name");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe(
						"Username can only contain letters, numbers, and underscores.");
			});

		it("should return valid for a valid username",
			() =>
			{
				const result: ValidationResult =
					validateUsername("valid_username_123");

				expect(result.valid)
					.toBe(true);
				expect(result.errorMessage)
					.toBeUndefined();
			});
	});

describe("validatePassword",
	() =>
	{
		it("should return invalid when password is undefined",
			() =>
			{
				const result: ValidationResult =
					validatePassword(undefined);

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe(
						`Password must be at least ${PASSWORD_VALIDATION.MIN_LENGTH} characters.`);
			});

		it("should return invalid when password is too short",
			() =>
			{
				const result: ValidationResult =
					validatePassword("short");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe(
						`Password must be at least ${PASSWORD_VALIDATION.MIN_LENGTH} characters.`);
			});

		it("should return invalid when password exceeds max length",
			() =>
			{
				const longPassword: string =
					"A1" + "a".repeat(99);

				const result: ValidationResult =
					validatePassword(longPassword);

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe(
						`Password must not exceed ${PASSWORD_VALIDATION.MAX_LENGTH} characters.`);
			});

		it("should return valid for a password meeting the length rules",
			() =>
			{
				const result: ValidationResult =
					validatePassword("ValidPass1abc");

				expect(result.valid)
					.toBe(true);
				expect(result.errorMessage)
					.toBeUndefined();
			});

		it("should return valid for a lowercase password when length requirement is met",
			() =>
			{
				const result: ValidationResult =
					validatePassword("lowercase123");

				expect(result.valid)
					.toBe(true);
				expect(result.errorMessage)
					.toBeUndefined();
			});

		it("should return valid for exact min length password",
			() =>
			{
				const result: ValidationResult =
					validatePassword("Abcdefghij1x");

				expect(result.valid)
					.toBe(true);
				expect(result.errorMessage)
					.toBeUndefined();
			});

		it("should return invalid when password is empty string",
			() =>
			{
				const result: ValidationResult =
					validatePassword("");

				expect(result.valid)
					.toBe(false);
			});
	});

describe("validatePasswordsMatch",
	() =>
	{
		it("should return invalid when passwords do not match",
			() =>
			{
				const result: ValidationResult =
					validatePasswordsMatch("password123", "password456");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe("Passwords do not match.");
			});

		it("should return valid when passwords match",
			() =>
			{
				const result: ValidationResult =
					validatePasswordsMatch("password123", "password123");

				expect(result.valid)
					.toBe(true);
				expect(result.errorMessage)
					.toBeUndefined();
			});
	});

describe("validateRegistrationForm",
	() =>
	{
		it("should return username error when username is invalid",
			() =>
			{
				const result: ValidationResult =
					validateRegistrationForm("ab", "validPassword123", "validPassword123");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toContain("Username");
			});

		it("should return password error when password is invalid",
			() =>
			{
				const result: ValidationResult =
					validateRegistrationForm("validUsername", "short", "short");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toContain("Password must be at least");
			});

		it("should return mismatch error when passwords don't match",
			() =>
			{
				const result: ValidationResult =
					validateRegistrationForm(
						"validUsername",
						"validPassword123",
						"differentPassword");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe("Passwords do not match.");
			});

		it("should return valid for a valid registration form",
			() =>
			{
				const result: ValidationResult =
					validateRegistrationForm(
						"validUsername",
						"validPassword123",
						"validPassword123");

				expect(result.valid)
					.toBe(true);
				expect(result.errorMessage)
					.toBeUndefined();
			});
	});