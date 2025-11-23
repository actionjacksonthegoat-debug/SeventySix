/**
 * Client log request DTO matching server expectations.
 * Represents error logs sent from the client (Angular app) to the server.
 */
export interface ClientLogRequest
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
	clientTimestamp?: string;
	additionalContext?: Record<string, unknown>;
	correlationId?: string;
}
