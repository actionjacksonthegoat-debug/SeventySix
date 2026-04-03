/**
 * Audio Context Service.
 * Shared audio context management for game audio services.
 * Handles AudioContext lifecycle, master gain, and helper node creation.
 * Game-specific audio services compose this service rather than
 * managing AudioContext directly.
 * Route-scoped — register in route providers[], not providedIn root.
 */

import { Injectable } from "@angular/core";
import type { IGameAudioService } from "@games/shared/models/game-service.interfaces";

/** Default master volume level. */
const DEFAULT_MASTER_VOLUME: number = 0.3;

/**
 * Manages a shared AudioContext and master gain for game audio.
 * Provides oscillator and gain node creation helpers.
 */
@Injectable()
export class AudioContextService implements IGameAudioService
{
	/** Internal AudioContext instance. */
	private context: AudioContext | null = null;

	/** Internal master gain node. */
	private gain: GainNode | null = null;

	/** Whether audio is currently muted. */
	private muted: boolean = false;

	/** Volume before mute for restore. */
	private preMuteVolume: number =
		DEFAULT_MASTER_VOLUME;

	/**
	 * Whether the audio context has been initialized.
	 */
	get isInitialized(): boolean
	{
		return this.context !== null;
	}

	/**
	 * Get the active AudioContext.
	 * @throws Error if not initialized.
	 */
	get audioContext(): AudioContext
	{
		if (this.context === null)
		{
			throw new Error(
				"AudioContextService: audioContext accessed before initialize().");
		}

		return this.context;
	}

	/**
	 * Get the master gain node.
	 * @throws Error if not initialized.
	 */
	get masterGain(): GainNode
	{
		if (this.gain === null)
		{
			throw new Error(
				"AudioContextService: masterGain accessed before initialize().");
		}

		return this.gain;
	}

	/**
	 * Whether audio is currently muted.
	 */
	get isMuted(): boolean
	{
		return this.muted;
	}

	/**
	 * Initialize AudioContext and master gain chain.
	 * Idempotent — safe to call multiple times.
	 */
	initialize(): void
	{
		if (this.context !== null)
		{
			return;
		}

		if (typeof AudioContext === "undefined")
		{
			return;
		}

		this.context =
			new AudioContext();
		this.gain =
			this.context.createGain();
		this.gain.gain.value =
			DEFAULT_MASTER_VOLUME;
		this.gain.connect(this.context.destination);
	}

	/**
	 * Toggle mute state.
	 * Sets master gain to 0 when muting, restores previous volume when unmuting.
	 */
	toggleMute(): void
	{
		if (this.gain === null)
		{
			return;
		}

		this.muted =
			!this.muted;

		if (this.muted)
		{
			this.preMuteVolume =
				this.gain.gain.value;
			this.gain.gain.value = 0;
		}
		else
		{
			this.gain.gain.value =
				this.preMuteVolume;
		}
	}

	/**
	 * Create an OscillatorNode connected to master gain.
	 * @param type
	 * Oscillator wave type.
	 * @param frequency
	 * Frequency in Hz.
	 * @returns
	 * The connected OscillatorNode.
	 */
	createOscillator(
		type: OscillatorType,
		frequency: number): OscillatorNode
	{
		const osc: OscillatorNode =
			this.audioContext.createOscillator();
		osc.type = type;
		osc.frequency.value = frequency;
		osc.connect(this.masterGain);

		return osc;
	}

	/**
	 * Create a GainNode connected to master gain with specified volume.
	 * @param volume
	 * Initial gain value.
	 * @returns
	 * The connected GainNode.
	 */
	createGainNode(volume: number): GainNode
	{
		const gainNode: GainNode =
			this.audioContext.createGain();
		gainNode.gain.value = volume;
		gainNode.connect(this.masterGain);

		return gainNode;
	}

	/**
	 * Close AudioContext and release all audio resources.
	 */
	dispose(): void
	{
		if (this.context !== null)
		{
			this
				.context
				.close()
				.catch(
					() =>
					{
						/* AudioContext.close() may reject if already closed. */
					});
			this.context = null;
		}

		this.gain = null;
		this.muted = false;
	}
}