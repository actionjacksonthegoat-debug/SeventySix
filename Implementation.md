# SeventySix Client Architecture v2.0

## The Problem Statement

### Current Pain Points

| Issue                             | Impact                                      |
| --------------------------------- | ------------------------------------------- |
| 30+ path aliases                  | Cognitive overload, "which alias do I use?" |
| No bounded context enforcement    | Game can import Admin, breaking isolation   |
| Domain services mixed with shared | Unclear ownership, testing complexity       |
| Testing utilities scattered       | Inconsistent test patterns                  |

### What We Want

1. **True bounded contexts**: Admin, Game, Commerce are isolated domains
2. **Clear ownership**: Domain services live IN their domain
3. **Explicit shared code**: Only truly shared code in `shared/`
4. **Enforceable boundaries**: Architecture tests that actually work
5. **Predictable patterns**: Any developer knows where code goes

---

## Part 1: How Do Large Enterprises Handle This?

### Amazon's Two-Pizza Teams

Amazon's service-oriented architecture treats each domain as a **self-contained unit**:

-   Each "domain" owns EVERYTHING domain-specific (services, repos, models, tests)
-   Shared code is extracted into explicit, versioned libraries
-   Teams own domains end-to-end
-   Communication between domains happens through well-defined APIs only

### Google's Monorepo (Bazel)

-   Each package is self-contained with strict dependency declarations
-   Build system enforces that Package A cannot import Package B unless declared
-   Shared libraries are explicit dependencies
-   Each package has its own `test/` directory

### Nx's Enterprise Pattern

```
libs/
├── shared/           # Truly shared (tag: scope:shared)
├── admin/            # Admin domain libs (tag: scope:admin)
├── game/             # Game domain libs (tag: scope:game)
└── commerce/         # Commerce domain libs (tag: scope:commerce)
```

**Key rule**: `scope:admin` can import `scope:shared` but NEVER `scope:game`.

### The Common Pattern

All three share a principle:

> **Each domain owns its own code. Shared code is ONLY what's genuinely shared.**

---

## Part 2: The Boundary Decision Framework

### The Core Question

When creating ANY code, ask:

| Question                             | Answer | Location          |
| ------------------------------------ | ------ | ----------------- |
| Is this used by 2+ domains?          | Yes    | `shared/`         |
| Is this used by exactly 1 domain?    | Yes    | That `domain/`    |
| Is this domain-specific test code?   | Yes    | `domain/testing/` |
| Is this generic test infrastructure? | Yes    | `shared/testing/` |

### Examples Applied

| Code                                | Used By          | Location           | Why                                    |
| ----------------------------------- | ---------------- | ------------------ | -------------------------------------- |
| `UserDto`                           | All domains      | `@shared/api`      | Generated from server, used everywhere |
| `DataTableComponent`                | All domains      | `@shared/ui`       | Generic UI component                   |
| `UserService` (manages Admin users) | Admin only       | `@admin/services`  | Domain-specific business logic         |
| `GameStateService`                  | Game only        | `@game/services`   | Domain-specific state                  |
| `GameStateService`                  | Game + Commerce  | `@shared/services` | Cross-domain = shared                  |
| `AuthService`                       | All domains      | `@shared/auth`     | Authentication is app-wide             |
| `UserQueryModel` (Admin filter)     | Admin only       | `@admin/models`    | Admin-specific client model            |
| `createMockUserService()`           | Admin tests only | `@admin/testing`   | Domain-specific test utility           |
| `TestBedHelper`, `RouterMock`       | All tests        | `@shared/testing`  | Generic test infrastructure            |

### The "Shared State" Clarification

**Q: Is it a violation for `shared/` to hold `GameStateService` if multiple domains use it?**

**A: No.** If Game AND Commerce both need game state (e.g., Commerce shows in-game discounts based on player level), then `GameStateService` is genuinely shared. The rule is:

> **If 2+ domains need it → it's shared. Period.**

The name "GameStateService" is misleading in this case - it should perhaps be `PlayerContextService` in shared. But the location follows usage, not naming.

---

## Part 3: The Architecture

### 3.1 Folder Structure

```
src/app/
├── shared/                         # @shared/* - Truly shared code ONLY
│   ├── api/                        # @shared/api - Generated DTOs + API client
│   │   ├── generated/              # Auto-generated from OpenAPI (NEVER import directly)
│   │   │   └── api.generated.ts    # Raw output from code generator
│   │   ├── index.ts                # Re-exports ONLY shared DTOs
│   │   └── api.service.ts          # HTTP wrapper
│   │
│   ├── auth/                       # @shared/auth - Authentication
│   │   ├── auth.service.ts
│   │   ├── guards/
│   │   └── index.ts
│   │
│   ├── layout/                     # @shared/layout - App shell (header, sidebar, footer)
│   │   ├── header/
│   │   ├── sidebar/
│   │   ├── footer/
│   │   └── index.ts
│   │
│   ├── ui/                         # @shared/ui - Generic UI components
│   │   ├── data-table/
│   │   ├── loading-spinner/
│   │   ├── confirm-dialog/
│   │   └── index.ts
│   │
│   ├── services/                   # @shared/services - App-wide singletons
│   │   ├── date.service.ts
│   │   ├── logger.service.ts
│   │   ├── notification.service.ts
│   │   └── index.ts
│   │
│   ├── util/                       # @shared/util - Pure functions
│   │   ├── date.utils.ts
│   │   ├── string.utils.ts
│   │   └── index.ts
│   │
│   ├── models/                     # @shared/models - Shared client models
│   │   ├── base-query.model.ts
│   │   ├── table-column.model.ts
│   │   └── index.ts
│   │
│   └── testing/                    # @shared/testing - Generic test infra
│       ├── setup/                  # TestBed configuration
│       ├── mocks/                  # Generic mocks (HttpClient, Router)
│       ├── helpers/                # Test assertion helpers
│       ├── fixtures/               # Base fixture classes for extension
│       │   └── base.fixtures.ts    # UserFixtureBase, etc.
│       └── index.ts
│
└── domains/                        # Domain bounded contexts
    │
    ├── admin/                      # @admin/* - Admin bounded context
    │   ├── api/                    # @admin/api - Admin-only DTOs
    │   │   └── index.ts            # Re-exports from shared/api/generated
    │   │
    │   ├── services/               # @admin/services - Admin services
    │   │   ├── user.service.ts
    │   │   ├── permission.service.ts
    │   │   └── index.ts
    │   │
    │   ├── models/                 # @admin/models - Admin client models
    │   │   ├── user-query.model.ts
    │   │   ├── log-filter.model.ts
    │   │   └── index.ts
    │   │
    │   ├── testing/                # @admin/testing - Admin test utilities
    │   │   ├── fixtures/
    │   │   │   └── user.fixtures.ts    # Extends UserFixtureBase
    │   │   ├── mocks/
    │   │   │   └── user.service.mock.ts
    │   │   └── index.ts
    │   │
    │   ├── users/                  # Feature: User management
    │   ├── logs/                   # Feature: Log viewer
    │   ├── permissions/            # Feature: Permission management
    │   └── admin.routes.ts
    │
    ├── game/                       # @game/* - Game bounded context
    │   ├── api/                    # @game/api - Game-only DTOs
    │   │   └── index.ts            # Re-exports GameStateDto, LobbyDto, etc.
    │   │
    │   ├── core/                   # @game/core - Persistent game services
    │   │   ├── game-state.service.ts   # providedIn: 'root' (persistent!)
    │   │   ├── websocket.service.ts    # providedIn: 'root' (persistent!)
    │   │   └── index.ts
    │   │
    │   ├── services/               # @game/services - Route-scoped services
    │   │   ├── lobby.service.ts
    │   │   ├── combat.service.ts
    │   │   └── index.ts
    │   │
    │   ├── models/
    │   ├── testing/
    │   ├── lobby/
    │   ├── play/
    │   └── game.routes.ts
    │
    └── commerce/                   # @commerce/* - Commerce bounded context
        ├── api/
        ├── services/
        ├── models/
        ├── testing/
        ├── cart/
        ├── checkout/
        └── commerce.routes.ts
```

### 3.2 Path Aliases (4 Total)

```json
// tsconfig.json
{
	"compilerOptions": {
		"paths": {
			// Shared (used by all domains)
			"@shared/*": ["src/app/shared/*"],

			// Domain aliases (each domain imports ONLY itself + shared)
			"@admin/*": ["src/app/domains/admin/*"],
			"@game/*": ["src/app/domains/game/*"],
			"@commerce/*": ["src/app/domains/commerce/*"]
		}
	}
}
```

**Total: 4 aliases** (vs 30+ currently)

-   `@layout` merged into `@shared/layout` - it's shared UI, no special treatment needed

### 3.3 Import Rules Matrix

| From → To        | @shared/\* | @admin/\* | @game/\* | @commerce/\* |
| ---------------- | ---------- | --------- | -------- | ------------ |
| **@shared/\***   | ✅         | ❌        | ❌       | ❌           |
| **@admin/\***    | ✅         | ✅        | ❌       | ❌           |
| **@game/\***     | ✅         | ❌        | ✅       | ❌           |
| **@commerce/\*** | ✅         | ❌        | ❌       | ✅           |

**Key insight**: Each domain can import itself + shared. NEVER another domain.

---

## Part 4: The DTO/Model Strategy

### The Problem with Generated APIs

OpenAPI generates ALL DTOs into one file. But not all DTOs are used by all domains:

```typescript
// shared/api/generated/api.generated.ts (auto-generated, 500+ types)
export interface UserDto { ... }        // Used everywhere
export interface GameStateDto { ... }   // Game only
export interface CartDto { ... }        // Commerce only
export interface LobbyDto { ... }       // Game only
export interface CheckoutDto { ... }    // Commerce only
```

### The Solution: Domain API Re-exports

**Rule**: Never import from `shared/api/generated/` directly. Each domain re-exports what it needs.

```typescript
// shared/api/index.ts - ONLY truly shared DTOs
export type { UserDto, AuthTokenDto, ApiErrorDto } from "./generated/api.generated";

// domains/game/api/index.ts - Game-specific DTOs
export type { GameStateDto, LobbyDto, PlayerDto, CombatDto } from "@shared/api/generated/api.generated";

// domains/commerce/api/index.ts - Commerce-specific DTOs
export type { CartDto, CheckoutDto, OrderDto, ProductDto } from "@shared/api/generated/api.generated";
```

### Import Patterns

```typescript
// In Game domain code
import { GameStateDto, LobbyDto } from "@game/api"; // ✅ Domain-specific
import { UserDto } from "@shared/api"; // ✅ Shared

// In Commerce domain code
import { CartDto, CheckoutDto } from "@commerce/api"; // ✅ Domain-specific
import { UserDto } from "@shared/api"; // ✅ Shared

// NEVER do this
import { GameStateDto } from "@shared/api/generated/api.generated"; // ❌ Direct import
import { CartDto } from "@game/api"; // ❌ Cross-domain
```

### DTOs vs Models: The Distinction

| Type      | Definition                     | Location    | Mutability                   |
| --------- | ------------------------------ | ----------- | ---------------------------- |
| **DTO**   | Server-defined, auto-generated | `*/api/`    | Immutable (from server)      |
| **Model** | Client-defined, hand-written   | `*/models/` | Can be mutable, has behavior |

```typescript
// DTO - from server, immutable shape
// domains/game/api/index.ts
export type { GameStateDto } from "@shared/api/generated/api.generated";

// Model - client-specific, can have methods/computed
// domains/game/models/game-state.model.ts
export interface GameViewModel {
	state: GameStateDto; // Wraps the DTO
	isMyTurn: boolean; // Computed client-side
	canPerformAction: boolean; // Business logic
}
```

### Architecture Test for DTO Imports

```javascript
// scripts/architecture-tests.mjs
test("generated API should only be imported by api/index.ts files", async () => {
	const violations = [];
	const files = await getFiles(SRC_DIR, ".ts");

	for (const file of files) {
		// Skip the allowed re-export files
		if (file.endsWith("/api/index.ts")) continue;

		const content = await fs.readFile(file, "utf-8");

		if (content.includes("@shared/api/generated") || content.includes("shared/api/generated")) {
			violations.push(`${path.relative(SRC_DIR, file)} imports directly from generated API`);
		}
	}

	assertEmpty(violations, "Direct imports from generated API (use @domain/api or @shared/api instead)");
});
```

---

## Part 5: Cross-Domain Features

### The Inevitable Problem

At scale, you WILL have features that span domains:

| Feature                 | Domains Involved | Where does it live? |
| ----------------------- | ---------------- | ------------------- |
| In-game store           | Game + Commerce  | ?                   |
| Achievement rewards     | Game + Commerce  | ?                   |
| Player marketplace      | Game + Commerce  | ?                   |
| Admin player management | Admin + Game     | ?                   |

### The Enterprise Solution: Integration Layer

Large companies solve this with an **integration pattern**:

```
src/app/
├── shared/                      # Pure shared code (no domain knowledge)
├── domains/
│   ├── admin/
│   ├── game/
│   └── commerce/
│
└── integrations/                # Cross-domain integration points
    ├── game-commerce/           # @integration/game-commerce
    │   ├── in-game-store/       # Feature spanning both
    │   ├── achievement-rewards/
    │   └── index.ts
    │
    └── admin-game/              # @integration/admin-game
        └── player-management/
```

### Integration Rules

1. **Integrations can import from multiple domains** (the only exception)
2. **Domains NEVER import from integrations** (keeps domains pure)
3. **Integrations are thin orchestration layers** (no business logic)

```typescript
// integrations/game-commerce/in-game-store/store.service.ts
import { GameStateService } from "@game/core"; // ✅ Game domain
import { CartService } from "@commerce/services"; // ✅ Commerce domain
import { ProductDto } from "@commerce/api"; // ✅ Commerce types

@Injectable()
export class InGameStoreService {
	// Orchestrates between domains - no business logic
	async purchaseItem(itemId: string): Promise<void> {
		const gameState = this.gameState.current();
		const product = await this.cart.addItem(itemId, gameState.playerId);
		// ...
	}
}
```

### When NOT to Use Integrations

If a "cross-domain" need is really just shared data:

-   Player state needed by Commerce? → Move `PlayerContextService` to `@shared/services`
-   User info needed by Game? → Already in `@shared/api`

**Rule**: If it's data/state that multiple domains read → `shared/`
**Rule**: If it's a feature with UI/workflows spanning domains → `integrations/`

---

## Part 6: Sub-Domain Boundaries (Mega-Domains)

### The Problem at Scale

When Game grows to 50+ services and 200+ components:

```
domains/game/
├── services/        # 50 services crammed here?!
└── lobby/
    combat/
    inventory/
    quests/
    achievements/
    social/
    crafting/
    trading/
    ...
```

### How Large Companies Handle This

**Google/Amazon approach**: When a domain gets too big, it becomes multiple bounded contexts (microservices). In a monolith, this translates to **sub-domains**.

### Sub-Domain Structure

```
domains/game/
├── api/                     # Domain-wide DTOs
├── core/                    # Persistent services (providedIn: 'root')
├── models/                  # Domain-wide models
├── testing/                 # Domain-wide test utilities
│
├── _shared/                 # INTERNAL shared within game domain ONLY
│   ├── components/          # Shared within Game, not app-wide
│   └── services/            # Shared within Game sub-domains
│
├── lobby/                   # Sub-domain: Lobby
│   ├── services/            # Lobby-specific services
│   ├── components/
│   └── lobby.routes.ts
│
├── combat/                  # Sub-domain: Combat system
│   ├── services/
│   │   ├── combat.service.ts
│   │   ├── damage-calculator.service.ts
│   │   └── index.ts
│   ├── components/
│   │   └── health-bar/
│   └── combat.routes.ts
│
├── inventory/               # Sub-domain: Inventory management
│   ├── services/
│   ├── components/
│   └── inventory.routes.ts
│
└── game.routes.ts           # Aggregates sub-domain routes
```

### Sub-Domain Import Rules

| From → To       | @game/core | @game/\_shared | @game/combat | @game/inventory |
| --------------- | ---------- | -------------- | ------------ | --------------- |
| @game/core      | ✅         | ❌             | ❌           | ❌              |
| @game/\_shared  | ✅         | ✅             | ❌           | ❌              |
| @game/combat    | ✅         | ✅             | ✅           | ❌              |
| @game/inventory | ✅         | ✅             | ❌           | ✅              |

**Key rule**: Sub-domains can import `core/`, `_shared/`, and themselves. Never other sub-domains.

### Architecture Test for Sub-Domains

```javascript
test("game sub-domains should not import from other sub-domains", async () => {
	const gameSubDomains = ["lobby", "combat", "inventory", "quests", "social"];
	const violations = [];

	for (const subDomain of gameSubDomains) {
		const subPath = path.join(SRC_DIR, "domains/game", subDomain);
		if (!(await exists(subPath))) continue;

		const files = await getFiles(subPath, ".ts");

		for (const file of files) {
			const content = await fs.readFile(file, "utf-8");

			for (const otherSub of gameSubDomains) {
				if (otherSub === subDomain) continue;

				// Check for imports like "../combat/" or "@game/combat"
				const patterns = [new RegExp(`from\\s+["']\\.\\./${otherSub}/`, "g"), new RegExp(`from\\s+["']@game/${otherSub}/`, "g")];

				for (const pattern of patterns) {
					if (pattern.test(content)) {
						violations.push(`${file} imports from ${otherSub}`);
					}
				}
			}
		}
	}

	assertEmpty(violations, "Game sub-domain cross-imports");
});
```

---

## Part 7: Service Scoping Strategy

### The Three Service Types

| Type                  | Location           | Injectable Config    | Lifecycle      | Use Case                    |
| --------------------- | ------------------ | -------------------- | -------------- | --------------------------- |
| **App Singleton**     | `@shared/services` | `providedIn: 'root'` | App lifetime   | Logger, Auth, Notifications |
| **Domain Persistent** | `@game/core`       | `providedIn: 'root'` | App lifetime   | GameState, WebSocket        |
| **Domain Scoped**     | `@game/services`   | `@Injectable()`      | Route lifetime | LobbyService, CombatService |

### Why Allow `providedIn: 'root'` in Domains?

Games need persistent state that survives route navigation:

```typescript
// domains/game/core/game-state.service.ts
@Injectable({ providedIn: "root" }) // ✅ Persists across routes
export class GameStateService {
	private state = signal<GameState | null>(null);

	// WebSocket keeps connection alive
	// Player position survives navigation
	// Game progress is never lost
}

// domains/game/services/combat.service.ts
@Injectable() // ✅ Route-scoped, destroyed when leaving combat
export class CombatService {
	// Combat-specific logic
	// Cleaned up when player leaves combat
}
```

### The Rule

```
@shared/services/    → Always providedIn: 'root' (app-wide singletons)
@domain/core/        → providedIn: 'root' allowed (persistent domain state)
@domain/services/    → NEVER providedIn: 'root' (route-scoped)
```

---

## Part 8: Testing Strategy

### Shared Fixture Base Classes

```typescript
// shared/testing/fixtures/base.fixtures.ts
export abstract class BaseFixtures<T> {
	abstract valid(): T;
	abstract invalid(): Partial<T>;

	list(count: number = 3): T[] {
		return Array.from({ length: count }, () => this.valid());
	}
}

export abstract class UserFixtureBase extends BaseFixtures<UserDto> {
	valid(): UserDto {
		return {
			id: crypto.randomUUID(),
			username: "testuser",
			email: "test@example.com",
			createdAt: new Date().toISOString(),
		};
	}

	invalid(): Partial<UserDto> {
		return { username: "" }; // Missing required fields
	}
}
```

### Domain-Specific Extensions

```typescript
// domains/admin/testing/fixtures/user.fixtures.ts
import { UserFixtureBase } from "@shared/testing";

class AdminUserFixtures extends UserFixtureBase {
	// Admin-specific fixtures
	admin(): UserDto {
		return { ...this.valid(), role: "admin" };
	}

	banned(): UserDto {
		return { ...this.valid(), status: "banned" };
	}

	withPermissions(permissions: string[]): UserDto {
		return { ...this.valid(), permissions };
	}
}

export const UserFixtures = new AdminUserFixtures();
```

```typescript
// domains/game/testing/fixtures/user.fixtures.ts
import { UserFixtureBase } from "@shared/testing";

class GameUserFixtures extends UserFixtureBase {
	// Game-specific fixtures
	player(): UserDto {
		return { ...this.valid(), role: "player" };
	}

	inGame(): UserDto {
		return { ...this.valid(), status: "in-game", currentGameId: "game-123" };
	}

	withLevel(level: number): UserDto {
		return { ...this.valid(), level };
	}
}

export const UserFixtures = new GameUserFixtures();
```

### Import Pattern in Tests

```typescript
// domains/admin/users/user-list.spec.ts
import { provideTestSetup, MockHttpClient } from "@shared/testing";
import { UserFixtures } from "@admin/testing"; // Admin-specific

// domains/game/lobby/lobby.spec.ts
import { provideTestSetup, MockHttpClient } from "@shared/testing";
import { UserFixtures } from "@game/testing"; // Game-specific (same name, different impl)
```

---

## Part 9: Migration Coexistence Strategy

### The Dual-Import Period

During migration, both old and new paths must work:

```typescript
// tsconfig.json during migration
{
  "compilerOptions": {
    "paths": {
      // NEW paths (target)
      "@shared/*": ["src/app/shared/*"],
      "@admin/*": ["src/app/domains/admin/*"],
      "@game/*": ["src/app/domains/game/*"],
      "@commerce/*": ["src/app/domains/commerce/*"],

      // OLD paths (deprecated, still work)
      "@infrastructure/*": ["src/app/shared/*"],        // Maps to new location
      "@testing": ["src/app/shared/testing"],
      "@admin/users/models": ["src/app/shared/api"]     // DTO re-exports
    }
  }
}
```

### Migration Script with Deprecation Warnings

```javascript
// scripts/check-deprecated-imports.mjs
const DEPRECATED_IMPORTS = [
	{ pattern: /@infrastructure\//, replacement: "@shared/", deadline: "2025-02-01" },
	{ pattern: /@testing/, replacement: "@shared/testing", deadline: "2025-02-01" },
	{ pattern: /@admin\/.*\/models/, replacement: "@admin/api or @shared/api", deadline: "2025-02-01" },
];

test("warn on deprecated imports", async () => {
	const warnings = [];
	const files = await getFiles(SRC_DIR, ".ts");

	for (const file of files) {
		const content = await fs.readFile(file, "utf-8");

		for (const { pattern, replacement, deadline } of DEPRECATED_IMPORTS) {
			if (pattern.test(content)) {
				warnings.push(`${file}: Uses deprecated import. Replace with ${replacement}. Deadline: ${deadline}`);
			}
		}
	}

	if (warnings.length > 0) {
		console.warn("⚠️ DEPRECATED IMPORTS FOUND:");
		warnings.forEach((w) => console.warn(`  ${w}`));
		// Don't fail, just warn during coexistence period
	}
});
```

### Feature Branch Strategy

1. **Main branch**: Old imports still work via tsconfig aliases
2. **Migration PRs**: Update one domain at a time
3. **After deadline**: Remove deprecated aliases, CI fails on old imports

---

## Part 10: Architecture Tests (Complete Suite)

```javascript
// scripts/architecture-tests.mjs

const DOMAINS = ["admin", "game", "commerce"];
const GAME_SUBDOMAINS = ["lobby", "combat", "inventory", "quests", "social"];

// Test 1: Domains cannot import other domains
test("domains should not import from other domains", async () => {
	// ... (existing implementation)
});

// Test 2: Shared cannot import from domains
test("shared should not import from any domain", async () => {
	// ... (existing implementation)
});

// Test 3: Generated API only imported by index.ts files
test("generated API should only be imported by api/index.ts files", async () => {
	// ... (new implementation above)
});

// Test 4: Domain services (not core) should not be providedIn: root
test("domain route-scoped services should not use providedIn root", async () => {
	const violations = [];

	for (const domain of DOMAINS) {
		const servicesPath = path.join(SRC_DIR, "domains", domain, "services");
		if (!(await exists(servicesPath))) continue;

		const files = await getFiles(servicesPath, ".ts");

		for (const file of files) {
			if (file.endsWith(".spec.ts")) continue;
			const content = await fs.readFile(file, "utf-8");

			if (content.includes("providedIn: 'root'") || content.includes('providedIn: "root"')) {
				violations.push(`${file} uses providedIn: 'root' (move to domain/core/ if persistent)`);
			}
		}
	}

	assertEmpty(violations, "Route-scoped services with providedIn: root");
});

// Test 5: Game sub-domains should not import other sub-domains
test("game sub-domains should not import from other sub-domains", async () => {
	// ... (new implementation above)
});

// Test 6: Domain testing can only import from same domain or shared
test("domain testing imports should respect boundaries", async () => {
	// ... (existing implementation)
});

// Test 7: Integrations are the only cross-domain importers
test("only integrations can import from multiple domains", async () => {
	const violations = [];
	const files = await getFiles(path.join(SRC_DIR, "domains"), ".ts");

	for (const file of files) {
		const content = await fs.readFile(file, "utf-8");
		const domainImports = DOMAINS.filter((d) => new RegExp(`from\\s+["']@${d}/`).test(content));

		if (domainImports.length > 1) {
			violations.push(`${file} imports from multiple domains: ${domainImports.join(", ")}`);
		}
	}

	assertEmpty(violations, "Domain files importing from multiple domains (use integrations/)");
});
```

---

## Part 11: Comparison Summary

| Aspect                    | Current                       | v2.0                                  |
| ------------------------- | ----------------------------- | ------------------------------------- |
| **Path aliases**          | 30+                           | 4                                     |
| **Shared location**       | `infrastructure/` + `shared/` | Single `shared/`                      |
| **Layout**                | Separate alias                | Merged into `@shared/layout`          |
| **Domain services**       | Mixed in shared               | In `domain/services/` or `core/`      |
| **Domain DTOs**           | All in shared                 | Re-exported from `domain/api/`        |
| **Cross-domain features** | Not addressed                 | `integrations/` layer                 |
| **Sub-domain boundaries** | Not addressed                 | `_shared/` + architecture tests       |
| **Persistent services**   | All `providedIn: 'root'`      | Only in `shared/` or `domain/core/`   |
| **Test fixtures**         | Duplicated                    | Base classes + domain extensions      |
| **Migration**             | Big bang                      | Coexistence with deprecation warnings |

---

## Conclusion

This architecture follows enterprise patterns (Amazon, Google, Nx) while remaining practical:

1. **4 meaningful aliases**: `@shared/*`, `@admin/*`, `@game/*`, `@commerce/*`
2. **True bounded contexts**: Each domain owns services, models, DTOs, and testing
3. **Clear DTO strategy**: Generated → re-exported through `domain/api/`
4. **Cross-domain handled explicitly**: `integrations/` layer for orchestration
5. **Sub-domains scale**: Large domains use internal `_shared/` and sub-domain boundaries
6. **Persistent state allowed**: `domain/core/` for `providedIn: 'root'` services
7. **Testing scales**: Base fixtures in shared, domain-specific extensions
8. **Gradual migration**: Old imports work via aliases during transition

The key insight: **Shared code should be truly shared. Domain code should be truly domain-owned. Cross-domain orchestration goes in integrations.**
