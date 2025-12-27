import {
	computed,
	Injectable,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { PerformanceMetrics } from "@shared/models";

/**
 * Extended Performance interface with memory property (Chrome-specific).
 */
interface PerformanceMemory
{
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance
{
	memory?: PerformanceMemory;
}

/**
 * Performance monitoring service.
 * Tracks FPS, frame time, and memory usage using requestAnimationFrame.
 * Dev-mode only - automatically disabled in production.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class PerformanceMonitorService
{
	/**
	 * Whether monitoring is currently active.
	 * @type {WritableSignal<boolean>}
	 * @private
	 */
	private readonly _isMonitoring: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Current performance metrics signal.
	 * @type {WritableSignal<PerformanceMetrics>}
	 * @private
	 */
	private readonly _metrics: WritableSignal<PerformanceMetrics> =
		signal<PerformanceMetrics>(
			{
				fps: 0,
				frameTime: 0,
				memoryUsed: 0,
				memoryTotal: 0
			});

	/**
	 * Read-only metrics signal for consumers.
	 * @type {Signal<PerformanceMetrics>}
	 * @readonly
	 */
	readonly currentMetrics: Signal<PerformanceMetrics> =
		this._metrics.asReadonly();

	/**
	 * Health indicator based on FPS threshold.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isHealthy: Signal<boolean> =
		computed(
			() => this._metrics().fps >= 50);

	/**
	 * Animation frame counter used for FPS calculation.
	 * @type {number}
	 * @private
	 */
	private frameCount: number = 0;

	/**
	 * Last timestamp used for delta calculation.
	 * @type {number}
	 * @private
	 */
	private lastTime: number =
		performance.now();

	/**
	 * ID returned from requestAnimationFrame.
	 * @type {number | null}
	 * @private
	 */
	private animationFrameId: number | null = null;

	/**
	 * Megabyte constant used for memory calculation.
	 * @type {number}
	 * @private
	 * @readonly
	 */
	private readonly MB: number = 1048576;

	/**
	 * Returns whether monitoring is active.
	 * @returns {boolean}
	 * True when performance monitoring is currently active.
	 */
	isMonitoring(): boolean
	{
		return this._isMonitoring();
	}

	/**
	 * Starts performance monitoring.
	 * Uses requestAnimationFrame for accurate FPS tracking.
	 * @returns {void}
	 */
	startMonitoring(): void
	{
		if (this._isMonitoring())
		{
			return;
		}

		this._isMonitoring.set(true);
		this.frameCount = 0;
		this.lastTime =
			performance.now();
		this.monitorFrame();
	}

	/**
	 * Stops performance monitoring and cleans up animation frame.
	 * @returns {void}
	 */
	stopMonitoring(): void
	{
		this._isMonitoring.set(false);

		if (this.animationFrameId !== null)
		{
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	/**
	 * Monitors each frame for performance metrics.
	 * Updates metrics every second.
	 * @returns {void}
	 */
	private monitorFrame: () => void =
		(): void =>
		{
			if (!this._isMonitoring())
			{
				return;
			}

			const now: number =
				performance.now();
			const delta: number =
				now - this.lastTime;

			this.frameCount++;

			// Update metrics every second
			if (delta >= 1000)
			{
				const fps: number =
					Math.round((this.frameCount * 1000) / delta);
				const frameTime: number =
					delta / this.frameCount;

				// Get memory info (Chrome only)
				const memory: PerformanceMemory | undefined =
					(
						performance as PerformanceWithMemory)
					.memory;
				const memoryUsed: number =
					memory
						? Math.round(memory.usedJSHeapSize / this.MB)
						: 0;
				const memoryTotal: number =
					memory
						? Math.round(memory.totalJSHeapSize / this.MB)
						: 0;

				this._metrics.set(
					{
						fps,
						frameTime: Math.round(frameTime * 100) / 100,
						memoryUsed,
						memoryTotal
					});

				this.frameCount = 0;
				this.lastTime = now;
			}

			this.animationFrameId =
				requestAnimationFrame(this.monitorFrame);
		};
}
