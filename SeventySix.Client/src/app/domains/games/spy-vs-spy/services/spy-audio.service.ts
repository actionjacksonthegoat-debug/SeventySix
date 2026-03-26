// <copyright file="spy-audio.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy Audio Service.
 * Manages soundtrack and sound effects using Web Audio API synthesis.
 * Single Responsibility: audio feedback only.
 *
 * Soundtrack: 8-bar spy theme loop in E minor (~140 BPM).
 * SFX: Procedural synthesis — no external audio files required.
 * Gracefully degrades when AudioContext is unavailable (e.g., NullEngine tests).
 */

import { Injectable } from "@angular/core";
import {
	LOOP_DURATION,
	NOTE_A3,
	NOTE_B3,
	NOTE_B4,
	NOTE_D4,
	NOTE_E4,
	NOTE_G4,
	SFX_VOLUME,
	SOUNDTRACK_VOLUME
} from "@games/spy-vs-spy/constants/spy-audio.constants";
import {
	scheduleBassNotes,
	scheduleMelodyNotes,
	schedulePercussionHits
} from "@games/spy-vs-spy/services/spy-audio-scheduler.utility";

/**
 * Manages soundtrack and sound effects using Web Audio API synthesis.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SpyAudioService
{
	/** Shared AudioContext for all audio output. */
	private audioContext: AudioContext | null = null;

	/** Master gain node for soundtrack. */
	private soundtrackGain: GainNode | null = null;

	/** Whether soundtrack is currently playing. */
	private soundtrackPlaying: boolean = false;

	/** Handle for the soundtrack scheduling interval. */
	private loopIntervalId: ReturnType<typeof setInterval> | null = null;

	/** Active soundtrack oscillator nodes (stopped on dispose). */
	private activeOscillators: OscillatorNode[] = [];

	/** Engine oscillator for airplane takeoff sounds. */
	private engineOscillator: OscillatorNode | null = null;

	/** Engine gain node for volume control. */
	private engineGain: GainNode | null = null;

	/**
	 * Plays item collection sound — ascending arpeggio.
	 */
	playItemCollected(): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		const gain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME * 0.7);
		const now: number =
			ctx.currentTime;

		const notes: ReadonlyArray<number> =
			[NOTE_E4, NOTE_G4, NOTE_B4];

		for (let i: number = 0; i < notes.length; i++)
		{
			const osc: OscillatorNode =
				ctx.createOscillator();
			osc.type = "square";
			osc.frequency.value =
				notes[i];
			osc.connect(gain);
			osc.start(now + i * 0.08);
			osc.stop(now + i * 0.08 + 0.07);
		}

		gain.gain.setValueAtTime(
			SFX_VOLUME * 0.7,
			now + 0.24);
		gain.gain.linearRampToValueAtTime(0, now + 0.35);
	}

	/**
	 * Plays bomb explosion sound — low noise burst with decay.
	 */
	playBombTriggered(): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		const now: number =
			ctx.currentTime;
		const gain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME);

		/* Noise burst via short buffer of random samples. */
		const bufferSize: number =
			ctx.sampleRate;
		const buffer: AudioBuffer =
			ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data: Float32Array =
			buffer.getChannelData(0);

		for (let i: number = 0; i < bufferSize; i++)
		{
			data[i] =
				Math.random() * 2 - 1;
		}

		const noise: AudioBufferSourceNode =
			ctx.createBufferSource();
		noise.buffer = buffer;

		/* Low-pass filter for bassy explosion. */
		const filter: BiquadFilterNode =
			ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 400;

		noise.connect(filter);
		filter.connect(gain);
		noise.start(now);
		noise.stop(now + 0.5);

		gain.gain.setValueAtTime(SFX_VOLUME, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

		/* Sub-bass impact hit. */
		const sub: OscillatorNode =
			ctx.createOscillator();
		sub.type = "sine";
		sub.frequency.value = 60;

		const subGain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME * 0.8);
		sub.connect(subGain);
		sub.start(now);
		sub.stop(now + 0.3);

		subGain.gain.setValueAtTime(SFX_VOLUME * 0.8, now);
		subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
	}

	/**
	 * Plays a massive island explosion boom — deep rumble with long decay.
	 * Louder and longer than playBombTriggered() for dramatic effect.
	 */
	playExplosionBoom(): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		const now: number =
			ctx.currentTime;

		/* Deep noise rumble with long decay. */
		const bufferSize: number =
			ctx.sampleRate * 2;
		const buffer: AudioBuffer =
			ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data: Float32Array =
			buffer.getChannelData(0);

		for (let i: number = 0; i < bufferSize; i++)
		{
			data[i] =
				Math.random() * 2 - 1;
		}

		const noise: AudioBufferSourceNode =
			ctx.createBufferSource();
		noise.buffer = buffer;

		const filter: BiquadFilterNode =
			ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(200, now);
		filter.frequency.linearRampToValueAtTime(80, now + 2);

		const noiseGain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME);
		noiseGain.gain.setValueAtTime(SFX_VOLUME, now);
		noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

		noise.connect(filter);
		filter.connect(noiseGain);
		noise.start(now);
		noise.stop(now + 2.5);

		/* Sub-bass impact — very low and powerful. */
		const sub: OscillatorNode =
			ctx.createOscillator();
		sub.type = "sine";
		sub.frequency.setValueAtTime(40, now);
		sub.frequency.linearRampToValueAtTime(25, now + 1.5);

		const subGain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME);
		subGain.gain.setValueAtTime(SFX_VOLUME, now);
		subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

		sub.connect(subGain);
		sub.start(now);
		sub.stop(now + 1.5);
	}

	/**
	 * Plays spring trap launch sound — ascending pitch sweep.
	 */
	playSpringTriggered(): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		const now: number =
			ctx.currentTime;
		const gain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME * 0.6);

		const osc: OscillatorNode =
			ctx.createOscillator();
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(200, now);
		osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
		osc.connect(gain);
		osc.start(now);
		osc.stop(now + 0.3);

		gain.gain.setValueAtTime(SFX_VOLUME * 0.6, now);
		gain.gain.linearRampToValueAtTime(0, now + 0.3);
	}

	/**
	 * Plays victory fanfare — major chord arpeggio with sustain.
	 */
	playWon(): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		const now: number =
			ctx.currentTime;
		const gain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME * 0.5);

		/* E major fanfare: E4 → G#4 → B4 → E5 */
		const fanfare: ReadonlyArray<number> =
			[NOTE_E4, 415.30, NOTE_B4, 659.25];

		for (let i: number = 0; i < fanfare.length; i++)
		{
			const osc: OscillatorNode =
				ctx.createOscillator();
			osc.type = "triangle";
			osc.frequency.value =
				fanfare[i];
			osc.connect(gain);
			osc.start(now + i * 0.15);
			osc.stop(now + i * 0.15 + 0.4);
		}

		gain.gain.setValueAtTime(
			SFX_VOLUME * 0.5,
			now + 0.6);
		gain.gain.linearRampToValueAtTime(0, now + 1.0);
	}

	/**
	 * Plays defeat sound — descending minor tones.
	 */
	playLost(): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		const now: number =
			ctx.currentTime;
		const gain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME * 0.5);

		/* Descending: E4 → D4 → B3 → A3 */
		const defeat: ReadonlyArray<number> =
			[NOTE_E4, NOTE_D4, NOTE_B3, NOTE_A3];

		for (let i: number = 0; i < defeat.length; i++)
		{
			const osc: OscillatorNode =
				ctx.createOscillator();
			osc.type = "triangle";
			osc.frequency.value =
				defeat[i];
			osc.connect(gain);
			osc.start(now + i * 0.2);
			osc.stop(now + i * 0.2 + 0.35);
		}

		gain.gain.setValueAtTime(
			SFX_VOLUME * 0.5,
			now + 0.8);
		gain.gain.linearRampToValueAtTime(0, now + 1.2);
	}

	/**
	 * Plays combat hit sound — sharp percussive impact.
	 */
	playCombatHit(): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		const now: number =
			ctx.currentTime;
		const gain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME * 0.6);

		/* Short noise burst for impact. */
		const bufferSize: number =
			Math.floor(ctx.sampleRate * 0.1);
		const buffer: AudioBuffer =
			ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data: Float32Array =
			buffer.getChannelData(0);

		for (let i: number = 0; i < bufferSize; i++)
		{
			data[i] =
				Math.random() * 2 - 1;
		}

		const noise: AudioBufferSourceNode =
			ctx.createBufferSource();
		noise.buffer = buffer;

		const filter: BiquadFilterNode =
			ctx.createBiquadFilter();
		filter.type = "bandpass";
		filter.frequency.value = 800;
		filter.Q.value = 2;

		noise.connect(filter);
		filter.connect(gain);
		noise.start(now);
		noise.stop(now + 0.1);

		gain.gain.setValueAtTime(SFX_VOLUME * 0.6, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
	}

	/**
	 * Plays search/rummage sound — quick filtered sweep.
	 */
	playSearch(): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		const now: number =
			ctx.currentTime;
		const gain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME * 0.3);

		const osc: OscillatorNode =
			ctx.createOscillator();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(300, now);
		osc.frequency.linearRampToValueAtTime(600, now + 0.1);
		osc.frequency.linearRampToValueAtTime(350, now + 0.15);
		osc.connect(gain);
		osc.start(now);
		osc.stop(now + 0.15);

		gain.gain.setValueAtTime(SFX_VOLUME * 0.3, now);
		gain.gain.linearRampToValueAtTime(0, now + 0.15);
	}

	/**
	 * Plays an engine startup sound — low frequency oscillator building in volume.
	 * Used when airplane begins takeoff sequence.
	 */
	playEngineStartup(): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		this.stopEngine();

		const now: number =
			ctx.currentTime;

		this.engineGain =
			ctx.createGain();
		this.engineGain.gain.setValueAtTime(0, now);
		this.engineGain.gain.linearRampToValueAtTime(SFX_VOLUME * 0.08, now + 1);
		this.engineGain.gain.linearRampToValueAtTime(SFX_VOLUME * 0.16, now + 3);
		this.engineGain.connect(ctx.destination);

		this.engineOscillator =
			ctx.createOscillator();
		this.engineOscillator.type = "sawtooth";
		this.engineOscillator.frequency.setValueAtTime(80, now);
		this.engineOscillator.frequency.linearRampToValueAtTime(120, now + 2);
		this.engineOscillator.frequency.linearRampToValueAtTime(200, now + 4);
		this.engineOscillator.connect(this.engineGain);
		this.engineOscillator.start(now);
	}

	/**
	 * Stops engine sounds and cleans up oscillator/gain nodes.
	 * Idempotent — calling while not playing has no effect.
	 */
	stopEngine(): void
	{
		if (this.engineOscillator != null)
		{
			try
			{
				this.engineOscillator.stop();
			}
			catch
			{
				/* Oscillator already stopped — ignore. */
			}
			this.engineOscillator = null;
		}

		if (this.engineGain != null)
		{
			this.engineGain.disconnect();
			this.engineGain = null;
		}
	}

	/**
	 * Starts the background soundtrack loop.
	 * Idempotent — calling while already playing has no effect.
	 * Gracefully degrades when AudioContext is unavailable (e.g., NullEngine tests).
	 */
	playSoundtrack(): void
	{
		if (this.soundtrackPlaying)
		{
			return;
		}

		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		const gain: GainNode =
			ctx.createGain();
		gain.gain.value = SOUNDTRACK_VOLUME;
		gain.connect(ctx.destination);

		this.soundtrackGain = gain;
		this.soundtrackPlaying = true;

		/* Schedule the first loop immediately. */
		this.scheduleLoop(ctx, gain, ctx.currentTime);

		/* Re-schedule every loop duration to keep playing. */
		this.loopIntervalId =
			setInterval(
				() =>
				{
					if (this.audioContext != null && this.soundtrackPlaying)
					{
						this.scheduleLoop(
							this.audioContext,
							gain,
							this.audioContext.currentTime);
					}
				},
				LOOP_DURATION * 1000);
	}

	/**
	 * Stops the background soundtrack.
	 * Idempotent — calling while not playing has no effect.
	 */
	stopSoundtrack(): void
	{
		if (!this.soundtrackPlaying)
		{
			return;
		}

		if (this.loopIntervalId != null)
		{
			clearInterval(this.loopIntervalId);
			this.loopIntervalId = null;
		}

		for (const osc of this.activeOscillators)
		{
			try
			{
				osc.stop();
			}
			catch
			{
				/* Oscillator already stopped — ignore. */
			}
		}
		this.activeOscillators = [];

		if (this.soundtrackGain != null)
		{
			this.soundtrackGain.disconnect();
			this.soundtrackGain = null;
		}

		this.soundtrackPlaying = false;
	}

	/**
	 * Disposes audio resources including active soundtrack.
	 */
	dispose(): void
	{
		this.stopSoundtrack();
		this.stopEngine();

		if (this.audioContext != null)
		{
			this
				.audioContext
				.close()
				.catch(
					() =>
					{
						/* Context close failure — ignore. */
					});
			this.audioContext = null;
		}
	}

	/**
	 * Ensures an AudioContext exists, creating one if needed.
	 * @returns
	 * The AudioContext, or null if unavailable.
	 */
	private ensureContext(): AudioContext | null
	{
		if (this.audioContext != null)
		{
			return this.audioContext;
		}

		try
		{
			this.audioContext =
				new AudioContext();

			return this.audioContext;
		}
		catch
		{
			return null;
		}
	}

	/**
	 * Creates a gain node connected to the audio destination for SFX.
	 * @param ctx
	 * The AudioContext.
	 * @param volume
	 * Initial gain value.
	 * @returns
	 * The connected GainNode.
	 */
	private createSfxGain(
		ctx: AudioContext,
		volume: number): GainNode
	{
		const gain: GainNode =
			ctx.createGain();
		gain.gain.value = volume;
		gain.connect(ctx.destination);

		return gain;
	}

	/**
	 * Schedules one full loop of the spy theme (bass + melody + percussion).
	 * @param ctx
	 * The AudioContext.
	 * @param gain
	 * The soundtrack master gain node.
	 * @param startTime
	 * The AudioContext time to begin scheduling from.
	 */
	private scheduleLoop(
		ctx: AudioContext,
		gain: GainNode,
		startTime: number): void
	{
		scheduleBassNotes(ctx, gain, startTime, this.activeOscillators);
		scheduleMelodyNotes(ctx, gain, startTime, this.activeOscillators);
		schedulePercussionHits(ctx, gain, startTime);
	}
}