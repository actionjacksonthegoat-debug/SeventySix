/**
 * Driving HUD component unit tests.
 * Tests speed display, timer, countdown overlay, and contextual messages.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RaceState } from "@games/car-a-lot/models/car-a-lot.models";
import { BoostService } from "@games/car-a-lot/services/boost.service";
import { CarALotAudioService } from "@games/car-a-lot/services/car-a-lot-audio.service";
import { CoinService } from "@games/car-a-lot/services/coin.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { InputService } from "@games/shared/services/input.service";
import { DrivingHudComponent } from "./driving-hud";

describe("DrivingHudComponent",
	() =>
	{
		let fixture: ComponentFixture<DrivingHudComponent>;
		let raceState: RaceStateService;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [DrivingHudComponent],
							providers: [
								provideZonelessChangeDetection(),
								RaceStateService,
								CoinService,
								BoostService,
								CarALotAudioService,
								InputService
							]
						})
					.compileComponents();

				raceState =
					TestBed.inject(RaceStateService);
				fixture =
					TestBed.createComponent(DrivingHudComponent);
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(fixture.componentInstance)
					.toBeTruthy();
			});

		it("should display speed as 0 mph initially",
			() =>
			{
				const speedElement: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='speed-display']");

				expect(speedElement?.textContent)
					.toContain("0 mph");
			});

		it("should display timer as 0:00 initially",
			() =>
			{
				const timerElement: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='timer-display']");

				expect(timerElement?.textContent)
					.toContain("0:00");
			});

		it("should show countdown overlay during Countdown state",
			() =>
			{
				const countdownElement: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='countdown-overlay']");

				expect(countdownElement)
					.toBeTruthy();
			});

		it("should show rescue message during OctopusPhase",
			() =>
			{
				raceState.transitionTo(RaceState.Racing);
				raceState.transitionTo(RaceState.OctopusPhase);
				fixture.detectChanges();

				const messageElement: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='rescue-message']");

				expect(messageElement?.textContent)
					.toContain("Octopus");
			});

		it("should show victory overlay during Victory state",
			() =>
			{
				raceState.transitionTo(RaceState.Racing);
				raceState.transitionTo(RaceState.OctopusPhase);
				raceState.transitionTo(RaceState.Rescue);
				raceState.transitionTo(RaceState.Victory);
				fixture.detectChanges();

				const victoryElement: HTMLElement | null =
					fixture.nativeElement.querySelector(
						"[data-testid='victory-overlay']");

				expect(victoryElement)
					.toBeTruthy();
			});

		it("should update speed display when speed changes",
			() =>
			{
				raceState.updateSpeed(15);
				fixture.detectChanges();

				const speedElement: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='speed-display']");

				expect(speedElement?.textContent)
					.toContain("15 mph");
			});

		it("should format elapsed time correctly",
			() =>
			{
				raceState.updateElapsedTime(75);
				fixture.detectChanges();

				const timerElement: HTMLElement | null =
					fixture.nativeElement.querySelector("[data-testid='timer-display']");

				expect(timerElement?.textContent)
					.toContain("1:15");
			});
	});