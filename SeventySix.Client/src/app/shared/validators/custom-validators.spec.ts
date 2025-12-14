import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { DateService } from "@infrastructure/services";
import {
	dateRangeValidator,
	futureDateValidator,
	matchFieldValidator,
	requiredIfValidator,
	stringLengthValidator
} from "./custom-validators";

describe("Custom Validators",
	() =>
	{
		let dateService: DateService;

		beforeEach(
			() =>
			{
				dateService =
					new DateService();
				TestBed.configureTestingModule(
					{
						providers: [provideZonelessChangeDetection()]
					});
			});

		describe("dateRangeValidator",
			() =>
			{
				it("should return null for valid date within range",
					() =>
					{
						const min: Date =
							new Date("2024-01-01");
						const max: Date =
							new Date("2024-12-31");
						const validator: ValidatorFn =
							dateRangeValidator(min, max);
						const control: FormControl =
							new FormControl(new Date("2024-06-15"));

						expect(validator(control))
						.toBeNull();
					});

				it("should return error for date before minimum",
					() =>
					{
						const min: Date =
							new Date("2024-01-01");
						const validator: ValidatorFn =
							dateRangeValidator(min);
						const control: FormControl =
							new FormControl(new Date("2023-12-31"));

						expect(validator(control)).not.toBeNull();
					});

				it("should return null for empty value",
					() =>
					{
						const validator: ValidatorFn =
							dateRangeValidator();
						const control: FormControl =
							new FormControl(null);

						expect(validator(control))
						.toBeNull();
					});
			});

		describe("stringLengthValidator",
			() =>
			{
				it("should return null for valid length",
					() =>
					{
						const validator: ValidatorFn =
							stringLengthValidator(2, 10);
						const control: FormControl =
							new FormControl("valid");

						expect(validator(control))
						.toBeNull();
					});

				it("should return error for string too short",
					() =>
					{
						const validator: ValidatorFn =
							stringLengthValidator(5);
						const control: FormControl =
							new FormControl("abc");

						expect(validator(control)).not.toBeNull();
					});

				it("should return error for string too long",
					() =>
					{
						const validator: ValidatorFn =
							stringLengthValidator(undefined, 5);
						const control: FormControl =
							new FormControl("toolongstring");

						expect(validator(control)).not.toBeNull();
					});

				it("should return null for empty value",
					() =>
					{
						const validator: ValidatorFn =
							stringLengthValidator(5);
						const control: FormControl =
							new FormControl(null);

						expect(validator(control))
						.toBeNull();
					});
			});

		describe("futureDateValidator",
			() =>
			{
				it("should return null for future date",
					() =>
					{
						const validator: ValidatorFn =
							futureDateValidator(dateService);
						const futureDate: Date =
							new Date();
						futureDate.setDate(futureDate.getDate() + 1);
						const control: FormControl =
							new FormControl(futureDate);

						expect(validator(control))
						.toBeNull();
					});

				it("should return error for past date",
					() =>
					{
						const validator: ValidatorFn =
							futureDateValidator(dateService);
						const pastDate: Date =
							new Date("2020-01-01");
						const control: FormControl =
							new FormControl(pastDate);

						expect(validator(control)).not.toBeNull();
					});

				it("should return null for empty value",
					() =>
					{
						const validator: ValidatorFn =
							futureDateValidator(dateService);
						const control: FormControl =
							new FormControl(null);

						expect(validator(control))
						.toBeNull();
					});
			});

		describe("requiredIfValidator",
			() =>
			{
				it("should return error when dependent field has value but control is empty",
					() =>
					{
						const validator: ValidatorFn =
							requiredIfValidator("otherField");
						const control: FormControl =
							new FormControl("");
						Object.defineProperty(control, "parent",
							{
								get: () => ({
									get: () => new FormControl("value")
								})
							});

						const result: ValidationErrors | null =
							validator(control);
						expect(result).not.toBeNull();
					});

				it("should return null when control has no parent",
					() =>
					{
						const validator: ValidatorFn =
							requiredIfValidator("otherField");
						const control: FormControl =
							new FormControl("");

						expect(validator(control))
						.toBeNull();
					});
			});

		describe("matchFieldValidator",
			() =>
			{
				it("should return error when fields do not match",
					() =>
					{
						const validator: ValidatorFn =
							matchFieldValidator("password");
						const control: FormControl =
							new FormControl("value1");
						Object.defineProperty(control, "parent",
							{
								get: () => ({
									get: () => new FormControl("value2")
								})
							});

						const result: ValidationErrors | null =
							validator(control);
						expect(result).not.toBeNull();
					});

				it("should return null when control has no parent",
					() =>
					{
						const validator: ValidatorFn =
							matchFieldValidator("password");
						const control: FormControl =
							new FormControl("value");

						expect(validator(control))
						.toBeNull();
					});
			});
	});
