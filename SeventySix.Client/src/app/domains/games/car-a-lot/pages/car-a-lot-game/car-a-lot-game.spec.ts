/**
 * Car-a-Lot Game Page component unit tests.
 * Tests game container rendering and child component integration.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { KART_GROUND_OFFSET } from "@games/car-a-lot/constants/car-a-lot.constants";
import {
	CharacterType,
	KartColor
} from "@games/car-a-lot/models/car-a-lot.models";
import { BoostService } from "@games/car-a-lot/services/boost.service";
import { CarALotAudioService } from "@games/car-a-lot/services/car-a-lot-audio.service";
import { CharacterBuilderService } from "@games/car-a-lot/services/character-builder.service";
import { CoinService } from "@games/car-a-lot/services/coin.service";
import { DrivingPhysicsService } from "@games/car-a-lot/services/driving-physics.service";
import { GameFlowService } from "@games/car-a-lot/services/game-flow.service";
import { KartBuilderService } from "@games/car-a-lot/services/kart-builder.service";
import { OctopusBossService } from "@games/car-a-lot/services/octopus-boss.service";
import { RaceCameraService } from "@games/car-a-lot/services/race-camera.service";
import { RaceSceneService } from "@games/car-a-lot/services/race-scene.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
import { TrackBuilderService } from "@games/car-a-lot/services/track-builder.service";
import { TrackFeaturesService } from "@games/car-a-lot/services/track-features.service";
import { BABYLON_ENGINE_OPTIONS } from "@games/shared/constants/engine.constants";
import { AudioContextService } from "@games/shared/services/audio-context.service";
import { BabylonEngineService } from "@games/shared/services/babylon-engine.service";
import { DisposableRegistryService } from "@games/shared/services/disposable-registry.service";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";
import { Mock, vi } from "vitest";
import { CarALotGameComponent } from "./car-a-lot-game";

describe("CarALotGameComponent",
	() =>
	{
		let fixture: ComponentFixture<CarALotGameComponent>;
		let component: CarALotGameComponent;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [CarALotGameComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([]),
								AudioContextService,
								BabylonEngineService,
								CharacterBuilderService,
								DisposableRegistryService,
								DrivingPhysicsService,
								InputService,
								KartBuilderService,
								OctopusBossService,
								RaceCameraService,
								RaceSceneService,
								RaceStateService,
								RoadCollisionService,
								TrackBuilderService,
								TrackFeaturesService,
								CoinService,
								BoostService,
								CarALotAudioService,
								GameFlowService,
								GameLoopService,
								{
									provide: BABYLON_ENGINE_OPTIONS,
									useValue: { useNullEngine: true }
								}
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(CarALotGameComponent);
				component =
					fixture.componentInstance;
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(fixture.componentInstance)
					.toBeTruthy();
			});

		it("should render game container",
			() =>
			{
				const container: HTMLElement | null =
					fixture.nativeElement.querySelector(".game-container");

				expect(container)
					.toBeTruthy();
			});

		it("should render babylon canvas",
			() =>
			{
				const canvas: HTMLElement | null =
					fixture.nativeElement.querySelector("app-babylon-canvas");

				expect(canvas)
					.toBeTruthy();
			});

		it("should render driving hud",
			() =>
			{
				const hud: HTMLElement | null =
					fixture.nativeElement.querySelector("app-driving-hud");

				expect(hud)
					.toBeTruthy();
			});

		it("should render color selector",
			() =>
			{
				const selector: HTMLElement | null =
					fixture.nativeElement.querySelector("app-color-selector");

				expect(selector)
					.toBeTruthy();
			});

		describe("public handlers",
			() =>
			{
				it("should forward kart color changes to the kart builder",
					() =>
					{
						const setKartColorSpy: Mock =
							vi.spyOn(component["kartBuilder"], "setKartColor");

						component.onKartColorChange(KartColor.Red);

						expect(setKartColorSpy)
							.toHaveBeenCalledWith(KartColor.Red);
					});

				it("should update the selected character without rebuilding rescue assets when scene data is unavailable",
					() =>
					{
						const createRescueSpy: Mock =
							vi.spyOn(component["characterBuilder"], "createRescueCharacter");
						component["scene"] = null;
						component["rescueCharRoot"] = null;

						component.onCharacterChange(CharacterType.Prince);

						expect(createRescueSpy.mock.calls.length)
							.toBe(0);
					});

				it("should rebuild the rescue character when the scene is available",
					() =>
					{
						const oldRescueDisposeSpy: Mock =
							vi.fn();
						const newRescueRoot: { position: Vector3; } =
							{ position: Vector3.Zero() };
						const createRescueSpy: Mock =
							vi
								.spyOn(component["characterBuilder"], "createRescueCharacter")
								.mockReturnValue(newRescueRoot as never);

						component["scene"] =
							{} as typeof component["scene"];
						component["rescueCenter"] =
							new Vector3(5, 0, 10);
						component["rescueCharRoot"] =
							{
								dispose: oldRescueDisposeSpy
							} as unknown as typeof component["rescueCharRoot"];

						component.onCharacterChange(CharacterType.Princess);

						expect(oldRescueDisposeSpy)
							.toHaveBeenCalledOnce();
						expect(createRescueSpy)
							.toHaveBeenCalledOnce();
						expect(component["rescueCharRoot"])
							.toBe(newRescueRoot);
					});

				it("should reset race state and rebuild start assets when starting a game",
					() =>
					{
						const resetRaceSpy: Mock =
							vi.spyOn(component["raceState"], "reset");
						const resetPhysicsSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "reset");
						const resetBoostSpy: Mock =
							vi.spyOn(component["boostService"], "reset");
						const resetCoinsSpy: Mock =
							vi.spyOn(component["coinService"], "reset");
						const resetForNewRaceSpy: Mock =
							vi.spyOn(component["gameFlow"], "resetForNewRace");
						const setCharacterTypeSpy: Mock =
							vi.spyOn(component["characterBuilder"], "setCharacterType");
						const startCountdownSpy: Mock =
							vi.spyOn(component["raceState"], "startCountdown");
						const playCountdownSpy: Mock =
							vi.spyOn(component["audioService"], "playCountdownBing");
						const createRescueSpy: Mock =
							vi
								.spyOn(component["characterBuilder"], "createRescueCharacter")
								.mockReturnValue({ position: Vector3.Zero() } as never);
						vi
							.spyOn(component["raceState"], "characterType")
							.mockReturnValue(CharacterType.Prince);

						component["scene"] =
							{} as typeof component["scene"];
						component["rescueCenter"] =
							new Vector3(2, 0, 3);
						component["rescueCharRoot"] =
							{ dispose: vi.fn() } as unknown as typeof component["rescueCharRoot"];
						component["kartRoot"] =
							{
								position: new Vector3(99, 99, 99),
								rotation: { y: 5 }
							} as unknown as typeof component["kartRoot"];

						component.onStartGame();

						expect(resetRaceSpy)
							.toHaveBeenCalledOnce();
						expect(resetPhysicsSpy)
							.toHaveBeenCalledOnce();
						expect(resetBoostSpy)
							.toHaveBeenCalledOnce();
						expect(resetCoinsSpy)
							.toHaveBeenCalledOnce();
						expect(component["kartRoot"]?.position)
							.toEqual(new Vector3(0, KART_GROUND_OFFSET, 0));
						expect(component["kartRoot"]?.rotation.y)
							.toBe(0);
						expect(setCharacterTypeSpy)
							.toHaveBeenCalledWith(CharacterType.Prince);
						expect(createRescueSpy)
							.toHaveBeenCalledOnce();
						expect(startCountdownSpy)
							.toHaveBeenCalledOnce();
						expect(resetForNewRaceSpy)
							.toHaveBeenCalledOnce();
						expect(playCountdownSpy)
							.toHaveBeenCalledWith(false);
					});
			});

		describe("cleanup",
			() =>
			{
				it("should reset physics and delegate disposal to the registry",
					() =>
					{
						const resetPhysicsSpy: Mock =
							vi.spyOn(component["drivingPhysics"], "reset");
						const disposeAllSpy: Mock =
							vi.spyOn(component["disposableRegistry"], "disposeAll");

						component["cleanup"]();

						expect(resetPhysicsSpy)
							.toHaveBeenCalledOnce();
						expect(disposeAllSpy)
							.toHaveBeenCalledOnce();
					});
			});
	});