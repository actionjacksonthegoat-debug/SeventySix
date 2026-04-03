// <copyright file="index.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Games shared barrel export.
 * Provides a single import point for all shared game infrastructure:
 * services, utilities, models, and components.
 */

/* ─── Services ─────────────────────────────────────────────────────── */
export { AssetManagerService } from "./services/asset-manager.service";
export { AudioContextService } from "./services/audio-context.service";
export { BabylonEngineService } from "./services/babylon-engine.service";
export { BaseGameAudioService } from "./services/base-game-audio.service";
export { DisposableRegistryService } from "./services/disposable-registry.service";
export { GameLoopService } from "./services/game-loop.service";
export { InputService } from "./services/input.service";

/* ─── Utilities ────────────────────────────────────────────────────── */
export { CountdownHelper } from "./utilities/countdown.utility";
export type { CountdownTickResult } from "./utilities/countdown.utility";
export { GameStateMachine } from "./utilities/game-state-machine.utility";
export { createNoiseBuffer, playArpeggio, SfxBuilder } from "./utilities/sfx-builder.utility";
export type { ArpeggioOptions } from "./utilities/sfx-builder.utility";
export { formatTimerValue, getTimerWarningClass } from "./utilities/timer-display.utility";

/* ─── Models ───────────────────────────────────────────────────────── */
export type {
	IDisposable,
	IGameAudioService,
	IGameCameraService,
	IGamePhysicsService,
	IGameSceneService
} from "./models/game-service.interfaces";
export { GameLifecycleState } from "./models/game.models";

/* ─── Components ───────────────────────────────────────────────────── */
export { BabylonCanvasComponent } from "./components/babylon-canvas/babylon-canvas";
export { FullscreenToggleComponent } from "./components/fullscreen-toggle/fullscreen-toggle";
export { GameLoadingComponent } from "./components/game-loading/game-loading";