/**
 * Log statistics model
 * Matches LogStatisticsResponse DTO from backend
 */
export interface LogStatistics
{
	totalLogs: number;
	errorCount: number;
	warningCount: number;
	infoCount: number;
	debugCount: number;
	criticalCount: number;
	oldestLogDate: string | null;
	newestLogDate: string | null;
}
