# SeventySix Client Architecture Migration Plan

**Project**: SeventySix Client (Angular 20+) Feature-Based Bounded Context Architecture
**Date**: November 27, 2025
**Objective**: Restructure Angular client to mirror server bounded context architecture using Features as boundaries
**Principles**: KISS, DRY, YAGNI

---

## Executive Summary

Migrate the Angular client from the current `core/shared/features` structure to a **Feature-First Bounded Context Architecture** where each feature is self-contained with its own repositories, services, models, and components. This mirrors the server's bounded context structure (Identity, Logging, ApiTracking) while organizing by UI boundaries (Admin, Game, etc.).

**Key Changes:**

1. Rename `core/` → `infrastructure/` to align with server naming
2. Make each feature fully self-contained with minimal cross-feature dependencies
3. Move feature-specific services, repositories, and models INTO their respective features
4. Keep only truly cross-cutting infrastructure in `infrastructure/`
5. Ensure features don't know about each other (Admin ≠ Game)

---

## Current State Analysis

### Current Client Structure

```
src/app/
├── core/                    # Currently mixed: infrastructure + shared services
│   ├── api-services/        # HTTP client wrapper
│   ├── directives/          # Cross-cutting directives
│   ├── error-handling/      # Error handling infrastructure
│   ├── guards/              # Route guards
│   ├── interceptors/        # HTTP interceptors
│   ├── layout/              # App shell/layout
│   ├── models/              # Shared models (some feature-specific mixed in)
│   ├── performance/         # Performance monitoring
│   ├── repositories/        # Base repository (good) + HTTP repo (good)
│   ├── services/            # Mixed: infrastructure + feature-ish services
│   └── utils/               # Utility functions
├── shared/                  # Reusable UI components
│   ├── animations/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── validators/
└── features/               # Feature modules (partially self-contained)
    ├── admin/              # Has its own repos, services, models ✓
    │   ├── users/
    │   │   ├── components/
    │   │   ├── models/
    │   │   ├── repositories/
    │   │   └── services/
    │   └── log-management/
    ├── game/               # World map feature
    ├── physics/
    └── rv-camper/
```

### What's Already Good

-   Features like `admin/users` already follow the pattern (models, repositories, services inside feature)
-   `HttpRepository` base class in core provides reusable data access
-   Features use lazy loading

### What Needs to Change

1. `core/` should be renamed to `infrastructure/` to match server
2. Feature-specific services in `core/services/` should move to their features
3. Models in `core/models/` that are feature-specific should move to features
4. Each feature should be **completely** self-contained

---

## Target Architecture

### New Client Structure

```
src/app/
├── infrastructure/              # Renamed from core/ - TRUE cross-cutting only
│   ├── api/                     # HTTP client configuration
│   │   ├── api.service.ts       # Base HTTP wrapper
│   │   └── api.interceptors.ts  # HTTP interceptors
│   ├── auth/                    # Authentication (if needed)
│   │   └── guards/
│   ├── error-handling/          # Global error handling
│   ├── layout/                  # App shell, navigation
│   ├── performance/             # Web vitals, monitoring
│   ├── repositories/            # Base repository classes only
│   │   ├── base.repository.ts
│   │   └── http.repository.ts
│   ├── services/                # TRUE infrastructure services only
│   │   ├── logger.service.ts
│   │   ├── notification.service.ts
│   │   ├── storage.service.ts
│   │   └── theme.service.ts
│   └── models/                  # Shared infrastructure types
│       ├── base-query-request.model.ts
│       └── paged-result.model.ts
│
├── shared/                      # Reusable UI components (unchanged)
│   ├── animations/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── validators/
│
└── features/                    # Self-contained feature boundaries
    │
    ├── admin/                   # Admin Bounded Context (Views + Flows)
    │   ├── admin.routes.ts
    │   ├── dashboard/           # Admin Dashboard sub-feature
    │   │   ├── components/
    │   │   ├── admin-dashboard.component.ts
    │   │   └── admin-dashboard.component.html
    │   │
    │   ├── users/               # User Management (maps to Identity)
    │   │   ├── components/
    │   │   ├── models/
    │   │   │   ├── user.model.ts
    │   │   │   └── index.ts
    │   │   ├── repositories/
    │   │   │   └── user.repository.ts
    │   │   ├── services/
    │   │   │   └── user.service.ts
    │   │   ├── validators/
    │   │   └── users.component.ts
    │   │
    │   ├── logs/                # Log Management (maps to Logging)
    │   │   ├── components/
    │   │   ├── models/
    │   │   │   ├── log.model.ts
    │   │   │   └── index.ts
    │   │   ├── repositories/
    │   │   │   └── log.repository.ts
    │   │   ├── services/
    │   │   │   └── log.service.ts
    │   │   └── log-management.component.ts
    │   │
    │   └── error-pages/         # Error UI
    │
    ├── game/                    # Game Bounded Context
    │   ├── game.routes.ts       # Game-specific routes
    │   ├── world-map/           # World Map feature
    │   │   ├── components/
    │   │   ├── models/
    │   │   ├── services/
    │   │   └── world-map.ts
    │   └── ... (future game features)
    │
    ├── home/                    # Home/Landing Bounded Context
    │   └── home-page/
    │
    ├── developer/               # Developer Tools Bounded Context
    │   └── style-guide/
    │
    ├── physics/                 # Physics Calculator Bounded Context
    │   ├── models/
    │   ├── services/
    │   └── physics.ts
    │
    └── rv-camper/               # RV Camper Bounded Context
        ├── models/
        ├── services/
        └── rv-camper.ts
```

---

## Server-Client Alignment

| Server Bounded Context | Client Feature Location        | Shared Boundary                  |
| ---------------------- | ------------------------------ | -------------------------------- |
| `Identity/`            | `features/admin/users/`        | User management                  |
| `Logging/`             | `features/admin/logs/`         | Log management                   |
| `ApiTracking/`         | `features/admin/api-tracking/` | API tracking (future)            |
| `Infrastructure/`      | `infrastructure/`              | Cross-cutting services           |
| `Shared/`              | `infrastructure/models/`       | Base types (Result, PagedResult) |

---

## Feature Standard Structure

Each feature follows this standard (mirroring server bounded context):

```
feature-name/
├── components/              # Feature-specific UI components
│   ├── feature-card/
│   ├── feature-table/
│   └── feature-dialog/
├── composables/             # Reusable feature logic (optional)
├── models/                  # Feature DTOs and interfaces
│   ├── feature.model.ts
│   ├── feature-request.model.ts
│   └── index.ts
├── repositories/            # Data access layer
│   └── feature.repository.ts
├── services/                # Business logic layer
│   └── feature.service.ts
├── validators/              # Form validators (optional)
│   └── feature.validators.ts
├── feature.routes.ts        # Feature routing (if sub-routes exist)
├── feature.component.ts     # Main feature component
├── feature.component.html
├── feature.component.scss
└── feature.component.spec.ts
```

---

## 🚨 Critical Migration Rules

### LINE-FOR-LINE CODE MOVE Policy

This is a **structural reorganization**, NOT a rewrite:

1. ✅ **DO**: Move files to new locations
2. ✅ **DO**: Update import paths/aliases
3. ✅ **DO**: Rename `core/` to `infrastructure/`
4. ❌ **DON'T**: Change business logic
5. ❌ **DON'T**: Refactor service implementations
6. ❌ **DON'T**: Modify component templates
7. ❌ **DON'T**: Add new features during migration

### Test Execution Rules (from CLAUDE.md)

```bash
# ALWAYS run headless, no-watch
npm test

# Or explicitly
npm test -- --no-watch --browsers=ChromeHeadless

# NEVER use watch mode for validation
```

---

## Phase 1: Infrastructure Rename (1-2 hours)

**Goal**: Rename `core/` to `infrastructure/` and update all imports

### Step 1.1: Update Path Aliases

**File**: `tsconfig.json`

```json
{
	"compilerOptions": {
		"paths": {
			"@infrastructure/*": ["src/app/infrastructure/*"],
			"@shared/*": ["src/app/shared/*"],
			"@admin/*": ["src/app/features/admin/*"],
			"@game/*": ["src/app/features/game/*"],
			"@home/*": ["src/app/features/home/*"],
			"@physics/*": ["src/app/features/physics/*"],
			"@rv-camper/*": ["src/app/features/rv-camper/*"],
			"@developer/*": ["src/app/features/developer/*"]
		}
	}
}
```

### Step 1.2: Rename Directory

```powershell
# Rename core to infrastructure
Move-Item -Path "src/app/core" -Destination "src/app/infrastructure"
```

### Step 1.3: Update All Imports

Use VS Code find/replace:

-   Find: `@core/`
-   Replace: `@infrastructure/`

### Step 1.4: Verify Build

```powershell
npm run build
```

### Step 1.5: Run Tests

```powershell
npm test
```

**Deliverable**: `core/` renamed to `infrastructure/`, all tests passing

---

## Phase 2: Audit Infrastructure Services (1 hour)

**Goal**: Identify which services belong in infrastructure vs. features

### Infrastructure Services (Keep in `infrastructure/services/`)

These are truly cross-cutting concerns:

| Service                   | Reason                 |
| ------------------------- | ---------------------- |
| `logger.service.ts`       | App-wide logging       |
| `notification.service.ts` | Global notifications   |
| `storage.service.ts`      | LocalStorage wrapper   |
| `theme.service.ts`        | Theme management       |
| `loading.service.ts`      | Global loading state   |
| `viewport.service.ts`     | Responsive breakpoints |
| `sw-update.service.ts`    | Service worker updates |

### Feature-Specific Services (Candidates for Move)

Evaluate if these should move to features:

| Service                   | Current Location               | Move To |
| ------------------------- | ------------------------------ | ------- |
| `base-filter.service.ts`  | Keep - base class for features |
| `date.service.ts`         | Keep - general utility         |
| `sanitization.service.ts` | Keep - security utility        |
| `error-queue.service.ts`  | Keep - error infrastructure    |

**Deliverable**: Documented list of services to keep/move

---

## Phase 3: Feature Self-Containment Audit (1 hour)

**Goal**: Verify each feature has complete self-contained structure

### Admin Feature Audit

| Sub-feature       | Has Models | Has Repository | Has Service | Has Components | Status       |
| ----------------- | ---------- | -------------- | ----------- | -------------- | ------------ |
| `users/`          | ✅         | ✅             | ✅          | ✅             | Complete     |
| `log-management/` | ✅         | ✅             | ✅          | ✅             | Complete     |
| `dashboard/`      | Partial    | -              | -           | ✅             | Needs review |
| `error-pages/`    | -          | -              | -           | ✅             | OK (UI only) |

### Game Feature Audit

| Sub-feature  | Has Models | Has Repository | Has Service | Has Components | Status      |
| ------------ | ---------- | -------------- | ----------- | -------------- | ----------- |
| `world-map/` | ?          | ?              | ?           | ✅             | Needs audit |

### Action Items

For each incomplete feature:

1. Identify if it needs models/repos/services
2. If yes, add them to the feature folder
3. If no (pure UI), document why

**Deliverable**: Audit report with action items per feature

---

## Phase 4: Rename Log Management to Logs (30 minutes)

**Goal**: Align `log-management/` naming with server's `Logging/` context

### Step 4.1: Rename Directory

```powershell
# Rename for consistency
Move-Item -Path "src/app/features/admin/log-management" -Destination "src/app/features/admin/logs"
```

### Step 4.2: Update Routes

**File**: `features/admin/admin.routes.ts`

Update import paths from `log-management` to `logs`.

### Step 4.3: Update All Imports

Find/replace: `@admin/log-management` → `@admin/logs`

### Step 4.4: Run Tests

```powershell
npm test
```

**Deliverable**: `log-management/` renamed to `logs/`, tests passing

---

## Phase 5: Add Missing Feature Structure (2-3 hours)

**Goal**: Ensure all features have standard bounded context structure

### Step 5.1: Game Feature Enhancement

If `world-map` needs data layer, add structure:

```
features/game/
├── game.routes.ts            # Game routing
├── world-map/
│   ├── components/           # UI components
│   ├── models/               # Game models if needed
│   │   └── world-map.model.ts
│   ├── services/             # Game logic if needed
│   │   └── world-map.service.ts
│   └── world-map.ts          # Main component
└── shared/                   # Game-wide shared (if multiple sub-features)
```

### Step 5.2: Physics Feature Enhancement

If `physics` needs structure:

```
features/physics/
├── models/
│   ├── physics-calculation.model.ts
│   └── index.ts
├── services/
│   └── physics.service.ts
└── physics.ts
```

### Step 5.3: RV Camper Feature Enhancement

Similar pattern for `rv-camper`.

**Deliverable**: All features have consistent structure

---

## Phase 5B: Feature Route Modularization (NEW)

**Goal**: Give every feature its own `feature.routes.ts` so features can be added/removed from `app.routes.ts` as complete bounded contexts.

### Rationale

Currently only `admin` has its own routes file. All other features are directly imported in `app.routes.ts`. This violates bounded context principles because:

1. Features should be self-contained modules
2. Features should be easy to enable/disable
3. Features should own their own routing configuration

### Target Pattern

Each feature should follow this pattern:

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

Then in `app.routes.ts`:

```typescript
{
	path: "game",
	loadChildren: () => import("./features/game/game.routes").then((m) => m.GAME_ROUTES),
	data: { breadcrumb: "Game" }
}
```

### Features to Update

| Feature      | Current State              | Action                       |
| ------------ | -------------------------- | ---------------------------- |
| `admin/`     | ✅ Has `admin.routes.ts`   | None                         |
| `game/`      | ❌ Direct component import | Create `game.routes.ts`      |
| `home/`      | ❌ Direct component import | Create `home.routes.ts`      |
| `physics/`   | ❌ Direct component import | Create `physics.routes.ts`   |
| `rv-camper/` | ❌ Direct component import | Create `rv-camper.routes.ts` |
| `developer/` | ❌ Direct component import | Create `developer.routes.ts` |

### Implementation Steps

#### Step 5B.1: Create `game.routes.ts`

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

#### Step 5B.2: Create `home.routes.ts`

```typescript
// features/home/home.routes.ts
import { Routes } from "@angular/router";

export const HOME_ROUTES: Routes = [
	{
		path: "",
		loadComponent: () => import("./home-page/home-page").then((m) => m.HomePage),
		title: "SeventySix - Home",
	},
];
```

#### Step 5B.3: Create `physics.routes.ts`

```typescript
// features/physics/physics.routes.ts
import { Routes } from "@angular/router";

export const PHYSICS_ROUTES: Routes = [
	{
		path: "",
		loadComponent: () => import("./physics/physics").then((m) => m.Physics),
		title: "Physics - Calculations",
	},
];
```

#### Step 5B.4: Create `rv-camper.routes.ts`

```typescript
// features/rv-camper/rv-camper.routes.ts
import { Routes } from "@angular/router";

export const RV_CAMPER_ROUTES: Routes = [
	{
		path: "",
		loadComponent: () => import("./rv-camper/rv-camper").then((m) => m.RVCamper),
		title: "RV Camper - Projects",
	},
];
```

#### Step 5B.5: Create `developer.routes.ts`

```typescript
// features/developer/developer.routes.ts
import { Routes } from "@angular/router";

export const DEVELOPER_ROUTES: Routes = [
	{
		path: "style-guide",
		loadComponent: () => import("./style-guide/style-guide.component").then((m) => m.StyleGuideComponent),
		title: "Style Guide",
	},
];
```

#### Step 5B.6: Update `app.routes.ts`

Update to use `loadChildren` for all features:

```typescript
export const routes: Routes = [
	{
		path: "",
		loadChildren: () => import("./features/home/home.routes").then((m) => m.HOME_ROUTES),
	},
	{
		path: "game",
		loadChildren: () => import("./features/game/game.routes").then((m) => m.GAME_ROUTES),
		data: { breadcrumb: "Game" },
	},
	{
		path: "physics",
		loadChildren: () => import("./features/physics/physics.routes").then((m) => m.PHYSICS_ROUTES),
		data: { breadcrumb: "Physics" },
	},
	{
		path: "rv-camper",
		loadChildren: () => import("./features/rv-camper/rv-camper.routes").then((m) => m.RV_CAMPER_ROUTES),
		data: { breadcrumb: "RV Camper" },
	},
	{
		path: "developer",
		loadChildren: () => import("./features/developer/developer.routes").then((m) => m.DEVELOPER_ROUTES),
		data: { breadcrumb: "Developer" },
	},
	{
		path: "admin",
		loadChildren: () => import("./features/admin/admin.routes").then((m) => m.ADMIN_ROUTES),
		data: { breadcrumb: "Admin" },
	},
	// Error routes remain
];
```

### Verification

```powershell
npm run build
npm test
```

**Deliverable**: All features have their own routes file, can be toggled on/off from app.routes.ts

---

## Phase 6: Documentation Update (30 minutes)

**Goal**: Update architecture documentation to reflect changes

### Step 6.1: Update Architecture Files

Update `.github/instructions/architecture-client.md`:

-   Replace `core/` references with `infrastructure/`
-   Document new feature structure standard
-   Update folder diagram

### Step 6.2: Update Quick Reference

Update `.github/instructions/quick-reference.md`:

-   Update project locations table
-   Add feature structure reference

**Deliverable**: Documentation reflects new structure

---

## Phase 7: Final Validation (1 hour)

### Step 7.1: Build Verification

```powershell
npm run build
```

### Step 7.2: Test Execution

```powershell
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

### Step 7.3: Feature Boundary Check

Verify no cross-feature imports exist:

```powershell
# Check for imports between features (should be none)
grep -r "from '@admin" src/app/features/game/
grep -r "from '@game" src/app/features/admin/
```

### Step 7.4: Lint Check

```powershell
npm run lint
```

**Deliverable**: Clean build, all tests passing, no cross-feature imports

---

## Success Criteria

### Structural Requirements

-   ✅ `core/` renamed to `infrastructure/`
-   ✅ All features follow bounded context structure
-   ✅ No feature imports from other features
-   ✅ Server naming alignment (Identity/Logging/etc.)

### Functional Requirements

-   ✅ All existing functionality preserved
-   ✅ All unit tests pass
-   ✅ All E2E tests pass
-   ✅ No build errors or warnings

### Code Quality

-   ✅ All imports updated and valid
-   ✅ No circular dependencies
-   ✅ TypeScript path aliases working
-   ✅ Lint rules pass

---

## Timeline Estimate

| Phase     | Task                           | Time          |
| --------- | ------------------------------ | ------------- |
| 1         | Infrastructure Rename          | 1-2 hours     |
| 2         | Audit Infrastructure Services  | 1 hour        |
| 3         | Feature Self-Containment Audit | 1 hour        |
| 4         | Rename Log Management          | 30 minutes    |
| 5         | Add Missing Feature Structure  | 2-3 hours     |
| 6         | Documentation Update           | 30 minutes    |
| 7         | Final Validation               | 1 hour        |
| **Total** |                                | **7-9 hours** |

---

## Risk Mitigation

### Risk 1: Import Path Breaks

**Mitigation**: Use TypeScript compilation to catch all broken imports before runtime.

### Risk 2: Circular Dependencies

**Mitigation**: Features should only import from `infrastructure/` and `shared/`, never from other features.

### Risk 3: Test Failures

**Mitigation**: Run tests after each phase, fix immediately (per CLAUDE.md rules).

---

## Rollback Plan

If migration fails at any phase:

1. Git revert to last working commit
2. Review failing phase
3. Create smaller sub-tasks
4. Retry with more granular steps

---

## Future Considerations (YAGNI - Don't Implement Now)

These are noted for future reference but should NOT be implemented as part of this migration:

-   Feature-level lazy loading boundaries
-   Feature-specific state management (NgRx/SignalStore)
-   Feature-specific API clients
-   Micro-frontend architecture
-   Feature flags per bounded context

---

## Conclusion

This plan restructures the Angular client to:

1. **Mirror server architecture** - Features align with bounded contexts
2. **Enforce boundaries** - Each feature is self-contained
3. **Improve maintainability** - Clear ownership of code
4. **Enable scaling** - Features can be extracted to micro-frontends later (YAGNI)

The migration is a **structural reorganization only** - no business logic changes, no feature additions, no refactoring of implementations.

---

**Next Steps**: Begin Phase 1 when ready.

