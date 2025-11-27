import {
	Injectable,
	signal,
	computed,
	Signal,
	WritableSignal
} from "@angular/core";

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
@Injectable({
	providedIn: "root"
})
export class PerformanceMonitorService
{
	private readonly _isMonitoring: WritableSignal<boolean> =
		signal<boolean>(false);
	private readonly _metrics: WritableSignal<PerformanceMetrics> =
		signal<PerformanceMetrics>({
			fps: 0,
			frameTime: 0,
			memoryUsed: 0,
			memoryTotal: 0
		});

	readonly currentMetrics: Signal<PerformanceMetrics> =
		this._metrics.asReadonly();
	readonly isHealthy: Signal<boolean> = computed(
		() => this._metrics().fps >= 50
	);

	private frameCount: number = 0;
	private lastTime: number = performance.now();
	private animationFrameId: number | null = null;
	private readonly MB: number = 1048576;

	/**
	 * Returns whether monitoring is active.
	 */
	isMonitoring(): boolean
	{
		return this._isMonitoring();
	}

	/**
	 * Starts performance monitoring.
	 * Uses requestAnimationFrame for accurate FPS tracking.
	 */
	startMonitoring(): void
	{
		if (this._isMonitoring())
		{
			return;
		}

		this._isMonitoring.set(true);
		this.frameCount = 0;
		this.lastTime = performance.now();
		this.monitorFrame();
	}

	/**
	 * Stops performance monitoring and cleans up animation frame.
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
	 */
	private monitorFrame: () => void = (): void =>
	{
		if (!this._isMonitoring())
		{
			return;
		}

		const now: number = performance.now();
		const delta: number = now - this.lastTime;

		this.frameCount++;

		// Update metrics every second
		if (delta >= 1000)
		{
			const fps: number = Math.round((this.frameCount * 1000) / delta);
			const frameTime: number = delta / this.frameCount;

			// Get memory info (Chrome only)
			const memory: PerformanceMemory | undefined = (
				performance as PerformanceWithMemory
			).memory;
			const memoryUsed: number = memory
				? Math.round(memory.usedJSHeapSize / this.MB)
				: 0;
			const memoryTotal: number = memory
				? Math.round(memory.totalJSHeapSize / this.MB)
				: 0;

			this._metrics.set({
				fps,
				frameTime: Math.round(frameTime * 100) / 100,
				memoryUsed,
				memoryTotal
			});

			this.frameCount = 0;
			this.lastTime = now;
		}

		this.animationFrameId = requestAnimationFrame(this.monitorFrame);
	};
}
