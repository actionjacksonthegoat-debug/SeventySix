/**
 * HTTP Error Utilities
 * Centralized utilities for HTTP error extraction and conversion.
 * Provides single source of truth for error handling logic.
 */

import { HttpErrorResponse } from "@angular/common/http";
import {
	HttpError,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	NetworkError
} from "@core/models/errors";

/**
 * Extracts request URL from error object.
 * Falls back to window.location.href if not available.
 */
export function extractRequestUrl(error?: Error | HttpErrorResponse): string
{
	// Try HttpErrorResponse first
	if (error instanceof HttpErrorResponse && error.url)
	{
		return error.url;
	}

	// Try HttpError (our custom error class)
	if (error instanceof HttpError && error.url)
	{
		return error.url;
	}

	// Fallback to current URL
	return window.location.href;
}

/**
 * Extracts HTTP request method from error object.
 * Returns undefined if method cannot be determined.
 */
export function extractRequestMethod(
	error?: Error | HttpErrorResponse
): string | undefined
{
	// Try HttpError (our custom error class)
	if (error instanceof HttpError && error.method)
	{
		return error.method;
	}

	// HttpErrorResponse doesn't include method by default
	return undefined;
}

/**
 * Extracts HTTP status code from error object.
 * Returns undefined if status code cannot be determined.
 */
export function extractStatusCode(
	error?: Error | HttpErrorResponse
): number | undefined
{
	// Try HttpErrorResponse first
	if (error instanceof HttpErrorResponse)
	{
		return error.status;
	}

	// Try HttpError (our custom error class)
	if (error instanceof HttpError && error.statusCode)
	{
		return error.statusCode;
	}

	return undefined;
}

/**
 * Converts HttpErrorResponse to application-specific error.
 * Follows error type hierarchy based on HTTP status codes.
 */
export function convertToAppError(
	error: HttpErrorResponse,
	url: string,
	method: string
): Error
{
	// Network errors (status 0)
	if (error.status === 0)
	{
		return new NetworkError("Unable to connect to the server");
	}

	// Validation errors (400 with validation details)
	if (error.status === 400 && error.error?.errors)
	{
		return new ValidationError("Validation failed", error.error.errors);
	}

	// Not found errors
	if (error.status === 404)
	{
		return new NotFoundError(error.error?.title || "Resource not found");
	}

	// Unauthorized errors
	if (error.status === 401 || error.status === 403)
	{
		return new UnauthorizedError(
			error.error?.title || "Unauthorized access"
		);
	}

	// Generic HTTP errors
	return new HttpError(
		error.error?.title || error.message || "HTTP request failed",
		error.status,
		url,
		method
	);
}
