import { HttpErrorResponse } from "@angular/common/http";

/**
 * Error details for logging.
 */
export interface ErrorDetails
{
	message: string;
	error?: Error;
	httpError?: HttpErrorResponse;
	context?: Record<string, unknown>;
}