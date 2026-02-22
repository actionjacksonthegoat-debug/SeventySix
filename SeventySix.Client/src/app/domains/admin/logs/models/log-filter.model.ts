import { BaseQueryRequest } from "@shared/models";

/** Log query request DTO matching backend LogQueryRequest. */
export interface LogQueryRequest extends BaseQueryRequest
{
	/** Filter by log level (e.g., Information, Warning, Error). */
	logLevel?: string | null;

	/** Additional context information for filtering logs. */
	sourceContext?: string | null;
}