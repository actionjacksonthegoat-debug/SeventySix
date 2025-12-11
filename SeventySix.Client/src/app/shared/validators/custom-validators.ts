import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { DateService } from "@infrastructure/services";
import { isNullOrUndefined, isNullOrWhitespace } from "@infrastructure/utils/null-check.utility";

/**
 * Validator for date ranges.
 * Ensures date is within min/max range.
 */
export function dateRangeValidator(min?: Date, max?: Date): ValidatorFn
{
	return (control: AbstractControl): ValidationErrors | null =>
	{
		if (isNullOrUndefined(control.value))
		{
			return null;
		}

		const value: Date = new Date(control.value);

		if (min && value < min)
		{
			return {
				dateRange: {
					min: min.toISOString(),
					actual: value.toISOString()
				}
			};
		}

		if (max && value > max)
		{
			return {
				dateRange: {
					max: max.toISOString(),
					actual: value.toISOString()
				}
			};
		}

		return null;
	};
}

/**
 * Validator for string length constraints.
 */
export function stringLengthValidator(min?: number, max?: number): ValidatorFn
{
	return (control: AbstractControl): ValidationErrors | null =>
	{
		if (isNullOrUndefined(control.value))
		{
			return null;
		}

		const length: number = String(control.value).length;

		if (min !== undefined && length < min)
		{
			return { stringLength: { min, actual: length } };
		}

		if (max !== undefined && length > max)
		{
			return { stringLength: { max, actual: length } };
		}

		return null;
	};
}

/**
 * Validator for future dates.
 * Ensures date is in the future.
 */
export function futureDateValidator(dateService: DateService): ValidatorFn
{
	return (control: AbstractControl): ValidationErrors | null =>
	{
		if (isNullOrUndefined(control.value))
		{
			return null;
		}

		const value: Date = new Date(control.value);
		const today: Date = dateService.parseUTC(dateService.now());
		today.setHours(0, 0, 0, 0);

		if (value < today)
		{
			return {
				futureDate: {
					message: "Date must be today or in the future",
					actual: value.toISOString()
				}
			};
		}

		return null;
	};
}

/**
 * Validator for required if another field has value.
 */
export function requiredIfValidator(dependentFieldName: string): ValidatorFn
{
	return (control: AbstractControl): ValidationErrors | null =>
	{
		if (isNullOrUndefined(control.parent))
		{
			return null;
		}

		const dependentControl: AbstractControl | null =
			control.parent.get(dependentFieldName);

		if (dependentControl?.value && isNullOrWhitespace(control.value))
		{
			return {
				requiredIf: {
					message: `This field is required when ${dependentFieldName} has a value`
				}
			};
		}

		return null;
	};
}

/**
 * Validator for matching fields (e.g., password confirmation).
 */
export function matchFieldValidator(matchFieldName: string): ValidatorFn
{
	return (control: AbstractControl): ValidationErrors | null =>
	{
		if (isNullOrUndefined(control.parent))
		{
			return null;
		}

		const matchControl: AbstractControl | null =
			control.parent.get(matchFieldName);

		if (matchControl && control.value !== matchControl.value)
		{
			return {
				matchField: {
					message: `This field must match ${matchFieldName}`
				}
			};
		}

		return null;
	};
}
