import { components } from "@shared/generated-open-api/generated-open-api";

// Log DTOs with type corrections
export type LogDto =
	& Omit<
		components["schemas"]["LogDto"],
		"id" | "statusCode" | "durationMs">
	& {
		id: number;
		statusCode?: number | null;
		durationMs?: number | null;
	};
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
export * from "./log.utilities";
