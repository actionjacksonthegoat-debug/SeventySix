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
	output,
	OutputEmitterRef,
	type Signal
} from "@angular/core";
import { RaceState } from "@sandbox/car-a-lot/models/car-a-lot.models";
import { BoostService } from "@sandbox/car-a-lot/services/boost.service";
import { CarALotAudioService } from "@sandbox/car-a-lot/services/car-a-lot-audio.service";
import { CoinService } from "@sandbox/car-a-lot/services/coin.service";
import { RaceStateService } from "@sandbox/car-a-lot/services/race-state.service";

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

	/** Boost service for active boost indicator. */
	protected readonly boostService: BoostService =
		inject(BoostService);

	/** Audio service for mute toggle. */
	protected readonly audioService: CarALotAudioService =
		inject(CarALotAudioService);

	/** Expose RaceState enum for template comparisons. */
	protected readonly RaceState: typeof RaceState = RaceState;

	/**
	 * Emits when the Start Game button is clicked.
	 * @type {OutputEmitterRef<void>}
	 */
	readonly startGame: OutputEmitterRef<void> =
		output();

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
	 * Handle start game button click — emit event to parent.
	 */
	protected onStartGame(): void
	{
		this.startGame.emit();
	}

	/**
	 * Toggle audio mute on/off.
	 */
	protected onToggleMute(): void
	{
		this.audioService.toggleMute();
	}
}