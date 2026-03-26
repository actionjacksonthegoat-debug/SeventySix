/**
 * Damage Handler Service (SpyDamageHandlerService) unit tests.
 * Tests trap stun application, combat resolution, death and stun
 * visual effects, and audio feedback delegation.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	BOMB_STUN_SECONDS,
	SPRING_STUN_SECONDS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	CombatResult,
	SpyIdentity,
	StunState,
	TrapType
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { SpyState } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { CombatService } from "./combat.service";
import { SpyAiService } from "./spy-ai.service";
import { SpyAudioService } from "./spy-audio.service";
import { SpyBuilderService } from "./spy-builder.service";
import { SpyDamageHandlerService } from "./spy-damage-handler.service";
import { SpyPhysicsService } from "./spy-physics.service";
import { TurnService } from "./turn.service";

describe("SpyDamageHandlerService",
	() =>
	{
		let service: SpyDamageHandlerService;
		let mockSpyBuilder: SpyBuilderService;
		let mockPhysics: SpyPhysicsService;
		let mockAi: SpyAiService;
		let mockTurnService: TurnService;
		let mockCombatService: CombatService;
		let mockAudio: SpyAudioService;

		beforeEach(
			() =>
			{
				mockSpyBuilder =
					{
						buildSpy: (): null => null,
						playDeathAnimation: (): Promise<void> => Promise.resolve(),
						showStunEffect: (): void =>
						{/* mock */},
						hideStunEffect: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyBuilderService;

				mockPhysics =
					{
						getState: (): unknown => ({}),
						setStunned: (): void =>
						{/* mock */},
						resetPosition: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyPhysicsService;

				mockAi =
					{
						getState: (): Readonly<SpyState> =>
							({
								identity: SpyIdentity.White,
								positionX: 0,
								positionZ: 0
							}) as Readonly<SpyState>,
						setStunned: (): void =>
						{/* mock */},
						reset: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyAiService;

				mockTurnService =
					{
						applyDeathPenalty: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as TurnService;

				mockCombatService =
					{
						resolve: (): CombatResult =>
							CombatResult.Player1Wins,
						dispose: (): void =>
						{/* mock */}
					} as unknown as CombatService;

				mockAudio =
					{
						playBombTriggered: (): void =>
						{/* mock */},
						playSpringTriggered: (): void =>
						{/* mock */},
						playCombatHit: (): void =>
						{/* mock */},
						dispose: (): void =>
						{/* mock */}
					} as unknown as SpyAudioService;

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpyDamageHandlerService,
							{ provide: SpyBuilderService, useValue: mockSpyBuilder },
							{ provide: SpyPhysicsService, useValue: mockPhysics },
							{ provide: SpyAiService, useValue: mockAi },
							{ provide: TurnService, useValue: mockTurnService },
							{ provide: CombatService, useValue: mockCombatService },
							{ provide: SpyAudioService, useValue: mockAudio }
						]
					});

				service =
					TestBed.inject(SpyDamageHandlerService);
			});

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("applyTrapToSpy",
			() =>
			{
				it("should stun player 1 physics with bomb state for bomb trap",
					() =>
					{
						let stunState: StunState =
							StunState.None;
						let stunDuration: number = 0;

						mockPhysics.setStunned =
							(state: StunState, duration: number): void =>
							{
								stunState = state;
								stunDuration = duration;
							};

						const isBomb: boolean =
							service.applyTrapToSpy(TrapType.Bomb, true);

						expect(isBomb)
							.toBe(true);
						expect(stunState)
							.toBe(StunState.BombStunned);
						expect(stunDuration)
							.toBe(BOMB_STUN_SECONDS);
					});

				it("should stun player 1 physics with spring state for spring trap",
					() =>
					{
						let stunState: StunState =
							StunState.None;
						let stunDuration: number = 0;

						mockPhysics.setStunned =
							(state: StunState, duration: number): void =>
							{
								stunState = state;
								stunDuration = duration;
							};

						const isBomb: boolean =
							service.applyTrapToSpy(TrapType.SpringTrap, true);

						expect(isBomb)
							.toBe(false);
						expect(stunState)
							.toBe(StunState.SpringLaunched);
						expect(stunDuration)
							.toBe(SPRING_STUN_SECONDS);
					});

				it("should stun AI for player 2 bomb trap",
					() =>
					{
						let aiStunState: StunState =
							StunState.None;

						mockAi.setStunned =
							(state: StunState): void =>
							{
								aiStunState = state;
							};

						service.applyTrapToSpy(TrapType.Bomb, false);

						expect(aiStunState)
							.toBe(StunState.BombStunned);
					});

				it("should apply death penalty via turn service",
					() =>
					{
						let penaltyIdentity: SpyIdentity | null = null;

						mockTurnService.applyDeathPenalty =
							(identity: SpyIdentity): void =>
							{
								penaltyIdentity = identity;
							};

						service.applyTrapToSpy(TrapType.Bomb, true);

						expect(penaltyIdentity)
							.toBe(SpyIdentity.Black);
					});

				it("should apply death penalty for player 2",
					() =>
					{
						let penaltyIdentity: SpyIdentity | null = null;

						mockTurnService.applyDeathPenalty =
							(identity: SpyIdentity): void =>
							{
								penaltyIdentity = identity;
							};

						service.applyTrapToSpy(TrapType.SpringTrap, false);

						expect(penaltyIdentity)
							.toBe(SpyIdentity.White);
					});

				it("should play bomb audio for bomb trap",
					() =>
					{
						let bombPlayed: boolean = false;

						mockAudio.playBombTriggered =
							(): void =>
							{
								bombPlayed = true;
							};

						service.applyTrapToSpy(TrapType.Bomb, true);

						expect(bombPlayed)
							.toBe(true);
					});

				it("should play spring audio for spring trap",
					() =>
					{
						let springPlayed: boolean = false;

						mockAudio.playSpringTriggered =
							(): void =>
							{
								springPlayed = true;
							};

						service.applyTrapToSpy(TrapType.SpringTrap, true);

						expect(springPlayed)
							.toBe(true);
					});

				it("should return true for bomb and false for spring",
					() =>
					{
						expect(service.applyTrapToSpy(TrapType.Bomb, true))
							.toBe(true);
						expect(service.applyTrapToSpy(TrapType.SpringTrap, true))
							.toBe(false);
					});
			});

		describe("resolveCombat",
			() =>
			{
				it("should return Player1Wins when combat resolves for player 1",
					() =>
					{
						mockCombatService.resolve =
							(): CombatResult =>
								CombatResult.Player1Wins;

						const result: CombatResult =
							service.resolveCombat();

						expect(result)
							.toBe(CombatResult.Player1Wins);
					});

				it("should return Player2Wins when combat resolves for player 2",
					() =>
					{
						mockCombatService.resolve =
							(): CombatResult =>
								CombatResult.Player2Wins;

						const result: CombatResult =
							service.resolveCombat();

						expect(result)
							.toBe(CombatResult.Player2Wins);
					});

				it("should play combat hit audio on resolution",
					() =>
					{
						let hitPlayed: boolean = false;

						mockAudio.playCombatHit =
							(): void =>
							{
								hitPlayed = true;
							};

						service.resolveCombat();

						expect(hitPlayed)
							.toBe(true);
					});

				it("should stun AI when player 1 wins combat",
					() =>
					{
						let aiStunned: boolean = false;

						mockCombatService.resolve =
							(): CombatResult =>
								CombatResult.Player1Wins;
						mockAi.setStunned =
							(): void =>
							{
								aiStunned = true;
							};

						service.resolveCombat();

						expect(aiStunned)
							.toBe(true);
					});

				it("should stun player 1 when player 2 wins combat",
					() =>
					{
						let playerStunned: boolean = false;

						mockCombatService.resolve =
							(): CombatResult =>
								CombatResult.Player2Wins;
						mockPhysics.setStunned =
							(): void =>
							{
								playerStunned = true;
							};

						service.resolveCombat();

						expect(playerStunned)
							.toBe(true);
					});

				it("should apply death penalty to loser identity",
					() =>
					{
						let penaltyIdentity: SpyIdentity | null = null;

						mockTurnService.applyDeathPenalty =
							(identity: SpyIdentity): void =>
							{
								penaltyIdentity = identity;
							};
						mockCombatService.resolve =
							(): CombatResult =>
								CombatResult.Player1Wins;

						service.resolveCombat();

						expect(penaltyIdentity)
							.toBe(SpyIdentity.White);
					});
			});

		describe("triggerDeathVisual",
			() =>
			{
				it("should not throw when visuals are not initialized",
					() =>
					{
						expect(() => service.triggerDeathVisual(true))
							.not
							.toThrow();
					});
			});

		describe("triggerStunVisual",
			() =>
			{
				it("should not throw when visuals are not initialized",
					() =>
					{
						expect(() => service.triggerStunVisual(true, 3))
							.not
							.toThrow();
					});
			});
	});