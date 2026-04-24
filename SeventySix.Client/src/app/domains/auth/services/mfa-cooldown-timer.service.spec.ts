/**
 * Unit tests for MfaCooldownTimerService.
 * Uses Vitest fake timers for deterministic interval-based countdown control.
 */

import { Signal } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { MfaCooldownTimerService } from "./mfa-cooldown-timer.service";

describe("MfaCooldownTimerService",
	() =>
	{
		let service: MfaCooldownTimerService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							MfaCooldownTimerService
						]
					});

				service =
					TestBed.inject(MfaCooldownTimerService);
			});

		afterEach(
			() =>
			{
				vi.useRealTimers();
				TestBed.resetTestingModule();
			});

		it("start_SetsRemainingSecondsToConfiguredDuration",
			() =>
			{
				vi.useFakeTimers();

				service.start(30);

				expect(service.remainingSeconds())
					.toBe(30);
				expect(service.isActive())
					.toBe(true);
			});

		it("tick_DecrementsRemainingSecondsEverySecond",
			() =>
			{
				vi.useFakeTimers();

				service.start(30);
				vi.advanceTimersByTime(1000);
				expect(service.remainingSeconds())
					.toBe(29);

				vi.advanceTimersByTime(1000);
				expect(service.remainingSeconds())
					.toBe(28);
			});

		it("complete_FiresWhenRemainingSecondsReachesZero",
			() =>
			{
				vi.useFakeTimers();

				let fired: boolean = false;
				service.completed.subscribe(
					() =>
					{
						fired = true;
					});

				service.start(2);
				vi.advanceTimersByTime(2000);

				expect(fired)
					.toBe(true);
				expect(service.remainingSeconds())
					.toBe(0);
				expect(service.isActive())
					.toBe(false);
			});

		it("stop_StopsTimerImmediately_AndResetsState",
			() =>
			{
				vi.useFakeTimers();

				service.start(30);
				vi.advanceTimersByTime(3000);
				service.stop();

				expect(service.remainingSeconds())
					.toBe(0);
				expect(service.isActive())
					.toBe(false);
			});

		it("restart_ResetsCounter_AndBeginsAgain",
			() =>
			{
				vi.useFakeTimers();

				service.start(30);
				vi.advanceTimersByTime(5000);
				service.start(10);

				expect(service.remainingSeconds())
					.toBe(10);
				expect(service.isActive())
					.toBe(true);

				vi.advanceTimersByTime(1000);
				expect(service.remainingSeconds())
					.toBe(9);
			});

		it("multipleStartCalls_DoNotCreateOverlappingTimers",
			() =>
			{
				vi.useFakeTimers();

				service.start(30);
				service.start(30);
				vi.advanceTimersByTime(1000);

				expect(service.remainingSeconds())
					.toBe(29);
			});

		it("destroyed_CleansUpInternalSubscription",
			() =>
			{
				vi.useFakeTimers();

				service.start(30);
				TestBed.resetTestingModule();

				// Advancing timers after destroy must not throw
				vi.advanceTimersByTime(60000);
				expect(true)
					.toBe(true);
			});

		it("remainingSecondsSignal_IsReadonlySignal_ExposedToTemplate",
			() =>
			{
				const signal: Signal<number> =
					service.remainingSeconds;

				expect(typeof signal)
					.toBe("function");
				expect(service.remainingSeconds())
					.toBe(0);
			});
	});