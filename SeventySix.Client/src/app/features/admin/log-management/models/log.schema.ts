import { z } from "zod";

/**
 * Zod schema for LogLevel enum
 */
export const LogLevelSchema: z.ZodEnum<
	["Verbose", "Debug", "Information", "Warning", "Error", "Fatal"]
> = z.enum(["Verbose", "Debug", "Information", "Warning", "Error", "Fatal"]);

/**
 * Zod schema for LogResponse model
 * Provides runtime type validation for API responses
 */
export const LogResponseSchema: z.ZodType<{
	id: number;
	timestamp: Date;
	logLevel: string;
	message: string;
	sourceContext: string | null;
	exception: string | null;
	stackTrace: string | null;
	requestId: string | null;
	requestPath: string | null;
	machineName: string | null;
	threadId: number | null;
	application: string | null;
	environment: string | null;
	userId: string | null;
	userName: string | null;
	sessionId: string | null;
	correlationId: string | null;
	spanId: string | null;
	parentSpanId: string | null;
	clientIp: string | null;
	userAgent: string | null;
	duration: number | null;
	statusCode: number | null;
	properties: Record<string, unknown> | null;
}> = z.object({
	id: z.number().int().positive(),
	timestamp: z.coerce.date(),
	logLevel: z.string(),
	message: z.string(),
	sourceContext: z.string().nullable(),
	exception: z.string().nullable(),
	stackTrace: z.string().nullable(),
	requestId: z.string().nullable(),
	requestPath: z.string().nullable(),
	machineName: z.string().nullable(),
	threadId: z.number().int().nullable(),
	application: z.string().nullable(),
	environment: z.string().nullable(),
	userId: z.string().nullable(),
	userName: z.string().nullable(),
	sessionId: z.string().nullable(),
	correlationId: z.string().nullable(),
	spanId: z.string().nullable(),
	parentSpanId: z.string().nullable(),
	clientIp: z.string().nullable(),
	userAgent: z.string().nullable(),
	duration: z.number().nullable(),
	statusCode: z.number().int().nullable(),
	properties: z.record(z.unknown()).nullable()
});

/**
 * Infer TypeScript type from Zod schema
 */
export type LogResponseFromSchema = z.infer<typeof LogResponseSchema>;

/**
 * Zod schema for PagedResult<LogResponse>
 */
export const PagedLogResponseSchema: z.ZodType<{
	data: LogResponseFromSchema[];
	totalCount: number;
	pageNumber: number;
	pageSize: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}> = z.object({
	data: z.array(LogResponseSchema),
	totalCount: z.number().int().nonnegative(),
	pageNumber: z.number().int().min(1),
	pageSize: z.number().int().min(1),
	totalPages: z.number().int().nonnegative(),
	hasPreviousPage: z.boolean(),
	hasNextPage: z.boolean()
});
