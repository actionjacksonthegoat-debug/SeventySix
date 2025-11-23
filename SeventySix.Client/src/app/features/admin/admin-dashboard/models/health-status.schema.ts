import { z } from "zod";

/**
 * Zod schema for SystemResources
 */
export const SystemResourcesSchema: z.ZodType<{
	cpuUsagePercent: number;
	memoryUsedMb: number;
	memoryTotalMb: number;
	diskUsagePercent: number;
}> = z.object({
	cpuUsagePercent: z.number().min(0).max(100),
	memoryUsedMb: z.number().nonnegative(),
	memoryTotalMb: z.number().positive(),
	diskUsagePercent: z.number().min(0).max(100)
});

/**
 * Zod schema for QueueHealth
 */
export const QueueHealthSchema: z.ZodType<{
	queuedItems: number;
	failedItems: number;
	circuitBreakerOpen: boolean;
	status: string;
}> = z.object({
	queuedItems: z.number().int().nonnegative(),
	failedItems: z.number().int().nonnegative(),
	circuitBreakerOpen: z.boolean(),
	status: z.string()
});

/**
 * Zod schema for ApiHealthStatus
 */
export const ApiHealthStatusSchema: z.ZodType<{
	apiName: string;
	isAvailable: boolean;
	responseTimeMs: number;
	lastChecked: string | null;
}> = z.object({
	apiName: z.string(),
	isAvailable: z.boolean(),
	responseTimeMs: z.number().nonnegative(),
	lastChecked: z.string().datetime().nullable()
});

/**
 * Zod schema for ExternalApiHealth
 */
export const ExternalApiHealthSchema: z.ZodType<{
	apis: Record<string, z.infer<typeof ApiHealthStatusSchema>>;
}> = z.object({
	apis: z.record(z.string(), ApiHealthStatusSchema)
});

/**
 * Zod schema for DatabaseHealth
 */
export const DatabaseHealthSchema: z.ZodType<{
	isConnected: boolean;
	responseTimeMs: number;
	activeConnections: number;
	status: string;
}> = z.object({
	isConnected: z.boolean(),
	responseTimeMs: z.number().nonnegative(),
	activeConnections: z.number().int().nonnegative(),
	status: z.string()
});

/**
 * Zod schema for HealthStatus model
 * Provides runtime type validation for API responses
 */
export const HealthStatusSchema: z.ZodType<{
	status: string;
	checkedAt: string;
	database: z.infer<typeof DatabaseHealthSchema>;
	externalApis: z.infer<typeof ExternalApiHealthSchema>;
	errorQueue: z.infer<typeof QueueHealthSchema>;
	system: z.infer<typeof SystemResourcesSchema>;
}> = z.object({
	status: z.string(),
	checkedAt: z.string().datetime(),
	database: DatabaseHealthSchema,
	externalApis: ExternalApiHealthSchema,
	errorQueue: QueueHealthSchema,
	system: SystemResourcesSchema
});

/**
 * Infer TypeScript type from Zod schema
 */
export type HealthStatusFromSchema = z.infer<typeof HealthStatusSchema>;
