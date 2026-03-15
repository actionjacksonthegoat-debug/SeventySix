---
description: Game domain architecture, patterns, and new game blueprint for SeventySix Games
applyTo: "**/SeventySix.Client/src/app/domains/games/**/*.{ts,html,scss}"
---

# Games Domain Instructions

## Domain Boundaries (CRITICAL)

Games imports ONLY `@shared/*` + `@games/*`. NEVER another domain.

| From → To | @shared | @games | @admin | @sandbox | @developer |
| --------- | ------- | ------ | ------ | -------- | ---------- |
| @games    | [OK]    | [SELF] | [NEVER]| [NEVER]  | [NEVER]    |

## SOLID Architecture (CRITICAL — All Games)

Every game — even small ones — MUST follow SOLID from the start. Small games grow; retrofitting SOLID is expensive.

### Component = Thin Controller (Single Responsibility)

The game page component is a **wiring layer only**. It injects services, connects them during scene init, and delegates all per-frame logic. Components MUST NOT contain game logic, state machine transitions, or physics calculations.

| [NEVER] in Component | [ALWAYS] in Service |
|----------------------|---------------------|
| State machine transitions | `GameFlowService.update()` |
| Physics calculations | `PhysicsService.update()` |
| Collision response logic | Collision service or flow service |
| Audio trigger decisions | Flow/state service calls audio |
| Multi-line `onBeforeRenderObservable` lambdas | `GameLoopService` + `onUpdate` callback |

### Required Service Decomposition

| Responsibility | Service | Principle |
|---------------|---------|-----------|
| Render loop lifecycle | `GameLoopService` (shared) | DRY — reuse across all games |
| Scene setup (sky, lighting, ground) | `*SceneService` | SRP — scene environment only |
| Per-frame state transitions | `GameFlowService` | SRP — game state machine only |
| Player input | `InputService` (shared) | DRY — polling model reused |
| Physics / movement | `*PhysicsService` | SRP — movement math only |
| Camera control | `*CameraService` | SRP — camera follow/orbit only |
| Audio | `*AudioService` | SRP — sound triggers only |
| Collision detection | `*CollisionService` | SRP — boundary checks only |

### Interface Segregation for Services

Services MUST expose a focused public API. A service with `initialize()`, `update()`, `dispose()`, and domain-specific methods is acceptable. A service that mixes unrelated concerns (e.g., physics + audio) is not.

### Open/Closed via Shared Infrastructure

New games extend behavior by composing `@games/shared/` services — not by modifying them. Game-specific services live under `{game-name}/services/`. Shared services live under `games/shared/services/`.

## Route-Scoped Service Pattern

Game services use `@Injectable()` with NO `providedIn`. They are registered in the route `providers[]` array. This ensures per-route game state isolation — navigating away disposes the injector and all services.

```typescript
// [CORRECT] Route-scoped game service
@Injectable()
export class MyGameService { }

// [NEVER] Root-scoped game service
@Injectable({ providedIn: "root" })
export class MyGameService { }
```

## Shared Game Infrastructure (`games/shared/`)

All games MUST use shared services where they exist. Do NOT duplicate lifecycle management, input handling, or engine setup.

| Shared Service | Purpose | Every Game Uses |
|---------------|---------|-----------------|
| `GameLoopService` | Scene observer lifecycle (init → start → update → pause → dispose) | Yes |
| `InputService` | Keyboard/touch polling via `keys` dictionary | Yes |
| `BabylonEngineService` | Engine creation and canvas binding | Yes |
| `AssetManagerService` | Asset container loading and caching | When loading models |

## Game Lifecycle Pattern

`GameLoopService` manages lifecycle: `initialize(scene)` → `start()` → per-frame `update(deltaTime)` → `pause()` → `dispose()`.

States flow through `GameLifecycleState`: `Initializing` → `Ready` → `Running` ↔ `Paused` → `Disposed`.

## Input Architecture

Polling model via `InputService.keys` dictionary. Game physics read keys each frame. Mobile touch controls inject virtual key presses via `setKey()`.

| [NEVER] | [ALWAYS] |
|---------|----------|
| Direct event handlers in physics code | Read `InputService.keys` in game loop |
| Touch events modifying physics directly | Touch → `setKey()` → physics reads keys |

## Observable Cleanup

| Context | Pattern |
|---------|---------|
| Angular subscriptions | `DestroyRef` + `takeUntilDestroyed()` |
| Babylon.js observers | `GameLoopService.dispose()` removes the observer — no manual observer management needed |

## Performance Rules

| [NEVER] | [ALWAYS] |
|---------|----------|
| Leak Babylon.js resources | `dispose()` engines, scenes, meshes, materials, textures, observers |
| Leave render loop running | Stop render loop before disposing engine |
| Re-download assets for cloning | `LoadAssetContainerAsync` + `instantiateModelsToScene()` |
| Allocate `Vector3`/`Quaternion` in hot loops | Reuse instances in `update()` |

## Mobile-First Responsive Rules

- Touch controls: min 48px touch targets (see `accessibility.instructions.md` for WCAG AA)
- Canvas: `touch-action: none` to prevent browser gestures
- Responsive layout: game UI adapts to viewport

## New Game Blueprint

To add a new game, create this folder structure under `games/`:

```
games/
  {game-name}/
    pages/
      {game-name}-game/
        {game-name}-game.ts        # Component (thin controller)
        {game-name}-game.html      # Template
        {game-name}-game.scss      # Styles
        {game-name}-game.spec.ts   # Tests
    services/
      game-flow.service.ts         # State machine (REQUIRED)
      {game-name}-audio.service.ts # Audio triggers
      {other}.service.ts           # One service per responsibility
    models/
      {game-name}.models.ts
    constants/
      {game-name}.constants.ts
```

Then:
1. Add route in `games.routes.ts` with route-scoped `providers[]` (include shared services: `GameLoopService`, `InputService`, `BabylonEngineService`)
2. Add game card in `games-landing.html`
3. Add E2E selectors/routes/page-text in fixtures