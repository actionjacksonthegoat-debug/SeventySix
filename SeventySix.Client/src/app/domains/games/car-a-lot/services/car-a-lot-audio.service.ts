/**
 * Car-a-Lot Audio Service.
 * Procedural audio synthesis using Web Audio API for driving game sounds.
 * All sounds generated procedurally — no external audio files required.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";
import { BaseGameAudioService } from "@games/shared/services/base-game-audio.service";
import { playArpeggio, SfxBuilder } from "@games/shared/utilities/sfx-builder.utility";

/** Racing melody notes as semitone offsets in sections. */
const MELODY_SECTIONS: number[][] =
	[
		[0, 4, 7, 12, 7, 4, 0, -5],
		[2, 5, 9, 14, 9, 5, 2, -3],
		[0, 7, 12, 16, 12, 7, 4, 0],
		[-5, 0, 4, 7, 12, 7, 0, -5]
	];

/** Bass line semitone offsets per section. */
const BASS_PATTERN: number[] =
	[0, 5, 7, 5];

/** Note duration per melody step in seconds. */
const MELODY_STEP_DURATION: number = 0.22;

/** Base frequency for music (C4). */
const BASE_FREQ: number = 261.63;

/**
 * Service for procedural audio synthesis in Car-a-Lot.
 * Uses Web Audio API oscillators and noise for all game sounds.
 */
@Injectable()
export class CarALotAudioService extends BaseGameAudioService
{
	/** SFX gain node for sound effects. */
	private sfxGain: GainNode | null = null;

	/** Music gain node for background music. */
	private musicGain: GainNode | null = null;

	/**
	 * Get active AudioContext or null when not initialized.
	 */
	private get audioContext(): AudioContext | null
	{
		return this.audioContextService.isInitialized
			? this.audioContextService.audioContext
			: null;
	}

	/** Active music oscillators for cleanup. */
	private musicOscillators: OscillatorNode[] = [];

	/** Music arpeggio interval for cleanup. */
	private arpeggioInterval: ReturnType<typeof setInterval> | null = null;

	/**
	 * Initialize game-specific SFX and music gain nodes.
	 * Called by base class after AudioContext is initialized.
	 */
	protected initializeGainNodes(): void
	{
		if (!this.audioContextService.isInitialized || this.sfxGain !== null)
		{
			return;
		}

		this.sfxGain =
			this.audioContextService.audioContext.createGain();
		this.sfxGain.gain.value = 0.6;
		this.sfxGain.connect(this.audioContextService.masterGain);

		this.musicGain =
			this.audioContextService.audioContext.createGain();
		this.musicGain.gain.value = 0.45;
		this.musicGain.connect(this.audioContextService.masterGain);
	}

	/**
	 * Play a countdown bing tone (pitched higher for final bing).
	 * @param isLast
	 * True for the final "GO" bing (higher pitch).
	 */
	playCountdownBing(isLast: boolean): void
	{
		if (this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		SfxBuilder
			.tone(this.audioContext, this.sfxGain)
			.sine(isLast ? 880 : 440, 0.4)
			.expEnvelope(0.4, 0.01, 0.4)
			.play();
	}

	/**
	 * Start the engine drone sound, modulated by speed.
	 */
	startEngine(): void
	{
		if (this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		this.startEngineSound(60, 0.03, "sawtooth");
	}

	/**
	 * Update engine sound pitch based on current speed ratio (0-1).
	 * @param speedRatio
	 * Speed as fraction of max speed (0 = idle, 1 = max).
	 */
	updateEngine(speedRatio: number): void
	{
		this.updateEngineSound(
			60 + speedRatio * 180,
			0.01 + speedRatio * 0.03);
	}

	/**
	 * Play a boost whoosh effect.
	 */
	playBoost(): void
	{
		if (this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		const now: number =
			this.audioContext.currentTime;
		const osc: OscillatorNode =
			this.audioContext.createOscillator();
		const gain: GainNode =
			this.audioContext.createGain();

		osc.type = "sine";
		osc.frequency.setValueAtTime(200, now);
		osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
		osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);

		gain.gain.setValueAtTime(0.3, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start(now);
		osc.stop(now + 0.5);
	}

	/**
	 * Play a coin chime effect.
	 */
	playCoin(): void
	{
		if (this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		playArpeggio(
			this.audioContext,
			this.sfxGain,
			[0, 7, 12].map((s) =>
				SfxBuilder.semitoneToFrequency(880, s)),
			{
				waveform: "sine",
				noteSpacing: 0.08,
				noteDuration: 0.15,
				volume: 0.2,
				envelopeType: "exponential",
				envelopeDelay: 0,
				envelopeReleaseDuration: 0.15
			});
	}

	/**
	 * Play a soft bumper thud effect.
	 */
	playBumper(): void
	{
		if (this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		SfxBuilder
			.tone(this.audioContext, this.sfxGain)
			.triangle(120, 0.2)
			.sweepTo(40, 0.2)
			.expEnvelope(0.25, 0.01, 0.2)
			.play();
	}

	/**
	 * Play a deep rumble for the octopus approach.
	 */
	playOctopusRumble(): void
	{
		if (this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		const now: number =
			this.audioContext.currentTime;
		const osc: OscillatorNode =
			this.audioContext.createOscillator();
		const gain: GainNode =
			this.audioContext.createGain();

		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(45, now);
		osc.frequency.linearRampToValueAtTime(30, now + 1.5);

		gain.gain.setValueAtTime(0.2, now);
		gain.gain.linearRampToValueAtTime(0.3, now + 0.5);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start(now);
		osc.stop(now + 1.5);
	}

	/**
	 * Play a jump ramp launch sound.
	 */
	playJump(): void
	{
		if (this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		SfxBuilder
			.tone(this.audioContext, this.sfxGain)
			.sine(200, 0.3)
			.sweepTo(600, 0.2)
			.expEnvelope(0.2, 0.01, 0.3)
			.play();
	}

	/**
	 * Play a victory fanfare — ascending five-note sequence.
	 */
	playVictory(): void
	{
		if (this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		playArpeggio(
			this.audioContext,
			this.sfxGain,
			[0, 4, 7, 12, 16].map((s) =>
				SfxBuilder.semitoneToFrequency(BASE_FREQ, s)),
			{
				waveform: "square",
				noteSpacing: 0.2,
				noteDuration: 0.3,
				volume: 0.2,
				envelopeType: "exponential",
				envelopeDelay: 0,
				envelopeReleaseDuration: 0.3
			});
	}

	/**
	 * Play a game-over descending tone.
	 */
	playGameOver(): void
	{
		if (this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		SfxBuilder
			.tone(this.audioContext, this.sfxGain)
			.sawtooth(400, 1.0)
			.sweepTo(80, 1.0)
			.expEnvelope(0.2, 0.01, 1.0)
			.play();
	}

	/**
	 * Start looping background music with multi-section melody and bass.
	 */
	startMusic(): void
	{
		if (this.audioContext === null || this.musicGain === null)
		{
			return;
		}

		this.stopMusic();

		let noteIndex: number = 0;
		let sectionIndex: number = 0;
		let bassStep: number = 0;

		this.arpeggioInterval =
			setInterval(
				() =>
				{
					if (this.audioContext === null || this.musicGain === null)
					{
						return;
					}

					const now: number =
						this.audioContext.currentTime;
					const section: number[] =
						MELODY_SECTIONS[sectionIndex % MELODY_SECTIONS.length];
					const semitone: number =
						section[noteIndex % section.length];
					const freq: number =
						SfxBuilder.semitoneToFrequency(BASE_FREQ, semitone);

					const melodyOsc: OscillatorNode =
						this.audioContext.createOscillator();
					const melodyGain: GainNode =
						this.audioContext.createGain();

					melodyOsc.type =
						sectionIndex % 2 === 0 ? "square" : "triangle";
					melodyOsc.frequency.value = freq;
					melodyGain.gain.setValueAtTime(0.1, now);
					melodyGain.gain.exponentialRampToValueAtTime(0.01, now + MELODY_STEP_DURATION);

					melodyOsc.connect(melodyGain);
					melodyGain.connect(this.musicGain);
					melodyOsc.start(now);
					melodyOsc.stop(now + MELODY_STEP_DURATION);

					if (noteIndex % 4 === 0)
					{
						const bassSemitone: number =
							BASS_PATTERN[bassStep % BASS_PATTERN.length] - 12;
						const bassFreq: number =
							SfxBuilder.semitoneToFrequency(BASE_FREQ, bassSemitone);

						const bassOsc: OscillatorNode =
							this.audioContext.createOscillator();
						const bassGainNode: GainNode =
							this.audioContext.createGain();

						bassOsc.type = "sine";
						bassOsc.frequency.value = bassFreq;
						bassGainNode.gain.setValueAtTime(0.12, now);
						bassGainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

						bassOsc.connect(bassGainNode);
						bassGainNode.connect(this.musicGain);
						bassOsc.start(now);
						bassOsc.stop(now + 0.5);

						bassStep++;
					}

					noteIndex++;

					if (noteIndex >= section.length)
					{
						noteIndex = 0;
						sectionIndex++;
					}
				},
				Math.round(MELODY_STEP_DURATION * 1000));
	}

	/**
	 * Stop background music.
	 */
	stopMusic(): void
	{
		for (const osc of this.musicOscillators)
		{
			osc.stop();
			osc.disconnect();
		}
		this.musicOscillators = [];

		if (this.arpeggioInterval !== null)
		{
			clearInterval(this.arpeggioInterval);
			this.arpeggioInterval = null;
		}
	}

	/**
	 * Dispose all audio resources and close the context.
	 */
	override dispose(): void
	{
		super.dispose();
		this.sfxGain = null;
		this.musicGain = null;
	}
}