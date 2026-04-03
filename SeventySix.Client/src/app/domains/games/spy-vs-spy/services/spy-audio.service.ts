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
import { BaseGameAudioService } from "@games/shared/services/base-game-audio.service";
import { createNoiseBuffer, playArpeggio, SfxBuilder } from "@games/shared/utilities/sfx-builder.utility";
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
export class SpyAudioService extends BaseGameAudioService
{
	/** Master gain node for soundtrack. */
	private soundtrackGain: GainNode | null = null;

	/** Whether soundtrack is currently playing. */
	private soundtrackPlaying: boolean = false;

	/** Handle for the soundtrack scheduling interval. */
	private loopIntervalId: ReturnType<typeof setInterval> | null = null;

	/** Active soundtrack oscillator nodes (stopped on dispose). */
	private activeOscillators: OscillatorNode[] = [];

	/**
	 * Initialize gain nodes. No game-specific gain nodes needed —
	 * SpyAudioService creates SFX gains per-effect via createSfxGain().
	 */
	protected initializeGainNodes(): void
	{
		/* No persistent gain nodes — SFX gains are created per-effect. */
	}

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

		playArpeggio(
			ctx,
			gain,
			[NOTE_E4, NOTE_G4, NOTE_B4],
			{
				waveform: "square",
				noteSpacing: 0.08,
				noteDuration: 0.07,
				volume: SFX_VOLUME * 0.7,
				envelopeType: "linear",
				envelopeDelay: 0,
				envelopeReleaseDuration: 0.11
			});
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
		const noise: AudioBufferSourceNode =
			ctx.createBufferSource();
		noise.buffer =
			createNoiseBuffer(ctx, 1);

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
		const noise: AudioBufferSourceNode =
			ctx.createBufferSource();
		noise.buffer =
			createNoiseBuffer(ctx, 2);

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

		SfxBuilder
			.tone(ctx, this.audioContextService.masterGain)
			.sawtooth(200, 0.3)
			.sweepTo(1200, 0.25)
			.linearEnvelope(SFX_VOLUME * 0.6, 0, 0.3)
			.play();
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

		const gain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME * 0.5);

		/* E major fanfare: E4 → G#4 → B4 → E5 */
		playArpeggio(
			ctx,
			gain,
			[NOTE_E4, 415.30, NOTE_B4, 659.25],
			{
				waveform: "triangle",
				noteSpacing: 0.15,
				noteDuration: 0.4,
				volume: SFX_VOLUME * 0.5,
				envelopeType: "linear",
				envelopeDelay: 0.15,
				envelopeReleaseDuration: 0.4
			});
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

		const gain: GainNode =
			this.createSfxGain(ctx, SFX_VOLUME * 0.5);

		/* Descending: E4 → D4 → B3 → A3 */
		playArpeggio(
			ctx,
			gain,
			[NOTE_E4, NOTE_D4, NOTE_B3, NOTE_A3],
			{
				waveform: "triangle",
				noteSpacing: 0.2,
				noteDuration: 0.35,
				volume: SFX_VOLUME * 0.5,
				envelopeType: "linear",
				envelopeDelay: 0.2,
				envelopeReleaseDuration: 0.4
			});
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
		const noise: AudioBufferSourceNode =
			ctx.createBufferSource();
		noise.buffer =
			createNoiseBuffer(ctx, 0.1);

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

		this.startEngineSound(80, 0, "sawtooth");

		const engineGainNode: GainNode | null =
			this.activeEngineGain;
		const engineOscNode: OscillatorNode | null =
			this.activeEngineOscillator;

		if (engineGainNode != null)
		{
			engineGainNode.gain.setValueAtTime(0, now);
			engineGainNode.gain.linearRampToValueAtTime(SFX_VOLUME * 0.08, now + 1);
			engineGainNode.gain.linearRampToValueAtTime(SFX_VOLUME * 0.16, now + 3);
		}

		if (engineOscNode != null)
		{
			engineOscNode.frequency.setValueAtTime(80, now);
			engineOscNode.frequency.linearRampToValueAtTime(120, now + 2);
			engineOscNode.frequency.linearRampToValueAtTime(200, now + 4);
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
		gain.connect(this.audioContextService.masterGain);

		this.soundtrackGain = gain;
		this.soundtrackPlaying = true;

		/* Schedule the first loop immediately. */
		this.scheduleLoop(ctx, gain, ctx.currentTime);

		/* Re-schedule every loop duration to keep playing. */
		this.loopIntervalId =
			setInterval(
				() =>
				{
					if (this.audioContextService.isInitialized && this.soundtrackPlaying)
					{
						this.scheduleLoop(
							this.audioContextService.audioContext,
							gain,
							this.audioContextService.audioContext.currentTime);
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
	 * Stops all music (soundtrack). Called by base class during dispose.
	 */
	stopMusic(): void
	{
		this.stopSoundtrack();
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