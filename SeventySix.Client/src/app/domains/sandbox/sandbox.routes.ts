/**
 * Sandbox Feature Routes
 * Lazy-loaded routes for sandbox experimentation area
 */
import { Routes } from "@angular/router";
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
			data: { breadcrumb: "Landing" }
		},
		{
			path: "galactic-assault",
			loadComponent: () =>
				import("./pages/galactic-assault/galactic-assault").then(
					(module) =>
						module.GalacticAssaultComponent),
			title: "Galactic Assault - SeventySix",
			data: { breadcrumb: "Galactic Assault" },
			providers: [
				BabylonEngineService,
				GameSceneService,
				PlayerShipService,
				InputService,
				EnemySwarmService,
				CollisionService,
				WeaponService,
				PowerUpService,
				BossService,
				ScoringService,
				GameAudioService,
				GameCollisionHandlerService,
				GameStateService,
				ParticleEffectsService
			]
		}
	];