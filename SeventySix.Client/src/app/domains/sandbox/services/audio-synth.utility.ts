/**
 * Audio Synthesis Utility.
 * Pure functions for procedural sound synthesis using the Web Audio API.
 * Extracted from GameAudioService to maintain file size limits.
 */

/**
 * Plays a short noise burst for machine-gun-style weapons.
 * @param {AudioContext} ctx
 * The Web Audio API context.
 * @param {GainNode} destination
 * The gain node to connect output to.
 * @param {number} startTime
 * The audio context time to start at.
 * @param {number} duration
 * Duration in seconds.
 * @param {number} filterFreq
 * High-pass filter frequency.
 */
export function playNoiseShot(
	ctx: AudioContext,
	destination: GainNode,
	startTime: number,
	duration: number,
	filterFreq: number): void
{
	const bufferSize: number =
		Math.floor(ctx.sampleRate * duration);
	const buffer: AudioBuffer =
		ctx.createBuffer(
			1,
			bufferSize,
			ctx.sampleRate);
	const data: Float32Array =
		buffer.getChannelData(0);

	for (let idx: number = 0; idx < bufferSize; idx++)
	{
		data[idx] =
			Math.random() * 2 - 1;
	}

	const source: AudioBufferSourceNode =
		ctx.createBufferSource();

	source.buffer = buffer;

	const gain: GainNode =
		ctx.createGain();

	gain.gain.setValueAtTime(
		0.3,
		startTime);
	gain.gain.exponentialRampToValueAtTime(
		0.001,
		startTime + duration);

	const filter: BiquadFilterNode =
		ctx.createBiquadFilter();

	filter.type = "highpass";
	filter.frequency.value = filterFreq;

	source.connect(filter);
	filter.connect(gain);
	gain.connect(destination);
	source.start(startTime);
	source.stop(startTime + duration);
}

/**
 * Plays a sine frequency sweep for laser-type weapons.
 * @param {AudioContext} ctx
 * The Web Audio API context.
 * @param {GainNode} destination
 * The gain node to connect output to.
 * @param {number} startTime
 * The audio context time to start at.
 * @param {number} startFreq
 * Starting frequency in Hz.
 * @param {number} endFreq
 * Ending frequency in Hz.
 * @param {number} duration
 * Duration in seconds.
 */
export function playSineSweep(
	ctx: AudioContext,
	destination: GainNode,
	startTime: number,
	startFreq: number,
	endFreq: number,
	duration: number): void
{
	const osc: OscillatorNode =
		ctx.createOscillator();
	const gain: GainNode =
		ctx.createGain();

	osc.type = "sine";
	osc.frequency.setValueAtTime(
		startFreq,
		startTime);
	osc.frequency.exponentialRampToValueAtTime(
		endFreq,
		startTime + duration);
	osc.connect(gain);
	gain.connect(destination);
	gain.gain.setValueAtTime(
		0.2,
		startTime);
	gain.gain.exponentialRampToValueAtTime(
		0.001,
		startTime + duration);
	osc.start(startTime);
	osc.stop(startTime + duration);
}

/**
 * Creates and plays the noise component of an explosion effect.
 * @param {AudioContext} ctx
 * The Web Audio API context.
 * @param {GainNode} destination
 * The gain node to connect output to.
 * @param {number} startTime
 * Schedule start time.
 * @param {number} duration
 * Duration in seconds.
 */
export function playExplosionNoise(
	ctx: AudioContext,
	destination: GainNode,
	startTime: number,
	duration: number): void
{
	const noiseSize: number =
		Math.floor(ctx.sampleRate * duration);
	const noiseBuffer: AudioBuffer =
		ctx.createBuffer(
			1,
			noiseSize,
			ctx.sampleRate);
	const noiseData: Float32Array =
		noiseBuffer.getChannelData(0);

	for (let idx: number = 0; idx < noiseSize; idx++)
	{
		noiseData[idx] =
			Math.random() * 2 - 1;
	}

	const noiseSource: AudioBufferSourceNode =
		ctx.createBufferSource();

	noiseSource.buffer = noiseBuffer;

	const noiseGain: GainNode =
		ctx.createGain();

	noiseGain.gain.setValueAtTime(
		0.4,
		startTime);
	noiseGain.gain.exponentialRampToValueAtTime(
		0.001,
		startTime + duration);

	noiseSource.connect(noiseGain);
	noiseGain.connect(destination);
	noiseSource.start(startTime);
	noiseSource.stop(startTime + duration);
}

/**
 * Creates and plays the tonal component of an explosion effect.
 * @param {AudioContext} ctx
 * The Web Audio API context.
 * @param {GainNode} destination
 * The gain node to connect output to.
 * @param {number} startTime
 * Schedule start time.
 * @param {number} duration
 * Duration in seconds.
 * @param {number} startFreq
 * Starting frequency in Hz.
 * @param {number} endFreq
 * Ending frequency in Hz.
 */
export function playExplosionTone(
	ctx: AudioContext,
	destination: GainNode,
	startTime: number,
	duration: number,
	startFreq: number,
	endFreq: number): void
{
	const osc: OscillatorNode =
		ctx.createOscillator();
	const oscGain: GainNode =
		ctx.createGain();

	osc.type = "sine";
	osc.frequency.setValueAtTime(
		startFreq,
		startTime);
	osc.frequency.exponentialRampToValueAtTime(
		endFreq,
		startTime + duration);
	osc.connect(oscGain);
	oscGain.connect(destination);
	oscGain.gain.setValueAtTime(
		0.3,
		startTime);
	oscGain.gain.exponentialRampToValueAtTime(
		0.001,
		startTime + duration);
	osc.start(startTime);
	osc.stop(startTime + duration);
}

/**
 * Plays a combined explosion synthesis effect (noise + tone).
 * @param {AudioContext} ctx
 * The Web Audio API context.
 * @param {GainNode} destination
 * The gain node to connect output to.
 * @param {number} startTime
 * The audio context time to start at.
 * @param {number} duration
 * Duration in seconds.
 * @param {number} startFreq
 * Starting frequency in Hz.
 * @param {number} endFreq
 * Ending frequency in Hz.
 */
export function playExplosionSynth(
	ctx: AudioContext,
	destination: GainNode,
	startTime: number,
	duration: number,
	startFreq: number,
	endFreq: number): void
{
	playExplosionNoise(
		ctx,
		destination,
		startTime,
		duration);
	playExplosionTone(
		ctx,
		destination,
		startTime,
		duration,
		startFreq,
		endFreq);
}

/**
 * Plays the nuke explosion multi-stage effect.
 * @param {AudioContext} ctx
 * The Web Audio API context.
 * @param {GainNode} destination
 * The gain node to connect output to.
 * @param {number} startTime
 * The audio context time to start at.
 */
export function playNukeEffect(
	ctx: AudioContext,
	destination: GainNode,
	startTime: number): void
{
	playExplosionSynth(
		ctx,
		destination,
		startTime,
		0.5,
		400,
		100);
	playExplosionSynth(
		ctx,
		destination,
		startTime + 0.3,
		1,
		200,
		30);
	playExplosionSynth(
		ctx,
		destination,
		startTime + 1,
		2,
		80,
		20);
}