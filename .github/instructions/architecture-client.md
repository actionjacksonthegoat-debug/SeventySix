# Client Architecture Quick Reference

> **Full documentation**: See `.claude/CLAUDE.md` for comprehensive guidelines.

---

## Project Structure (Target)

```
SeventySix.Client/src/app/
├── infrastructure/         # TRUE cross-cutting only (renamed from core/)
│   ├── api/               # HTTP client, interceptors
│   ├── auth/              # Guards
│   ├── repositories/      # Base classes only
│   ├── services/          # logger, notification, storage, theme
│   └── models/            # Base types (PagedResult, etc.)
├── shared/                # Reusable UI components, pipes, directives
└── features/              # Self-contained bounded contexts
    ├── admin/             # users/, logs/, api-tracking/
    ├── game/
    ├── home/
    └── ...
```

---

## Path Aliases

| Alias               | Path                       |
| ------------------- | -------------------------- |
| `@infrastructure/*` | `src/app/infrastructure/*` |
| `@shared/*`         | `src/app/shared/*`         |
| `@admin/*`          | `src/app/features/admin/*` |
| `@game/*`           | `src/app/features/game/*`  |
| `@home/*`           | `src/app/features/home/*`  |

**Rule**: Features ONLY import from `@infrastructure/` and `@shared/`, NEVER from other features.

---

## Feature Structure

```
feature/
├── components/           # UI components
├── models/              # DTOs, interfaces
├── repositories/        # Data access
├── services/            # Business logic
├── validators/          # Form validators (optional)
├── feature.routes.ts    # Feature routing (REQUIRED)
├── feature.component.ts # Main component
└── feature.component.spec.ts
```

---

## Feature Route Modularization (REQUIRED)

Every feature MUST have its own `feature.routes.ts` file for bounded context modularity:

```typescript
// features/game/game.routes.ts
import { Routes } from "@angular/router";

export const GAME_ROUTES: Routes = [
	{
		path: "",
		loadComponent: () => import("./world-map/world-map").then((m) => m.WorldMap),
		title: "Game - World Map",
	},
];
```

In `app.routes.ts`, use `loadChildren` for all features:

```typescript
{
	path: "game",
	loadChildren: () => import("./features/game/game.routes").then((m) => m.GAME_ROUTES),
	data: { breadcrumb: "Game" }
}
```

**Rule**: Features can be enabled/disabled by commenting out their route in `app.routes.ts`.

---

## Server-Client Alignment

| Server Context    | Client Feature        | Path Alias            |
| ----------------- | --------------------- | --------------------- |
| `Identity/`       | `admin/users/`        | `@admin/users`        |
| `Logging/`        | `admin/logs/`         | `@admin/logs`         |
| `ApiTracking/`    | `admin/api-tracking/` | `@admin/api-tracking` |
| `Infrastructure/` | `infrastructure/`     | `@infrastructure`     |

