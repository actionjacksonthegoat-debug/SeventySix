/**
 * Log chart data models
 * Matches LogChartDataResponse and LogChartDataPoint DTOs from backend
 */
export interface LogChartData
{
	period: string;
	dataPoints: LogChartDataPoint[];
}

export interface LogChartDataPoint
{
	timestamp: string;
	errorCount: number;
	warningCount: number;
	fatalCount: number;
	totalCount: number;
}
