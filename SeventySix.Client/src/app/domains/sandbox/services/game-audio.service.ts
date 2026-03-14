/**
 * Game Audio Service.
 * Procedural audio synthesis using Web Audio API for music and sound effects.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";

import {
	playExplosionSynth,
	playNoiseShot,
	playNukeEffect,
	playSineSweep
} from "@sandbox/services/audio-synth.utility";

/**
 * Music intensity level for dynamic soundtrack changes.
 */
type MusicIntensity = "normal" | "boss";

/**
 * Explosion size categories for different effect magnitudes.
 */
type ExplosionSize = "small" | "medium" | "large" | "nuke";

/**
 * Pentatonic minor scale intervals for procedural music generation.
 * @type {number[]}
 */
const PENTATONIC_INTERVALS: number[] =
	[0, 3, 5, 7, 10];

/**
 * Base frequency for music generation (A3).
 * @type {number}
 */
const BASE_FREQUENCY: number = 220;

/**
 * Service responsible for procedural audio synthesis and playback.
 * Uses Web Audio API to generate all sounds without external audio files.
 */
@Injectable()
export class GameAudioService
{
	/**
	 * Web Audio API context.
	 * @type {AudioContext | null}
	 * @private
	 */
	private audioContext: AudioContext | null = null;

	/**
	 * Master gain node for global volume control.
	 * @type {GainNode | null}
	 * @private
	 */
	private masterGain: GainNode | null = null;

	/**
	 * Music gain node for music volume control.
	 * @type {GainNode | null}
	 * @private
	 */
	private musicGain: GainNode | null = null;

	/**
	 * SFX gain node for sound effects volume control.
	 * @type {GainNode | null}
	 * @private
	 */
	private sfxGain: GainNode | null = null;

	/**
	 * Whether audio is currently muted.
	 * @type {boolean}
	 * @private
	 */
	private muted: boolean = false;

	/**
	 * Whether the audio context has been initialized.
	 * @type {boolean}
	 * @private
	 */
	private initialized: boolean = false;

	/**
	 * Active music oscillator nodes for cleanup.
	 * @type {OscillatorNode[]}
	 * @private
	 */
	private musicOscillators: OscillatorNode[] = [];

	/**
	 * Music arpeggio interval reference.
	 * @type {ReturnType<typeof setInterval> | null}
	 * @private
	 */
	private arpeggioInterval: ReturnType<typeof setInterval> | null = null;

	/**
	 * Current music intensity level.
	 * @type {MusicIntensity}
	 * @private
	 */
	private currentIntensity: MusicIntensity = "normal";

	/**
	 * Initializes the Web Audio API context and gain nodes.
	 * Must be called after a user interaction to comply with browser autoplay policy.
	 */
	async initialize(): Promise<void>
	{
		if (this.initialized)
		{
			return;
		}

		this.audioContext =
			new AudioContext();

		this.masterGain =
			this.audioContext.createGain();
		this.masterGain.gain.value = 0.5;
		this.masterGain.connect(this.audioContext.destination);

		this.musicGain =
			this.audioContext.createGain();
		this.musicGain.gain.value = 0.3;
		this.musicGain.connect(this.masterGain);

		this.sfxGain =
			this.audioContext.createGain();
		this.sfxGain.gain.value = 0.6;
		this.sfxGain.connect(this.masterGain);

		if (this.audioContext.state === "suspended")
		{
			await this.audioContext.resume();
		}

		this.initialized = true;
	}

	/**
	 * Returns whether the audio is currently muted.
	 * @returns {boolean}
	 * True if muted.
	 */
	isMuted(): boolean
	{
		return this.muted;
	}

	/**
	 * Toggles the mute state on or off.
	 */
	toggleMute(): void
	{
		this.muted =
			!this.muted;

		if (this.masterGain !== null)
		{
			this.masterGain.gain.value =
				this.muted ? 0 : 0.5;
		}
	}

	/**
	 * Starts the procedural background music.
	 * @param {MusicIntensity} [intensity]
	 * Optional intensity level. Defaults to "normal".
	 */
	startMusic(intensity?: MusicIntensity): void
	{
		if (this.audioContext === null || this.musicGain === null)
		{
			return;
		}

		this.stopMusic();
		this.currentIntensity =
			intensity ?? "normal";

		const bassDrone: OscillatorNode =
			this.audioContext.createOscillator();

		bassDrone.type = "sine";
		bassDrone.frequency.value =
			this.currentIntensity === "boss" ? BASE_FREQUENCY / 2 : BASE_FREQUENCY / 4;

		const bassGain: GainNode =
			this.audioContext.createGain();

		bassGain.gain.value = 0.15;
		bassDrone.connect(bassGain);
		bassGain.connect(this.musicGain);
		bassDrone.start();
		this.musicOscillators.push(bassDrone);

		const padOscillator: OscillatorNode =
			this.audioContext.createOscillator();

		padOscillator.type = "sawtooth";
		padOscillator.frequency.value = BASE_FREQUENCY;

		const padGain: GainNode =
			this.audioContext.createGain();

		padGain.gain.value = 0.05;
		padOscillator.connect(padGain);
		padGain.connect(this.musicGain);
		padOscillator.start();
		this.musicOscillators.push(padOscillator);

		this.startArpeggio();
	}

	/**
	 * Stops the background music and cleans up oscillators.
	 */
	stopMusic(): void
	{
		for (const oscillator of this.musicOscillators)
		{
			try
			{
				oscillator.stop();
				oscillator.disconnect();
			}
			catch
			{
				// Oscillator may already be stopped
			}
		}

		this.musicOscillators = [];

		if (this.arpeggioInterval !== null)
		{
			clearInterval(this.arpeggioInterval);
			this.arpeggioInterval = null;
		}
	}

	/**
	 * Sets the music intensity for dynamic soundtrack changes.
	 * @param {MusicIntensity} intensity
	 * The desired intensity level.
	 */
	setMusicIntensity(intensity: MusicIntensity): void
	{
		if (intensity !== this.currentIntensity)
		{
			this.startMusic(intensity);
		}
	}

	/**
	 * Plays a weapon shot sound effect.
	 * @param {string} weaponType
	 * The weapon type identifier.
	 */
	playShot(weaponType: string): void
	{
		if (this.muted || this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		const ctx: AudioContext =
			this.audioContext;
		const now: number =
			ctx.currentTime;

		switch (weaponType)
		{
			case "SpreadGun":
				playNoiseShot(
					ctx,
					this.sfxGain,
					now,
					0.08,
					800);
				break;

			case "Laser":
				playSineSweep(
					ctx,
					this.sfxGain,
					now,
					2000,
					400,
					0.2);
				break;

			case "RapidFire":
				playNoiseShot(
					ctx,
					this.sfxGain,
					now,
					0.03,
					2000);
				break;

			default:
				playNoiseShot(
					ctx,
					this.sfxGain,
					now,
					0.05,
					1200);
				break;
		}
	}

	/**
	 * Plays an explosion sound effect.
	 * @param {ExplosionSize} size
	 * The explosion magnitude.
	 */
	playExplosion(size: ExplosionSize): void
	{
		if (this.muted || this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		const ctx: AudioContext =
			this.audioContext;
		const now: number =
			ctx.currentTime;

		switch (size)
		{
			case "small":
				playExplosionSynth(
					ctx,
					this.sfxGain,
					now,
					0.3,
					200,
					50);
				break;

			case "medium":
				playExplosionSynth(
					ctx,
					this.sfxGain,
					now,
					0.5,
					150,
					30);
				break;

			case "large":
				playExplosionSynth(
					ctx,
					this.sfxGain,
					now,
					2,
					100,
					20);
				break;

			case "nuke":
				playNukeEffect(
					ctx,
					this.sfxGain,
					now);
				break;
		}
	}

	/**
	 * Plays the power-up collection sound effect.
	 */
	playPowerUp(): void
	{
		if (this.muted || this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		const ctx: AudioContext =
			this.audioContext;
		const now: number =
			ctx.currentTime;
		const notes: number[] =
			[523, 659, 784];

		for (let idx: number = 0; idx < notes.length; idx++)
		{
			const osc: OscillatorNode =
				ctx.createOscillator();
			const gain: GainNode =
				ctx.createGain();

			osc.type = "sine";
			osc.frequency.value =
				notes[idx];
			osc.connect(gain);
			gain.connect(this.sfxGain);
			gain.gain.setValueAtTime(
				0.3,
				now + idx * 0.1);
			gain.gain.exponentialRampToValueAtTime(
				0.001,
				now + idx * 0.1 + 0.2);
			osc.start(now + idx * 0.1);
			osc.stop(now + idx * 0.1 + 0.2);
		}
	}

	/**
	 * Plays the free life awarded sound effect.
	 */
	playFreeLife(): void
	{
		if (this.muted || this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		const ctx: AudioContext =
			this.audioContext;
		const now: number =
			ctx.currentTime;
		const notes: number[] =
			[440, 554, 659, 784, 880];

		for (let idx: number = 0; idx < notes.length; idx++)
		{
			const osc: OscillatorNode =
				ctx.createOscillator();
			const gain: GainNode =
				ctx.createGain();

			osc.type = "square";
			osc.frequency.value =
				notes[idx];
			osc.connect(gain);
			gain.connect(this.sfxGain);
			gain.gain.setValueAtTime(
				0.2,
				now + idx * 0.12);
			gain.gain.exponentialRampToValueAtTime(
				0.001,
				now + idx * 0.12 + 0.25);
			osc.start(now + idx * 0.12);
			osc.stop(now + idx * 0.12 + 0.25);
		}
	}

	/**
	 * Plays the player hit sound effect.
	 */
	playPlayerHit(): void
	{
		if (this.muted || this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		const ctx: AudioContext =
			this.audioContext;
		const now: number =
			ctx.currentTime;

		const osc: OscillatorNode =
			ctx.createOscillator();
		const gain: GainNode =
			ctx.createGain();

		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(
			200,
			now);
		osc.frequency.linearRampToValueAtTime(
			50,
			now + 0.15);
		osc.connect(gain);
		gain.connect(this.sfxGain);
		gain.gain.setValueAtTime(
			0.4,
			now);
		gain.gain.exponentialRampToValueAtTime(
			0.001,
			now + 0.2);
		osc.start(now);
		osc.stop(now + 0.2);
	}

	/**
	 * Plays the game over sound effect.
	 */
	playGameOver(): void
	{
		if (this.muted || this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		const ctx: AudioContext =
			this.audioContext;
		const now: number =
			ctx.currentTime;
		const notes: number[] =
			[440, 415, 392, 370, 349, 330];

		for (let idx: number = 0; idx < notes.length; idx++)
		{
			const osc: OscillatorNode =
				ctx.createOscillator();
			const gain: GainNode =
				ctx.createGain();

			osc.type = "sine";
			osc.frequency.value =
				notes[idx];
			osc.connect(gain);
			gain.connect(this.sfxGain);
			gain.gain.setValueAtTime(
				0.3,
				now + idx * 0.2);
			gain.gain.exponentialRampToValueAtTime(
				0.001,
				now + idx * 0.2 + 0.4);
			osc.start(now + idx * 0.2);
			osc.stop(now + idx * 0.2 + 0.4);
		}
	}

	/**
	 * Plays the victory fanfare sound effect.
	 */
	playVictory(): void
	{
		if (this.muted || this.audioContext === null || this.sfxGain === null)
		{
			return;
		}

		const ctx: AudioContext =
			this.audioContext;
		const now: number =
			ctx.currentTime;
		const notes: number[] =
			[523, 659, 784, 1047, 1319];

		for (let idx: number = 0; idx < notes.length; idx++)
		{
			const osc: OscillatorNode =
				ctx.createOscillator();
			const gain: GainNode =
				ctx.createGain();

			osc.type = "square";
			osc.frequency.value =
				notes[idx];
			osc.connect(gain);
			gain.connect(this.sfxGain);
			gain.gain.setValueAtTime(
				0.25,
				now + idx * 0.15);
			gain.gain.exponentialRampToValueAtTime(
				0.001,
				now + idx * 0.15 + 0.3);
			osc.start(now + idx * 0.15);
			osc.stop(now + idx * 0.15 + 0.3);
		}
	}

	/**
	 * Disposes all audio resources and closes the audio context.
	 */
	dispose(): void
	{
		this.stopMusic();

		if (this.masterGain !== null)
		{
			this.masterGain.disconnect();
			this.masterGain = null;
		}

		if (this.musicGain !== null)
		{
			this.musicGain.disconnect();
			this.musicGain = null;
		}

		if (this.sfxGain !== null)
		{
			this.sfxGain.disconnect();
			this.sfxGain = null;
		}

		if (this.audioContext !== null)
		{
			void this.audioContext.close();
			this.audioContext = null;
		}

		this.initialized = false;
		this.muted = false;
	}

	/**
	 * Starts the arpeggio sequence for background music.
	 * @private
	 */
	private startArpeggio(): void
	{
		if (this.audioContext === null || this.musicGain === null)
		{
			return;
		}

		const tempo: number =
			this.currentIntensity === "boss" ? 180 : 120;
		const intervalMs: number =
			60000 / tempo;

		this.arpeggioInterval =
			setInterval(
				() => this.playArpeggioNote(),
				intervalMs);
	}

	/**
	 * Plays a single arpeggio note from the pentatonic scale.
	 * @private
	 */
	private playArpeggioNote(): void
	{
		if (this.audioContext === null || this.musicGain === null || this.muted)
		{
			return;
		}

		const ctx: AudioContext =
			this.audioContext;
		const now: number =
			ctx.currentTime;

		const intervalIndex: number =
			Math.floor(Math.random() * PENTATONIC_INTERVALS.length);
		const semitones: number =
			PENTATONIC_INTERVALS[intervalIndex];
		const octave: number =
			Math.floor(Math.random() * 2) + 1;
		const frequency: number =
			BASE_FREQUENCY * Math.pow(
				2,
				(semitones + octave * 12) / 12);

		const osc: OscillatorNode =
			ctx.createOscillator();
		const gain: GainNode =
			ctx.createGain();

		osc.type = "triangle";
		osc.frequency.value = frequency;
		osc.connect(gain);
		gain.connect(this.musicGain);
		gain.gain.setValueAtTime(
			0.1,
			now);
		gain.gain.exponentialRampToValueAtTime(
			0.001,
			now + 0.3);
		osc.start(now);
		osc.stop(now + 0.3);
	}
}