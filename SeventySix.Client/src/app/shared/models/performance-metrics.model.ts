/**
 * Performance metrics tracked by the monitor.
 */
export interface PerformanceMetrics
{
	fps: number;
	frameTime: number; // ms
	memoryUsed: number; // MB
	memoryTotal: number; // MB
}
