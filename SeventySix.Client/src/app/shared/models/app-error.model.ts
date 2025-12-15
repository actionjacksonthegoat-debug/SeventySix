/**
 * Base application error class.
 * All custom errors should extend this class.
 */
export class AppError extends Error
{
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
	constructor(message: string = "Network error occurred")
	{
		super(message, "NETWORK_ERROR");
		this.name = "NetworkError";
		Object.setPrototypeOf(this, NetworkError.prototype);
	}
}
