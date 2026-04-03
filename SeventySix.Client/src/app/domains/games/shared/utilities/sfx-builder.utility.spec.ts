// <copyright file="sfx-builder.utility.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNoiseBuffer, playArpeggio, SfxBuilder } from "./sfx-builder.utility";
import type { ArpeggioOptions } from "./sfx-builder.utility";

describe("SfxBuilder",
	() =>
	{
		let ctx: AudioContext;
		let parentGain: GainNode;
		let createdOscillators: OscillatorNode[];
		let createdGains: GainNode[];

		beforeEach(
			() =>
			{
				createdOscillators = [];
				createdGains = [];

				const mockGainParam: AudioParam =
					{
						value: 0,
						setValueAtTime: vi.fn(),
						exponentialRampToValueAtTime: vi.fn(),
						linearRampToValueAtTime: vi.fn()
					} as unknown as AudioParam;

				const mockFreqParam: AudioParam =
					{
						value: 0,
						setValueAtTime: vi.fn(),
						exponentialRampToValueAtTime: vi.fn(),
						linearRampToValueAtTime: vi.fn()
					} as unknown as AudioParam;

				parentGain =
					{
						gain: mockGainParam,
						connect: vi.fn()
					} as unknown as GainNode;

				ctx =
					{
						currentTime: 1.0,
						createOscillator: vi.fn(
							() =>
							{
								const osc: OscillatorNode =
									{
										type: "sine" as OscillatorType,
										frequency: {
											...mockFreqParam,
											value: 0,
											setValueAtTime: vi.fn(),
											exponentialRampToValueAtTime: vi.fn(),
											linearRampToValueAtTime: vi.fn()
										},
										connect: vi.fn(),
										start: vi.fn(),
										stop: vi.fn()
									} as unknown as OscillatorNode;
								createdOscillators.push(osc);

								return osc;
							}),
						createGain: vi.fn(
							() =>
							{
								const gain: GainNode =
									{
										gain: {
											value: 0,
											setValueAtTime: vi.fn(),
											exponentialRampToValueAtTime: vi.fn(),
											linearRampToValueAtTime: vi.fn()
										},
										connect: vi.fn()
									} as unknown as GainNode;
								createdGains.push(gain);

								return gain;
							})
					} as unknown as AudioContext;
			});

		describe("tone factory",
			() =>
			{
				it("should create a builder instance",
					() =>
					{
						const builder: SfxBuilder =
							SfxBuilder.tone(ctx, parentGain);

						expect(builder)
							.toBeDefined();
					});
			});

		describe("single tone",
			() =>
			{
				it("should create a sine oscillator with correct frequency",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.5)
							.play();

						expect(ctx.createOscillator)
							.toHaveBeenCalledOnce();
						expect(createdOscillators[0].type)
							.toBe("sine");
						expect(createdOscillators[0].frequency.value)
							.toBe(440);
					});

				it("should create a square oscillator",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.square(880, 0.3)
							.play();

						expect(createdOscillators[0].type)
							.toBe("square");
						expect(createdOscillators[0].frequency.value)
							.toBe(880);
					});

				it("should create a sawtooth oscillator",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sawtooth(200, 0.4)
							.play();

						expect(createdOscillators[0].type)
							.toBe("sawtooth");
						expect(createdOscillators[0].frequency.value)
							.toBe(200);
					});

				it("should create a triangle oscillator",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.triangle(120, 0.2)
							.play();

						expect(createdOscillators[0].type)
							.toBe("triangle");
						expect(createdOscillators[0].frequency.value)
							.toBe(120);
					});

				it("should start and stop oscillator at correct times",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.5)
							.play();

						expect(createdOscillators[0].start)
							.toHaveBeenCalledWith(1.0);
						expect(createdOscillators[0].stop)
							.toHaveBeenCalledWith(1.5);
					});

				it("should apply start offset to oscillator timing",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.5, 0.2)
							.play();

						expect(createdOscillators[0].start)
							.toHaveBeenCalledWith(1.2);
						expect(createdOscillators[0].stop)
							.toHaveBeenCalledWith(1.7);
					});
			});

		describe("gain routing",
			() =>
			{
				it("should create a gain node connected to parent",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.5)
							.play();

						expect(ctx.createGain)
							.toHaveBeenCalledOnce();
						expect(createdGains[0].connect)
							.toHaveBeenCalledWith(parentGain);
					});

				it("should connect oscillator to the created gain",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.5)
							.play();

						expect(createdOscillators[0].connect)
							.toHaveBeenCalledWith(createdGains[0]);
					});
			});

		describe("exponential envelope",
			() =>
			{
				it("should set attack and schedule exponential ramp",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.5)
							.expEnvelope(0.4, 0.01, 0.5)
							.play();

						const gainParam: AudioParam =
							createdGains[0].gain;

						expect(gainParam.setValueAtTime)
							.toHaveBeenCalledWith(0.4, 1.0);
						expect(gainParam.exponentialRampToValueAtTime)
							.toHaveBeenCalledWith(0.01, 1.5);
					});

				it("should apply envelope start offset",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.5)
							.expEnvelope(0.4, 0.01, 0.5, 0.1)
							.play();

						const gainParam: AudioParam =
							createdGains[0].gain;

						expect(gainParam.setValueAtTime)
							.toHaveBeenCalledWith(0.4, 1.1);
						expect(gainParam.exponentialRampToValueAtTime)
							.toHaveBeenCalledWith(0.01, 1.6);
					});
			});

		describe("linear envelope",
			() =>
			{
				it("should set attack and schedule linear ramp",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.5)
							.linearEnvelope(0.3, 0, 0.5)
							.play();

						const gainParam: AudioParam =
							createdGains[0].gain;

						expect(gainParam.setValueAtTime)
							.toHaveBeenCalledWith(0.3, 1.0);
						expect(gainParam.linearRampToValueAtTime)
							.toHaveBeenCalledWith(0, 1.5);
					});
			});

		describe("frequency sweep",
			() =>
			{
				it("should apply exponential frequency sweep",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(200, 0.5)
							.sweepTo(800, 0.3)
							.play();

						const freqParam: AudioParam =
							createdOscillators[0].frequency as unknown as AudioParam;

						expect(freqParam.setValueAtTime)
							.toHaveBeenCalledWith(200, 1.0);
						expect(freqParam.exponentialRampToValueAtTime)
							.toHaveBeenCalledWith(800, 1.3);
					});

				it("should apply linear frequency sweep",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.triangle(120, 0.2)
							.linearSweepTo(40, 0.2)
							.play();

						const freqParam: AudioParam =
							createdOscillators[0].frequency as unknown as AudioParam;

						expect(freqParam.setValueAtTime)
							.toHaveBeenCalledWith(120, 1.0);
						expect(freqParam.linearRampToValueAtTime)
							.toHaveBeenCalledWith(40, 1.2);
					});
			});

		describe("multiple tones",
			() =>
			{
				it("should create multiple oscillators for staggered tones",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.15, 0)
							.sine(660, 0.15, 0.08)
							.sine(880, 0.15, 0.16)
							.play();

						expect(ctx.createOscillator)
							.toHaveBeenCalledTimes(3);
						expect(createdOscillators[0].frequency.value)
							.toBe(440);
						expect(createdOscillators[1].frequency.value)
							.toBe(660);
						expect(createdOscillators[2].frequency.value)
							.toBe(880);
					});

				it("should share a single gain node across all tones",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.15, 0)
							.sine(660, 0.15, 0.08)
							.play();

						expect(ctx.createGain)
							.toHaveBeenCalledOnce();
					});

				it("should stagger start/stop times correctly",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.15, 0)
							.sine(660, 0.15, 0.08)
							.play();

						expect(createdOscillators[0].start)
							.toHaveBeenCalledWith(1.0);
						expect(createdOscillators[0].stop)
							.toHaveBeenCalledWith(1.15);
						expect(createdOscillators[1].start)
							.toHaveBeenCalledWith(1.08);
						expect(createdOscillators[1].stop)
							.toHaveBeenCalledWith(1.23);
					});
			});

		describe("sweep on last tone only",
			() =>
			{
				it("should apply sweep to the last added tone",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sine(440, 0.5)
							.sine(200, 0.3)
							.sweepTo(600, 0.2)
							.play();

						/* First tone: no sweep (plain frequency value). */
						expect(createdOscillators[0].frequency.value)
							.toBe(440);

						/* Second tone: has sweep. */
						const freq1: AudioParam =
							createdOscillators[1].frequency as unknown as AudioParam;
						expect(freq1.setValueAtTime)
							.toHaveBeenCalledWith(200, 1.0);
						expect(freq1.exponentialRampToValueAtTime)
							.toHaveBeenCalledWith(600, 1.2);
					});

				it("should ignore sweep when no tones exist",
					() =>
					{
						expect(
							() =>
							{
								SfxBuilder
									.tone(ctx, parentGain)
									.sweepTo(800, 0.3)
									.sine(440, 0.5)
									.play();
							})
							.not
							.toThrow();
					});
			});

		describe("chaining",
			() =>
			{
				it("should support full fluent chain",
					() =>
					{
						SfxBuilder
							.tone(ctx, parentGain)
							.sawtooth(400, 1.0)
							.sweepTo(80, 1.0)
							.expEnvelope(0.2, 0.01, 1.0)
							.play();

						expect(ctx.createOscillator)
							.toHaveBeenCalledOnce();
						expect(ctx.createGain)
							.toHaveBeenCalledOnce();
						expect(createdOscillators[0].type)
							.toBe("sawtooth");
					});
			});

		describe("semitoneToFrequency",
			() =>
			{
				it("should return base frequency for semitone 0",
					() =>
					{
						expect(SfxBuilder.semitoneToFrequency(440, 0))
							.toBe(440);
					});

				it("should return an octave up for semitone 12",
					() =>
					{
						expect(SfxBuilder.semitoneToFrequency(440, 12))
							.toBe(880);
					});

				it("should return an octave down for semitone -12",
					() =>
					{
						expect(SfxBuilder.semitoneToFrequency(440, -12))
							.toBe(220);
					});

				it("should calculate correct frequency for semitone 7 (perfect fifth)",
					() =>
					{
						const result: number =
							SfxBuilder.semitoneToFrequency(261.63, 7);

						expect(result)
							.toBeCloseTo(391.99, 1);
					});
			});
	});

describe("createNoiseBuffer",
	() =>
	{
		it("should create a buffer with correct length",
			() =>
			{
				const sampleRate: number = 44100;
				const getChannelData: Float32Array =
					new Float32Array(sampleRate);
				const mockBuffer: AudioBuffer =
					{
						getChannelData: vi
							.fn()
							.mockReturnValue(getChannelData)
					} as unknown as AudioBuffer;
				const mockCtx: AudioContext =
					{
						sampleRate,
						createBuffer: vi
							.fn()
							.mockReturnValue(mockBuffer)
					} as unknown as AudioContext;

				const result: AudioBuffer =
					createNoiseBuffer(mockCtx, 1);

				expect(mockCtx.createBuffer)
					.toHaveBeenCalledWith(1, 44100, 44100);
				expect(result)
					.toBe(mockBuffer);
			});

		it("should fill buffer with values between -1 and 1",
			() =>
			{
				const sampleRate: number = 100;
				const channelData: Float32Array =
					new Float32Array(100);
				const mockBuffer: AudioBuffer =
					{
						getChannelData: vi
							.fn()
							.mockReturnValue(channelData)
					} as unknown as AudioBuffer;
				const mockCtx: AudioContext =
					{
						sampleRate,
						createBuffer: vi
							.fn()
							.mockReturnValue(mockBuffer)
					} as unknown as AudioContext;

				createNoiseBuffer(mockCtx, 1);

				for (let i: number = 0; i < channelData.length; i++)
				{
					expect(channelData[i])
						.toBeGreaterThanOrEqual(-1);
					expect(channelData[i])
						.toBeLessThanOrEqual(1);
				}
			});

		it("should handle fractional duration correctly",
			() =>
			{
				const sampleRate: number = 44100;
				const getChannelData: Float32Array =
					new Float32Array(Math.floor(44100 * 0.1));
				const mockBuffer: AudioBuffer =
					{
						getChannelData: vi
							.fn()
							.mockReturnValue(getChannelData)
					} as unknown as AudioBuffer;
				const mockCtx: AudioContext =
					{
						sampleRate,
						createBuffer: vi
							.fn()
							.mockReturnValue(mockBuffer)
					} as unknown as AudioContext;

				createNoiseBuffer(mockCtx, 0.1);

				expect(mockCtx.createBuffer)
					.toHaveBeenCalledWith(1, 4410, 44100);
			});
	});

describe("playArpeggio",
	() =>
	{
		let ctx: AudioContext;
		let gain: GainNode;
		let oscs: OscillatorNode[];

		beforeEach(
			() =>
			{
				oscs = [];

				const mockGainParam: AudioParam =
					{
						value: 0,
						setValueAtTime: vi.fn(),
						exponentialRampToValueAtTime: vi.fn(),
						linearRampToValueAtTime: vi.fn()
					} as unknown as AudioParam;

				gain =
					{
						gain: mockGainParam,
						connect: vi.fn()
					} as unknown as GainNode;

				ctx =
					{
						currentTime: 2.0,
						createOscillator: vi.fn(
							() =>
							{
								const osc: OscillatorNode =
									{
										type: "sine" as OscillatorType,
										frequency: { value: 0 },
										connect: vi.fn(),
										start: vi.fn(),
										stop: vi.fn()
									} as unknown as OscillatorNode;
								oscs.push(osc);

								return osc;
							})
					} as unknown as AudioContext;
			});

		it("should create one oscillator per note",
			() =>
			{
				const opts: ArpeggioOptions =
					{
						waveform: "sine",
						noteSpacing: 0.1,
						noteDuration: 0.2,
						volume: 0.5,
						envelopeType: "exponential",
						envelopeDelay: 0,
						envelopeReleaseDuration: 0.3
					};

				playArpeggio(
					ctx,
					gain,
					[440, 550, 660],
					opts);

				expect(ctx.createOscillator)
					.toHaveBeenCalledTimes(3);
			});

		it("should set correct waveform and frequencies",
			() =>
			{
				const opts: ArpeggioOptions =
					{
						waveform: "square",
						noteSpacing: 0.08,
						noteDuration: 0.15,
						volume: 0.2,
						envelopeType: "exponential",
						envelopeDelay: 0,
						envelopeReleaseDuration: 0.15
					};

				playArpeggio(
					ctx,
					gain,
					[880, 1318.5, 1760],
					opts);

				expect(oscs[0].type)
					.toBe("square");
				expect(oscs[0].frequency.value)
					.toBe(880);
				expect(oscs[1].frequency.value)
					.toBe(1318.5);
				expect(oscs[2].frequency.value)
					.toBe(1760);
			});

		it("should stagger start/stop times by noteSpacing",
			() =>
			{
				const opts: ArpeggioOptions =
					{
						waveform: "triangle",
						noteSpacing: 0.15,
						noteDuration: 0.4,
						volume: 0.5,
						envelopeType: "linear",
						envelopeDelay: 0,
						envelopeReleaseDuration: 0.4
					};

				playArpeggio(
					ctx,
					gain,
					[330, 440],
					opts);

				expect(oscs[0].start)
					.toHaveBeenCalledWith(2.0);
				expect(oscs[0].stop)
					.toHaveBeenCalledWith(2.4);
				expect(oscs[1].start)
					.toHaveBeenCalledWith(2.15);
				expect(oscs[1].stop)
					.toHaveBeenCalledWith(2.55);
			});

		it("should apply exponential envelope after last note",
			() =>
			{
				const opts: ArpeggioOptions =
					{
						waveform: "sine",
						noteSpacing: 0.08,
						noteDuration: 0.15,
						volume: 0.2,
						envelopeType: "exponential",
						envelopeDelay: 0,
						envelopeReleaseDuration: 0.15
					};

				playArpeggio(
					ctx,
					gain,
					[440, 550, 660],
					opts);

				expect(gain.gain.setValueAtTime)
					.toHaveBeenCalledWith(0.2, 2.16);
				expect(gain.gain.exponentialRampToValueAtTime)
					.toHaveBeenCalledWith(0.01, 2.31);
			});

		it("should apply linear envelope with delay",
			() =>
			{
				const opts: ArpeggioOptions =
					{
						waveform: "triangle",
						noteSpacing: 0.2,
						noteDuration: 0.35,
						volume: 0.5,
						envelopeType: "linear",
						envelopeDelay: 0.2,
						envelopeReleaseDuration: 0.4
					};

				playArpeggio(
					ctx,
					gain,
					[330, 294, 247, 220],
					opts);

				/* Last note starts at 2.0 + 3*0.2 = 2.6 */
				/* Envelope starts at 2.6 + 0.2 = 2.8 */
				expect(gain.gain.setValueAtTime)
					.toHaveBeenCalledWith(0.5, expect.closeTo(2.8));
				expect(gain.gain.linearRampToValueAtTime)
					.toHaveBeenCalledWith(0, expect.closeTo(3.2));
			});

		it("should connect all oscillators to the provided gain node",
			() =>
			{
				const opts: ArpeggioOptions =
					{
						waveform: "sine",
						noteSpacing: 0.1,
						noteDuration: 0.2,
						volume: 0.3,
						envelopeType: "exponential",
						envelopeDelay: 0,
						envelopeReleaseDuration: 0.2
					};

				playArpeggio(
					ctx,
					gain,
					[440, 550],
					opts);

				expect(oscs[0].connect)
					.toHaveBeenCalledWith(gain);
				expect(oscs[1].connect)
					.toHaveBeenCalledWith(gain);
			});
	});