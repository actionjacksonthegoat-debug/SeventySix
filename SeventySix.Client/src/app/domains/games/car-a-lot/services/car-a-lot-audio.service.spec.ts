import { setupSimpleServiceTest } from "@shared/testing";
import { Mock, vi } from "vitest";
import { CarALotAudioService } from "./car-a-lot-audio.service";

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

describe("CarALotAudioService",
	() =>
	{
		let service: CarALotAudioService;
		let doubles: AudioTestDoubles;
		let setIntervalSpy: ReturnType<typeof vi.spyOn>;
		let clearIntervalSpy: ReturnType<typeof vi.spyOn>;
		let capturedIntervalCallback: (() => void) | null;
		let globalTarget: { AudioContext?: unknown; };
		let originalAudioContext: unknown;

		beforeEach(
			() =>
			{
				service =
					setupSimpleServiceTest(CarALotAudioService);
				doubles =
					createAudioDoubles();
				capturedIntervalCallback = null;
				globalTarget =
					globalThis as unknown as { AudioContext?: unknown; };
				originalAudioContext =
					globalTarget.AudioContext;

				class MockAudioContext
				{
					constructor()
					{
						return doubles.context as unknown as AudioContext;
					}
				}

				globalTarget.AudioContext = MockAudioContext;
				setIntervalSpy =
					vi
						.spyOn(globalThis, "setInterval")
						.mockImplementation(
							(callback: TimerHandler): ReturnType<typeof setInterval> =>
							{
								capturedIntervalCallback =
									callback as () => void;
								return 123 as unknown as ReturnType<typeof setInterval>;
							});
				clearIntervalSpy =
					vi
						.spyOn(globalThis, "clearInterval")
						.mockImplementation(
							() => undefined);
			});

		afterEach(
			() =>
			{
				setIntervalSpy.mockRestore();
				clearIntervalSpy.mockRestore();
				globalTarget.AudioContext =
					originalAudioContext;
			});

		it("should initialize audio graph when AudioContext is available",
			() =>
			{
				service.initialize();

				const internalService: {
					initialized: boolean;
					audioContext: AudioContext | null;
					masterGain: GainNode | null;
					sfxGain: GainNode | null;
					musicGain: GainNode | null;
				} =
					service as unknown as {
						initialized: boolean;
						audioContext: AudioContext | null;
						masterGain: GainNode | null;
						sfxGain: GainNode | null;
						musicGain: GainNode | null;
					};

				expect(internalService.initialized)
					.toBe(true);
				expect(internalService.audioContext)
					.not
					.toBeNull();
				expect(internalService.masterGain)
					.not
					.toBeNull();
				expect(internalService.sfxGain)
					.not
					.toBeNull();
				expect(internalService.musicGain)
					.not
					.toBeNull();
				expect(doubles.context.createGain)
					.toHaveBeenCalledTimes(3);
			});

		it("should no-op initialize when already initialized",
			() =>
			{
				service.initialize();
				const firstCallCount: number =
					doubles.context.createGain.mock.calls.length;

				service.initialize();

				expect(doubles.context.createGain.mock.calls.length)
					.toBe(firstCallCount);
			});

		it("should no-op initialize when AudioContext is unavailable",
			() =>
			{
				globalTarget.AudioContext = undefined;

				service.initialize();

				const internalService: {
					initialized: boolean;
					audioContext: AudioContext | null;
				} =
					service as unknown as {
						initialized: boolean;
						audioContext: AudioContext | null;
					};
				expect(internalService.initialized)
					.toBe(false);
				expect(internalService.audioContext)
					.toBeNull();
			});

		it("should toggle mute and update master gain",
			() =>
			{
				service.initialize();

				expect(service.isMuted())
					.toBe(false);
				service.toggleMute();
				expect(service.isMuted())
					.toBe(true);
				service.toggleMute();
				expect(service.isMuted())
					.toBe(false);
			});

		it("should start, update, and stop engine audio",
			() =>
			{
				service.initialize();
				service.startEngine();
				service.updateEngine(0.5);

				const internalService: {
					engineOsc: OscillatorNode | null;
					engineGain: GainNode | null;
				} =
					service as unknown as {
						engineOsc: OscillatorNode | null;
						engineGain: GainNode | null;
					};

				expect(internalService.engineOsc)
					.not
					.toBeNull();
				expect(internalService.engineGain)
					.not
					.toBeNull();

				service.stopEngine();

				expect(internalService.engineOsc)
					.toBeNull();
				expect(internalService.engineGain)
					.toBeNull();
			});

		it("should no-op engine operations when not initialized",
			() =>
			{
				service.startEngine();
				service.updateEngine(0.75);
				service.stopEngine();

				expect(doubles.context.createOscillator)
					.not
					.toHaveBeenCalled();
			});

		it("should no-op startEngine when already running",
			() =>
			{
				service.initialize();
				service.startEngine();
				const initialOscCount: number =
					doubles.oscillators.length;

				service.startEngine();

				expect(doubles.oscillators.length)
					.toBe(initialOscCount);
			});

		it("should generate all procedural one-shot SFX when initialized",
			() =>
			{
				service.initialize();

				service.playCountdownBing(false);
				service.playCountdownBing(true);
				service.playBoost();
				service.playCoin();
				service.playBumper();
				service.playOctopusRumble();
				service.playJump();
				service.playVictory();
				service.playGameOver();

				expect(doubles.oscillators.length)
					.toBeGreaterThan(10);
			});

		it("should no-op one-shot SFX methods when not initialized",
			() =>
			{
				service.playCountdownBing(false);
				service.playBoost();
				service.playCoin();
				service.playBumper();
				service.playOctopusRumble();
				service.playJump();
				service.playVictory();
				service.playGameOver();

				expect(doubles.context.createOscillator)
					.not
					.toHaveBeenCalled();
			});

		it("should start and stop music loop",
			() =>
			{
				service.initialize();
				service.startMusic();

				expect(setIntervalSpy)
					.toHaveBeenCalledOnce();
				expect(capturedIntervalCallback)
					.not
					.toBeNull();

				for (let index: number = 0; index < 10; index++)
				{
					capturedIntervalCallback?.();
				}

				expect(doubles.oscillators.length)
					.toBeGreaterThan(0);

				service.stopMusic();
				expect(clearIntervalSpy)
					.toHaveBeenCalled();
			});

		it("should no-op startMusic when not initialized",
			() =>
			{
				service.startMusic();

				expect(setIntervalSpy)
					.not
					.toHaveBeenCalled();
			});

		it("should dispose resources and reset internal state",
			async () =>
			{
				service.initialize();
				service.startEngine();
				service.startMusic();

				service.dispose();
				await Promise.resolve();

				const internalService: {
					audioContext: AudioContext | null;
					masterGain: GainNode | null;
					sfxGain: GainNode | null;
					musicGain: GainNode | null;
					initialized: boolean;
				} =
					service as unknown as {
						audioContext: AudioContext | null;
						masterGain: GainNode | null;
						sfxGain: GainNode | null;
						musicGain: GainNode | null;
						initialized: boolean;
					};

				expect(doubles.context.close)
					.toHaveBeenCalledOnce();
				expect(internalService.audioContext)
					.toBeNull();
				expect(internalService.masterGain)
					.toBeNull();
				expect(internalService.sfxGain)
					.toBeNull();
				expect(internalService.musicGain)
					.toBeNull();
				expect(internalService.initialized)
					.toBe(false);
			});
	});