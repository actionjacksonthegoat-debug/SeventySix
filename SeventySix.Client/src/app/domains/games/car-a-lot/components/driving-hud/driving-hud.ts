/**
 * Driving HUD component.
 * Displays speed, race timer, countdown, and contextual messages during gameplay.
 */

import { DecimalPipe } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	type Signal
} from "@angular/core";
import { RaceState } from "@games/car-a-lot/models/car-a-lot.models";
import { CarALotAudioService } from "@games/car-a-lot/services/car-a-lot-audio.service";
import { CoinService } from "@games/car-a-lot/services/coin.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { InputService } from "@games/shared/services/input.service";

/** Driving heads-up display overlay for Car-a-Lot. */
@Component(
	{
		selector: "app-driving-hud",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [DecimalPipe],
		templateUrl: "./driving-hud.html",
		styleUrl: "./driving-hud.scss"
	})
export class DrivingHudComponent
{
	/** Race state service for telemetry signals. */
	protected readonly raceState: RaceStateService =
		inject(RaceStateService);

	/** Coin service for collection counter. */
	protected readonly coinService: CoinService =
		inject(CoinService);

	/** Audio service for mute toggle. */
	protected readonly audioService: CarALotAudioService =
		inject(CarALotAudioService);

	/** Input service for device detection and mobile preview toggle. */
	protected readonly inputService: InputService =
		inject(InputService);

	/** Expose RaceState enum for template comparisons. */
	protected readonly RaceState: typeof RaceState = RaceState;

	/**
	 * Jump prompt text — adapts based on device type.
	 * Shows "TAP JUMP" on touch devices, "HIT SPACE TO JUMP" on desktop.
	 * @type {string}
	 */
	protected readonly jumpPromptText: string =
		this.inputService.isTouchDevice
			? "TAP JUMP TO LEAP OVER THE OCTOPUS"
			: "HIT SPACE TO JUMP OVER THE OCTOPUS";

	/**
	 * Computed signal that formats elapsed time as M:SS display string.
	 * @type {Signal<string>}
	 */
	protected readonly formattedTime: Signal<string> =
		computed(
			() =>
			{
				const totalSeconds: number =
					this.raceState.elapsedTime();
				const minutes: number =
					Math.floor(totalSeconds / 60);
				const seconds: number =
					Math.floor(totalSeconds % 60);

				return `${minutes}:${
					seconds
						.toString()
						.padStart(2, "0")
				}`;
			});

	/**
	 * Toggle audio mute on/off.
	 */
	protected onToggleMute(): void
	{
		this.audioService.toggleMute();
	}
}