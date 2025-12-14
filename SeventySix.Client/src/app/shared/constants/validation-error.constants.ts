/**
 * Validation error message templates.
 * Use {field} placeholder for field name substitution.
 * Functions receive the Angular validation error object as params.
 */
export type ValidationMessageTemplate =
	| string
	| ((params: Record<string, unknown>) => string);

export const VALIDATION_ERROR_MESSAGES: Record<
	string,
	ValidationMessageTemplate> =
	{
		required: "{field} is required",
		email: "Invalid email format",
		minlength: (params: Record<string, unknown>) =>
			`{field} must be at least ${params["requiredLength"]} characters`,
		maxlength: (params: Record<string, unknown>) =>
			`{field} must not exceed ${params["requiredLength"]} characters`,
		pattern: "{field} format is invalid",
		min: (params: Record<string, unknown>) =>
			`{field} must be at least ${params["min"]}`,
		max: (params: Record<string, unknown>) =>
			`{field} must not exceed ${params["max"]}`,
		usernameTaken: "Username is already taken"
	};
