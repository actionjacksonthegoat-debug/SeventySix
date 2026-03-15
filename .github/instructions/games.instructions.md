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
| Babylon.js observers | Store `Observer` reference, call `scene.onBeforeRenderObservable.remove(observer)` on dispose |

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
        {game-name}-game.ts        # Component
        {game-name}-game.html      # Template
        {game-name}-game.scss      # Styles
        {game-name}-game.spec.ts   # Tests
    services/
      {service-name}.service.ts
      {service-name}.service.spec.ts
    models/
      {game-name}.models.ts
    constants/
      {game-name}.constants.ts
```

Then:
1. Add route in `games.routes.ts` with route-scoped `providers[]`
2. Add game card in `games-landing.html`
3. Add E2E selectors/routes/page-text in fixtures