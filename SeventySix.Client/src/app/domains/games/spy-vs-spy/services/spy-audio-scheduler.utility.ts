// <copyright file="spy-audio-scheduler.utility.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Scheduling utility functions for the Spy Audio Service.
 * Handles Web Audio API note scheduling for the spy theme soundtrack.
 * Extracted as pure functions to keep SpyAudioService within size limits.
 */

import {
	BASS_PATTERN,
	BEAT_DURATION,
	BEATS_PER_BAR,
	LOOP_BARS,
	MELODY_PATTERN
} from "@games/spy-vs-spy/constants/spy-audio.constants";

/**
 * Schedules the bass line oscillator notes for one loop.
 * @param ctx
 * The AudioContext.
 * @param masterGain
 * The soundtrack master gain node.
 * @param startTime
 * The AudioContext time to begin from.
 * @param activeOscillators
 * Array tracking active oscillators for cleanup on stop.
 */
export function scheduleBassNotes(
	ctx: AudioContext,
	masterGain: GainNode,
	startTime: number,
	activeOscillators: OscillatorNode[]): void
{
	for (let i: number = 0; i < BASS_PATTERN.length; i++)
	{
		const noteTime: number =
			startTime + i * BEAT_DURATION;

		const osc: OscillatorNode =
			ctx.createOscillator();
		osc.type = "sawtooth";
		osc.frequency.value =
			BASS_PATTERN[i];

		const noteGain: GainNode =
			ctx.createGain();
		noteGain.gain.setValueAtTime(0.4, noteTime);
		noteGain.gain.exponentialRampToValueAtTime(
			0.001,
			noteTime + BEAT_DURATION * 0.9);

		osc.connect(noteGain);
		noteGain.connect(masterGain);
		osc.start(noteTime);
		osc.stop(noteTime + BEAT_DURATION * 0.95);

		activeOscillators.push(osc);
	}
}

/**
 * Schedules the staccato melody notes for one loop.
 * @param ctx
 * The AudioContext.
 * @param masterGain
 * The soundtrack master gain node.
 * @param startTime
 * The AudioContext time to begin from.
 * @param activeOscillators
 * Array tracking active oscillators for cleanup on stop.
 */
export function scheduleMelodyNotes(
	ctx: AudioContext,
	masterGain: GainNode,
	startTime: number,
	activeOscillators: OscillatorNode[]): void
{
	for (let i: number = 0; i < MELODY_PATTERN.length; i++)
	{
		if (MELODY_PATTERN[i] === 0)
		{
			continue;
		}

		const noteTime: number =
			startTime + i * BEAT_DURATION;
		const noteDuration: number =
			BEAT_DURATION * 0.5;

		const osc: OscillatorNode =
			ctx.createOscillator();
		osc.type = "triangle";
		osc.frequency.value =
			MELODY_PATTERN[i];

		const noteGain: GainNode =
			ctx.createGain();
		noteGain.gain.setValueAtTime(0.3, noteTime);
		noteGain.gain.linearRampToValueAtTime(
			0,
			noteTime + noteDuration);

		osc.connect(noteGain);
		noteGain.connect(masterGain);
		osc.start(noteTime);
		osc.stop(noteTime + noteDuration);

		activeOscillators.push(osc);
	}
}

/**
 * Schedules percussion hits (filtered noise) for one loop.
 * Hi-hat every beat, snare on beats 2 and 4.
 * @param ctx
 * The AudioContext.
 * @param masterGain
 * The soundtrack master gain node.
 * @param startTime
 * The AudioContext time to begin from.
 */
export function schedulePercussionHits(
	ctx: AudioContext,
	masterGain: GainNode,
	startTime: number): void
{
	const totalBeats: number =
		LOOP_BARS * BEATS_PER_BAR;

	/* Generate noise buffer once for reuse. */
	const noiseDuration: number = 0.05;
	const noiseLength: number =
		Math.floor(ctx.sampleRate * noiseDuration);
	const noiseBuffer: AudioBuffer =
		ctx.createBuffer(1, noiseLength, ctx.sampleRate);
	const noiseData: Float32Array =
		noiseBuffer.getChannelData(0);

	for (let s: number = 0; s < noiseLength; s++)
	{
		noiseData[s] =
			Math.random() * 2 - 1;
	}

	for (let beat: number = 0; beat < totalBeats; beat++)
	{
		const beatTime: number =
			startTime + beat * BEAT_DURATION;
		const isSnare: boolean =
			beat % BEATS_PER_BAR === 1
				|| beat % BEATS_PER_BAR === 3;

		const source: AudioBufferSourceNode =
			ctx.createBufferSource();
		source.buffer = noiseBuffer;

		const filter: BiquadFilterNode =
			ctx.createBiquadFilter();
		filter.type =
			isSnare ? "bandpass" : "highpass";
		filter.frequency.value =
			isSnare ? 800 : 8000;

		const hitGain: GainNode =
			ctx.createGain();
		hitGain.gain.setValueAtTime(
			isSnare ? 0.15 : 0.08,
			beatTime);
		hitGain.gain.exponentialRampToValueAtTime(
			0.001,
			beatTime + noiseDuration);

		source.connect(filter);
		filter.connect(hitGain);
		hitGain.connect(masterGain);
		source.start(beatTime);
		source.stop(beatTime + noiseDuration);
	}
}