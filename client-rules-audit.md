# Client-Side Rules Audit & Violations

> **Generated**: 2025-11-27
> **Scope**: SeventySix.Client - Angular 20+ Zoneless Application

---

## Executive Summary

The Angular client codebase is **largely compliant** with the established rules. Key areas requiring attention:

-   ✅ **Zoneless Architecture**: Fully implemented - no Zone.js usage found
-   ✅ **OnPush Change Detection**: All components use OnPush
-   ✅ **Modern Angular APIs**: Using `input()`, `output()`, `computed()`, `@if`/`@for`
-   ✅ **Dependency Injection**: Using `inject()` function pattern
-   ✅ **No Legacy Directives**: No `*ngIf`, `*ngFor`, `@HostBinding`, `@HostListener`
-   ⚠️ **Type Declarations**: Some missing explicit types in test files
-   ⚠️ **SCSS REM Units**: Some `px` violations for min-height sizing
-   ✅ **Test Configuration**: Using `provideZonelessChangeDetection()` correctly

---

## Phase 1: Critical Violations (High Priority)

### 1.1 Missing Explicit Types in Test Files

**Rule Violated**: "ALWAYS use explicit types: `const name: string = "test";`"

**Files with violations** (using `const x = value` without type annotation):

| File                                        | Line     | Current                                        | Should Be                                         |
| ------------------------------------------- | -------- | ---------------------------------------------- | ------------------------------------------------- |
| `e2e/home-page.spec.ts`                     | Multiple | `const cards = page.locator(...)`              | `const cards: Locator = page.locator(...)`        |
| `e2e/admin-dashboard.spec.ts`               | Multiple | `const tabs = page.locator(...)`               | `const tabs: Locator = page.locator(...)`         |
| `infrastructure/utils/query-config.spec.ts` | Multiple | `const config = getQueryConfig(...)`           | `const config: QueryConfig = getQueryConfig(...)` |
| `app/app.spec.ts`                           | Multiple | `const fixture = TestBed.createComponent(...)` | `const fixture: ComponentFixture<App> = ...`      |
| Multiple `*.spec.ts` files                  | Various  | Missing type annotations                       | Add explicit types                                |

**Estimated Impact**: ~100+ occurrences across test files

**Fix Pattern**:

```typescript
// ❌ Current
const cards = page.locator(".feature-card");
const fixture = TestBed.createComponent(UserComponent);
const error = new Error("Test error");

// ✅ Fixed
const cards: Locator = page.locator(".feature-card");
const fixture: ComponentFixture<UserComponent> = TestBed.createComponent(UserComponent);
const error: Error = new Error("Test error");
```

---

### 1.2 SCSS PX Violations for Sizing

**Rule Violated**: "ALWAYS use `rem` for sizing. ONLY use `px` for border, radius, shadow, breakpoints"

**Files with `min-height: XXXpx` violations**:

| File                                                                                                       | Line | Current             | Should Be              |
| ---------------------------------------------------------------------------------------------------------- | ---- | ------------------- | ---------------------- |
| `features/admin/logs/components/log-detail-dialog/log-detail-dialog.component.scss`                        | 6    | `min-height: 400px` | `min-height: 25rem`    |
| `features/physics/physics/physics.scss`                                                                    | 9    | `min-height: 400px` | `min-height: 25rem`    |
| `features/admin/admin-dashboard/components/grafana-dashboard-embed/grafana-dashboard-embed.component.scss` | 41   | `min-height: 400px` | `min-height: 25rem`    |
| `features/admin/admin-dashboard/components/api-statistics-table/api-statistics-table.component.scss`       | 10   | `min-height: 300px` | `min-height: 18.75rem` |
| `features/admin/admin-dashboard/components/api-statistics-table/api-statistics-table.component.scss`       | 57   | `min-height: 200px` | `min-height: 12.5rem`  |

**Recommended**: Add SCSS variables for common min-heights:

```scss
// _variables.scss additions
$min-height-dialog: 25rem; // 400px
$min-height-card-lg: 18.75rem; // 300px
$min-height-card-md: 12.5rem; // 200px
```

---

## Phase 2: Code Quality Improvements (Medium Priority)

### 2.1 Test Files Missing Explicit Types

While test files have some flexibility, consistency matters. Pattern observed:

```typescript
// Common pattern needing attention
let emitted = false; // Should be: let emitted: boolean = false;
let callCount = 0; // Should be: let callCount: number = 0;
```

**Files**:

-   `infrastructure/services/error-handler.service.spec.ts` (line 386)
-   `features/admin/logs/components/log-table/log-table.component.spec.ts` (line 314)
-   `shared/components/breadcrumb/breadcrumb.component.spec.ts` (line 154)

---

### 2.2 DRY Opportunities in SCSS

**Pattern**: Multiple components have similar `min-height` patterns that could use a mixin or variable.

**Recommendation**: Add to `_variables.scss`:

```scss
// Standard min-heights for common patterns
$min-height-dialog: 25rem; // Dialogs, embedded content
$min-height-table: 18.75rem; // Data tables, lists
$min-height-card: 12.5rem; // Cards, compact views
```

---

## Phase 3: Documentation & Consistency (Low Priority)

### 3.1 Files Following All Rules ✅

These files demonstrate excellent compliance:

-   `features/admin/users/components/user-list/user-list.ts` - Full Signal pattern
-   `features/admin/logs/components/log-table/log-table.component.ts` - ProcessedLog pattern
-   `shared/components/data-table/data-table.component.ts` - Comprehensive computed signals
-   `infrastructure/services/notification.service.ts` - Proper signal state management
-   `shared/components/breadcrumb/breadcrumb.component.ts` - Proper computed breadcrumbs

### 3.2 Test Configuration Verified ✅

All test files properly use:

-   `provideZonelessChangeDetection()`
-   No `fakeAsync()`, `tick()`, `flush()` from Zone.js
-   `jasmine.clock()` is acceptable (different from Zone.js tick)

---

## Violations Summary

| Category                 | Count | Priority | Effort |
| ------------------------ | ----- | -------- | ------ |
| Missing Types in Tests   | ~100+ | High     | Medium |
| SCSS `px` for min-height | 5     | High     | Low    |
| Test `let` without types | 3     | Medium   | Low    |
| SCSS DRY opportunities   | 3     | Low      | Low    |

---

## Recommended Fix Order

1. **Batch 1** (1-2 hours): Fix SCSS `px` violations (5 files)
2. **Batch 2** (2-3 hours): Add types to E2E test files (2 files)
3. **Batch 3** (4-6 hours): Add types to unit test files (20+ files)
4. **Batch 4** (1 hour): Add SCSS variables for min-heights

---

## Files Requiring No Changes ✅

The following areas are fully compliant:

-   All components use `ChangeDetectionStrategy.OnPush`
-   All components use `inject()` for DI
-   All components use modern `input()`, `output()` APIs
-   All templates use `@if`, `@for` control flow
-   No `*ngIf`, `*ngFor`, `[ngClass]`, `[ngStyle]` found
-   No `@HostBinding`, `@HostListener` found
-   No Zone.js imports or usage
-   All subscriptions use `takeUntilDestroyed()`
-   Configuration in `environment.ts` files (no hardcoded URLs in services)
-   Path aliases properly used (`@infrastructure/`, `@admin/`, etc.)
