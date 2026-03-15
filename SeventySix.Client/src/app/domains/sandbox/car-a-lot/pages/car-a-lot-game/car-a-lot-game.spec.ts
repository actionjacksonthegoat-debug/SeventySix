/**
 * Car-a-Lot Game Page component unit tests.
 * Tests game container rendering and child component integration.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BoostService } from "@sandbox/car-a-lot/services/boost.service";
import { CarALotAudioService } from "@sandbox/car-a-lot/services/car-a-lot-audio.service";
import { CharacterBuilderService } from "@sandbox/car-a-lot/services/character-builder.service";
import { CoinService } from "@sandbox/car-a-lot/services/coin.service";
import { DrivingPhysicsService } from "@sandbox/car-a-lot/services/driving-physics.service";
import { KartBuilderService } from "@sandbox/car-a-lot/services/kart-builder.service";
import { OctopusBossService } from "@sandbox/car-a-lot/services/octopus-boss.service";
import { RaceCameraService } from "@sandbox/car-a-lot/services/race-camera.service";
import { RaceSceneService } from "@sandbox/car-a-lot/services/race-scene.service";
import { RaceStateService } from "@sandbox/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@sandbox/car-a-lot/services/road-collision.service";
import { TrackBuilderService } from "@sandbox/car-a-lot/services/track-builder.service";
import { TrackFeaturesService } from "@sandbox/car-a-lot/services/track-features.service";
import { BABYLON_ENGINE_OPTIONS } from "@sandbox/shared/constants/engine.constants";
import { BabylonEngineService } from "@sandbox/shared/services/babylon-engine.service";
import { InputService } from "@sandbox/shared/services/input.service";
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