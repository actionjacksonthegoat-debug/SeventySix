import { AudioContextService } from "@games/shared/services/audio-context.service";
import { setupSimpleServiceTest } from "@shared/testing";
import type { Mock } from "vitest";

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
					const osc: FakeOscillatorNode =
						{
							type: "sine",
							frequency: createFakeParam(),
							connect: vi.fn(),
							start: vi.fn(),
							stop: vi.fn()
						};
					oscillators.push(osc);
					return osc as unknown as OscillatorNode;
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

describe("AudioContextService",
	() =>
	{
		let service: AudioContextService;
		let doubles: AudioTestDoubles;
		let globalTarget: { AudioContext?: unknown; };
		let originalAudioContext: unknown;

		beforeEach(
			() =>
			{
				service =
					setupSimpleServiceTest(AudioContextService);
				doubles =
					createAudioDoubles();
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
			});

		afterEach(
			() =>
			{
				service.dispose();
				globalTarget.AudioContext =
					originalAudioContext;
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should not be initialized before calling initialize",
			() =>
			{
				expect(service.isInitialized)
					.toBe(false);
			});

		it("should initialize AudioContext and master gain",
			() =>
			{
				service.initialize();

				expect(service.isInitialized)
					.toBe(true);
				expect(doubles.context.createGain)
					.toHaveBeenCalled();
				expect(doubles.gains[0].connect)
					.toHaveBeenCalledWith(doubles.context.destination);
			});

		it("should be idempotent on double initialize",
			() =>
			{
				service.initialize();
				service.initialize();

				expect(doubles.context.createGain)
					.toHaveBeenCalledTimes(1);
			});

		it("should start unmuted",
			() =>
			{
				service.initialize();

				expect(service.isMuted)
					.toBe(false);
			});

		it("should toggle mute state",
			() =>
			{
				service.initialize();

				service.toggleMute();
				expect(service.isMuted)
					.toBe(true);
				expect(doubles.gains[0].gain.value)
					.toBe(0);

				service.toggleMute();
				expect(service.isMuted)
					.toBe(false);
				expect(doubles.gains[0].gain.value)
					.toBeGreaterThan(0);
			});

		it("should throw when accessing audioContext before initialize",
			() =>
			{
				expect(() => service.audioContext)
					.toThrow();
			});

		it("should throw when accessing masterGain before initialize",
			() =>
			{
				expect(() => service.masterGain)
					.toThrow();
			});

		it("should create an oscillator connected to master gain",
			() =>
			{
				service.initialize();
				service.createOscillator("square", 440);

				expect(doubles.context.createOscillator)
					.toHaveBeenCalled();
				expect(doubles.oscillators[0].type)
					.toBe("square");
				expect(doubles.oscillators[0].frequency.value)
					.toBe(440);
				expect(doubles.oscillators[0].connect)
					.toHaveBeenCalled();
			});

		it("should close AudioContext on dispose",
			() =>
			{
				service.initialize();
				service.dispose();

				expect(doubles.context.close)
					.toHaveBeenCalled();
				expect(service.isInitialized)
					.toBe(false);
			});

		it("should handle double dispose safely",
			() =>
			{
				service.initialize();

				expect(
					() =>
					{
						service.dispose();
						service.dispose();
					})
					.not
					.toThrow();
			});

		it("should handle dispose without initialize",
			() =>
			{
				expect(() => service.dispose())
					.not
					.toThrow();
			});

		it("should create a gain node with specified volume",
			() =>
			{
				service.initialize();
				service.createGainNode(0.5);

				const createdGain: FakeGainNode =
					doubles.gains[1];
				expect(createdGain.gain.value)
					.toBe(0.5);
				expect(createdGain.connect)
					.toHaveBeenCalled();
			});
	});