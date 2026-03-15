/**
 * Games Domain Routes
 * Lazy-loaded routes for the Games domain featuring all game experiences.
 */
import { Routes } from "@angular/router";
import { BoostService } from "@games/car-a-lot/services/boost.service";
import { CarALotAudioService } from "@games/car-a-lot/services/car-a-lot-audio.service";
import { CharacterBuilderService } from "@games/car-a-lot/services/character-builder.service";
import { CoinService } from "@games/car-a-lot/services/coin.service";
import { DrivingPhysicsService } from "@games/car-a-lot/services/driving-physics.service";
import { KartBuilderService } from "@games/car-a-lot/services/kart-builder.service";
import { OctopusBossService } from "@games/car-a-lot/services/octopus-boss.service";
import { RaceCameraService } from "@games/car-a-lot/services/race-camera.service";
import { RaceSceneService } from "@games/car-a-lot/services/race-scene.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
import { TrackBuilderService } from "@games/car-a-lot/services/track-builder.service";
import { TrackFeaturesService } from "@games/car-a-lot/services/track-features.service";
import { GameFlowService } from "@games/car-a-lot/services/game-flow.service";
import { BabylonEngineService } from "@games/shared/services/babylon-engine.service";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";

/**
 * Games domain routes for all game experiences.
 * Lazy-loaded under `/games` for domain isolation.
 * Each game provides its own route-scoped services.
 */
export const GAMES_ROUTES: Routes =
	[
		{
			path: "",
			loadComponent: () =>
				import("./pages/games-landing/games-landing").then(
					(module) => module.GamesLandingComponent),
			title: "Games - SeventySix",
			data: { breadcrumb: "Games" }
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
				GameFlowService,
				GameLoopService,
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