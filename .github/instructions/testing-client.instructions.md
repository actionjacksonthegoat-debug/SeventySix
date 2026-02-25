---
description: Client-side testing rules and patterns for Vitest + Angular
applyTo: "**/SeventySix.Client/src/**/*.spec.ts"
---

# Client Testing Instructions

## Test Libraries (CRITICAL)

| Allowed         | Forbidden |
| --------------- | --------- |
| Vitest          | Jest      |
| Angular TestBed | Karma     |

## Setup Helpers (from `@testing`)

### Service Tests

```typescript
import { setupServiceTest, setupSimpleServiceTest } from "@testing/test-bed-builders";

// Service WITH TanStack Query dependency
const { service, queryClient } = setupServiceTest(UserService, [...withHttpTesting(), { provide: ApiService, useValue: createMockApiService() }]);

// Service WITHOUT TanStack Query
const service: ThemeService = setupSimpleServiceTest(ThemeService, [...withComponentDefaults()]);
```

### Component Tests

```typescript
import { ComponentTestBed } from "@testing/test-bed-builders";

const fixture: ComponentFixture<UserListComponent> = await new ComponentTestBed<UserListComponent>().withAdminDefaults().withMockService(UserService, ["getPagedUsers", "deleteUser"]).build(UserListComponent);
```

## Provider Helpers (Composable)

```typescript
import { withHttpTesting, withQueryTesting, withRouterTesting, withZonelessTesting, withComponentDefaults, withApiServiceDefaults, withAnimationsTesting, withServiceDefaults } from "@testing/provider-helpers";

// Compose providers for test scenario
TestBed.configureTestingModule({
	providers: [...withZonelessTesting(), ...withHttpTesting(), ...withQueryTesting(), MyService],
});
```

| Helper                     | Provides                                       |
| -------------------------- | ---------------------------------------------- |
| `withHttpTesting()`        | `provideHttpClient` + `HttpTestingController`  |
| `withQueryTesting()`       | `provideTanStackQuery` with test `QueryClient` |
| `withRouterTesting()`      | `provideRouter` with test routes               |
| `withZonelessTesting()`    | `provideZonelessChangeDetection`               |
| `withComponentDefaults()`  | Zoneless + animations                          |
| `withApiServiceDefaults()` | Zoneless + HTTP + TanStack Query               |
| `withServiceDefaults()`    | Standard service test providers                |

## Mock Factories (from `@testing/mock-factories`)

```typescript
import { createMockLogger, createMockNotificationService, createMockRouter, createMockApiService } from "@testing/mock-factories";

// [CORRECT] Use mock factories for dependencies
const mockRouter: Router = createMockRouter();
const mockApi: ApiService = createMockApiService();
```

## TanStack Query Test Utilities

```typescript
import { createTestQueryClient, flushMicrotasks } from "@testing/test-bed-builders";

// Create isolated query client for test
const queryClient: QueryClient = createTestQueryClient();

// Flush pending query operations
await flushMicrotasks();
```

## Zoneless Testing (CRITICAL)

> ALL client tests MUST use `provideZonelessChangeDetection()`. Never import `Zone.js` in tests.

```typescript
// [ALWAYS] — Zoneless
TestBed.configureTestingModule({
	providers: [
		provideZonelessChangeDetection(),
		// ... other providers
	],
});

// [NEVER] — Zone.js dependent
TestBed.configureTestingModule({
	// Missing zoneless provider
});
```

## 80/20 Test Priority

Focus coverage on the **20% of code that carries 80% of risk**:

1. Services with business logic, data transformations, or conditional branching
2. Guards and interceptors
3. Complex computed signals or derived state
4. Component behavior with user interactions

**Skip tests for:** Simple template bindings, pass-through services, DTOs, constants.

## Test Failure Rule (CRITICAL)

> **NEVER** attribute a failing test to "another change" to skip fixing it.
> ALL failing tests in `npm test` MUST be fixed before claiming completion — regardless of when or how they were introduced.

## Chrome DevTools Verification (REQUIRED)

After unit tests pass, verify in real browser via Chrome DevTools MCP — see `copilot-instructions.md` Chrome DevTools section.

