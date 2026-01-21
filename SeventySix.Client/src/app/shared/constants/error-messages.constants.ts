/**
 * Centralized error message constants for consistent user feedback.
 * Use these instead of inline error strings to ensure DRY principle
 * and easy localization in the future.
 */

/**
 * Error messages for CRUD operations.
 * @type {Readonly<object>}
 */
export const ERROR_MESSAGES: Readonly<{
	LOAD_FAILED: (entityName: string) => string;
	SAVE_FAILED: (entityName: string) => string;
	DELETE_FAILED: (entityName: string) => string;
	CREATE_FAILED: (entityName: string) => string;
	UPDATE_FAILED: (entityName: string) => string;
	FETCH_FAILED: (entityName: string) => string;
}> =
	{
		LOAD_FAILED: (entityName: string): string =>
			`Failed to load ${entityName}`,
		SAVE_FAILED: (entityName: string): string =>
			`Failed to save ${entityName}`,
		DELETE_FAILED: (entityName: string): string =>
			`Failed to delete ${entityName}`,
		CREATE_FAILED: (entityName: string): string =>
			`Failed to create ${entityName}`,
		UPDATE_FAILED: (entityName: string): string =>
			`Failed to update ${entityName}`,
		FETCH_FAILED: (entityName: string): string =>
			`Failed to fetch ${entityName}`
	} as const;

/**
 * Authentication error messages.
 * @type {Readonly<object>}
 */
export const AUTH_ERROR_MESSAGES: Readonly<{
	LOGIN_FAILED: string;
	SESSION_EXPIRED: string;
	UNAUTHORIZED: string;
	FORBIDDEN: string;
}> =
	{
		LOGIN_FAILED: "Login failed. Please check your credentials.",
		SESSION_EXPIRED: "Your session has expired. Please log in again.",
		UNAUTHORIZED: "You are not authorized to perform this action.",
		FORBIDDEN: "Access denied. You don't have permission to view this resource."
	} as const;

/**
 * Network error messages.
 * @type {Readonly<object>}
 */
export const NETWORK_ERROR_MESSAGES: Readonly<{
	CONNECTION_FAILED: string;
	TIMEOUT: string;
	SERVER_ERROR: string;
	SERVICE_UNAVAILABLE: string;
}> =
	{
		CONNECTION_FAILED: "Unable to connect to server. Please check your internet connection.",
		TIMEOUT: "Request timed out. Please try again.",
		SERVER_ERROR: "An unexpected server error occurred. Please try again later.",
		SERVICE_UNAVAILABLE: "Service is temporarily unavailable. Please try again later."
	} as const;

/**
 * Form validation error messages (dynamic with field names).
 * Use for runtime validation messages in forms.
 * @type {Readonly<object>}
 */
export const FORM_VALIDATION_MESSAGES: Readonly<{
	REQUIRED_FIELD: (fieldName: string) => string;
	INVALID_FORMAT: (fieldName: string) => string;
	MIN_LENGTH: (fieldName: string, minLength: number) => string;
	MAX_LENGTH: (fieldName: string, maxLength: number) => string;
}> =
	{
		REQUIRED_FIELD: (fieldName: string): string =>
			`${fieldName} is required`,
		INVALID_FORMAT: (fieldName: string): string =>
			`${fieldName} has an invalid format`,
		MIN_LENGTH: (
			fieldName: string,
			minLength: number): string =>
			`${fieldName} must be at least ${minLength} characters`,
		MAX_LENGTH: (
			fieldName: string,
			maxLength: number): string =>
			`${fieldName} cannot exceed ${maxLength} characters`
	} as const;
