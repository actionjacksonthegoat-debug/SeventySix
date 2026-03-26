/**
 * Car-a-Lot Audio Service.
 * Procedural audio synthesis using Web Audio API for driving game sounds.
 * All sounds generated procedurally — no external audio files required.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";

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
export class CarALotAudioService
{
	/** Web Audio API context. */
	private audioContext: AudioContext | null = null;

	/** Master gain node for global volume. */
	private masterGain: GainNode | null = null;

	/** SFX gain node for sound effects. */
	private sfxGain: GainNode | null = null;

	/** Music gain node for background music. */
	private musicGain: GainNode | null = null;

	/** Whether audio is muted. */
	private muted: boolean = false;

	/** Whether the context has been initialized. */
	private initialized: boolean = false;

	/** Active music oscillators for cleanup. */
	private musicOscillators: OscillatorNode[] = [];

	/** Music arpeggio interval for cleanup. */
	private arpeggioInterval: ReturnType<typeof setInterval> | null = null;

	/** Engine drone oscillator. */
	private engineOsc: OscillatorNode | null = null;

	/** Engine drone gain for RPM modulation. */
	private engineGain: GainNode | null = null;

	/**
	 * Initialize the Web Audio API context and gain nodes.
	 * Must be called after a user interaction event.
	 */
	initialize(): void
	{
		if (this.initialized)
		{
			return;
		}

		if (typeof AudioContext === "undefined")
		{
			return;
		}

		this.audioContext =
			new AudioContext();
		this.masterGain =
			this.audioContext.createGain();
		this.masterGain.gain.value = 0.3;
		this.masterGain.connect(this.audioContext.destination);

		this.sfxGain =
			this.audioContext.createGain();
		this.sfxGain.gain.value = 0.6;
		this.sfxGain.connect(this.masterGain);

		this.musicGain =
			this.audioContext.createGain();
		this.musicGain.gain.value = 0.45;
		this.musicGain.connect(this.masterGain);

		this.initialized = true;
	}

	/**
	 * Returns whether audio is currently muted.
	 * @returns
	 * True if muted.
	 */
	isMuted(): boolean
	{
		return this.muted;
	}

	/**
	 * Toggle mute state.
	 */
	toggleMute(): void
	{
		this.muted =
			!this.muted;

		if (this.masterGain !== null)
		{
			this.masterGain.gain.value =
				this.muted ? 0 : 0.3;
		}
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

		const now: number =
			this.audioContext.currentTime;
		const osc: OscillatorNode =
			this.audioContext.createOscillator();
		const gain: GainNode =
			this.audioContext.createGain();

		osc.type = "sine";
		osc.frequency.value =
			isLast ? 880 : 440;

		gain.gain.setValueAtTime(0.4, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start(now);
		osc.stop(now + 0.4);
	}

	/**
	 * Start the engine drone sound, modulated by speed.
	 */
	startEngine(): void
	{
		if (this.audioContext === null || this.sfxGain === null || this.engineOsc !== null)
		{
			return;
		}

		this.engineOsc =
			this.audioContext.createOscillator();
		this.engineOsc.type = "sawtooth";
		this.engineOsc.frequency.value = 60;

		this.engineGain =
			this.audioContext.createGain();
		this.engineGain.gain.value = 0.03;

		this.engineOsc.connect(this.engineGain);
		this.engineGain.connect(this.sfxGain);
		this.engineOsc.start();
	}

	/**
	 * Update engine sound pitch based on current speed ratio (0-1).
	 * @param speedRatio
	 * Speed as fraction of max speed (0 = idle, 1 = max).
	 */
	updateEngine(speedRatio: number): void
	{
		if (this.engineOsc !== null)
		{
			this.engineOsc.frequency.value =
				60 + speedRatio * 180;
		}

		if (this.engineGain !== null)
		{
			this.engineGain.gain.value =
				0.01 + speedRatio * 0.03;
		}
	}

	/**
	 * Stop the engine drone sound.
	 */
	stopEngine(): void
	{
		if (this.engineOsc !== null)
		{
			this.engineOsc.stop();
			this.engineOsc.disconnect();
			this.engineOsc = null;
		}

		if (this.engineGain !== null)
		{
			this.engineGain.disconnect();
			this.engineGain = null;
		}
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

		const now: number =
			this.audioContext.currentTime;

		for (const [noteIdx, semitone] of [0, 7, 12].entries())
		{
			const osc: OscillatorNode =
				this.audioContext.createOscillator();
			const gain: GainNode =
				this.audioContext.createGain();

			const freq: number =
				880 * Math.pow(2, semitone / 12);
			const start: number =
				now + noteIdx * 0.08;

			osc.type = "sine";
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0.2, start);
			gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);

			osc.connect(gain);
			gain.connect(this.sfxGain);
			osc.start(start);
			osc.stop(start + 0.15);
		}
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

		const now: number =
			this.audioContext.currentTime;
		const osc: OscillatorNode =
			this.audioContext.createOscillator();
		const gain: GainNode =
			this.audioContext.createGain();

		osc.type = "triangle";
		osc.frequency.setValueAtTime(120, now);
		osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

		gain.gain.setValueAtTime(0.25, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start(now);
		osc.stop(now + 0.2);
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

		const now: number =
			this.audioContext.currentTime;
		const osc: OscillatorNode =
			this.audioContext.createOscillator();
		const gain: GainNode =
			this.audioContext.createGain();

		osc.type = "sine";
		osc.frequency.setValueAtTime(200, now);
		osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

		gain.gain.setValueAtTime(0.2, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start(now);
		osc.stop(now + 0.3);
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

		const now: number =
			this.audioContext.currentTime;

		for (const [noteIdx, semitone] of [0, 4, 7, 12, 16].entries())
		{
			const osc: OscillatorNode =
				this.audioContext.createOscillator();
			const gain: GainNode =
				this.audioContext.createGain();

			const freq: number =
				BASE_FREQ * Math.pow(2, semitone / 12);
			const start: number =
				now + noteIdx * 0.2;

			osc.type = "square";
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0.2, start);
			gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);

			osc.connect(gain);
			gain.connect(this.sfxGain);
			osc.start(start);
			osc.stop(start + 0.3);
		}
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

		const now: number =
			this.audioContext.currentTime;
		const osc: OscillatorNode =
			this.audioContext.createOscillator();
		const gain: GainNode =
			this.audioContext.createGain();

		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(400, now);
		osc.frequency.exponentialRampToValueAtTime(80, now + 1.0);

		gain.gain.setValueAtTime(0.2, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

		osc.connect(gain);
		gain.connect(this.sfxGain);
		osc.start(now);
		osc.stop(now + 1.0);
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
						BASE_FREQ * Math.pow(2, semitone / 12);

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
							BASE_FREQ * Math.pow(2, bassSemitone / 12);

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
	dispose(): void
	{
		this.stopEngine();
		this.stopMusic();

		if (this.audioContext !== null)
		{
			this
				.audioContext
				.close()
				.catch(
					() =>
					{
						/* Context may already be closed */
					});
			this.audioContext = null;
		}

		this.masterGain = null;
		this.sfxGain = null;
		this.musicGain = null;
		this.initialized = false;
	}
}