# Implementation Plan: Client Feature Directory Restructuring

> **Generated**: December 1, 2025
> **Scope**: Angular Client Feature Directory Pattern Standardization
> **Principles**: KISS, DRY, YAGNI, SOLID (SRP)
> **Approach**: TDD (Test-Driven Development) with 80/20 testing rule

---

## Executive Summary

This plan standardizes the Angular client feature directory structure by:

1. **Moving routed pages to their own named folders** at the feature base level
2. **Eliminating `subpages/` folders** - all pages are peers, not children
3. **Reserving `components/` for non-routed presentational components**
4. **Extracting repeated patterns** to `@shared/` (only when Rule of Three applies)
5. **Enforcing consistent naming conventions**

### Critical Guidelines Applied

| Guideline          | Application                                         |
| ------------------ | --------------------------------------------------- |
| **TDD**            | Write/update tests first, then refactor             |
| **80/20 Testing**  | Focus on critical paths, skip trivial tests         |
| **Logging**        | ⚠️ Only `warn` and `error` level - NO debug/info    |
| **Explicit Types** | `const x: Type = value` always                      |
| **OnPush**         | All components use `ChangeDetectionStrategy.OnPush` |
| **Zoneless**       | Use `provideZonelessChangeDetection()` in tests     |
| **inject()**       | Never constructor DI                                |
| **Signals**        | `input()`, `output()`, `computed()` over decorators |

---

## Current State Analysis

### Directory Structure Issues Identified

| Feature                             | Issue                                             | Impact                                                       |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| `admin/logs/`                       | Page files at root (`log-management.component.*`) | Inconsistent with folder-per-page pattern                    |
| `admin/users/`                      | Uses `subpages/` folder                           | Implies parent-child when pages are peers                    |
| `admin/users/subpages/user/`        | Page folder exists inside subpages                | Should be at `admin/users/user-detail/`                      |
| `admin/users/subpages/user-create/` | Same issue                                        | Should be at `admin/users/user-create/`                      |
| `admin/permission-requests/`        | Page files at root                                | Should be in `permission-requests-page/` folder              |
| `admin/admin-dashboard/`            | Uses `.component` suffix for page                 | Pages use no suffix (e.g., `admin-dashboard.ts`)             |
| `auth/register/`                    | Multiple pages in one folder                      | Should split into `register-email/` and `register-complete/` |
| `game/world-map/`                   | ✅ Correct pattern                                | Page in own folder                                           |
| `home/home-page/`                   | ✅ Correct pattern                                | Page in own folder                                           |
| `developer/style-guide/`            | Uses `.component` suffix                          | Pages use no suffix                                          |
| `physics/physics/`                  | ✅ Correct pattern                                | Page in own folder                                           |
| `rv-camper/rv-camper/`              | ✅ Correct pattern                                | Page in own folder                                           |
| `account/profile/`                  | ✅ Correct pattern                                | Uses `-page` suffix correctly                                |
| `account/permissions/`              | ✅ Correct pattern                                | Uses `-page` naming                                          |

### Repeated Code Patterns (DRY Opportunities)

> **YAGNI Check**: Only extract if pattern appears 3+ times (Rule of Three)

#### 1. Page Header Pattern (HIGH PRIORITY ✅)

Found in: `users.component.html`, `log-management.component.html`, `permission-requests.component.html` (3 occurrences - extract)

```html
<!-- Pattern repeating across pages -->
<div class="page-header">
	<div class="header-content">
		<div class="header-title">
			<mat-icon class="page-icon">{{ icon }}</mat-icon>
			<div>
				<h1 class="mat-headline-4">{{ title }}</h1>
				<p class="mat-body-2 subtitle">{{ subtitle }}</p>
			</div>
		</div>
		<div class="header-actions">
			<!-- Action buttons -->
		</div>
	</div>
</div>
```

**Action**: Extract to `@shared/components/page-header/` component.

#### 2. Loading State Container (SKIP - YAGNI ❌)

Found in: `user-page.html`, `user-create.html`, `permission-requests.component.html`

```html
<div class="loading-container">
	<mat-spinner></mat-spinner>
	<p class="mat-body-1">Loading...</p>
</div>
```

**Decision**: Already have `loading-state` mixin in `_mixins.scss`. Component extraction adds unnecessary abstraction. Use mixin for SCSS, inline template for HTML.

#### 3. Form Page Actions Pattern (SKIP - YAGNI ❌)

Found in: `user-page.html`, `user-create.html`, `profile-page.html`, `request-permissions.html`

```html
<header class="page-header">
	<h1>{{ pageTitle() }}</h1>
	<div class="page-actions">
		<button mat-stroked-button (click)="onCancel()">Cancel</button>
		<button mat-raised-button color="primary" (click)="onSubmit()">Save</button>
	</div>
</header>
```

**Decision**: Each form page has unique button labels, icons, and disabled logic. Extracting creates rigid abstraction. KEEP inline - KISS over DRY here.

#### 4. Error Card Display (SKIP - YAGNI ❌)

Found in: `permission-requests.component.html`, `user-page.html` (only 2 occurrences)

```html
@if (error()) {
<mat-card appearance="outlined" class="error-card">
	<mat-card-content>{{ error() }}</mat-card-content>
</mat-card>
}
```

**Decision**: Only 2 occurrences, doesn't meet Rule of Three. Keep inline.

#### 5. SCSS Page Container Pattern (ALREADY DRY ✅)

The `page-header()` mixin in `_mixins.scss` is already being used correctly.

---

## Testing Strategy (80/20 Rule)

### What to Test

| Component Type        | Test Coverage          | Rationale                           |
| --------------------- | ---------------------- | ----------------------------------- |
| **Pages**             | Renders without error  | Smoke test only - routing validates |
| **Shared Components** | Inputs bind correctly  | Reused widely, worth testing        |
| **Services**          | Business logic methods | Core functionality                  |
| **Repositories**      | Skip unit tests        | Covered by integration tests        |

### What NOT to Test

-   CSS/SCSS styling
-   Template structure (covered by compilation)
-   Third-party library behavior (Material components)
-   Route configuration (covered by e2e)

### Test Template for Refactored Pages

```typescript
describe("UserListPage", () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UserListPage],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClientTesting(),
				// Mock services at route level
				{ provide: UserService, useValue: mockUserService },
			],
		}).compileComponents();
	});

	it("should create", async () => {
		const fixture: ComponentFixture<UserListPage> = TestBed.createComponent(UserListPage);
		await fixture.whenStable();

		expect(fixture.componentInstance).toBeTruthy();
	});
});
```

> **Note**: One "should create" test per page is sufficient for refactoring validation. Existing functionality tests remain unchanged.

---

## Target Directory Structure

### Pattern Definition

```
features/
└── {feature-name}/
    ├── {feature-name}.routes.ts           # Feature routes
    ├── models/                             # Feature models/interfaces
    │   └── index.ts
    ├── repositories/                       # API repository layer
    │   └── index.ts
    ├── services/                           # Business logic services
    │   └── index.ts
    ├── components/                         # Non-routed presentational components
    │   ├── index.ts
    │   └── {component-name}/
    │       ├── {component-name}.ts
    │       ├── {component-name}.html
    │       ├── {component-name}.scss
    │       └── {component-name}.spec.ts
    └── {page-name}/                        # Each routed page in own folder
        ├── {page-name}.ts                  # No .component suffix for pages
        ├── {page-name}.html
        ├── {page-name}.scss
        └── {page-name}.spec.ts
```

### Naming Conventions

| Type            | Naming                               | Example                               |
| --------------- | ------------------------------------ | ------------------------------------- |
| Page Class      | `{Name}Page`                         | `UserDetailPage`, `LogManagementPage` |
| Page Files      | `{name}.ts` (no suffix)              | `user-detail.ts`, `log-management.ts` |
| Component Class | `{Name}Component` or `{Name}`        | `UserListComponent`, `LogList`        |
| Component Files | `{name}.ts` or `{name}.component.ts` | `user-list.ts`                        |
| Service         | `{Name}Service`                      | `UserService`                         |
| Repository      | `{Name}Repository`                   | `UserRepository`                      |

---

## Implementation Tasks

### Phase 1: Extract Shared Components (DRY First) ✅ COMPLETE

**Priority**: HIGH - Do this before restructuring to avoid repetitive work.

**Status**: ✅ Completed on December 1, 2025

#### Task 1.1: Create `PageHeader` Component

**Location**: `@shared/components/page-header/`

**TDD Approach**: Write test first, then implement.

**Test** (`page-header.spec.ts`):

```typescript
describe("PageHeaderComponent", () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [PageHeaderComponent],
			providers: [provideZonelessChangeDetection()],
		}).compileComponents();
	});

	it("should display title", async () => {
		const fixture: ComponentFixture<PageHeaderComponent> = TestBed.createComponent(PageHeaderComponent);
		fixture.componentRef.setInput("title", "Test Title");
		await fixture.whenStable();
		fixture.detectChanges();

		expect(fixture.nativeElement.textContent).toContain("Test Title");
	});

	it("should display icon when provided", async () => {
		const fixture: ComponentFixture<PageHeaderComponent> = TestBed.createComponent(PageHeaderComponent);
		fixture.componentRef.setInput("title", "Test");
		fixture.componentRef.setInput("icon", "people");
		await fixture.whenStable();
		fixture.detectChanges();

		const icon: HTMLElement | null = fixture.nativeElement.querySelector("mat-icon");
		expect(icon).toBeTruthy();
	});
});
```

**Implementation** (`page-header.ts`):

```typescript
import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

/**
 * Reusable page header with icon, title, subtitle, and action slot.
 * Used across admin pages for consistent layout.
 */
@Component({
	selector: "app-page-header",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [MatIconModule],
	templateUrl: "./page-header.html",
	styleUrl: "./page-header.scss",
})
export class PageHeaderComponent {
	readonly icon = input<string>();
	readonly title = input.required<string>();
	readonly subtitle = input<string>();
}
```

**Template** (`page-header.html`):

```html
<div class="page-header">
	<div class="header-content">
		<div class="header-title">
			@if (icon()) {
			<mat-icon class="page-icon">{{ icon() }}</mat-icon>
			}
			<div>
				<h1 class="mat-headline-4">{{ title() }}</h1>
				@if (subtitle()) {
				<p class="mat-body-2 subtitle">{{ subtitle() }}</p>
				}
			</div>
		</div>
		<div class="header-actions">
			<ng-content select="[actions]" />
		</div>
	</div>
</div>
```

**SCSS** (`page-header.scss`):

```scss
@use "mixins" as mixins;

:host {
	display: block;
}

@include mixins.page-header();
```

**Update `@shared/components/index.ts`**:

```typescript
export { PageHeaderComponent } from "./page-header/page-header";
```

> **80/20 Testing**: Two tests cover critical paths (title display, icon conditional). Skip edge case tests for subtitle - pattern is identical to icon.

---

#### Task 1.2: Create `FormPageHeader` Component (REMOVED - YAGNI)

~~**Location**: `@shared/components/form-page-header/`~~

**Decision**: Each form has unique requirements. Creating abstraction adds complexity without benefit. Skip per YAGNI.

---

### Phase 2: Restructure Admin Feature

#### Task 2.1: Restructure `admin/logs/` ✅ COMPLETE

**Status**: ✅ Completed on December 1, 2025

**Changes Made**:

-   Created `logs/log-management/` folder with refactored page files
-   Refactored to use `PageHeaderComponent`
-   Renamed class `LogManagementComponent` → `LogManagementPage`
-   Updated `admin.routes.ts`
-   Deleted old component files

---

#### Task 2.2: Restructure `admin/users/` ✅ COMPLETE

**Status**: ✅ Completed on December 1, 2025

**Changes Made**:

-   Created `users/user-list/` folder with `UserListPage` component using `PageHeaderComponent`
-   Moved `subpages/user/` → `users/user-detail/`, renamed class `UserPage` → `UserDetailPage`
-   Moved `subpages/user-create/` → `users/user-create/` (class name already correct)
-   Updated `admin.routes.ts` import paths for all three user routes
-   Deleted old `users.component.*` files and empty `subpages/` folder

**Final Structure**:

```
users/
├── user-list/
│   ├── user-list-page.ts
│   ├── user-list-page.html
│   ├── user-list-page.scss
│   └── user-list-page.spec.ts
├── user-detail/
│   ├── user-detail-page.ts
│   ├── user-detail-page.html
│   ├── user-detail-page.scss
│   └── user-detail-page.spec.ts
├── user-create/
│   ├── user-create.ts
│   ├── user-create.html
│   ├── user-create.scss
│   └── user-create.spec.ts
├── components/
│   └── user-list/
├── models/
├── repositories/
└── services/
```

---

#### Task 2.3: Restructure `admin/permission-requests/` ✅ COMPLETE

**Status**: ✅ Completed on December 1, 2025

**Changes Made**:

-   Created `permission-request-list/` folder with `PermissionRequestListPage` component
-   Refactored to use `PageHeaderComponent`
-   Updated `admin.routes.ts` import path
-   Deleted old `permission-requests.component.*` files

---

#### Task 2.4: Restructure `admin/admin-dashboard/` ✅ COMPLETE

**Status**: ✅ Completed on December 1, 2025

**Changes Made**:

-   Created `admin-dashboard-page/` folder with `AdminDashboardPage` component
-   Refactored to use `PageHeaderComponent`
-   Updated component imports to use relative paths (`../components/...`)
-   Updated `admin.routes.ts` import path
-   Added `ChangeDetectionStrategy.OnPush`

---

### Phase 3: Restructure Auth Feature ✅ COMPLETE

**Status**: ✅ Completed on December 1, 2025

#### Task 3.1: Split `auth/register/` into Separate Pages ✅ COMPLETE

**Status**: ✅ Completed - Created `register-email/` and `register-complete/` folders with properly named files.

#### Task 3.2: Rename Other Auth Pages ✅ COMPLETE

**Status**: ✅ Completed - All auth pages renamed:

-   `login/login.component.*` → `login/login.*`
-   `forgot-password/forgot-password.component.*` → `forgot-password/forgot-password.*`
-   `change-password/change-password.component.*` → `change-password/change-password.*`
-   `set-password/set-password.component.*` → `set-password/set-password.*`

---

### Phase 4: Restructure Developer Feature ✅ COMPLETE

**Status**: ✅ Completed on December 1, 2025

#### Task 4.1: Rename Style Guide Page ✅ COMPLETE

**Changes Made**:

-   Renamed `style-guide.component.*` → `style-guide.*`
-   Updated `developer.routes.ts` import path
-   Component already has `ChangeDetectionStrategy.OnPush`

---

### ~~Phase 5: Update Route Imports~~ (MERGED INTO PHASES 2-4)

Route imports were updated as part of each phase restructuring.

---

## Completed Summary

| Phase | Status      | Description                                                                                 |
| ----- | ----------- | ------------------------------------------------------------------------------------------- |
| 1     | ✅ Complete | PageHeaderComponent extracted to @shared/components                                         |
| 2     | ✅ Complete | Admin feature restructured (logs, users, permission-requests, admin-dashboard)              |
| 3     | ✅ Complete | Auth feature restructured (register, login, forgot-password, change-password, set-password) |
| 4     | ✅ Complete | Developer feature restructured (style-guide)                                                |
| 5     | ✅ Complete | Route imports updated (merged into phases 2-4)                                              |

---

## ~~Previous Task 3.1~~ (REMOVED - Duplicate of above)

**Current**:

```
admin-dashboard/
├── admin-dashboard.component.html
├── admin-dashboard.component.scss
├── admin-dashboard.component.spec.ts
├── admin-dashboard.component.ts
├── components/
│   ├── api-statistics-table/
│   └── grafana-dashboard-embed/
├── models/
├── repositories/
└── services/
```

**Target** (minimal change - just rename):

```
admin-dashboard/
├── admin-dashboard.ts             # No .component suffix
├── admin-dashboard.html
├── admin-dashboard.scss
├── admin-dashboard.spec.ts
├── components/
├── models/
├── repositories/
└── services/
```

**Note**: Since `admin-dashboard/` folder already exists and is named correctly, only rename files to drop `.component` suffix.

**Steps**:

1. Rename `admin-dashboard.component.*` → `admin-dashboard.*`
2. Rename class `AdminDashboardComponent` → `AdminDashboardPage`
3. Update `admin.routes.ts` import path

---

### Phase 3: Restructure Auth Feature

#### Task 3.1: Split `auth/register/` into Separate Pages

**Current**:

```
register/
├── register-complete.component.html
├── register-complete.component.scss
├── register-complete.component.ts
├── register-email.component.html
├── register-email.component.scss
└── register-email.component.ts
```

**Target**:

```
register-email/
├── register-email.ts
├── register-email.html
├── register-email.scss
└── register-email.spec.ts
register-complete/
├── register-complete.ts
├── register-complete.html
├── register-complete.scss
└── register-complete.spec.ts
```

**Steps**:

1. Create `auth/register-email/` folder
2. Create `auth/register-complete/` folder
3. Move and rename files accordingly
4. Delete empty `register/` folder
5. Update `auth.routes.ts` import paths

---

#### Task 3.2: Rename Other Auth Pages

**Current Files** → **Target Files**:

-   `login/login.component.ts` → `login/login.ts` (class: `LoginPage`)
-   `forgot-password/forgot-password.component.ts` → `forgot-password/forgot-password.ts` (class: `ForgotPasswordPage`)
-   `change-password/change-password.component.ts` → `change-password/change-password.ts` (class: `ChangePasswordPage`)
-   `set-password/set-password.component.ts` → `set-password/set-password.ts` (class: `=`)

---

### Phase 4: Restructure Developer Feature

#### Task 4.1: Rename Style Guide Page

**Current**:

```
style-guide/
├── style-guide.component.html
├── style-guide.component.scss
├── style-guide.component.spec.ts
└── style-guide.component.ts
```

**Target**:

```
style-guide/
├── style-guide.ts
├── style-guide.html
├── style-guide.scss
└── style-guide.spec.ts
```

**Steps**:

1. Rename files to drop `.component` suffix
2. Rename class `StyleGuideComponent` → `StyleGuidePage`
3. Update `developer.routes.ts` import path

---

### Phase 5: Update Route Imports

After all restructuring, update route files:

#### `admin.routes.ts` Updated Imports

```typescript
// Before
loadComponent: () => import("./logs/log-management.component").then((m) => m.LogManagementComponent);

// After (note: formatting follows .editorconfig)
loadComponent: () => import("./logs/log-management/log-management").then((m) => m.LogManagementPage);
```

**Full `admin.routes.ts` After Refactoring**:

```typescript
import { Routes } from "@angular/router";
import { LogManagementService } from "@admin/logs/services";
import { LogRepository } from "@admin/logs/repositories";
import { UserService, UserExportService, UserPreferencesService } from "@admin/users/services";
import { UserRepository } from "@admin/users/repositories";
import { ThirdPartyApiService, HealthApiService } from "@admin/admin-dashboard/services";
import { ThirdPartyApiRepository, HealthApiRepository } from "@admin/admin-dashboard/repositories";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequestRepository } from "@admin/permission-requests/repositories";

export const ADMIN_ROUTES: Routes = [
	{
		path: "",
		redirectTo: "dashboard",
		pathMatch: "full",
	},
	{
		path: "logs",
		providers: [LogManagementService, LogRepository],
		loadComponent: () => import("./logs/log-management/log-management").then((m) => m.LogManagementPage),
		title: "Log Management - SeventySix",
	},
	{
		path: "dashboard",
		providers: [ThirdPartyApiService, ThirdPartyApiRepository, HealthApiService, HealthApiRepository],
		loadComponent: () => import("./admin-dashboard/admin-dashboard").then((m) => m.AdminDashboardPage),
		title: "Admin Dashboard - SeventySix",
	},
	{
		path: "users",
		providers: [UserService, UserRepository, UserExportService, UserPreferencesService],
		children: [
			{
				path: "",
				loadComponent: () => import("./users/user-list/user-list-page").then((m) => m.UserListPage),
				title: "User Management - SeventySix",
			},
			{
				path: "create",
				loadComponent: () => import("./users/user-create/user-create").then((m) => m.UserCreatePage),
				title: "Create User - SeventySix",
			},
			{
				path: ":id",
				loadComponent: () => import("./users/user-detail/user-detail").then((m) => m.UserDetailPage),
				title: "User Details - SeventySix",
			},
		],
	},
	{
		path: "permission-requests",
		providers: [PermissionRequestService, PermissionRequestRepository],
		loadComponent: () => import("./permission-requests/permission-requests-list/permission-requests-list").then((m) => m.PermissionRequestsListPage),
		title: "Permission Requests - SeventySix",
	},
];
```

Full mapping:

| Route                 | Before                                                                                | After                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `logs`                | `./logs/log-management.component` → `LogManagementComponent`                          | `./logs/log-management/log-management` → `LogManagementPage`                                             |
| `dashboard`           | `./admin-dashboard/admin-dashboard.component` → `AdminDashboardComponent`             | `./admin-dashboard/admin-dashboard` → `AdminDashboardPage`                                               |
| `users`               | `./users/users.component` → `UsersComponent`                                          | `./users/user-list/user-list-page` → `UserListPage`                                                      |
| `users/create`        | `./users/subpages/user-create/user-create` → `UserCreatePage`                         | `./users/user-create/user-create` → `UserCreatePage`                                                     |
| `users/:id`           | `./users/subpages/user/user-page` → `UserPage`                                        | `./users/user-detail/user-detail` → `UserDetailPage`                                                     |
| `permission-requests` | `./permission-requests/permission-requests.component` → `PermissionRequestsComponent` | `./permission-requests/permission-requests-list/permission-requests-list` → `PermissionRequestsListPage` |

---

## ~~Phase 6: Update Path Aliases~~ (REMOVED - YAGNI)

Current path aliases are sufficient for the new structure. No changes needed.

---

## Validation Checklist

### After Each Task (TDD Cycle)

1. [ ] **RED**: Verify existing tests pass before refactoring
2. [ ] **REFACTOR**: Move/rename files
3. [ ] **GREEN**: Run `npm test` - all tests pass
4. [ ] Run `npm run build` - no TypeScript errors
5. [ ] Run `npm run lint` - no ESLint errors
6. [ ] Manual: Navigate to restructured route

### Testing Guidelines (80/20 Rule)

| Test Type           | Priority | When to Write                         |
| ------------------- | -------- | ------------------------------------- |
| Component renders   | HIGH     | Always                                |
| Input binding works | HIGH     | For required inputs                   |
| User interaction    | MEDIUM   | For critical actions (submit, delete) |
| Edge cases          | LOW      | Skip unless business-critical         |
| Styling/CSS         | SKIP     | Never test styles                     |

### Logging Audit

⚠️ **During restructuring, audit all files for logging violations**:

```typescript
// ❌ FORBIDDEN - Remove these
this.logger.debug("...");
this.logger.info("...");
console.log("...");
console.debug("...");

// ✅ ALLOWED - Keep these
this.logger.warn("...");
this.logger.error("...");
console.warn("...");
console.error("...");
```

---

## Risk Mitigation

| Risk                      | Mitigation                                         |
| ------------------------- | -------------------------------------------------- |
| Breaking imports          | Use IDE refactoring tools (F2 rename in VS Code)   |
| Missing files             | `git status` check before each commit              |
| Broken tests              | Run `npm test` after each task                     |
| Route 404s                | Test each route after updating `*.routes.ts`       |
| Debug logging left behind | Grep for `debug\|info\|console\.log` before commit |

---

## Code Quality Checks

### Before Each Commit

```powershell
# Run all quality checks
npm run build; npm run lint; npm test

# Audit for forbidden logging
Select-String -Path "src/**/*.ts" -Pattern "(\.debug\(|\.info\(|console\.log)" -Recurse
```

### Naming Convention Enforcement

| ❌ Avoid                            | ✅ Use                                            |
| ----------------------------------- | ------------------------------------------------- |
| `const x = value`                   | `const x: Type = value`                           |
| `@Input()`                          | `input<Type>()` or `input.required<Type>()`       |
| `@Output()`                         | `output<Type>()`                                  |
| `constructor(private svc: Service)` | `private readonly svc: Service = inject(Service)` |
| `*ngIf`, `*ngFor`                   | `@if`, `@for`                                     |

---

## Implementation Order

> **TDD Workflow**: For each task: Run tests → Refactor → Run tests → Commit

1. **Phase 1** (Task 1.1): Create `PageHeaderComponent` - write test first, then implement
2. **Phase 2** (Tasks 2.1-2.4): Restructure Admin - update tests, then move files
3. **Phase 3** (Tasks 3.1-3.2): Restructure Auth
4. **Phase 4** (Task 4.1): Restructure Developer
5. **Phase 5**: Update all route imports
6. ~~**Phase 6**: Review path aliases~~ (REMOVED - YAGNI, current aliases sufficient)

---

## Files to Modify Summary

### New Files to Create

```
src/app/shared/components/page-header/
├── page-header.ts
├── page-header.html
├── page-header.scss
└── page-header.spec.ts      # TDD: Write this FIRST
```

### Files to Move/Rename

| Current Path                                                | New Path                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `admin/logs/log-management.component.*`                     | `admin/logs/log-management/log-management.*`                                    |
| `admin/users/users.component.*`                             | `admin/users/user-list/user-list-page.*`                                        |
| `admin/users/subpages/user/*`                               | `admin/users/user-detail/*`                                                     |
| `admin/users/subpages/user-create/*`                        | `admin/users/user-create/*`                                                     |
| `admin/users/components/user-list/*`                        | `admin/users/components/user-list-table/*`                                      |
| `admin/permission-requests/permission-requests.component.*` | `admin/permission-requests/permission-requests-list/permission-requests-list.*` |
| `admin/admin-dashboard/admin-dashboard.component.*`         | `admin/admin-dashboard/admin-dashboard.*`                                       |
| `auth/register/register-email.component.*`                  | `auth/register-email/register-email.*`                                          |
| `auth/register/register-complete.component.*`               | `auth/register-complete/register-complete.*`                                    |
| `auth/login/login.component.*`                              | `auth/login/login.*`                                                            |
| `auth/forgot-password/forgot-password.component.*`          | `auth/forgot-password/forgot-password.*`                                        |
| `auth/change-password/change-password.component.*`          | `auth/change-password/change-password.*`                                        |
| `auth/set-password/set-password.component.*`                | `auth/set-password/set-password.*`                                              |
| `developer/style-guide/style-guide.component.*`             | `developer/style-guide/style-guide.*`                                           |

### Files to Update

-   `src/app/features/admin/admin.routes.ts`
-   `src/app/features/auth/auth.routes.ts`
-   `src/app/features/developer/developer.routes.ts`
-   `src/app/shared/components/index.ts`

### Folders to Delete

-   `admin/users/subpages/`
-   `auth/register/` (after contents moved)

---

## Estimated Effort

| Phase       | Tasks | Estimated Time       |
| ----------- | ----- | -------------------- |
| Phase 1     | 1     | 30 min               |
| Phase 2     | 4     | 2 hours              |
| Phase 3     | 2     | 1 hour               |
| Phase 4     | 1     | 15 min               |
| Phase 5     | 1     | 30 min               |
| ~~Phase 6~~ | ~~1~~ | ~~15 min~~ (REMOVED) |
| **Total**   | **9** | **~4.25 hours**      |

---

## Post-Implementation

After completion:

1. Run full test suite: `npm test`
2. Run lint: `npm run lint`
3. Audit for debug/info logging: Remove any found
4. Delete `Implementation.md` (the old one with uppercase I)
5. Manual smoke test: Navigate all restructured routes

---

## Code Smells to Watch For

During restructuring, look for and fix:

| Smell                             | Fix                                                   |
| --------------------------------- | ----------------------------------------------------- |
| `console.log()`                   | Remove or convert to `logger.error()`                 |
| `@Input()`/`@Output()` decorators | Convert to `input()`/`output()`                       |
| `*ngIf`/`*ngFor`                  | Convert to `@if`/`@for`                               |
| `constructor(private svc)`        | Convert to `inject()`                                 |
| `var x = value`                   | Add explicit type annotation                          |
| Missing `OnPush`                  | Add `changeDetection: ChangeDetectionStrategy.OnPush` |
| Method calls in templates         | Convert to `computed()` signals                       |

---

## Decision Log (YAGNI Tracker)

| Proposed                     | Decision   | Rationale                                     |
| ---------------------------- | ---------- | --------------------------------------------- |
| `FormPageHeader` component   | ❌ Skip    | Each form has unique buttons/logic            |
| `ErrorAlert` component       | ❌ Skip    | Only 2 occurrences (Rule of Three)            |
| `LoadingContainer` component | ❌ Skip    | Mixin exists, inline template is simpler      |
| Path alias updates           | ❌ Skip    | Current aliases sufficient                    |
| Extensive test coverage      | ❌ Minimal | 80/20 rule - smoke tests only for refactoring |
| Debug/Info logging           | ❌ Remove  | Only warn/error level allowed                 |

---

## Appendix: Formatting Reference

### EditorConfig Rules Applied

```
# TypeScript files
- Tabs for indentation (size 4)
- LF line endings
- Double quotes for strings
- Allman-style braces (opening on new line)
- Parameters wrapped on separate lines when 2+
- Binary operators on left of new line
- Method chains: new line BEFORE each dot
```

### Example: Properly Formatted Component

```typescript
import { Component, ChangeDetectionStrategy, inject, input, computed, Signal } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { UserService } from "@admin/users/services";
import { User } from "@admin/users/models";

/**
 * User detail page.
 * Displays and allows editing of a single user.
 */
@Component({
	selector: "app-user-detail",
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [MatIconModule],
	templateUrl: "./user-detail.html",
	styleUrl: "./user-detail.scss",
})
export class UserDetailPage {
	private readonly userService: UserService = inject(UserService);

	readonly userId = input.required<string>();

	readonly user: Signal<User | null> = computed(() => this.userService.getById(this.userId()));

	readonly isLoading: Signal<boolean> = computed(() => this.userService.isLoading());
}
```
