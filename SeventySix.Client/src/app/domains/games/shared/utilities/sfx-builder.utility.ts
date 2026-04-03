/**
 * SFX Builder Utility.
 * Fluent builder for Web Audio API sound effects.
 * Eliminates boilerplate oscillator-gain-connect-schedule patterns
 * shared across all game audio services.
 */

/** Configuration for a tone play command. */
interface ToneConfig
{
	/** Oscillator waveform type. */
	waveform: OscillatorType;

	/** Starting frequency in Hz. */
	frequency: number;

	/** Optional frequency sweep target and duration. */
	sweep?: {
		/** Target frequency in Hz. */
		target: number;
		/** Sweep duration in seconds. */
		duration: number;
		/** Whether to use exponential ramp (true) or linear ramp (false). */
		exponential: boolean;
	};

	/** Start time offset in seconds from `now`. */
	startOffset: number;

	/** Tone duration in seconds. */
	duration: number;
}

/** Configuration for a gain envelope. */
interface EnvelopeConfig
{
	/** Initial gain value at attack. */
	attack: number;

	/** Final gain value at release. */
	release: number;

	/** Total envelope duration in seconds. */
	duration: number;

	/** Whether to use exponential ramp (true) or linear ramp (false). */
	exponential: boolean;
}

/**
 * Fluent builder for procedural Web Audio sound effects.
 * Handles oscillator creation, gain routing, envelope scheduling, and cleanup.
 *
 * @example
 * ```ts
 * SfxBuilder.tone(ctx, gainNode)
 *   .sine(440)
 *   .expEnvelope(0.4, 0.01, 0.4)
 *   .play();
 * ```
 */
export class SfxBuilder
{
	/** AudioContext for this effect. */
	private readonly ctx: AudioContext;

	/** Parent gain node to connect to. */
	private readonly parentGain: GainNode;

	/** Configured tones to play. */
	private readonly tones: ToneConfig[] = [];

	/** Gain envelope configuration. */
	private envelope: EnvelopeConfig | null = null;

	/** Additional time offset for envelope start. */
	private envelopeOffset: number = 0;

	/**
	 * Private constructor — use static factory methods.
	 * @param ctx
	 * The AudioContext.
	 * @param parentGain
	 * The gain node to route output through.
	 */
	private constructor(
		ctx: AudioContext,
		parentGain: GainNode)
	{
		this.ctx = ctx;
		this.parentGain = parentGain;
	}

	/**
	 * Creates a new SFX builder for a single tone.
	 * @param ctx
	 * The AudioContext.
	 * @param parentGain
	 * The gain node to route output through.
	 * @returns
	 * A new SfxBuilder instance.
	 */
	static tone(
		ctx: AudioContext,
		parentGain: GainNode): SfxBuilder
	{
		return new SfxBuilder(ctx, parentGain);
	}

	/**
	 * Adds a sine oscillator tone.
	 * @param frequency
	 * Frequency in Hz.
	 * @param duration
	 * Tone duration in seconds.
	 * @param startOffset
	 * Start time offset from now in seconds.
	 * @returns
	 * This builder for chaining.
	 */
	sine(
		frequency: number,
		duration: number,
		startOffset: number = 0): SfxBuilder
	{
		return this.addTone("sine", frequency, duration, startOffset);
	}

	/**
	 * Adds a square oscillator tone.
	 * @param frequency
	 * Frequency in Hz.
	 * @param duration
	 * Tone duration in seconds.
	 * @param startOffset
	 * Start time offset from now in seconds.
	 * @returns
	 * This builder for chaining.
	 */
	square(
		frequency: number,
		duration: number,
		startOffset: number = 0): SfxBuilder
	{
		return this.addTone("square", frequency, duration, startOffset);
	}

	/**
	 * Adds a sawtooth oscillator tone.
	 * @param frequency
	 * Frequency in Hz.
	 * @param duration
	 * Tone duration in seconds.
	 * @param startOffset
	 * Start time offset from now in seconds.
	 * @returns
	 * This builder for chaining.
	 */
	sawtooth(
		frequency: number,
		duration: number,
		startOffset: number = 0): SfxBuilder
	{
		return this.addTone("sawtooth", frequency, duration, startOffset);
	}

	/**
	 * Adds a triangle oscillator tone.
	 * @param frequency
	 * Frequency in Hz.
	 * @param duration
	 * Tone duration in seconds.
	 * @param startOffset
	 * Start time offset from now in seconds.
	 * @returns
	 * This builder for chaining.
	 */
	triangle(
		frequency: number,
		duration: number,
		startOffset: number = 0): SfxBuilder
	{
		return this.addTone("triangle", frequency, duration, startOffset);
	}

	/**
	 * Adds an exponential frequency sweep to the last added tone.
	 * @param target
	 * Target frequency in Hz.
	 * @param duration
	 * Sweep duration in seconds.
	 * @returns
	 * This builder for chaining.
	 */
	sweepTo(
		target: number,
		duration: number): SfxBuilder
	{
		return this.addSweep(target, duration, true);
	}

	/**
	 * Adds a linear frequency sweep to the last added tone.
	 * @param target
	 * Target frequency in Hz.
	 * @param duration
	 * Sweep duration in seconds.
	 * @returns
	 * This builder for chaining.
	 */
	linearSweepTo(
		target: number,
		duration: number): SfxBuilder
	{
		return this.addSweep(target, duration, false);
	}

	/**
	 * Configures an exponential gain envelope (attack → release).
	 * @param attack
	 * Initial gain value.
	 * @param release
	 * Final gain value (must be > 0 for exponential ramp).
	 * @param duration
	 * Envelope duration in seconds.
	 * @param startOffset
	 * Optional offset from the effect start time.
	 * @returns
	 * This builder for chaining.
	 */
	expEnvelope(
		attack: number,
		release: number,
		duration: number,
		startOffset: number = 0): SfxBuilder
	{
		this.envelope =
			{ attack, release, duration, exponential: true };
		this.envelopeOffset = startOffset;

		return this;
	}

	/**
	 * Configures a linear gain envelope (attack → release).
	 * @param attack
	 * Initial gain value.
	 * @param release
	 * Final gain value.
	 * @param duration
	 * Envelope duration in seconds.
	 * @param startOffset
	 * Optional offset from the effect start time.
	 * @returns
	 * This builder for chaining.
	 */
	linearEnvelope(
		attack: number,
		release: number,
		duration: number,
		startOffset: number = 0): SfxBuilder
	{
		this.envelope =
			{ attack, release, duration, exponential: false };
		this.envelopeOffset = startOffset;

		return this;
	}

	/**
	 * Schedules and plays all configured tones through the parent gain.
	 * Creates oscillators and gain nodes, connects them, and auto-stops.
	 */
	play(): void
	{
		const now: number =
			this.ctx.currentTime;
		const gain: GainNode =
			this.ctx.createGain();
		gain.connect(this.parentGain);

		if (this.envelope != null)
		{
			this.applyEnvelope(gain, now);
		}

		for (const tone of this.tones)
		{
			this.scheduleTone(tone, gain, now);
		}
	}

	/**
	 * Applies the configured envelope to the gain node.
	 * @param gain
	 * The gain node to shape.
	 * @param now
	 * The current audio context time.
	 */
	private applyEnvelope(gain: GainNode, now: number): void
	{
		if (this.envelope == null)
		{
			return;
		}

		const envStart: number =
			now + this.envelopeOffset;

		gain.gain.setValueAtTime(
			this.envelope.attack,
			envStart);

		if (this.envelope.exponential)
		{
			gain.gain.exponentialRampToValueAtTime(
				this.envelope.release,
				envStart + this.envelope.duration);
		}
		else
		{
			gain.gain.linearRampToValueAtTime(
				this.envelope.release,
				envStart + this.envelope.duration);
		}
	}

	/**
	 * Creates, configures, and schedules a single oscillator tone.
	 * @param tone
	 * The tone configuration.
	 * @param gain
	 * The parent gain node to connect to.
	 * @param now
	 * The current audio context time.
	 */
	private scheduleTone(tone: ToneConfig, gain: GainNode, now: number): void
	{
		const osc: OscillatorNode =
			this.ctx.createOscillator();
		osc.type =
			tone.waveform;

		const start: number =
			now + tone.startOffset;

		if (tone.sweep != null)
		{
			osc.frequency.setValueAtTime(tone.frequency, start);

			if (tone.sweep.exponential)
			{
				osc.frequency.exponentialRampToValueAtTime(
					tone.sweep.target,
					start + tone.sweep.duration);
			}
			else
			{
				osc.frequency.linearRampToValueAtTime(
					tone.sweep.target,
					start + tone.sweep.duration);
			}
		}
		else
		{
			osc.frequency.value =
				tone.frequency;
		}

		osc.connect(gain);
		osc.start(start);
		osc.stop(start + tone.duration);
	}

	/**
	 * Adds a tone configuration to the builder.
	 * @param waveform
	 * Oscillator waveform type.
	 * @param frequency
	 * Starting frequency in Hz.
	 * @param duration
	 * Tone duration in seconds.
	 * @param startOffset
	 * Start time offset from now in seconds.
	 * @returns
	 * This builder for chaining.
	 */
	private addTone(
		waveform: OscillatorType,
		frequency: number,
		duration: number,
		startOffset: number): SfxBuilder
	{
		this.tones.push(
			{ waveform, frequency, startOffset, duration });

		return this;
	}

	/**
	 * Adds a frequency sweep to the most recently added tone.
	 * @param target
	 * Target frequency in Hz.
	 * @param duration
	 * Sweep duration in seconds.
	 * @param exponential
	 * Whether to use exponential ramp.
	 * @returns
	 * This builder for chaining.
	 */
	private addSweep(
		target: number,
		duration: number,
		exponential: boolean): SfxBuilder
	{
		if (this.tones.length === 0)
		{
			return this;
		}

		const lastTone: ToneConfig =
			this.tones[this.tones.length - 1];
		lastTone.sweep =
			{ target, duration, exponential };

		return this;
	}

	/**
	 * Converts a semitone offset to a frequency using equal-temperament tuning.
	 * Formula: `baseFreq * 2^(semitone / 12)`.
	 * @param baseFreq
	 * Base frequency in Hz (e.g. 261.63 for C4, 440 for A4).
	 * @param semitone
	 * Semitone offset (positive = higher, negative = lower).
	 * @returns
	 * The computed frequency in Hz.
	 */
	static semitoneToFrequency(
		baseFreq: number,
		semitone: number): number
	{
		return baseFreq * Math.pow(2, semitone / 12);
	}
}

/** Options for {@link playArpeggio}. */
export interface ArpeggioOptions
{
	/** Oscillator waveform type. */
	waveform: OscillatorType;

	/** Time gap between consecutive notes in seconds. */
	noteSpacing: number;

	/** Duration of each note in seconds. */
	noteDuration: number;

	/** Initial gain volume. */
	volume: number;

	/** Envelope type applied after the last note. */
	envelopeType: "exponential" | "linear";

	/** Time after last note starts before envelope release begins (seconds). */
	envelopeDelay: number;

	/** Total envelope release duration from delay point (seconds). */
	envelopeReleaseDuration: number;
}

/**
 * Plays a sequence of notes as an arpeggio through the given gain node.
 * Each note gets its own oscillator, staggered by {@link ArpeggioOptions.noteSpacing}.
 * A shared gain envelope is applied after the last note.
 * @param ctx
 * The AudioContext.
 * @param gain
 * The gain node to connect oscillators to.
 * @param notes
 * Array of frequencies in Hz.
 * @param options
 * Arpeggio configuration.
 */
export function playArpeggio(
	ctx: AudioContext,
	gain: GainNode,
	notes: ReadonlyArray<number>,
	options: ArpeggioOptions): void
{
	const now: number =
		ctx.currentTime;

	for (let i: number = 0; i < notes.length; i++)
	{
		const osc: OscillatorNode =
			ctx.createOscillator();
		osc.type =
			options.waveform;
		osc.frequency.value =
			notes[i];
		osc.connect(gain);

		const start: number =
			now + i * options.noteSpacing;
		osc.start(start);
		osc.stop(start + options.noteDuration);
	}

	const lastNoteStart: number =
		now + (notes.length - 1) * options.noteSpacing;
	const envelopeStart: number =
		lastNoteStart + options.envelopeDelay;

	gain.gain.setValueAtTime(
		options.volume,
		envelopeStart);

	if (options.envelopeType === "exponential")
	{
		gain.gain.exponentialRampToValueAtTime(
			0.01,
			envelopeStart + options.envelopeReleaseDuration);
	}
	else
	{
		gain.gain.linearRampToValueAtTime(
			0,
			envelopeStart + options.envelopeReleaseDuration);
	}
}

/**
 * Creates an AudioBuffer filled with white noise.
 * @param ctx
 * The AudioContext.
 * @param durationSeconds
 * Buffer duration in seconds.
 * @returns
 * An AudioBuffer containing random noise samples.
 */
export function createNoiseBuffer(
	ctx: AudioContext,
	durationSeconds: number): AudioBuffer
{
	const bufferSize: number =
		Math.floor(ctx.sampleRate * durationSeconds);
	const buffer: AudioBuffer =
		ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	const data: Float32Array =
		buffer.getChannelData(0);

	for (let i: number = 0; i < bufferSize; i++)
	{
		data[i] =
			Math.random() * 2 - 1;
	}

	return buffer;
}