# SeventySix Client Architecture Improvement Plan

## Executive Summary

This implementation plan identifies architectural improvements, security concerns, performance optimizations, and code quality issues in the SeventySix Angular 21+ client codebase. The plan follows **KISS**, **DRY**, and **YAGNI** principles while adhering to the project's established coding guidelines, Domain-Driven Design patterns, and TDD practices (80/20 rule).

---

## Table of Contents

1. [Critical Security Issues](#1-critical-security-issues)
2. [Architectural Pattern Improvements](#2-architectural-pattern-improvements)
3. [TanStack Query Optimizations](#3-tanstack-query-optimizations)
4. [Memory Leak Prevention](#4-memory-leak-prevention)
5. [API Handling Standardization](#5-api-handling-standardization)
6. [Domain Infrastructure Cleanup](#6-domain-infrastructure-cleanup)
7. [Shared Infrastructure Improvements](#7-shared-infrastructure-improvements)
8. [Performance Optimizations](#8-performance-optimizations)
9. [Optimistic Updates Implementation](#9-optimistic-updates-implementation)
10. [Code Quality & DRY Violations](#10-code-quality--dry-violations)
11. [Testing Strategy](#11-testing-strategy)
12. [Implementation Priority Matrix](#12-implementation-priority-matrix)

---

## 1. Critical Security Issues

### 1.1 Session Storage for OAuth Return URL - HIGH PRIORITY

**Location:** [auth.service.ts#L247](SeventySix.Client/src/app/shared/services/auth.service.ts#L247)

**Issue:** Using `sessionStorage` directly for OAuth return URL creates XSS vulnerability vector.

**Current Code:**

```typescript
sessionStorage.setItem(STORAGE_KEYS.AUTH_RETURN_URL, returnUrl);
```

**Problem:**

- Direct sessionStorage usage bypasses the SSR-safe `StorageService`
- Return URL could be manipulated if XSS exists elsewhere
- Inconsistent with the pattern used elsewhere in the codebase

**Solution:**

1. Use `StorageService` consistently for all storage operations
2. Validate return URL against allowlist of domains
3. Use signed/encrypted storage tokens for sensitive redirects

**Implementation:**

```typescript
// auth.service.ts
loginWithProvider(
	provider: OAuthProvider,
	returnUrl: string = "/"): void
{
	// Validate returnUrl is relative or same-origin
	const validatedUrl: string =
		this.validateReturnUrl(returnUrl);
	this.storageService.setSessionItem(
		STORAGE_KEYS.AUTH_RETURN_URL,
		validatedUrl);
	window.location.href =
		`${this.authUrl}/${provider}`;
}

private validateReturnUrl(url: string): string
{
	// Only allow relative URLs or same-origin
	if (url.startsWith("/") && !url.startsWith("//"))
	{
		return url;
	}
	return "/";
}
```

**Testing (TDD - 80/20):**

- Test relative URL acceptance
- Test absolute URL rejection
- Test protocol-relative URL rejection (`//evil.com`)

---

### 1.2 SanitizationService Trust Methods - MEDIUM PRIORITY

**Location:** [sanitization.service.ts#L64-L95](SeventySix.Client/src/app/shared/services/sanitization.service.ts#L64-L95)

**Issue:** `trustHtml`, `trustUrl`, `trustResourceUrl` methods exist and only warn in dev mode.

**Current State:** Methods include dev-mode warnings, which is good, but:

- No audit trail in production
- No Content Security Policy (CSP) integration
- No centralized registry of trusted content

**Solution:**

1. Add telemetry tracking for trust method usage in production
2. Document approved usage patterns in code comments
3. Audit current usage and remove unused methods

**Implementation:**

```typescript
/**
 * Bypasses sanitization for trusted HTML.
 * Use with extreme caution - only for content you control.
 * @param {string} html
 * The trusted HTML to mark as safe.
 * @returns {SafeHtml}
 * Trusted HTML token suitable for binding.
 */
trustHtml(html: string): SafeHtml
{
	this.warnBypassUsage("trustHtml", html);
	this.trackBypassUsage("trustHtml"); // NEW: Production telemetry
	return this.sanitizer.bypassSecurityTrustHtml(html);
}

private trackBypassUsage(methodName: string): void
{
	// Track in production for security auditing
	if (!isDevMode())
	{
		this.telemetryService.trackEvent(
			"security.sanitization.bypass",
			{ method: methodName });
	}
}
```

**Action Items:**

1. Audit usage of `trustHtml/trustUrl/trustResourceUrl` across codebase
2. Add telemetry tracking to production builds
3. Document approved usage in JSDoc comments

---

### 1.3 Window/Document Direct Access - MEDIUM PRIORITY

**Location:** Multiple files

**Issue:** Inconsistent patterns for `window` object access.

**Current State:**

- `WindowUtilities` service exists but is minimal
- Some code uses `window.location` directly
- SSR compatibility concerns

**Solution:** Extend `WindowUtilities` to wrap all window operations.

**Implementation:**

```typescript
// shared/utilities/window.utilities.ts
@Injectable({
	providedIn: "root",
})
export class WindowUtilities {
	private readonly platformId: Object = inject(PLATFORM_ID);

	private readonly isBrowser: boolean = isPlatformBrowser(this.platformId);

	/**
	 * Reloads the current page using `window.location.reload()`.
	 * @returns {void}
	 */
	reload(): void {
		if (this.isBrowser) {
			window.location.reload();
		}
	}

	/**
	 * Navigates to a URL using `window.location.href`.
	 * @param {string} url
	 * The URL to navigate to.
	 * @returns {void}
	 */
	navigateTo(url: string): void {
		if (this.isBrowser) {
			window.location.href = url;
		}
	}

	/**
	 * Gets the current URL.
	 * @returns {string}
	 * The current window location href, or empty string if not in browser.
	 */
	getCurrentUrl(): string {
		if (this.isBrowser) {
			return window.location.href;
		}
		return "";
	}

	/**
	 * Gets the viewport inner height.
	 * @returns {number}
	 * The window inner height, or 0 if not in browser.
	 */
	getViewportHeight(): number {
		if (this.isBrowser) {
			return window.innerHeight;
		}
		return 0;
	}
}
```

**Testing (TDD - 80/20):**

- Test SSR-safe returns for non-browser environment
- Test actual window operations in browser environment

---

## 2. Architectural Pattern Improvements

### 2.1 Service Inheritance Hierarchy - HIGH PRIORITY

**Location:**

- [base-query.service.ts](SeventySix.Client/src/app/shared/services/base-query.service.ts)
- [base-mutation.service.ts](SeventySix.Client/src/app/shared/services/base-mutation.service.ts)
- [base-filter.service.ts](SeventySix.Client/src/app/shared/services/base-filter.service.ts)

**Issue:** Duplicate code between `BaseQueryService` and `BaseMutationService`.

**Current Hierarchy:**

```
BaseFilterService<TFilter>
    └── BaseQueryService<TFilter> (has createMutation + filter state)

BaseMutationService (has createMutation, no filter state)
```

**Problem:** The `createMutation` method is duplicated in both:

- `BaseQueryService.createMutation()` (lines 82-110)
- `BaseMutationService.createMutation()` (lines 93-124)

**Solution - Composition over Inheritance:**

```typescript
// Create a shared utility for mutation creation
// shared/utilities/mutation-factory.utility.ts
export function createMutationFactory<TInput, TResult>(queryClient: QueryClient, queryKeyPrefix: string, mutationFunction: (input: TInput) => Observable<TResult>, onSuccessCallback?: (result: TResult, variables: TInput) => void): CreateMutationResult<TResult, Error, TInput> {
	return injectMutation(() => ({
		mutationFn: (input: TInput) => lastValueFrom(mutationFunction(input)),
		onSuccess: (mutationResult: TResult, mutationVariables: TInput) => {
			if (onSuccessCallback) {
				onSuccessCallback(mutationResult, mutationVariables);
			} else {
				queryClient.invalidateQueries({
					queryKey: [queryKeyPrefix],
				});
			}
		},
	}));
}
```

**Testing:** Unit tests for mutation factory with various callback scenarios.

---

### 2.2 HealthApiService Missing Base Class Extension - MEDIUM PRIORITY

**Location:** [health-api.service.ts](SeventySix.Client/src/app/domains/admin/services/health-api.service.ts)

**Issue:** `HealthApiService` doesn't extend `BaseMutationService` despite having similar patterns.

**Current Code (Problem):**

```typescript
@Injectable()
export class HealthApiService {
	// ❌ PROBLEM: Manual DI that base services already provide
	private readonly apiService: ApiService = inject(ApiService);

	private readonly queryClient: QueryClient = inject(QueryClient);

	private readonly queryConfig: ReturnType<typeof getQueryConfig> = getQueryConfig(ADMIN_API_ENDPOINTS.HEALTH);
	// ...
}
```

**Problem:** Duplicates DI patterns that base services already provide.

**Solution:** Either:

1. Extend `BaseMutationService` if mutations are needed
2. Create lightweight `BaseReadOnlyService` for query-only services

```typescript
// shared/services/base-readonly.service.ts
export abstract class BaseReadOnlyService {
	protected readonly queryClient: QueryClient = inject(QueryClient);

	protected abstract readonly queryKeyPrefix: string;

	protected get queryConfig(): ReturnType<typeof getQueryConfig> {
		return getQueryConfig(this.queryKeyPrefix);
	}
}
```

---

### 2.3 Query Key Utility Type Safety - MEDIUM PRIORITY

**Location:** [query-keys.utility.ts](SeventySix.Client/src/app/shared/utilities/query-keys.utility.ts)

**Issue:** Manual query key construction is error-prone despite interfaces.

**Current State:** Well-structured but could leverage TypeScript's const assertions better.

**Improvement:** Add factory pattern for compile-time safety:

```typescript
// Ensure query key changes are caught at compile time
export const QueryKeys: QueryKeysType = {
	users: {
		all: ["users"] as const,
		paged: (queryFilter: BaseQueryRequest) => ["users", "paged", queryFilter] as const,
		single: (userId: number | string) => ["users", userId] as const,
	},
} as const satisfies QueryKeysType;
```

---

## 3. TanStack Query Optimizations

### 3.1 Query Configuration Centralization - HIGH PRIORITY

**Location:** [query-config.utility.ts](SeventySix.Client/src/app/shared/utilities/query-config.utility.ts)

**Current State:** Good centralized config, but improvement opportunities exist.

**Issue:** Resource-specific configs accessed via string keys without type safety.

**Current Code (Problem):**

```typescript
// ❌ PROBLEM: String key access without compile-time type safety
const resourceConfig: QueryOptions | undefined = config[resource as keyof typeof config] as QueryOptions | undefined;
```

**Solution:** Create strongly-typed resource config accessor:

```typescript
// environment.interface.ts additions
export type CacheResource = "users" | "logs" | "health" | "thirdpartyrequests" | "account" | "permissionrequests";

// query-config.utility.ts
export function getQueryConfig<TResource extends CacheResource>(resource: TResource): QueryOptions {
	const cacheConfig: typeof environment.cache.query = environment.cache.query;
	return cacheConfig[resource] ?? cacheConfig.default;
}
```

---

### 3.2 Force Refresh Pattern Improvement - MEDIUM PRIORITY

**Location:** [base-filter.service.ts#L35-L36](SeventySix.Client/src/app/shared/services/base-filter.service.ts#L35-L36)

**Issue:** Force refresh uses boolean toggle which can miss rapid refreshes.

**Current Code (Problem):**

```typescript
protected readonly forceRefreshTrigger: WritableSignal<boolean> =
	signal<boolean>(false);

forceRefresh(): void
{
	// ❌ PROBLEM: Boolean toggle can miss rapid refreshes
	this.forceRefreshTrigger.update(
		(value: boolean) => !value);
}
```

**Problem:** If called twice quickly, toggle returns to original state.

**Solution:** Use timestamp or counter instead:

```typescript
protected readonly forceRefreshTrigger: WritableSignal<number> =
	signal<number>(0);

forceRefresh(): void
{
	// ✅ SOLUTION: Counter always increments
	this.forceRefreshTrigger.update(
		(currentCount: number) => currentCount + 1);
}
```

````

---

### 3.3 Missing Query Deduplication for Same Resource - LOW PRIORITY

**Location:** Various service files

**Issue:** Multiple components calling same query create separate instances.

**Current Behavior:** TanStack Query handles this, but Angular's DI with route-level providers can cause duplicates.

**Solution:** Ensure query keys are truly identical when sharing data across components.

---

## 4. Memory Leak Prevention

### 4.1 Selection Manager Subscription - HIGH PRIORITY

**Location:** [selection.manager.ts](SeventySix.Client/src/app/shared/components/data-table/managers/selection.manager.ts)

**Issue:** `SelectionModel.changed` subscription never unsubscribed.

**Current Code (Problem):**

```typescript
constructor()
{
	this.selection =
		new SelectionModel<T>(true, []);

	// ❌ PROBLEM: Subscription never unsubscribed - memory leak!
	this.selection.changed.subscribe(
		() =>
		{
			this.selectionState.set(
				this.selection.selected as readonly T[]);
		});
}
````

**Problem:** Memory leak when DataTableComponent is destroyed.

**Solution:** Convert to injectable service with `DestroyRef` support:

```typescript
// Option 1: Pass DestroyRef from parent component (recommended for managers)
import {
	DestroyRef,
	signal,
	WritableSignal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SelectionModel } from "@angular/cdk/collections";

export class DataTableSelectionManager<TRow extends { id: number; }>
{
	private readonly selection: SelectionModel<TRow>;
	private readonly selectionState: WritableSignal<readonly TRow[]> =
		signal<readonly TRow[]>([]);

	/**
	 * Initialize selection manager with destroy reference for cleanup.
	 * @param {DestroyRef} destroyRef
	 * Angular destroy reference from parent component.
	 */
	constructor(destroyRef: DestroyRef)
	{
		this.selection = new SelectionModel<TRow>(true, []);
		this.selection.changed
			.pipe(takeUntilDestroyed(destroyRef))
			.subscribe(
				() =>
				{
					this.selectionState.set(
						this.selection.selected as readonly TRow[]);
				});
	}

	// ... rest of implementation
}

// Usage in DataTableComponent
@Component({ ... })
export class DataTableComponent<TRow extends { id: number; }>
{
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	readonly selectionManager: DataTableSelectionManager<TRow> =
		new DataTableSelectionManager<TRow>(this.destroyRef);
}
```

**Testing (TDD - 80/20):**

- Test that subscription is cleaned up on destroy
- Test selection state updates correctly
- Test clear selection works

---

### 4.2 Effect Cleanup in Components - MEDIUM PRIORITY

**Location:** Multiple components using `effect()`

**Current Files:**

- [app.ts](SeventySix.Client/src/app/app.ts)
- [data-table.component.ts](SeventySix.Client/src/app/shared/components/data-table/data-table.component.ts)
- [theme.service.ts](SeventySix.Client/src/app/shared/services/theme.service.ts)

**Issue:** Effects in constructors without explicit cleanup options documented.

**Current State:** Angular 17+ handles effect cleanup automatically, but:

- No cleanup callbacks for DOM-manipulating effects
- Potential stale closures

**Solution:** Add explicit `onCleanup` where needed:

```typescript
// app.ts example
effect((onCleanup: EffectCleanupRegisterFn) => {
	const isExpanded: boolean = this.layoutService.sidebarExpanded();
	// Apply class...

	onCleanup(() => {
		// Remove class if effect re-runs
		this.renderer.removeClass(this.document.body, "sidebar-expanded");
	});
});
```

---

### 4.3 Timer/Interval Cleanup - LOW PRIORITY

**Location:** [notification.service.ts](SeventySix.Client/src/app/shared/services/notification.service.ts)

**Current State:** ✅ Well-implemented - uses `Map` to track timers and has proper cleanup.

**No action needed** - this is a reference implementation for other timer-based code.

---

## 5. API Handling Standardization

### 5.1 HTTP Context Token for Cache Control - MEDIUM PRIORITY

**Location:** [cache-bypass.interceptor.ts](SeventySix.Client/src/app/shared/interceptors/cache-bypass.interceptor.ts)

**Issue:** Cache bypass pattern using HTTP Context is good but could be more robust.

**Enhancement:** Add cache versioning support for stale-while-revalidate patterns:

```typescript
// New constant in http.constants.ts
export const CACHE_VERSION: HttpContextToken<string> = new HttpContextToken<string>(() => "");

// Usage in services
const httpContext: HttpContext = new HttpContext().set(FORCE_REFRESH, true).set(CACHE_VERSION, "v1.2.0");
```

---

### 5.2 Error Interceptor Response Handling - LOW PRIORITY

**Location:** [error.interceptor.ts](SeventySix.Client/src/app/shared/interceptors/error.interceptor.ts)

**Current State:** ✅ Good implementation with proper error conversion.

**Minor Enhancement:** Consider adding request retry for network errors:

```typescript
// Add to error.interceptor.ts
if (error.status === 0) {
	// Network error - could retry once
	logger.warning("Network error detected");
}
```

---

## 6. Domain Infrastructure Cleanup

### 6.1 Inconsistent Domain Service Patterns - MEDIUM PRIORITY

**Issue:** Domain services have varying inheritance patterns.

**Current State:**
| Service | Extends | Pattern |
|---------|---------|---------|
| `UserService` | `BaseQueryService` | Full pattern |
| `LogManagementService` | `BaseQueryService` | Full pattern |
| `AccountService` | `BaseMutationService` | Mutation-only |
| `PermissionRequestService` | `BaseMutationService` | Mutation-only |
| `HealthApiService` | None | Ad-hoc DI |

**Solution:** Establish clear rules:

1. Services with filters/pagination → `BaseQueryService`
2. Services with mutations only → `BaseMutationService`
3. Query-only services → `BaseReadOnlyService` (new)

---

### 6.2 Domain Model Location Consistency - MEDIUM PRIORITY

**Current Structure:** ✅ Generally good with `models/` folders per domain.

**Issue:** Some POCOs could benefit from stricter naming:

- All DTOs should end with `Dto`
- All requests should end with `Request`
- All responses should end with `Response`

**Files to audit:**

- `@admin/logs/models`
- `@admin/users/models`
- `@account/models`
- `@admin/permission-requests/models`

**Implementation Checklist:**

```typescript
// ✅ CORRECT naming patterns
UserDto; // Data transfer object
CreateUserRequest; // Input for create operation
UpdateUserRequest; // Input for update operation
UserQueryRequest; // Query parameters
PagedResultOfUserDto; // Paginated response wrapper
AuthResponse; // API response contract

// ❌ INCORRECT - needs renaming
UserModel; // Should be UserDto
CreateUser; // Should be CreateUserRequest
UserQuery; // Should be UserQueryRequest
```

---

## 7. Shared Infrastructure Improvements

### 7.1 Generated OpenAPI Types Usage - HIGH PRIORITY

**Location:** [generated-open-api.ts](SeventySix.Client/src/app/shared/generated-open-api/generated-open-api.ts)

**Issue:** Generated types exist but aren't consistently used across services.

**Current Problem:**

- Services define their own DTOs in `models/` folders
- Generated types from OpenAPI not leveraged
- Type drift risk between client and server

**Solution:**

1. Use generated types as source of truth
2. Create domain-specific type aliases:

```typescript
// admin/users/models/index.ts
import { components } from "@shared/generated-open-api/generated-open-api";

export type UserDto = components["schemas"]["UserDto"];

export type CreateUserRequest = components["schemas"]["CreateUserRequest"];

export type UpdateUserRequest = components["schemas"]["UpdateUserRequest"];

export type PagedResultOfUserDto = components["schemas"]["PagedResultOfUserDto"];
```

**Benefits:**

- Single source of truth from API
- Automatic type updates on regeneration
- Reduced maintenance burden

---

### 7.2 Barrel Export Optimization - LOW PRIORITY

**Location:** Various `index.ts` files

**Issue:** Some barrel exports re-export everything including internals.

**Solution:** Review and prune exports to only include public API.

---

### 7.3 StorageService Session Storage Support - MEDIUM PRIORITY

**Location:** [storage.service.ts](SeventySix.Client/src/app/shared/services/storage.service.ts)

**Issue:** Service only wraps `localStorage`, not `sessionStorage`.

**Solution:** Add session storage methods:

```typescript
/**
 * Get item from sessionStorage (SSR-safe).
 * @param {string} key
 * The storage key to retrieve.
 * @returns {T | null}
 * The parsed stored value as type T, or null if not present.
 */
getSessionItem<TValue = string>(key: string): TValue | null
{
	if (!this.isBrowser)
	{
		return null;
	}
	// Implementation similar to getItem
}

/**
 * Set item in sessionStorage (SSR-safe).
 * @param {string} key
 * The storage key.
 * @param {TValue} value
 * The value to store.
 * @returns {void}
 */
setSessionItem<TValue>(key: string, value: TValue): void
{
	if (!this.isBrowser)
	{
		return;
	}
	// Implementation
}

/**
 * Remove item from sessionStorage (SSR-safe).
 * @param {string} key
 * The storage key to remove.
 * @returns {void}
 */
removeSessionItem(key: string): void
{
	if (!this.isBrowser)
	{
		return;
	}
	sessionStorage.removeItem(key);
}
```

---

## 8. Performance Optimizations

### 8.1 Data Table Virtual Scroll Configuration - MEDIUM PRIORITY

**Location:** [data-table.component.ts](SeventySix.Client/src/app/shared/components/data-table/data-table.component.ts)

**Issue:** Virtual scroll item size is configurable but may not account for variable row heights.

**Current Code:**

```typescript
readonly virtualScrollItemSize: InputSignal<number> =
	input<number>(environment.ui.tables.virtualScrollItemSize);
```

**Enhancement:** Consider auto-calculation or measurement-based approach for complex rows.

---

### 8.2 Computed Signal Optimization - LOW PRIORITY

**Location:** Various components with multiple `computed()` calls

**Current State:** ✅ Generally good use of signals.

**Minor Improvement:** Ensure computed signals aren't recalculating unnecessarily by checking signal equality.

---

### 8.3 Selective Preloading Strategy Enhancement - LOW PRIORITY

**Location:** [selective-preloading.strategy.ts](SeventySix.Client/src/app/shared/services/selective-preloading.strategy.ts)

**Current State:** ✅ Properly implemented with `data.preload` flag.

**Enhancement:** Consider user-behavior-based preloading (hover intent).

---

## 9. Optimistic Updates Implementation

### 9.1 Optimistic Mutation Infrastructure - MEDIUM PRIORITY (Low Complexity Addition)

**Location:** [base-mutation.service.ts](SeventySix.Client/src/app/shared/services/base-mutation.service.ts)

**Current State:** ✅ `createOptimisticMutation` already exists and is well-implemented!

**Analysis:** The infrastructure is in place but appears underutilized.

**Action Items:**

1. Audit current mutation usage
2. Identify candidates for optimistic updates:
    - User status toggles (activate/deactivate)
    - Permission request approve/reject
    - Log deletion (immediate UI feedback)
3. Document pattern for team adoption

**Recommended Candidates for Optimistic Updates:**

| Operation                 | Complexity | User Impact | Recommendation |
| ------------------------- | ---------- | ----------- | -------------- |
| User activate/deactivate  | Low        | High        | Implement      |
| Permission approve/reject | Low        | High        | Implement      |
| Single log delete         | Low        | Medium      | Implement      |
| Bulk log delete           | Medium     | Medium      | Defer          |
| User role add/remove      | Medium     | Medium      | Defer          |

**Example Implementation (User Activate):**

```typescript
// user.service.ts
activateUserOptimistic(): CreateMutationResult<void, Error, number, UserDto[]>
{
	return this.createOptimisticMutation<number, void, UserDto[]>(
		(userId: number) =>
			this.apiService.post<void>(
				`${this.endpoint}/${userId}/activate`,
				{}),
		{
			onMutate: (userId: number): UserDto[] =>
			{
				// Snapshot current data
				const previousUsers: UserDto[] | undefined =
					this.queryClient.getQueryData(QueryKeys.users.all);

				// Optimistically update
				this.queryClient.setQueryData(
					QueryKeys.users.all,
					(existingUsers: UserDto[] | undefined) =>
						existingUsers?.map(
							(userItem: UserDto) =>
								userItem.id === userId
									? { ...userItem, isActive: true }
									: userItem));

				return previousUsers ?? [];
			},
			onError: (previousUsers: UserDto[]): void =>
			{
				// Rollback on error
				this.queryClient.setQueryData(
					QueryKeys.users.all,
					previousUsers);
			}
		});
}
```

---

## 10. Code Quality & DRY Violations

### 10.1 Duplicate Query Config Access Pattern - HIGH PRIORITY

**Locations:**

- [base-query.service.ts#L37-L42](SeventySix.Client/src/app/shared/services/base-query.service.ts#L37-L42)
- [base-mutation.service.ts#L73-L78](SeventySix.Client/src/app/shared/services/base-mutation.service.ts#L73-L78)
- [health-api.service.ts#L41-L44](SeventySix.Client/src/app/domains/admin/services/health-api.service.ts#L41-L44)

**Issue:** Same getter pattern repeated across services.

**Solution:** Create mixin or shared base:

```typescript
// shared/utilities/query-config.mixin.ts
export function withQueryConfig<TBase extends abstract new (...constructorArgs: unknown[]) => object>(Base: TBase, queryKeyPrefix: string): TBase {
	return class extends Base {
		get queryConfig(): ReturnType<typeof getQueryConfig> {
			return getQueryConfig(queryKeyPrefix);
		}
	};
}
```

---

### 10.2 DatePipe Provider Pattern - LOW PRIORITY

**Location:** [log-list.ts](SeventySix.Client/src/app/domains/admin/logs/components/log-list/log-list.ts)

**Issue:** `DatePipe` provided in component and injected.

**Current Code (Not Ideal):**

```typescript
@Component({
	// ...
	providers: [DatePipe],
})
export class LogList {
	// ⚠️ Not ideal: Pipe instantiation overhead
	private readonly datePipe: DatePipe = inject(DatePipe);
}
```

````

**Alternative:** Use `DateService` (already exists) or functional pipe:

```typescript
// Use existing DateService
private readonly dateService: DateService =
	inject(DateService);

// Or use formatDate function
import { formatDate } from "@angular/common";
formatter: (dateValue: unknown): string =>
	formatDate(
		dateValue as Date,
		"short",
		"en-US")
````

````

---

### 10.3 Consistent Error Message Pattern - MEDIUM PRIORITY

**Issue:** Error messages defined inline vs constants.

**Locations:**

- [log-list.ts](SeventySix.Client/src/app/domains/admin/logs/components/log-list/log-list.ts) - `"Failed to load logs"`
- Various other components

**Solution:** Create error message constants:

```typescript
// shared/constants/error-messages.constants.ts
export const ERROR_MESSAGES: Readonly<{
	LOAD_FAILED: (entityName: string) => string;
	SAVE_FAILED: (entityName: string) => string;
	DELETE_FAILED: (entityName: string) => string;
}> =
	{
		LOAD_FAILED: (entityName: string): string =>
			`Failed to load ${entityName}`,
		SAVE_FAILED: (entityName: string): string =>
			`Failed to save ${entityName}`,
		DELETE_FAILED: (entityName: string): string =>
			`Failed to delete ${entityName}`
	} as const;
````

---

## 11. Testing Strategy

### 11.1 Testing Priorities (80/20 Rule)

**Focus Areas (80% of value):**

1. Security-related code (auth interceptor, guards, sanitization)
2. Base services (BaseQueryService, BaseMutationService, BaseFilterService)
3. Critical business logic (mutation handlers, error handlers)
4. Data transformation utilities (http-params, query-keys, http-error)

**Defer/Minimize (20% of value):**

1. Simple display components
2. Straightforward CRUD operations
3. Third-party library wrappers

### 11.2 Test File Organization

**Current State:** ✅ Good - specs co-located with source files.

**Pattern to Follow:**

```
service.ts
service.spec.ts
service.test-helpers.ts  // Only if complex mocking needed
```

### 11.3 New Test Requirements

| Item                              | Test Type   | Priority |
| --------------------------------- | ----------- | -------- |
| Selection manager memory leak fix | Unit        | High     |
| OAuth return URL validation       | Unit        | High     |
| Optimistic mutation rollback      | Integration | Medium   |
| Force refresh counter pattern     | Unit        | Medium   |
| StorageService session methods    | Unit        | Low      |

---

## 12. Implementation Priority Matrix

### Phase 1: Critical Security & Memory Leaks (Week 1)

| ID  | Issue                               | Files                | Effort | Risk   |
| --- | ----------------------------------- | -------------------- | ------ | ------ |
| 1.1 | OAuth return URL validation         | auth.service.ts      | 2h     | High   |
| 4.1 | Selection manager subscription leak | selection.manager.ts | 2h     | High   |
| 2.1 | DRY violation in mutation services  | base-\*.service.ts   | 4h     | Medium |
| 1.3 | WindowUtilities SSR-safe extension  | window.utilities.ts  | 3h     | Medium |

### Phase 2: Architecture Improvements (Week 2)

| ID  | Issue                         | Files                  | Effort | Risk |
| --- | ----------------------------- | ---------------------- | ------ | ---- |
| 7.1 | Generated OpenAPI types usage | models/\*.ts           | 8h     | Low  |
| 2.2 | HealthApiService base class   | health-api.service.ts  | 2h     | Low  |
| 3.2 | Force refresh counter pattern | base-filter.service.ts | 1h     | Low  |
| 6.2 | Domain model naming audit     | @admin/\*/models       | 2h     | Low  |

### Phase 3: Optimistic Updates & Infrastructure (Week 3)

| ID  | Issue                                | Files                         | Effort | Risk |
| --- | ------------------------------------ | ----------------------------- | ------ | ---- |
| 9.1 | User activate/deactivate optimistic  | user.service.ts               | 3h     | Low  |
| 9.1 | Permission approve/reject optimistic | permission-request.service.ts | 3h     | Low  |
| 9.1 | Log delete optimistic                | log-management.service.ts     | 2h     | Low  |
| 7.3 | StorageService session support       | storage.service.ts            | 2h     | Low  |

### Phase 4: Code Quality & Cleanup (Week 4)

| ID   | Issue                         | Files                           | Effort | Risk |
| ---- | ----------------------------- | ------------------------------- | ------ | ---- |
| 10.1 | Query config mixin            | new utility file                | 2h     | Low  |
| 10.3 | Error message constants       | new constants file              | 1h     | Low  |
| 1.2  | SanitizationService telemetry | sanitization.service.ts         | 2h     | Low  |
| 4.2  | Effect cleanup audit          | app.ts, data-table.component.ts | 2h     | Low  |
| 5.1  | HTTP context cache versioning | http.constants.ts               | 1h     | Low  |
| 7.2  | Barrel export optimization    | index.ts files                  | 2h     | Low  |

### Total Estimated Effort

| Phase     | Effort  | Priority |
| --------- | ------- | -------- |
| Phase 1   | 11h     | Critical |
| Phase 2   | 13h     | High     |
| Phase 3   | 10h     | Medium   |
| Phase 4   | 10h     | Low      |
| **Total** | **44h** | -        |

---

## Appendix A: Code Review Checklist

For all changes implementing this plan:

### Variable Naming (CRITICAL)

- [ ] All variable names are 3+ characters and descriptive
- [ ] No single-letter variables (`x`, `u`, `t`, `m`, `i`)
- [ ] Lambda parameters are descriptive (`user => user.Id` not `x => x.Id`)
- [ ] Loop variables use `foreach` or descriptive names (`index` not `i`)

### Formatting (.editorconfig)

- [ ] Assignment `=` has value on new line, indented
- [ ] 2+ parameters each on new line, indented
- [ ] Lambda parameters on new line after `(`
- [ ] Closing `)` on same line as last param/arg
- [ ] Method chains have `.` on new line, indented
- [ ] Binary operators (`||`, `&&`) on LEFT of new line

### TypeScript/Angular

- [ ] Explicit type annotations (no implicit `any`)
- [ ] Proper JSDoc documentation on public methods
- [ ] Signals used for reactive state
- [ ] OnPush change detection for components
- [ ] `takeUntilDestroyed()` for all subscriptions
- [ ] No direct `window`/`document` access (use utilities)

### Testing (80/20 Rule)

- [ ] Unit tests for critical paths only
- [ ] Security code has comprehensive tests
- [ ] Base services have thorough tests
- [ ] Simple display components have minimal/no tests

### Architecture

- [ ] DRY - no duplicate patterns
- [ ] KISS - simplest solution that works
- [ ] Domain services extend appropriate base class
- [ ] No cross-domain imports (except `integrations/`)

---

## Appendix B: Files Modified Summary

### Shared Services (Phase 1-2)

- `auth.service.ts` - Validate OAuth return URLs, use WindowUtilities
- `base-query.service.ts` - Extract mutation factory, use shared utility
- `base-mutation.service.ts` - Extract mutation factory, use shared utility
- `base-filter.service.ts` - Counter-based force refresh
- `storage.service.ts` - Add session storage methods
- `sanitization.service.ts` - Add production telemetry tracking

### Shared Utilities (Phase 1-2)

- `window.utilities.ts` - Extend with SSR-safe methods
- `query-config.utility.ts` - Type-safe resource config
- `mutation-factory.utility.ts` - NEW: Shared mutation creation

### Shared Constants (Phase 4)

- `error-messages.constants.ts` - NEW: Centralized error messages
- `http.constants.ts` - Add CACHE_VERSION token

### Shared Components (Phase 1)

- `selection.manager.ts` - Fix memory leak with DestroyRef

### Domain Services (Phase 3)

- `user.service.ts` - Optimistic updates for activate/deactivate
- `log-management.service.ts` - Optimistic updates for delete
- `permission-request.service.ts` - Optimistic updates for approve/reject
- `health-api.service.ts` - Extend BaseReadOnlyService

### Domain Models (Phase 2)

- `@admin/users/models/index.ts` - Use generated OpenAPI types
- `@admin/logs/models/index.ts` - Use generated OpenAPI types
- `@admin/permission-requests/models/index.ts` - Use generated OpenAPI types
- `@account/models/index.ts` - Use generated OpenAPI types

### New Files Created

- `shared/services/base-readonly.service.ts` - Query-only base service
- `shared/utilities/mutation-factory.utility.ts` - Shared mutation creation
- `shared/constants/error-messages.constants.ts` - Error message constants

---

## Appendix C: Library Recommendations

Current stack is solid. No new libraries recommended - following YAGNI principle.

**Current Stack Review:**

- ✅ TanStack Query - Excellent choice for server state
- ✅ Angular Material - Consistent UI component library
- ✅ ngx-skeleton-loader - Good UX for loading states
- ✅ OpenTelemetry - Standard for observability

**Not Needed:**

- ❌ NgRx - TanStack Query handles server state adequately
- ❌ RxAngular - Zoneless detection already configured
- ❌ Custom caching library - TanStack Query sufficient

---

_Document Version: 1.2_
_Last Updated: January 21, 2026_
_Author: GitHub Copilot Architecture Review_
_Status: Ready for Implementation_
