/**
 * Base application error class.
 * All custom errors should extend this class.
 */
export class AppError extends Error
{
	/**
	 * Create a new application error carrying an optional code and HTTP status.
	 * @param {string} message
	 * Human-readable error message.
	 * @param {string | undefined} code
	 * Optional machine-readable error code.
	 * @param {number | undefined} statusCode
	 * Optional HTTP status code associated with the error.
	 * @returns {void}
	 */
	constructor(
		message: string,
		public readonly code?: string,
		public readonly statusCode?: number)
	{
		super(message);
		this.name = "AppError";
		Object.setPrototypeOf(this, AppError.prototype);
	}
}

/**
 * HTTP-related error.
 * Thrown when HTTP requests fail.
 */
export class HttpError extends AppError
{
	/**
	 * Represents an HTTP-related error with status and optional request context.
	 * @param {string} message
	 * Human-readable error message.
	 * @param {number} statusCode
	 * HTTP status code associated with the error.
	 * @param {string | undefined} url
	 * Optional request URL that produced the error.
	 * @param {string | undefined} method
	 * Optional HTTP method (GET, POST, etc.) associated with the error.
	 * @returns {void}
	 */
	constructor(
		message: string,
		public override readonly statusCode: number,
		public readonly url?: string,
		public readonly method?: string)
	{
		super(message, "HTTP_ERROR", statusCode);
		this.name = "HttpError";
		Object.setPrototypeOf(this, HttpError.prototype);
	}
}

/**
 * Validation error.
 * Thrown when input validation fails.
 */
export class ValidationError extends AppError
{
	/**
	 * Validation error containing field-level validation messages.
	 * @param {string} message
	 * Human-readable summary message.
	 * @param {Record<string, string[]>} errors
	 * Map of field names to an array of validation messages.
	 * @returns {void}
	 */
	constructor(
		message: string,
		public readonly errors: Record<string, string[]>)
	{
		super(message, "VALIDATION_ERROR", 400);
		this.name = "ValidationError";
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

/**
 * Not found error.
 * Thrown when a resource is not found.
 */
export class NotFoundError extends AppError
{
	/**
	 * Error thrown when a requested resource does not exist.
	 * @param {string} message
	 * Human-readable message (defaults to "Resource not found").
	 * @param {string | undefined} resource
	 * Optional resource identifier or name related to the error.
	 * @returns {void}
	 */
	constructor(
		message: string = "Resource not found",
		public readonly resource?: string)
	{
		super(message, "NOT_FOUND", 404);
		this.name = "NotFoundError";
		Object.setPrototypeOf(this, NotFoundError.prototype);
	}
}

/**
 * Unauthorized error.
 * Thrown when user is not authorized.
 */
export class UnauthorizedError extends AppError
{
	/**
	 * Error indicating the current user is not authorized to perform an action.
	 * @param {string} message
	 * Human-readable message (defaults to "Unauthorized access").
	 * @returns {void}
	 */
	constructor(message: string = "Unauthorized access")
	{
		super(message, "UNAUTHORIZED", 401);
		this.name = "UnauthorizedError";
		Object.setPrototypeOf(this, UnauthorizedError.prototype);
	}
}

/**
 * Network error.
 * Thrown when network connectivity issues occur.
 */
export class NetworkError extends AppError
{
	/**
	 * Error for network connectivity issues.
	 * @param {string} message
	 * Human-readable message (defaults to "Network error occurred").
	 * @returns {void}
	 */
	constructor(message: string = "Network error occurred")
	{
		super(message, "NETWORK_ERROR");
		this.name = "NetworkError";
		Object.setPrototypeOf(this, NetworkError.prototype);
	}
}
