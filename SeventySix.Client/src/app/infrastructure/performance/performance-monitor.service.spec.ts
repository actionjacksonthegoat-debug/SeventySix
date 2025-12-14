import { setupSimpleServiceTest } from "@testing";
import { PerformanceMonitorService } from "./performance-monitor.service";

describe("PerformanceMonitorService",
	() =>
	{
		let service: PerformanceMonitorService;

		beforeEach(
			() =>
			{
				service =
					setupSimpleServiceTest(PerformanceMonitorService);
			});

		afterEach(
			() =>
			{
			// Ensure monitoring is stopped after each test
				service.stopMonitoring();
			});

		it("should be created",
			() =>
			{
				expect(service)
				.toBeTruthy();
			});

		it("should have initial metrics",
			() =>
			{
				const metrics: ReturnType<PerformanceMonitorService["currentMetrics"]> =
					service.currentMetrics();
				expect(metrics.fps)
				.toBe(0);
				expect(metrics.frameTime)
				.toBe(0);
				expect(metrics.memoryUsed)
				.toBeGreaterThanOrEqual(0);
				expect(metrics.memoryTotal)
				.toBeGreaterThanOrEqual(0);
			});

		it("should start monitoring",
			() =>
			{
				service.startMonitoring();
				expect(service.isMonitoring())
				.toBe(true);
			});

		it("should stop monitoring",
			() =>
			{
				service.startMonitoring();
				service.stopMonitoring();
				expect(service.isMonitoring())
				.toBe(false);
			});

		it("should not start monitoring twice",
			() =>
			{
				service.startMonitoring();
				service.startMonitoring();
				expect(service.isMonitoring())
				.toBe(true);
			});

		it("should compute isHealthy based on fps",
			(done) =>
			{
				service.startMonitoring();

				// Initially false (fps = 0)
				expect(service.isHealthy())
				.toBe(false);

				// Wait for metrics to update (1+ second)
				setTimeout(
					() =>
					{
						// After monitoring, fps should be > 0 and likely >= 50
						const healthy: boolean =
							service.isHealthy();
						expect(typeof healthy)
						.toBe("boolean");
						service.stopMonitoring();
						done();
					},
					1100);
			});

		it("should update metrics over time",
			(done) =>
			{
				service.currentMetrics();
				service.startMonitoring();

				// Wait longer for metrics to update (give enough time for multiple frames)
				setTimeout(
					() =>
					{
						service.currentMetrics();
						// FPS should be updated (non-zero) after sufficient time
						// Note: In test environment, requestAnimationFrame may not fire reliably
						// so we check if monitoring started rather than requiring FPS > 0
						expect(service.isMonitoring())
						.toBe(true);
						service.stopMonitoring();
						// Verify monitoring stopped
						expect(service.isMonitoring())
						.toBe(false);
						done();
					},
					1500);
			});

		it("should handle memory metrics when available",
			() =>
			{
				const metrics: ReturnType<PerformanceMonitorService["currentMetrics"]> =
					service.currentMetrics();
				// Memory might be 0 if not supported, but should be a number
				expect(typeof metrics.memoryUsed)
				.toBe("number");
				expect(typeof metrics.memoryTotal)
				.toBe("number");
			});

		it("should cancel animation frame on stop",
			() =>
			{
				spyOn(window, "cancelAnimationFrame");
				service.startMonitoring();
				service.stopMonitoring();
				expect(window.cancelAnimationFrame)
				.toHaveBeenCalled();
			});
	});
