/**
 * Car-a-Lot Game Page component unit tests.
 * Tests game container rendering and child component integration.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
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
import { BabylonEngineService } from "@games/shared/services/babylon-engine.service";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";
import { CarALotGameComponent } from "./car-a-lot-game";

describe("CarALotGameComponent",
	() =>
	{
		let fixture: ComponentFixture<CarALotGameComponent>;

		beforeEach(
			async () =>
			{
				await TestBed
					.configureTestingModule(
						{
							imports: [CarALotGameComponent],
							providers: [
								provideZonelessChangeDetection(),
								BabylonEngineService,
								CharacterBuilderService,
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
	});