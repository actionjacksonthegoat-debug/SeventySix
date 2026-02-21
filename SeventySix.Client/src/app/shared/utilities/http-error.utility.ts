/**
 * HTTP Error Utilities
 * Centralized utilities for HTTP error extraction and conversion.
 * Provides single source of truth for error handling logic.
 */

import { HttpErrorResponse } from "@angular/common/http";
import { HTTP_STATUS } from "@shared/constants";
import {
	HttpError,
	NetworkError,
	NotFoundError,
	UnauthorizedError,
	ValidationError
} from "@shared/models";
import { isNonNullObject, isPresent } from "@shared/utilities/null-check.utility";

/**
 * Extracts validation errors from ASP.NET Core error response.
 * Returns array of field-level error messages.
 * @param {HttpErrorResponse} error
 * The HTTP error response potentially containing validation errors.
 * @returns {string[]}
 * An array of field-level error messages ("field: message").
 */
export function extractValidationErrors(
	error: HttpErrorResponse): string[]
{
	const errors: string[] = [];

	if (!isNonNullObject(error.error?.errors))
	{
		return errors;
	}

	for (const [field, messages] of Object.entries(error.error.errors))
	{
		if (Array.isArray(messages))
		{
			for (const message of messages)
			{
				errors.push(`${field}: ${message}`);
			}
		}
	}

	return errors;
}

/**
 * Extracts HTTP status details for error messages.
 * @param {HttpErrorResponse} error
 * The HTTP error response to extract status details from.
 * @returns {string | null}
 * A human-readable status string (e.g., "Status: 500 Internal Server Error") or null if unavailable.
 */
export function extractHttpStatus(
	error: HttpErrorResponse): string | null
{
	return error.status > 0
		? `Status: ${error.status} ${error.statusText}`
		: null;
}

/**
 * Extracts error title if different from user message.
 * @param {HttpErrorResponse} error
 * The HTTP error response that may contain a title.
 * @param {string} userMessage
 * The user-facing message to compare against.
 * @returns {string | null}
 * The distinct error title when present and different from user message, otherwise null.
 */
export function extractErrorTitle(
	error: HttpErrorResponse,
	userMessage: string): string | null
{
	const title: string | undefined =
		error.error?.title;
	return isPresent(title) && title !== userMessage ? title : null;
}

/**
 * Extracts request URL from error object.
 * Falls back to window.location.href if not available.
 * @param {Error | HttpErrorResponse | undefined} error
 * The error object which may contain request metadata.
 * @returns {string}
 * The request URL associated with the error or the current page URL as a fallback.
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
 * @param {Error | HttpErrorResponse | undefined} error
 * The error object which may include the HTTP method.
 * @returns {string | undefined}
 * The HTTP method (e.g., 'GET', 'POST') or undefined when unknown.
 */
export function extractRequestMethod(
	error?: Error | HttpErrorResponse): string | undefined
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
 * @param {Error | HttpErrorResponse | undefined} error
 * The error object which may include an HTTP status code.
 * @returns {number | undefined}
 * The HTTP status code (e.g., 404) or undefined when unavailable.
 */
export function extractStatusCode(
	error?: Error | HttpErrorResponse): number | undefined
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
 * @param {HttpErrorResponse} error
 * The original HTTP error response from HttpClient.
 * @param {string} url
 * The request URL associated with the error.
 * @param {string} method
 * The HTTP method used for the request.
 * @returns {Error}
 * A domain-specific Error instance (ValidationError, NotFoundError, UnauthorizedError, NetworkError, or HttpError).
 */
export function convertToAppError(
	error: HttpErrorResponse,
	url: string,
	method: string): Error
{
	// Network errors (status 0)
	if (error.status === HTTP_STATUS.NETWORK_ERROR)
	{
		return new NetworkError("Unable to connect to the server");
	}

	// Validation errors (400 with validation details)
	if (error.status === HTTP_STATUS.BAD_REQUEST && error.error?.errors)
	{
		return new ValidationError("Validation failed", error.error.errors);
	}

	// Not found errors
	if (error.status === HTTP_STATUS.NOT_FOUND)
	{
		return new NotFoundError(error.error?.title ?? "Resource not found");
	}

	// Unauthorized errors
	if (error.status === HTTP_STATUS.UNAUTHORIZED || error.status === HTTP_STATUS.FORBIDDEN)
	{
		return new UnauthorizedError(
			error.error?.title ?? "Unauthorized access");
	}

	// Generic HTTP errors
	return new HttpError(
		error.error?.title ?? error.message ?? "HTTP request failed",
		error.status,
		url,
		method);
}