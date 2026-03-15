/**
 * Sandbox Feature Routes
 * Lazy-loaded routes for sandbox experimentation area
 */
import { Routes } from "@angular/router";
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
import { BabylonEngineService } from "@sandbox/shared/services/babylon-engine.service";
import { InputService } from "@sandbox/shared/services/input.service";

/**
 * Sandbox feature routes used for experimentation and testing of components.
 * Lazy-loaded under `/sandbox` for isolation from production flows.
 */
export const SANDBOX_ROUTES: Routes =
	[
		{
			path: "",
			loadComponent: () =>
				import("./pages/sandbox-landing/sandbox-landing").then(
					(module) =>
						module.SandboxLandingComponent),
			title: "Sandbox - SeventySix",
			data: { breadcrumb: "Sandbox" }
		},
		{
			path: "car-a-lot",
			loadComponent: () =>
				import("./car-a-lot/pages/car-a-lot-game/car-a-lot-game").then(
					(module) => module.CarALotGameComponent),
			title: "Car-a-Lot - SeventySix",
			data: { breadcrumb: "Car-a-Lot" },
			providers: [
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
				CarALotAudioService
			]
		}
	];