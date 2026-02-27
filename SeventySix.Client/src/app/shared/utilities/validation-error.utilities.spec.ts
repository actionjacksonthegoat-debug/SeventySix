import { FormControl, Validators } from "@angular/forms";
import { getValidationError } from "./validation-error.utilities";

describe("getValidationError",
	() =>
	{
		it("should return null when control has no errors",
			() =>
			{
				// Arrange
				const control: FormControl =
					new FormControl("valid");

				// Act
				const result: string | null =
					getValidationError(control, "Field");

				// Assert
				expect(result)
					.toBeNull();
			});

		it("should return required message with field label",
			() =>
			{
				// Arrange
				const control: FormControl =
					new FormControl("", Validators.required);

				// Act
				const result: string | null =
					getValidationError(control, "Email");

				// Assert
				expect(result)
					.toBe("Email is required");
			});

		it("should return minlength message with character count",
			() =>
			{
				// Arrange
				const control: FormControl =
					new FormControl(
						"ab",
						Validators.minLength(3));

				// Act
				const result: string | null =
					getValidationError(control, "Username");

				// Assert
				expect(result)
					.toBe("Username must be at least 3 characters");
			});

		it("should return null when control has empty errors object",
			() =>
			{
				// Arrange
				const control: FormControl =
					new FormControl("");
				control.setErrors({});

				// Act
				const result: string | null =
					getValidationError(control, "Field");

				// Assert
				expect(result)
					.toBeNull();
			});

		it("should return custom message from errorValue.message property",
			() =>
			{
				// Arrange
				const control: FormControl =
					new FormControl("");
				control.setErrors(
					{
						customValidator: {
							message: "Custom validation failed"
						}
					});

				// Act
				const result: string | null =
					getValidationError(control, "Field");

				// Assert
				expect(result)
					.toBe("Custom validation failed");
			});

		it("should return fallback invalid message for unknown error without message property",
			() =>
			{
				// Arrange
				const control: FormControl =
					new FormControl("");
				control.setErrors(
					{
						unknownError: true
					});

				// Act
				const result: string | null =
					getValidationError(control, "Email");

				// Assert
				expect(result)
					.toBe("Email is invalid");
			});
	});