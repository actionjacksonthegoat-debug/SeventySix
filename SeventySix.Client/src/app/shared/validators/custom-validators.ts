import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { DateService } from "@shared/services";
import { inject } from "@angular/core";
import { isNullOrUndefined, isNullOrWhitespace } from "@shared/utilities/null-check.utility";

/**
 * Validator for date ranges.
 * Ensures a control's value falls within the provided min/max bounds.
 * @param {Date | undefined} min
 * Minimum allowed date (inclusive). When omitted, no lower bound is applied.
 * @param {Date | undefined} max
 * Maximum allowed date (inclusive). When omitted, no upper bound is applied.
 * @returns {ValidatorFn}
 * Angular `ValidatorFn` that returns `ValidationErrors` when validation fails or `null` when valid.
 */
export function dateRangeValidator(min?: Date, max?: Date): ValidatorFn
{
	// Inject DateService at factory creation time (prevents calling inject() inside the per-call validator)
	const dateService: DateService =
		inject(DateService);

	return (control: AbstractControl): ValidationErrors | null =>
	{
		if (isNullOrUndefined(control.value))
		{
			return null;
		}

		const value: Date =
			typeof control.value === "string"
				? dateService.parseUTC(control.value)
				: (control.value as Date);

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
 * Ensures a control's string length is within the optional min/max bounds.
 * @param {number | undefined} min
 * Minimum allowed length (inclusive). When omitted, no minimum is enforced.
 * @param {number | undefined} max
 * Maximum allowed length (inclusive). When omitted, no maximum is enforced.
 * @returns {ValidatorFn}
 * Angular `ValidatorFn` that returns `ValidationErrors` when validation fails or `null` when valid.
 */
export function stringLengthValidator(min?: number, max?: number): ValidatorFn
{
	return (control: AbstractControl): ValidationErrors | null =>
	{
		if (isNullOrUndefined(control.value))
		{
			return null;
		}

		const length: number =
			String(control.value).length;

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
 * Ensures a control's date value is today or in the future.
 * @returns {ValidatorFn}
 * Angular `ValidatorFn` that returns `ValidationErrors` when the date is before today or `null` when valid.
 */
export function futureDateValidator(): ValidatorFn
{
	// Inject DateService at factory creation time (prevents calling inject() inside the per-call validator)
	const dateService: DateService =
		inject(DateService);

	return (control: AbstractControl): ValidationErrors | null =>
	{
		if (isNullOrUndefined(control.value))
		{
			return null;
		}

		const value: Date =
			typeof control.value === "string" ? dateService.parseUTC(control.value) : (control.value as Date);
		const today: Date =
			dateService.nowDate();
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
 * Validator that enforces a field to be required when another field has a value.
 * @param {string} dependentFieldName
 * The name of the dependent form control to inspect in the same parent FormGroup.
 * @returns {ValidatorFn}
 * Angular `ValidatorFn` that returns `ValidationErrors` when the target field is empty while the dependent field has a value, or `null` when valid.
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
 * Validator that requires a control's value to match another control's value (e.g., password confirmation).
 * @param {string} matchFieldName
 * The name of the control to match against within the same parent FormGroup.
 * @returns {ValidatorFn}
 * Angular `ValidatorFn` that returns `ValidationErrors` when values differ or `null` when they match.
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
