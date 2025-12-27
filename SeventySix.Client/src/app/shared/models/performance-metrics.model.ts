/**
 * Performance metrics tracked by the monitor.
 */
export interface PerformanceMetrics
{
	/**
	 * Frames per second observed.
	 * @type {number}
	 */
	fps: number;

	/**
	 * Frame time in milliseconds.
	 * @type {number}
	 */
	frameTime: number; // ms

	/**
	 * Memory currently used in megabytes.
	 * @type {number}
	 */
	memoryUsed: number; // MB

	/**
	 * Total available memory in megabytes.
	 * @type {number}
	 */
	memoryTotal: number; // MB
}
