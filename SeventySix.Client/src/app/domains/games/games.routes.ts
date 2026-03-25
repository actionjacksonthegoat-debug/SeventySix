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
import { GameFlowService } from "@games/car-a-lot/services/game-flow.service";
import { KartBuilderService } from "@games/car-a-lot/services/kart-builder.service";
import { OctopusBossService } from "@games/car-a-lot/services/octopus-boss.service";
import { RaceCameraService } from "@games/car-a-lot/services/race-camera.service";
import { RaceSceneService } from "@games/car-a-lot/services/race-scene.service";
import { RaceStateService } from "@games/car-a-lot/services/race-state.service";
import { RoadCollisionService } from "@games/car-a-lot/services/road-collision.service";
import { TrackBuilderService } from "@games/car-a-lot/services/track-builder.service";
import { TrackFeaturesService } from "@games/car-a-lot/services/track-features.service";
import { BabylonEngineService } from "@games/shared/services/babylon-engine.service";
import { GameLoopService } from "@games/shared/services/game-loop.service";
import { InputService } from "@games/shared/services/input.service";
import { AirplaneService } from "@games/spy-vs-spy/services/airplane.service";
import { CombatService } from "@games/spy-vs-spy/services/combat.service";
import { ExplosionService } from "@games/spy-vs-spy/services/explosion.service";
import { FurnitureService } from "@games/spy-vs-spy/services/furniture.service";
import { SpyFlowService } from "@games/spy-vs-spy/services/game-flow.service";
import { IslandDecorationService } from "@games/spy-vs-spy/services/island-decoration.service";
import { IslandEnvironmentService } from "@games/spy-vs-spy/services/island-environment.service";
import { IslandOutdoorService } from "@games/spy-vs-spy/services/island-outdoor.service";
import { IslandSceneService } from "@games/spy-vs-spy/services/island-scene.service";
import { ItemService } from "@games/spy-vs-spy/services/item.service";
import { MinimapService } from "@games/spy-vs-spy/services/minimap.service";
import { SearchService } from "@games/spy-vs-spy/services/search.service";
import { SpyAiCoordinatorService } from "@games/spy-vs-spy/services/spy-ai-coordinator.service";
import { SpyAiService } from "@games/spy-vs-spy/services/spy-ai.service";
import { SpyAudioService } from "@games/spy-vs-spy/services/spy-audio.service";
import { SpyBuilderService } from "@games/spy-vs-spy/services/spy-builder.service";
import { SpyCameraService } from "@games/spy-vs-spy/services/spy-camera.service";
import { SpyDamageHandlerService } from "@games/spy-vs-spy/services/spy-damage-handler.service";
import { SpyPathfindingService } from "@games/spy-vs-spy/services/spy-pathfinding.service";
import { SpyPhysicsService } from "@games/spy-vs-spy/services/spy-physics.service";
import { SpySearchHandlerService } from "@games/spy-vs-spy/services/spy-search-handler.service";
import { TrapService } from "@games/spy-vs-spy/services/trap.service";
import { TurnService } from "@games/spy-vs-spy/services/turn.service";

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
		},
		{
			path: "spy-vs-spy",
			loadComponent: () =>
				import("./spy-vs-spy/pages/spy-vs-spy-game/spy-vs-spy-game").then(
					(module) => module.SpyVsSpyGameComponent),
			title: "Spy And Fly - SeventySix",
			data: { breadcrumb: "Spy And Fly" },
			providers: [
				AirplaneService,
				BabylonEngineService,
				CombatService,
				ExplosionService,
				FurnitureService,
				GameLoopService,
				InputService,
				IslandDecorationService,
				IslandEnvironmentService,
				IslandOutdoorService,
				IslandSceneService,
				ItemService,
				MinimapService,
				SearchService,
				SpyAiCoordinatorService,
				SpyAiService,
				SpyAudioService,
				SpyBuilderService,
				SpyCameraService,
				SpyDamageHandlerService,
				SpyFlowService,
				SpyPathfindingService,
				SpySearchHandlerService,
				SpyPhysicsService,
				TrapService,
				TurnService
			]
		}
	];