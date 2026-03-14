/**
 * Galactic Assault game page component unit tests.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BABYLON_ENGINE_OPTIONS } from "@sandbox/constants/game.constants";
import { BabylonEngineService } from "@sandbox/services/babylon-engine.service";
import { BossService } from "@sandbox/services/boss.service";
import { CollisionService } from "@sandbox/services/collision.service";
import { EnemySwarmService } from "@sandbox/services/enemy-swarm.service";
import { GameAudioService } from "@sandbox/services/game-audio.service";
import { GameCollisionHandlerService } from "@sandbox/services/game-collision-handler.service";
import { GameSceneService } from "@sandbox/services/game-scene.service";
import { GameStateService } from "@sandbox/services/game-state.service";
import { InputService } from "@sandbox/services/input.service";
import { ParticleEffectsService } from "@sandbox/services/particle-effects.service";
import { PlayerShipService } from "@sandbox/services/player-ship.service";
import { PowerUpService } from "@sandbox/services/powerup.service";
import { ScoringService } from "@sandbox/services/scoring.service";
import { WeaponService } from "@sandbox/services/weapon.service";
import { vi } from "vitest";
import { GalacticAssaultComponent } from "./galactic-assault";

/**
 * Installs a minimal AudioContext stub into the global scope.
 * Required because jsdom does not provide Web Audio API.
 */
function installAudioContextStub(): void
{
	const mockGain: Record<string, unknown> =
		{
			connect: vi.fn(),
			gain: { value: 1 }
		};

	class StubAudioContext
	{
		/** @type {string} */
		state: string = "running";

		/** @type {number} */
		currentTime: number = 0;

		/** @type {number} */
		sampleRate: number = 44100;

		/** @type {Record<string, unknown>} */
		destination: Record<string, unknown> = mockGain;

		/** Creates gain node stub. */
		createGain(): Record<string, unknown>
		{
			return {
				connect: vi.fn(),
				disconnect: vi.fn(),
				gain: { value: 1 }
			};
		}

		/** Creates oscillator stub. */
		createOscillator(): Record<string, unknown>
		{
			return {
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
				frequency: { value: 440 },
				type: "sine"
			};
		}

		/** Creates biquad filter stub. */
		createBiquadFilter(): Record<string, unknown>
		{
			return {
				connect: vi.fn(),
				frequency: { value: 1000 },
				type: "lowpass",
				Q: { value: 1 }
			};
		}

		/** Creates buffer source stub. */
		createBufferSource(): Record<string, unknown>
		{
			return {
				connect: vi.fn(),
				start: vi.fn(),
				buffer: null
			};
		}

		/** Creates audio buffer stub. */
		createBuffer(
			_channels: number,
			length: number): Record<string, unknown>
		{
			return {
				getChannelData: (): Float32Array =>
					new Float32Array(length)
			};
		}

		/** Stub resume. */
		async resume(): Promise<void>
		{
		}

		/** Stub close. */
		async close(): Promise<void>
		{
		}
	}

	vi.stubGlobal(
		"AudioContext",
		StubAudioContext);
}

describe("GalacticAssaultComponent",
	() =>
	{
		let component: GalacticAssaultComponent;
		let fixture: ComponentFixture<GalacticAssaultComponent>;

		beforeEach(
			async () =>
			{
				installAudioContextStub();

				await TestBed
					.configureTestingModule(
						{
							imports: [GalacticAssaultComponent],
							providers: [
								provideZonelessChangeDetection(),
								BabylonEngineService,
								GameSceneService,
								PlayerShipService,
								InputService,
								EnemySwarmService,
								CollisionService,
								GameCollisionHandlerService,
								WeaponService,
								PowerUpService,
								BossService,
								ScoringService,
								GameAudioService,
								GameStateService,
								ParticleEffectsService,
								{
									provide: BABYLON_ENGINE_OPTIONS,
									useValue: { useNullEngine: true }
								}
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(GalacticAssaultComponent);
				component =
					fixture.componentInstance;
			});

		afterEach(
			() =>
			{
				fixture.destroy();
				vi.unstubAllGlobals();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should contain the babylon canvas component",
			() =>
			{
				// Arrange & Act
				fixture.detectChanges();
				const canvas: HTMLElement | null =
					fixture.nativeElement.querySelector("app-babylon-canvas");

				// Assert
				expect(canvas)
					.toBeTruthy();
			});
	});