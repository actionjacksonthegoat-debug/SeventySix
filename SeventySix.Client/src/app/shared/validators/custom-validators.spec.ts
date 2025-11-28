import { TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { provideZonelessChangeDetection } from "@angular/core";
import {
	dateRangeValidator,
	temperatureRangeValidator,
	stringLengthValidator,
	futureDateValidator,
	requiredIfValidator,
	matchFieldValidator
} from "./custom-validators";

describe("Custom Validators", () =>
{
	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()]
		});
	});

	describe("dateRangeValidator", () =>
	{
		it("should return null for valid date within range", () =>
		{
			const min: Date = new Date("2024-01-01");
			const max: Date = new Date("2024-12-31");
			const validator = dateRangeValidator(min, max);
			const control = new FormControl(new Date("2024-06-15"));

			expect(validator(control)).toBeNull();
		});

		it("should return error for date before minimum", () =>
		{
			const min: Date = new Date("2024-01-01");
			const validator = dateRangeValidator(min);
			const control = new FormControl(new Date("2023-12-31"));

			expect(validator(control)).not.toBeNull();
		});

		it("should return null for empty value", () =>
		{
			const validator = dateRangeValidator();
			const control = new FormControl(null);

			expect(validator(control)).toBeNull();
		});
	});

	describe("temperatureRangeValidator", () =>
	{
		it("should return null for valid temperature", () =>
		{
			const validator = temperatureRangeValidator(-100, 100);
			const control = new FormControl(25);

			expect(validator(control)).toBeNull();
		});

		it("should return error for temperature below minimum", () =>
		{
			const validator = temperatureRangeValidator(-100, 100);
			const control = new FormControl(-150);

			const result = validator(control);
			expect(result).not.toBeNull();
			expect(result?.["temperatureRange"]).toBeDefined();
		});

		it("should return error for non-numeric value", () =>
		{
			const validator = temperatureRangeValidator();
			const control = new FormControl("invalid");

			const result = validator(control);
			expect(result).not.toBeNull();
		});

		it("should return null for empty value", () =>
		{
			const validator = temperatureRangeValidator();
			const control = new FormControl(null);

			expect(validator(control)).toBeNull();
		});
	});

	describe("stringLengthValidator", () =>
	{
		it("should return null for valid length", () =>
		{
			const validator = stringLengthValidator(2, 10);
			const control = new FormControl("valid");

			expect(validator(control)).toBeNull();
		});

		it("should return error for string too short", () =>
		{
			const validator = stringLengthValidator(5);
			const control = new FormControl("abc");

			expect(validator(control)).not.toBeNull();
		});

		it("should return error for string too long", () =>
		{
			const validator = stringLengthValidator(undefined, 5);
			const control = new FormControl("toolongstring");

			expect(validator(control)).not.toBeNull();
		});

		it("should return null for empty value", () =>
		{
			const validator = stringLengthValidator(5);
			const control = new FormControl(null);

			expect(validator(control)).toBeNull();
		});
	});

	describe("futureDateValidator", () =>
	{
		it("should return null for future date", () =>
		{
			const validator = futureDateValidator();
			const futureDate: Date = new Date();
			futureDate.setDate(futureDate.getDate() + 1);
			const control = new FormControl(futureDate);

			expect(validator(control)).toBeNull();
		});

		it("should return error for past date", () =>
		{
			const validator = futureDateValidator();
			const pastDate: Date = new Date("2020-01-01");
			const control = new FormControl(pastDate);

			expect(validator(control)).not.toBeNull();
		});

		it("should return null for empty value", () =>
		{
			const validator = futureDateValidator();
			const control = new FormControl(null);

			expect(validator(control)).toBeNull();
		});
	});

	describe("requiredIfValidator", () =>
	{
		it("should return error when dependent field has value but control is empty", () =>
		{
			const validator = requiredIfValidator("otherField");
			const control = new FormControl("");
			const parent = new FormControl();
			Object.defineProperty(control, "parent", {
				get: () => ({
					get: () => new FormControl("value")
				})
			});

			const result = validator(control);
			expect(result).not.toBeNull();
		});

		it("should return null when control has no parent", () =>
		{
			const validator = requiredIfValidator("otherField");
			const control = new FormControl("");

			expect(validator(control)).toBeNull();
		});
	});

	describe("matchFieldValidator", () =>
	{
		it("should return error when fields do not match", () =>
		{
			const validator = matchFieldValidator("password");
			const control = new FormControl("value1");
			Object.defineProperty(control, "parent", {
				get: () => ({
					get: () => new FormControl("value2")
				})
			});

			const result = validator(control);
			expect(result).not.toBeNull();
		});

		it("should return null when control has no parent", () =>
		{
			const validator = matchFieldValidator("password");
			const control = new FormControl("value");

			expect(validator(control)).toBeNull();
		});
	});
});
