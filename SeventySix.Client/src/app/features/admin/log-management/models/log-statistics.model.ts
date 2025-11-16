/**
 * Log statistics model
 * Matches LogStatisticsResponse DTO from backend
 */
export interface LogStatistics
{
	totalLogs: number;
	errorCount: number;
	warningCount: number;
	fatalCount: number;
	criticalCount: number;
	infoCount: number;
	debugCount: number;
	averageResponseTimeMs: number;
	totalRequests: number;
	failedRequests: number;
	topErrorSources: Record<string, number>;
	requestsByPath: Record<string, number>;
	oldestLogDate: string | null;
	newestLogDate: string | null;
	startDate: string;
	endDate: string;
}
