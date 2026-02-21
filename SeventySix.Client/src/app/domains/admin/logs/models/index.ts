import { components } from "@shared/generated-open-api/generated-open-api";

// Log DTOs with type corrections
/**
 * Data transfer object representing a log entry with numeric ID and optional fields.
 * Based on the generated `LogDto` schema with local numeric ID adjustments.
 */
export type LogDto =
	& Omit<
		components["schemas"]["LogDto"],
		"id" | "statusCode" | "durationMs">
	& {
		id: number;
		statusCode?: number | null;
		durationMs?: number | null;
	};

/**
 * Paged result containing log items and pagination metadata.
 * Mirrors the generated `PagedResultOfLogDto` schema with numeric page fields.
 */
export type PagedResultOfLogDto =
	& Omit<
		components["schemas"]["PagedResultOfLogDto"],
		"page" | "pageSize" | "totalCount" | "totalPages">
	& {
		page: number;
		pageSize: number;
		totalCount: number;
		totalPages: number;
	};

// Re-export client-side utilities and models
export * from "./log-filter.model";
export * from "./log-filter.utility";
export * from "./log.utility";