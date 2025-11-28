/** Request DTO for creating log entries from the client. */
export interface CreateLogRequest
{
	logLevel: string;
	message: string;
	exceptionMessage?: string;
	stackTrace?: string;
	sourceContext?: string;
	requestUrl?: string;
	requestMethod?: string;
	statusCode?: number;
	userAgent?: string;
	clientTimestamp: string;
	additionalContext?: Record<string, unknown>;
	correlationId?: string;
}
