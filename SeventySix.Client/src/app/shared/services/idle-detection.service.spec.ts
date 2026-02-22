import { DOCUMENT } from "@angular/common";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { DateService } from "@shared/services/date.service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdleDetectionService } from "./idle-detection.service";

describe("IdleDetectionService",
	() =>
	{
		let service: IdleDetectionService;
		let dateServiceSpy: { nowTimestamp: ReturnType<typeof vi.fn>; };
		let mockDocument: Document;

		const TIMEOUT_MINUTES: number = 30;
		const WARNING_SECONDS: number = 60;
		const TIMEOUT_MS: number =
			TIMEOUT_MINUTES * 60 * 1000;
		const WARNING_MS: number =
			WARNING_SECONDS * 1000;

		beforeEach(
			() =>
			{
				vi.useFakeTimers();

				dateServiceSpy =
					{
						nowTimestamp: vi
							.fn()
							.mockReturnValue(0)
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							IdleDetectionService,
							{
								provide: DateService,
								useValue: dateServiceSpy
							}
						]
					});

				service =
					TestBed.inject(IdleDetectionService);
				mockDocument =
					TestBed.inject(DOCUMENT);
			});

		afterEach(
			() =>
			{
				service.stop();
				vi.useRealTimers();
			});

		it("should initialize with idle and warning as false",
			() =>
			{
				expect(service.isIdle())
					.toBe(false);
				expect(service.isWarning())
					.toBe(false);
				expect(service.remainingSeconds())
					.toBe(0);
			});

		it("should set activity timestamp on start",
			() =>
			{
				dateServiceSpy.nowTimestamp.mockReturnValue(1000);

				service.start(
					TIMEOUT_MINUTES,
					WARNING_SECONDS);

				// After start, the service should have recorded the timestamp
				expect(dateServiceSpy.nowTimestamp)
					.toHaveBeenCalled();
			});

		it("should reset timestamp on DOM activity event",
			() =>
			{
				dateServiceSpy.nowTimestamp.mockReturnValue(0);
				service.start(
					TIMEOUT_MINUTES,
					WARNING_SECONDS);

				// Simulate user activity
				dateServiceSpy.nowTimestamp.mockReturnValue(5000);
				mockDocument.dispatchEvent(
					new Event("mousedown"));

				// Advance to just before timeout from new activity
				dateServiceSpy.nowTimestamp.mockReturnValue(
					5000 + TIMEOUT_MS - WARNING_MS - 1000);
				vi.advanceTimersByTime(15_000);

				// Should NOT be in warning state (activity reset the timer)
				expect(service.isWarning())
					.toBe(false);
			});

		it("should NOT show warning before warning period",
			() =>
			{
				dateServiceSpy.nowTimestamp.mockReturnValue(0);
				service.start(
					TIMEOUT_MINUTES,
					WARNING_SECONDS);

				// Advance to before warning threshold
				dateServiceSpy.nowTimestamp.mockReturnValue(
					TIMEOUT_MS - WARNING_MS - 1000);
				vi.advanceTimersByTime(15_000);

				expect(service.isWarning())
					.toBe(false);
				expect(service.isIdle())
					.toBe(false);
			});

		it("should show warning when entering warning period",
			() =>
			{
				dateServiceSpy.nowTimestamp.mockReturnValue(0);
				service.start(
					TIMEOUT_MINUTES,
					WARNING_SECONDS);

				// Advance into warning period
				dateServiceSpy.nowTimestamp.mockReturnValue(
					TIMEOUT_MS - WARNING_MS + 1000);
				vi.advanceTimersByTime(15_000);

				expect(service.isWarning())
					.toBe(true);
				expect(service.isIdle())
					.toBe(false);
				expect(service.remainingSeconds())
					.toBeGreaterThan(0);
			});

		it("should set idle when past timeout",
			() =>
			{
				dateServiceSpy.nowTimestamp.mockReturnValue(0);
				service.start(
					TIMEOUT_MINUTES,
					WARNING_SECONDS);

				// Advance past timeout
				dateServiceSpy.nowTimestamp.mockReturnValue(
					TIMEOUT_MS + 1000);
				vi.advanceTimersByTime(15_000);

				expect(service.isIdle())
					.toBe(true);
			});

		it("should clear warning state on resetTimer",
			() =>
			{
				dateServiceSpy.nowTimestamp.mockReturnValue(0);
				service.start(
					TIMEOUT_MINUTES,
					WARNING_SECONDS);

				// Enter warning state
				dateServiceSpy.nowTimestamp.mockReturnValue(
					TIMEOUT_MS - WARNING_MS + 1000);
				vi.advanceTimersByTime(15_000);
				expect(service.isWarning())
					.toBe(true);

				// Reset timer
				dateServiceSpy.nowTimestamp.mockReturnValue(
					TIMEOUT_MS - WARNING_MS + 2000);
				service.resetTimer();

				expect(service.isWarning())
					.toBe(false);
				expect(service.isIdle())
					.toBe(false);
			});

		it("should remove event listeners on stop",
			() =>
			{
				const removeListenerSpy: ReturnType<typeof vi.spyOn> =
					vi.spyOn(mockDocument, "removeEventListener");

				dateServiceSpy.nowTimestamp.mockReturnValue(0);
				service.start(
					TIMEOUT_MINUTES,
					WARNING_SECONDS);

				service.stop();

				// Should have removed activity listeners + visibilitychange
				const removedEvents: string[] =
					removeListenerSpy.mock.calls.map(
						(call: unknown[]) => call[0] as string);
				expect(removedEvents)
					.toContain("mousedown");
				expect(removedEvents)
					.toContain("keydown");
				expect(removedEvents)
					.toContain("visibilitychange");
			});

		it("should dismiss warning on user activity during warning",
			() =>
			{
				dateServiceSpy.nowTimestamp.mockReturnValue(0);
				service.start(
					TIMEOUT_MINUTES,
					WARNING_SECONDS);

				// Enter warning state
				dateServiceSpy.nowTimestamp.mockReturnValue(
					TIMEOUT_MS - WARNING_MS + 1000);
				vi.advanceTimersByTime(15_000);
				expect(service.isWarning())
					.toBe(true);

				// Simulate user activity — should dismiss warning
				dateServiceSpy.nowTimestamp.mockReturnValue(
					TIMEOUT_MS - WARNING_MS + 2000);
				mockDocument.dispatchEvent(
					new Event("keydown"));

				expect(service.isWarning())
					.toBe(false);
			});

		it("should check idle state on visibility change to visible",
			() =>
			{
				dateServiceSpy.nowTimestamp.mockReturnValue(0);
				service.start(
					TIMEOUT_MINUTES,
					WARNING_SECONDS);

				// Advance past timeout
				dateServiceSpy.nowTimestamp.mockReturnValue(
					TIMEOUT_MS + 1000);

				// Simulate tab becoming visible
				Object.defineProperty(
					mockDocument,
					"visibilityState",
					{
						value: "visible",
						writable: true,
						configurable: true
					});
				mockDocument.dispatchEvent(
					new Event("visibilitychange"));

				expect(service.isIdle())
					.toBe(true);
			});
	});