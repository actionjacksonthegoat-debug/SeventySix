---
description: Babylon.js engine patterns, asset management, and BabylonJS Assets licensing for SeventySix Games
applyTo: "**/SeventySix.Client/src/app/domains/games/**/*.ts"
---

# Babylon.js Instructions

## Engine Lifecycle

Scene lifecycle: `new Engine(canvas)` → `new Scene(engine)` → populate → `engine.runRenderLoop(() => scene.render())` → `engine.stopRenderLoop()` → `scene.dispose()` → `engine.dispose()`.

`BabylonEngineService` wraps this lifecycle in Angular — route-scoped.

## Testing with NullEngine

Use `NullEngine` for unit tests — no GPU required.

```typescript
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";

const engine = new NullEngine();
const scene = new Scene(engine);
```

## Scene Observables (Execution Order Per Frame)

`onBeforeAnimationsObservable` → `onAfterAnimationsObservable` → `onBeforePhysicsObservable` → `onAfterPhysicsObservable` → `onBeforeRenderObservable` → render → `onAfterRenderObservable`

| Purpose | Observable |
|---------|-----------|
| Game loop updates | `onBeforeRenderObservable` |
| Physics-aware updates | `onBeforePhysicsObservable` / `onAfterPhysicsObservable` |

## Asset Loading

| Method | Use Case |
|--------|----------|
| `LoadAssetContainerAsync(url, scene)` | Load into container without adding to scene |
| `container.addAllToScene()` | Add loaded container to scene |
| `container.instantiateModelsToScene()` | Clone instances from template (no re-download) |
| `ImportMeshAsync(url, scene, { meshNames })` | Load specific meshes |
| `AssetsManager` | Bulk loading with progress tracking |

**glTF/GLB**: Always use `@babylonjs/loaders/dynamic` → `registerBuiltInLoaders()` for ES6/npm tree-shaking.

## Camera Patterns

| Camera | Use Case |
|--------|----------|
| `FollowCamera` | Third-person chase cam (Car-a-Lot) |
| `ArcRotateCamera` | Orbit camera for inspection/editor |
| `FreeCamera` | First-person movement |
| `UniversalCamera` | Keyboard + mouse + touch combined |

## Physics (Havok)

- `scene.enablePhysics(gravity, new HavokPlugin(true, havokInstance))`
- `PhysicsAggregate` for the V2 physics API (preferred over V1 `PhysicsImpostor`)
- `PhysicsShapeType` enum: `SPHERE`, `BOX`, `CAPSULE`, `CYLINDER`, `MESH`, `CONVEX_HULL`
- For MMO: server-authoritative physics — client is visual only

## TransformNode Hierarchy

- Use `TransformNode` as empty parents for grouping meshes
- Set `parent` property for hierarchical transforms
- Use `node.getChildMeshes()` for recursive mesh access

## Material & Lighting

| Type | Use Case |
|------|----------|
| `StandardMaterial` | Simple surfaces |
| `PBRMaterial` | Physically-based rendering (production quality) |
| `HemisphericLight` | Ambient |
| `DirectionalLight` | Sunlight |
| `PointLight` | Local light sources |
| `ShadowGenerator` | Real-time shadows |

## Animation Patterns

| Method | Use Case |
|--------|----------|
| `Animation` class | Keyframe animations |
| `scene.onBeforeRenderObservable` | Per-frame procedural animation |
| `AnimationGroup` | Coordinated animations from loaded models |
| `scene.beginAnimation()` | Triggering stored animations |

## MMO-Scale Architecture Patterns

- **ECS**: Use `TransformNode` as entity, attach components via metadata/services
- **Entity interpolation**: Client receives server positions at tick rate, lerps between snapshots
- **State sync**: Server is authoritative. Client sends inputs, server resolves, broadcasts snapshots
- **Scene management**: Multi-scene via `scene.dispose()` + new `Scene(engine)`. Loading screens during transitions
- **LOD**: `mesh.addLODLevel(distance, lowerDetailMesh)` for performance at scale

## BabylonJS Assets — CC BY 4.0 (CRITICAL)

Repository: `https://github.com/BabylonJS/Assets`
CDN (learning only): `https://assets.babylonjs.com/`

**Self-hosting required for production** — the public CDN is for experimentation only.

### Attribution Requirements (MANDATORY)

BabylonJS Assets are licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**. When using any BabylonJS Assets:

1. Add attribution entry to `THIRD_PARTY_LICENSES.md` at repo root
2. Track which specific assets are used (file path + original source URL)
3. Note any modifications made to assets

Required attribution content:
- Creator identification: "BabylonJS / BabylonJS contributors"
- Copyright notice
- License notice: CC BY 4.0
- License link: `https://creativecommons.org/licenses/by/4.0/`
- Modification notice (if assets were modified)