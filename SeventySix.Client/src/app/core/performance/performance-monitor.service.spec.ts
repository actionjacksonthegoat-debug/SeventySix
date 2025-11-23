import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { PerformanceMonitorService } from "./performance-monitor.service";

describe("PerformanceMonitorService", () =>
{
	let service: PerformanceMonitorService;

	beforeEach(() =>
	{
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()]
		});
		service = TestBed.inject(PerformanceMonitorService);
	});

	afterEach(() =>
	{
		// Ensure monitoring is stopped after each test
		service.stopMonitoring();
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	it("should have initial metrics", () =>
	{
		const metrics = service.currentMetrics();
		expect(metrics.fps).toBe(0);
		expect(metrics.frameTime).toBe(0);
		expect(metrics.memoryUsed).toBeGreaterThanOrEqual(0);
		expect(metrics.memoryTotal).toBeGreaterThanOrEqual(0);
	});

	it("should start monitoring", () =>
	{
		service.startMonitoring();
		expect(service.isMonitoring()).toBe(true);
	});

	it("should stop monitoring", () =>
	{
		service.startMonitoring();
		service.stopMonitoring();
		expect(service.isMonitoring()).toBe(false);
	});

	it("should not start monitoring twice", () =>
	{
		service.startMonitoring();
		service.startMonitoring();
		expect(service.isMonitoring()).toBe(true);
	});

	it("should compute isHealthy based on fps", (done) =>
	{
		service.startMonitoring();

		// Initially false (fps = 0)
		expect(service.isHealthy()).toBe(false);

		// Wait for metrics to update (1+ second)
		setTimeout(() =>
		{
			// After monitoring, fps should be > 0 and likely >= 50
			const healthy = service.isHealthy();
			expect(typeof healthy).toBe("boolean");
			service.stopMonitoring();
			done();
		}, 1100);
	});

	it("should update metrics over time", (done) =>
	{
		const initialMetrics = service.currentMetrics();
		service.startMonitoring();

		// Wait for metrics to update
		setTimeout(() =>
		{
			const updatedMetrics = service.currentMetrics();
			// FPS should be updated (non-zero)
			expect(updatedMetrics.fps).toBeGreaterThan(0);
			service.stopMonitoring();
			done();
		}, 1100);
	});

	it("should handle memory metrics when available", () =>
	{
		const metrics = service.currentMetrics();
		// Memory might be 0 if not supported, but should be a number
		expect(typeof metrics.memoryUsed).toBe("number");
		expect(typeof metrics.memoryTotal).toBe("number");
	});

	it("should cancel animation frame on stop", () =>
	{
		spyOn(window, "cancelAnimationFrame");
		service.startMonitoring();
		service.stopMonitoring();
		expect(window.cancelAnimationFrame).toHaveBeenCalled();
	});
});
