/**
 * Base Game Audio Service.
 * Abstract foundation for game-specific audio services.
 * Provides shared AudioContext lifecycle, mute delegation, SFX gain creation,
 * and engine sound management. Game-specific services extend this class
 * and implement their own sound effects and music.
 *
 * Route-scoped — concrete subclasses must be provided via route providers[].
 */

import { inject } from "@angular/core";
import type { IGameAudioService } from "@games/shared/models/game-service.interfaces";
import { AudioContextService } from "@games/shared/services/audio-context.service";

/**
 * Abstract base class for game audio services.
 * Eliminates boilerplate: AudioContext delegation, mute, SFX gain, engine sounds.
 */
export abstract class BaseGameAudioService implements IGameAudioService
{
	/** Shared audio context lifecycle service. */
	protected readonly audioContextService: AudioContextService =
		inject(AudioContextService);

	/** Engine oscillator node (for continuous sounds like motors/drones). */
	private engineOscillator: OscillatorNode | null = null;

	/** Engine gain node for volume control. */
	private engineGain: GainNode | null = null;

	/**
	 * Initialize the audio context and game-specific gain nodes.
	 * Must be called after a user interaction event.
	 */
	initialize(): void
	{
		this.audioContextService.initialize();
		this.initializeGainNodes();
	}

	/**
	 * Whether audio is currently muted.
	 */
	get isMuted(): boolean
	{
		return this.audioContextService.isMuted;
	}

	/**
	 * Toggle mute state.
	 */
	toggleMute(): void
	{
		this.audioContextService.toggleMute();
	}

	/**
	 * Disposes audio resources including music, engine, and context.
	 */
	dispose(): void
	{
		this.stopMusic();
		this.stopEngine();
		this.audioContextService.dispose();
	}

	/**
	 * Initialize game-specific gain nodes (SFX, music, etc.).
	 * Called after AudioContext is initialized. Implementations should
	 * guard against double-initialization and missing AudioContext.
	 */
	protected abstract initializeGainNodes(): void;

	/**
	 * Stop any background music or looping audio.
	 * Called during dispose. Implementations should be idempotent.
	 */
	abstract stopMusic(): void;

	/**
	 * Ensures an AudioContext exists, creating one if needed.
	 * @returns
	 * The AudioContext, or null if unavailable.
	 */
	protected ensureContext(): AudioContext | null
	{
		this.audioContextService.initialize();

		return this.audioContextService.isInitialized
			? this.audioContextService.audioContext
			: null;
	}

	/**
	 * Creates a gain node connected to the master gain for SFX.
	 * @param ctx
	 * The AudioContext.
	 * @param volume
	 * Initial gain value.
	 * @returns
	 * The connected GainNode.
	 */
	protected createSfxGain(
		ctx: AudioContext,
		volume: number): GainNode
	{
		const gain: GainNode =
			ctx.createGain();
		gain.gain.value = volume;
		gain.connect(this.audioContextService.masterGain);

		return gain;
	}

	/**
	 * Starts a continuous engine sound (motor drone, airplane, etc.).
	 * Idempotent — stops any existing engine sound first.
	 * @param frequency
	 * Initial oscillator frequency in Hz.
	 * @param gainValue
	 * Initial gain value.
	 * @param waveform
	 * Oscillator waveform type.
	 */
	protected startEngineSound(
		frequency: number,
		gainValue: number,
		waveform: OscillatorType = "sawtooth"): void
	{
		const ctx: AudioContext | null =
			this.ensureContext();

		if (ctx == null)
		{
			return;
		}

		this.stopEngine();

		this.engineGain =
			ctx.createGain();
		this.engineGain.gain.value = gainValue;
		this.engineGain.connect(this.audioContextService.masterGain);

		this.engineOscillator =
			ctx.createOscillator();
		this.engineOscillator.type = waveform;
		this.engineOscillator.frequency.value = frequency;
		this.engineOscillator.connect(this.engineGain);
		this.engineOscillator.start();
	}

	/**
	 * Updates the engine sound frequency and gain.
	 * No-op if engine is not running.
	 * @param frequency
	 * New oscillator frequency in Hz.
	 * @param gainValue
	 * New gain value.
	 */
	protected updateEngineSound(
		frequency: number,
		gainValue: number): void
	{
		if (this.engineOscillator != null)
		{
			this.engineOscillator.frequency.value = frequency;
		}

		if (this.engineGain != null)
		{
			this.engineGain.gain.value = gainValue;
		}
	}

	/**
	 * Gets the engine oscillator for advanced frequency scheduling.
	 * @returns
	 * The engine OscillatorNode, or null if not running.
	 */
	protected get activeEngineOscillator(): OscillatorNode | null
	{
		return this.engineOscillator;
	}

	/**
	 * Gets the engine gain node for advanced gain scheduling.
	 * @returns
	 * The engine GainNode, or null if not running.
	 */
	protected get activeEngineGain(): GainNode | null
	{
		return this.engineGain;
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
			this.engineOscillator.disconnect();
			this.engineOscillator = null;
		}

		if (this.engineGain != null)
		{
			this.engineGain.disconnect();
			this.engineGain = null;
		}
	}
}