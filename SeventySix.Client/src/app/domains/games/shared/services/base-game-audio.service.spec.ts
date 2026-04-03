import { Injectable } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AudioContextService } from "@games/shared/services/audio-context.service";
import { setupSimpleServiceTest } from "@shared/testing";
import { Mock, vi } from "vitest";
import { BaseGameAudioService } from "./base-game-audio.service";

interface FakeAudioParam
{
	value: number;
	setValueAtTime: Mock;
	exponentialRampToValueAtTime: Mock;
	linearRampToValueAtTime: Mock;
}

interface FakeGainNode
{
	gain: FakeAudioParam;
	connect: Mock;
	disconnect: Mock;
}

interface FakeOscillatorNode
{
	type: string;
	frequency: FakeAudioParam;
	connect: Mock;
	disconnect: Mock;
	start: Mock;
	stop: Mock;
}

interface FakeAudioContext
{
	currentTime: number;
	destination: object;
	createGain: Mock;
	createOscillator: Mock;
	close: Mock;
}

interface AudioTestDoubles
{
	context: FakeAudioContext;
	gains: FakeGainNode[];
	oscillators: FakeOscillatorNode[];
}

function createFakeParam(): FakeAudioParam
{
	return {
		value: 0,
		setValueAtTime: vi.fn(),
		exponentialRampToValueAtTime: vi.fn(),
		linearRampToValueAtTime: vi.fn()
	};
}

function createAudioDoubles(): AudioTestDoubles
{
	const gains: FakeGainNode[] = [];
	const oscillators: FakeOscillatorNode[] = [];

	const context: FakeAudioContext =
		{
			currentTime: 10,
			destination: {},
			createGain: vi.fn(
				() =>
				{
					const gainNode: FakeGainNode =
						{
							gain: createFakeParam(),
							connect: vi.fn(),
							disconnect: vi.fn()
						};
					gains.push(gainNode);
					return gainNode as unknown as GainNode;
				}),
			createOscillator: vi.fn(
				() =>
				{
					const oscillator: FakeOscillatorNode =
						{
							type: "sine",
							frequency: createFakeParam(),
							connect: vi.fn(),
							disconnect: vi.fn(),
							start: vi.fn(),
							stop: vi.fn()
						};
					oscillators.push(oscillator);
					return oscillator as unknown as OscillatorNode;
				}),
			close: vi.fn(
				() => Promise.resolve())
		};

	return {
		context,
		gains,
		oscillators
	};
}

/** Concrete test subclass of BaseGameAudioService. */
@Injectable()
class TestAudioService extends BaseGameAudioService
{
	initializeGainNodesCalled: boolean = false;
	stopMusicCalled: boolean = false;

	protected override initializeGainNodes(): void
	{
		this.initializeGainNodesCalled = true;
	}

	override stopMusic(): void
	{
		this.stopMusicCalled = true;
	}

	/** Expose protected methods for testing. */
	testEnsureContext(): AudioContext | null
	{
		return this.ensureContext();
	}

	testCreateSfxGain(
		ctx: AudioContext,
		volume: number): GainNode
	{
		return this.createSfxGain(ctx, volume);
	}

	testStartEngineSound(
		frequency: number,
		gainValue: number,
		waveform?: OscillatorType): void
	{
		this.startEngineSound(frequency, gainValue, waveform);
	}

	testUpdateEngineSound(
		frequency: number,
		gainValue: number): void
	{
		this.updateEngineSound(frequency, gainValue);
	}

	testGetEngineOscillator(): OscillatorNode | null
	{
		return this.activeEngineOscillator;
	}

	testGetEngineGain(): GainNode | null
	{
		return this.activeEngineGain;
	}
}

describe("BaseGameAudioService",
	() =>
	{
		let service: TestAudioService;
		let audioContextService: AudioContextService;
		let doubles: AudioTestDoubles;
		let globalTarget: { AudioContext?: unknown; };
		let originalAudioContext: unknown;

		beforeEach(
			() =>
			{
				service =
					setupSimpleServiceTest(TestAudioService,
						[AudioContextService]);
				audioContextService =
					TestBed.inject(AudioContextService);
				doubles =
					createAudioDoubles();
				globalTarget =
					globalThis as unknown as { AudioContext?: unknown; };
				originalAudioContext =
					globalTarget.AudioContext;
				globalTarget.AudioContext =
					vi
						.fn()
						.mockImplementation(
							function(this: unknown): FakeAudioContext
							{
								return doubles.context;
							}) as unknown as typeof AudioContext;
			});

		afterEach(
			() =>
			{
				service.dispose();
				globalTarget.AudioContext =
					originalAudioContext;
			});

		describe("initialize",
			() =>
			{
				it("should delegate to AudioContextService",
					() =>
					{
						const initSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(audioContextService, "initialize");

						service.initialize();

						expect(initSpy)
							.toHaveBeenCalledOnce();
					});

				it("should call initializeGainNodes on the subclass",
					() =>
					{
						service.initialize();

						expect(service.initializeGainNodesCalled)
							.toBe(true);
					});
			});

		describe("isMuted",
			() =>
			{
				it("should delegate to AudioContextService.isMuted",
					() =>
					{
						expect(service.isMuted)
							.toBe(false);

						service.initialize();
						audioContextService.toggleMute();

						expect(service.isMuted)
							.toBe(true);
					});
			});

		describe("toggleMute",
			() =>
			{
				it("should delegate to AudioContextService.toggleMute",
					() =>
					{
						const muteSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(audioContextService, "toggleMute");

						service.toggleMute();

						expect(muteSpy)
							.toHaveBeenCalledOnce();
					});
			});

		describe("dispose",
			() =>
			{
				it("should call stopMusic on the subclass",
					() =>
					{
						service.dispose();

						expect(service.stopMusicCalled)
							.toBe(true);
					});

				it("should stop engine sounds",
					() =>
					{
						service.initialize();
						service.testStartEngineSound(440, 0.5);

						const oscillator: FakeOscillatorNode =
							doubles.oscillators[doubles.oscillators.length - 1];

						service.dispose();

						expect(oscillator.stop)
							.toHaveBeenCalledOnce();
						expect(oscillator.disconnect)
							.toHaveBeenCalledOnce();
					});

				it("should delegate to AudioContextService.dispose",
					() =>
					{
						const disposeSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(audioContextService, "dispose");

						service.dispose();

						expect(disposeSpy)
							.toHaveBeenCalledOnce();
					});
			});

		describe("ensureContext",
			() =>
			{
				it("should return null when AudioContext unavailable",
					() =>
					{
						globalTarget.AudioContext = undefined;

						const result: AudioContext | null =
							service.testEnsureContext();

						expect(result)
							.toBeNull();
					});

				it("should return AudioContext when available",
					() =>
					{
						const result: AudioContext | null =
							service.testEnsureContext();

						expect(result)
							.not
							.toBeNull();
					});
			});

		describe("createSfxGain",
			() =>
			{
				it("should create gain node with specified volume",
					() =>
					{
						service.initialize();
						const gain: GainNode =
							service.testCreateSfxGain(
								doubles.context as unknown as AudioContext,
								0.7);

						const lastGain: FakeGainNode =
							doubles.gains[doubles.gains.length - 1];

						expect(lastGain.gain.value)
							.toBe(0.7);
						expect(lastGain.connect)
							.toHaveBeenCalledOnce();
						expect(gain)
							.toBeDefined();
					});
			});

		describe("startEngineSound",
			() =>
			{
				it("should start oscillator with specified parameters",
					() =>
					{
						service.initialize();
						service.testStartEngineSound(220, 0.3, "square");

						const osc: FakeOscillatorNode =
							doubles.oscillators[doubles.oscillators.length - 1];

						expect(osc.type)
							.toBe("square");
						expect(osc.frequency.value)
							.toBe(220);
						expect(osc.start)
							.toHaveBeenCalledOnce();
					});

				it("should default to sawtooth waveform",
					() =>
					{
						service.initialize();
						service.testStartEngineSound(440, 0.5);

						const osc: FakeOscillatorNode =
							doubles.oscillators[doubles.oscillators.length - 1];

						expect(osc.type)
							.toBe("sawtooth");
					});

				it("should stop previous engine before starting new one",
					() =>
					{
						service.initialize();
						service.testStartEngineSound(220, 0.3);

						const firstOsc: FakeOscillatorNode =
							doubles.oscillators[doubles.oscillators.length - 1];

						service.testStartEngineSound(440, 0.5);

						expect(firstOsc.stop)
							.toHaveBeenCalledOnce();
						expect(firstOsc.disconnect)
							.toHaveBeenCalledOnce();
					});

				it("should no-op when context unavailable",
					() =>
					{
						globalTarget.AudioContext = undefined;
						service.testStartEngineSound(440, 0.5);

						expect(service.testGetEngineOscillator())
							.toBeNull();
					});
			});

		describe("updateEngineSound",
			() =>
			{
				it("should update frequency and gain when engine running",
					() =>
					{
						service.initialize();
						service.testStartEngineSound(220, 0.3);

						service.testUpdateEngineSound(880, 0.9);

						const osc: FakeOscillatorNode =
							doubles.oscillators[doubles.oscillators.length - 1];
						const gain: FakeGainNode =
							doubles.gains[doubles.gains.length - 1];

						expect(osc.frequency.value)
							.toBe(880);
						expect(gain.gain.value)
							.toBe(0.9);
					});

				it("should no-op when engine not running",
					() =>
					{
						service.testUpdateEngineSound(880, 0.9);

						expect(service.testGetEngineOscillator())
							.toBeNull();
					});
			});

		describe("stopEngine",
			() =>
			{
				it("should stop and disconnect oscillator and gain",
					() =>
					{
						service.initialize();
						service.testStartEngineSound(220, 0.3);

						const osc: FakeOscillatorNode =
							doubles.oscillators[doubles.oscillators.length - 1];
						const gain: FakeGainNode =
							doubles.gains[doubles.gains.length - 1];

						service.stopEngine();

						expect(osc.stop)
							.toHaveBeenCalledOnce();
						expect(osc.disconnect)
							.toHaveBeenCalledOnce();
						expect(gain.disconnect)
							.toHaveBeenCalledOnce();
						expect(service.testGetEngineOscillator())
							.toBeNull();
						expect(service.testGetEngineGain())
							.toBeNull();
					});

				it("should be idempotent — no error when called twice",
					() =>
					{
						service.initialize();
						service.testStartEngineSound(220, 0.3);

						service.stopEngine();
						service.stopEngine();

						expect(service.testGetEngineOscillator())
							.toBeNull();
					});

				it("should handle already-stopped oscillator gracefully",
					() =>
					{
						service.initialize();
						service.testStartEngineSound(220, 0.3);

						const osc: FakeOscillatorNode =
							doubles.oscillators[doubles.oscillators.length - 1];
						osc.stop.mockImplementationOnce(
							() =>
							{
								throw new Error("InvalidStateError");
							});

						expect(
							() => service.stopEngine())
							.not
							.toThrow();
					});
			});
	});