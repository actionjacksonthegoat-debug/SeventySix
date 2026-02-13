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
	validatePassword,
	validatePasswordsMatch,
	validateRegistrationForm,
	validateUsername
} from "./auth-validation.utility";

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

		it("should return invalid when password is missing uppercase letter",
			() =>
			{
				const result: ValidationResult =
					validatePassword("password1!");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe(
						"Password must contain at least one uppercase letter.");
			});

		it("should return invalid when password is missing lowercase letter",
			() =>
			{
				const result: ValidationResult =
					validatePassword("PASSWORD1!");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe(
						"Password must contain at least one lowercase letter.");
			});

		it("should return invalid when password is missing digit",
			() =>
			{
				const result: ValidationResult =
					validatePassword("Passwords!");

				expect(result.valid)
					.toBe(false);
				expect(result.errorMessage)
					.toBe(
						"Password must contain at least one digit.");
			});

		it("should return valid for a password meeting all rules",
			() =>
			{
				const result: ValidationResult =
					validatePassword("ValidPass1");

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

		it("should return valid for exact min length password meeting all rules",
			() =>
			{
				const result: ValidationResult =
					validatePassword("Abcdef1x");

				expect(result.valid)
					.toBe(true);
				expect(result.errorMessage)
					.toBeUndefined();
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
