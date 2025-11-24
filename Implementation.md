# Implementation Plan: Generic Data Table Refactoring

## ✅ Phase 1 Complete: Base Filter Service

**Completion Date**: 2025-11-23

**Implemented**:

-   ✅ Created `BaseQueryRequest` interface in `core/models/base-query-request.model.ts`

    -   Common properties: `pageNumber`, `pageSize`, `searchTerm`, `startDate`, `endDate`, `sortBy`, `sortDescending`
    -   Fully documented with JSDoc comments
    -   Follows Allman brace style per .editorconfig

-   ✅ Created `BaseFilterService<TFilter>` in `core/services/base-filter.service.ts`

    -   Generic base class for filter state management
    -   Protected filter signal for subclass access
    -   Methods: `getCurrentFilter()`, `updateFilter()`, `setPage()`, `setPageSize()`, `abstract clearFilters()`
    -   100% test coverage (13 tests passing)
    -   Follows CLAUDE.md guidelines: explicit types, JSDoc, Allman braces

-   ✅ Updated `LogFilterRequest` to extend `BaseQueryRequest`

    -   Added `sourceContext` property for test compatibility
    -   Removed duplicate pagination/search/date properties (inherited from base)

-   ✅ Updated `UserQueryRequest` to extend `BaseQueryRequest`

    -   Changed `page` → `pageNumber` for consistency with server contract
    -   Added `sortBy`, `sortDescending` support
    -   Comment added for date range support using `startDate`/`endDate`

-   ✅ Fixed `PagedResult<T>` interface

    -   Changed `page` → `pageNumber` to match server response

-   ✅ Updated `UserRepository.getPaged()` to use new properties

    -   Uses `pageNumber`, `sortBy`, `sortDescending` from request

-   ✅ Updated test files for compatibility
    -   `user.service.spec.ts`: Updated to use `pageNumber`
    -   `user.repository.spec.ts`: Updated to use `pageNumber`

**Test Results**: ✅ All 13 tests passing with 100% coverage

**Next Phase**: Phase 2 - Update LogManagementService and UserService to extend BaseFilterService

---

## ULTRATHINK Analysis

### Current State Assessment

**Server Capabilities (✅ Ready)**:

-   ✅ Generic `BaseQueryRequest` with pagination, search, sorting, date ranges
-   ✅ Generic `PagedResult<T>` response with metadata
-   ✅ LogsController: Full support (`GetLogsAsync`, `GetCountAsync`, batch delete)
-   ✅ UsersController: Full support (`GetPagedAsync`, batch operations)
-   ✅ LogFilterRequest: Extends BaseQueryRequest with LogLevel
-   ✅ UserQueryRequest: Extends BaseQueryRequest with IsActive, IncludeDeleted

**Client Current State**:

-   ✅ DataTableComponent: Generic, reusable with powerful features
-   ⚠️ LogList: Server-side pagination via LogManagementService
-   ⚠️ UserList: Client-side filtering using getAllUsers (not getPaged)
-   ❌ UserList: Not using server-side search, date ranges, or counts
-   ❌ Inconsistent patterns between Log and User implementations

**Key Insight**: The server is fully ready. The client has generic infrastructure but inconsistent usage patterns.

### Core Problem

1. **UserList uses client-side filtering** (loads all users, filters in browser)
2. **LogList uses server-side filtering** (proper pagination/filtering)
3. **No shared abstraction** for managing filter state, pagination, and queries
4. **DataTableComponent is generic** but feature components duplicate filter/pagination logic

### Design Principle Analysis

**KISS**: Create ONE abstraction for filter state management
**DRY**: Share pagination, search, date range, and count logic
**YAGNI**: Don't over-engineer; use existing patterns (TanStack Query + Signals)

---

## Implementation Strategy

### Phase 1: Create Generic Filter State Management

**Goal**: Abstract filter/pagination state into reusable service base class

**Decision**: CREATE BaseFilterService - More DataTables coming

**Rationale**:

-   Multiple DataTables planned (Logs, Users, + more features)
-   Date range support needed for both Logs and Users
-   Consistent filter management pattern across all features
-   Type-safe with generics: `BaseFilterService<TFilter extends BaseQueryRequest>`
-   Reduces duplication across future features (DRY)

**New File**: `SeventySix.Client/src/app/core/services/base-filter.service.ts`

**Responsibilities**:

-   Manage filter state signal (search, date ranges, pagination)
-   Provide standard methods: `setPage()`, `setPageSize()`, `updateFilter()`, `clearFilters()`
-   No TanStack Query coupling (pure state management)
-   Feature services extend this base class

**Action**: Create BaseFilterService, then update LogManagementService and UserService to extend it

---

### Phase 2: Update User Service to Use Server-Side Pagination

**Goal**: Make UserList consistent with LogList pattern

**Changes to `UserService`**:

1. Add `filter` signal (type: `UserQueryRequest`)
2. Add `updateFilter()`, `setPage()`, `setPageSize()` methods
3. Change `getAllUsers()` to use `getPaged()` with filter signal
4. Keep existing mutations (create, update, delete, bulk operations)

**Changes to `UserList`**:

1. Use `usersQuery.data()?.data` (paged result) instead of `usersQuery.data()`
2. Wire up search → `userService.updateFilter({ searchTerm })`
3. Wire up date range → `userService.updateFilter({ startDate, endDate })`
4. Wire up pagination → `userService.setPage()`, `userService.setPageSize()`
5. Remove client-side filtering from DataTableComponent (let server handle it)

**Why**: Enables 10,000+ users without loading all into browser

---

### Phase 3: Standardize DataTableComponent Event Handlers

**Goal**: Ensure DataTableComponent outputs are consistently handled

**Current DataTableComponent Outputs**:

-   `searchChange` - search text (debounced)
-   `filterChange` - quick filter toggled
-   `dateRangeChange` - date range selected
-   `pageChange` - page index changed
-   `pageSizeChange` - page size changed
-   `refreshClick` - refresh button clicked
-   `rowAction` - row action triggered
-   `bulkAction` - bulk action triggered

**Standard Pattern (Both Log & User)** - Allman brace style per .editorconfig:

```typescript
onSearch(searchText: string): void
{
	this.service.updateFilter({ searchTerm: searchText || undefined });
}

onDateRangeChange(event: DateRangeEvent): void
{
	this.service.updateFilter({
		startDate: event.startDate,
		endDate: event.endDate
	});
}

onPageChange(pageIndex: number): void
{
	this.service.setPage(pageIndex + 1); // DataTable uses 0-based, server uses 1-based
}

onPageSizeChange(pageSize: number): void
{
	this.service.setPageSize(pageSize);
}

onRefresh(): void
{
	void this.query.refetch();
}
```

**Why**: Shared pattern = less cognitive load, easier maintenance

---

### Phase 4: Document Customization Points

**Goal**: Clarify what's generic vs. feature-specific

**Generic (Shared in DataTableComponent)**:

-   ✅ Search input
-   ✅ Date range filter
-   ✅ Pagination (page number, page size)
-   ✅ Refresh button
-   ✅ Column visibility toggle
-   ✅ Bulk selection
-   ✅ Virtual scrolling
-   ✅ Loading/error states

**Feature-Specific (Per Feature Component)**:

-   ⚠️ Column definitions (keys, labels, formatters)
-   ⚠️ Quick filters (status chips, log level chips)
-   ⚠️ Row actions (view, edit, delete)
-   ⚠️ Bulk actions (activate, deactivate, delete)
-   ⚠️ Filter transformation (quick filter → server filter)

**Example**: LogList quick filters ("All", "Warnings", "Errors") → map to LogLevel server filter

**Why**: Clear separation of concerns for future features

---

## Detailed Implementation Steps

### Step 1: Create BaseFilterService

**Decision**: Create generic base class for filter management

**Rationale**:

-   Multiple DataTables planned (more than just Logs and Users)
-   Consistent pattern needed across all features
-   Date range support required for both Logs and Users
-   Type-safe generics provide flexibility for feature-specific filters
-   Reduces future duplication (DRY principle)

**File**: `SeventySix.Client/src/app/core/services/base-filter.service.ts`

**Implementation**:

```typescript
import { signal, WritableSignal } from "@angular/core";
import { BaseQueryRequest } from "@core/models";

/**
 * Base class for filter state management
 * Provides common filter operations for paginated data tables
 * @template TFilter - Filter type extending BaseQueryRequest
 */
export abstract class BaseFilterService<TFilter extends BaseQueryRequest> {
	/**
	 * Filter state signal
	 * Subclasses can access and modify this signal
	 */
	protected readonly filter: WritableSignal<TFilter>;

	/**
	 * Initialize filter with default values
	 * @param initialFilter - Initial filter state
	 */
	protected constructor(initialFilter: TFilter) {
		this.filter = signal<TFilter>(initialFilter);
	}

	/**
	 * Get current filter value
	 * @returns Current filter state
	 */
	getCurrentFilter(): TFilter {
		return this.filter();
	}

	/**
	 * Update filter and reset to page 1
	 * @param filter - Partial filter to update
	 */
	updateFilter(filter: Partial<TFilter>): void {
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					...filter,
					pageNumber: 1, // Reset to page 1 on filter change
				} as TFilter)
		);
	}

	/**
	 * Set page number
	 * @param pageNumber - Page number to load (1-based)
	 */
	setPage(pageNumber: number): void {
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					pageNumber,
				} as TFilter)
		);
	}

	/**
	 * Set page size and reset to page 1
	 * @param pageSize - Number of items per page
	 */
	setPageSize(pageSize: number): void {
		this.filter.update(
			(current: TFilter) =>
				({
					...current,
					pageSize,
					pageNumber: 1,
				} as TFilter)
		);
	}

	/**
	 * Clear all filters and reset to defaults
	 * Subclasses should override to provide feature-specific defaults
	 */
	abstract clearFilters(): void;
}
```

**Why**: Provides consistent filter management for all feature services

---

### Step 2: Update LogManagementService to Extend BaseFilterService

**File**: `SeventySix.Client/src/app/features/admin/log-management/services/log-management.service.ts`

**Changes**:

1. Extend BaseFilterService:

```typescript
export class LogManagementService extends BaseFilterService<LogFilterRequest> {
	constructor() {
		super({
			pageNumber: 1,
			pageSize: 50,
		});
	}

	// ... existing code ...
}
```

2. Remove duplicate filter management methods (inherited from base)

3. Override `clearFilters()` for feature-specific defaults:

```typescript
clearFilters(): void
{
	this.filter.set({
		pageNumber: 1,
		pageSize: 50,
		logLevel: undefined,
		startDate: undefined,
		endDate: undefined,
		searchTerm: undefined
	});
	this.clearSelection();
}
```

**Why**: Reduces duplication, maintains existing functionality

---

### Step 3: Update UserService to Extend BaseFilterService

**File**: `SeventySix.Client/src/app/features/admin/users/services/user.service.ts`

**Changes**:

1. Extend BaseFilterService:

```typescript
export class UserService extends BaseFilterService<UserQueryRequest> {
	constructor() {
		super({
			pageNumber: 1,
			pageSize: 50,
		});
	}

	// ... existing code ...
}
```

2. Update `getAllUsers()` to use `getPaged()` with filter signal:

```typescript
getAllUsers();
{
	return injectQuery(() => ({
		queryKey: ["users", "paged", this.filter()],
		queryFn: () => lastValueFrom(this.userRepository.getPaged(this.filter())),
		...this.queryConfig,
	}));
}
```

3. Override `clearFilters()` for feature-specific defaults:

```typescript
clearFilters(): void
{
	this.filter.set({
		pageNumber: 1,
		pageSize: 50,
		isActive: undefined,
		includeDeleted: false,
		startDate: undefined,
		endDate: undefined,
		searchTerm: undefined
	});
}
```

4. Note: `updateFilter()`, `setPage()`, `setPageSize()` are inherited from BaseFilterService

**Why**: Consistent pattern with LogManagementService, inherits common filter methods

---

### Step 4: Update UserList Component

**File**: `SeventySix.Client/src/app/features/admin/users/components/user-list/user-list.ts`

**Changes**:

1. Update computed signals to use paged result:

```typescript
readonly data: Signal<User[]> = computed(
	() => this.usersQuery.data()?.items ?? []
);
readonly totalCount: Signal<number> = computed(
	() => this.usersQuery.data()?.totalCount ?? 0
);
readonly pageIndex: Signal<number> = computed(
	() => (this.usersQuery.data()?.page ?? 1) - 1 // Convert 1-based to 0-based
);
readonly pageSize: Signal<number> = computed(
	() => this.usersQuery.data()?.pageSize ?? 50
);
```

2. Wire up search event (Allman brace style per .editorconfig):

```typescript
onSearch(searchText: string): void
{
	this.userService.updateFilter({ searchTerm: searchText || undefined });
}
```

3. Wire up pagination events (Allman brace style per .editorconfig):

```typescript
onPageChange(pageIndex: number): void
{
	this.userService.setPage(pageIndex + 1); // Convert 0-based to 1-based
}

onPageSizeChange(pageSize: number): void
{
	this.userService.setPageSize(pageSize);
}
```

4. Update quick filter logic to use server-side filtering (explicit types per CLAUDE.md):

```typescript
onFilterChange(event: FilterChangeEvent): void
{
	// Map quick filter UI to server filter parameter
	const filterKey: string = event.active ? event.filterKey : "all";

	let isActive: boolean | undefined;
	switch (filterKey)
	{
		case "all":
			isActive = undefined; // Show all users
			break;
		case "active":
			isActive = true;
			break;
		case "inactive":
			isActive = false;
			break;
	}

	this.userService.updateFilter({ isActive });
}
```

5. Remove client-side filtering from DataTableComponent template:

```html
<!-- BEFORE: DataTableComponent handled filtering -->
<app-data-table [data]="data()" [quickFilters]="quickFilters" ... />

<!-- AFTER: Server handles filtering, DataTable just displays -->
<app-data-table [data]="data()" [totalCount]="totalCount()" [pageIndex]="pageIndex()" [pageSize]="pageSize()" [quickFilters]="quickFilters" (searchChange)="onSearch($event)" (pageChange)="onPageChange($event)" (pageSizeChange)="onPageSizeChange($event)" (filterChange)="onFilterChange($event)" ... />
```

**Why**: Consistent with LogList pattern, supports large datasets

---

### Step 5: Add Date Range Support for Users

**Decision**: Add date range filtering using LastLogin property

**Rationale**:

-   Users have LastLogin timestamp that can be filtered by date range
-   Matches server BaseQueryRequest (StartDate/EndDate)
-   Consistent with LogList date range functionality
-   Useful for finding inactive users, login activity analysis

**File**: `SeventySix.Client/src/app/features/admin/users/components/user-list/user-list.ts`

**Changes**:

1. Enable date range in template:

```html
<app-data-table [dateRangeEnabled]="true" (dateRangeChange)="onDateRangeChange($event)" ... />
```

2. Add date range change handler:

```typescript
onDateRangeChange(event: DateRangeEvent): void
{
	this.userService.updateFilter({
		startDate: event.startDate,
		endDate: event.endDate
	});
}
```

**Server Behavior**:

-   Filters users where `LastLoginAt >= StartDate AND LastLoginAt <= EndDate`
-   Supported by BaseQueryRequest in server
-   UserQueryRequest inherits StartDate/EndDate from BaseQueryRequest

**Why**: Enables finding users who haven't logged in recently, activity analysis

---

### Step 6: Verify LogList Consistency

**File**: `SeventySix.Client/src/app/features/admin/log-management/components/log-list/log-list.ts`

**Check**:

1. ✅ Uses `logsQuery.data()?.data` (paged result)
2. ✅ Uses `logService.updateFilter()` for search
3. ✅ Uses `logService.setPage()` / `setPageSize()` for pagination
4. ✅ Uses date range filtering
5. ✅ Maps quick filters to server LogLevel

**Action**: No changes needed - LogList is the reference implementation

---

### Step 7: Update DataTableComponent Documentation

**File**: `SeventySix.Client/src/app/shared/components/data-table/data-table.component.ts`

**Add JSDoc**:

```typescript
/**
 * Generic data table component
 *
 * RESPONSIBILITIES:
 * - Display paginated data with virtual scrolling
 * - Emit events for user interactions (search, filter, pagination)
 * - Handle column visibility, bulk selection, row actions
 * - Show loading/error states
 *
 * NOT RESPONSIBLE FOR:
 * - Managing filter state (use service with filter signal)
 * - Fetching data (use TanStack Query in service)
 * - Server communication (use repository)
 *
 * USAGE PATTERN:
 * 1. Feature service manages filter state signal
 * 2. Feature service provides TanStack Query for data fetching
 * 3. Feature component wires DataTable events to service methods
 * 4. DataTable displays data and emits user interactions
 *
 * See LogList and UserList for reference implementations.
 */
```

---

## Migration Checklist

### BaseFilterService Creation

-   [ ] Create `SeventySix.Client/src/app/core/services/base-filter.service.ts`
-   [ ] Add generic type parameter `<TFilter extends BaseQueryRequest>`
-   [ ] Add protected `filter: WritableSignal<TFilter>`
-   [ ] Add `updateFilter()`, `setPage()`, `setPageSize()` methods
-   [ ] Add abstract `clearFilters()` method
-   [ ] Follow Allman brace style per .editorconfig
-   [ ] Use explicit type annotations per CLAUDE.md
-   [ ] Add comprehensive JSDoc comments

### LogManagementService Updates

-   [ ] Extend `BaseFilterService<LogFilterRequest>`
-   [ ] Add constructor calling `super()` with initial filter
-   [ ] Remove duplicate `updateFilter()`, `setPage()`, `setPageSize()` methods
-   [ ] Override `clearFilters()` with log-specific defaults
-   [ ] Keep existing TanStack Query methods
-   [ ] Verify all existing functionality still works

### UserService Updates

-   [ ] Extend `BaseFilterService<UserQueryRequest>`
-   [ ] Add constructor calling `super()` with initial filter
-   [ ] Change `getAllUsers()` to use `getPaged()` with filter signal
-   [ ] Override `clearFilters()` with user-specific defaults
-   [ ] Note: `updateFilter()`, `setPage()`, `setPageSize()` inherited from base
-   [ ] Follow Allman brace style per .editorconfig
-   [ ] Use explicit type annotations per CLAUDE.md

### UserList Updates

-   [ ] Update `data` signal to use `.items` from PagedResult
-   [ ] Update `totalCount` signal to use `.totalCount` from PagedResult
-   [ ] Add `pageIndex` computed signal (convert 1-based to 0-based)
-   [ ] Add `pageSize` computed signal from PagedResult
-   [ ] Update `onSearch()` to call `userService.updateFilter()` with explicit types
-   [ ] Add `onPageChange()` handler (convert 0-based to 1-based)
-   [ ] Add `onPageSizeChange()` handler
-   [ ] Add `onDateRangeChange()` handler for LastLogin filtering
-   [ ] Update `onFilterChange()` to map quick filters to `isActive` server filter
-   [ ] Update template to pass `[pageIndex]`, `[pageSize]`, `[totalCount]` to DataTable
-   [ ] Enable date range: `[dateRangeEnabled]="true"`
-   [ ] Remove client-side filterFn from quickFilters (server handles filtering)
-   [ ] Follow Allman brace style per .editorconfig
-   [ ] Use explicit type annotations per CLAUDE.md

### Testing

-   [ ] Test UserList with 0 users
-   [ ] Test UserList with 1000+ users
-   [ ] Test pagination (page forward, backward, page size change)
-   [ ] Test search (partial match across username, email, fullName)
-   [ ] Test quick filters (all, active, inactive)
-   [ ] Test date range filter (last 24h, 7d, 30d for LastLogin)
-   [ ] Test date range with users who never logged in (null LastLogin)
-   [ ] Test bulk actions with server-side pagination
-   [ ] Test refresh button
-   [ ] Test column visibility toggle
-   [ ] Verify TanStack Query cache invalidation
-   [ ] Verify LogList still works after BaseFilterService refactoring

### Documentation

-   [ ] Update DataTableComponent JSDoc with usage pattern
-   [ ] Add code comments explaining quick filter → server filter mapping
-   [ ] Add JSDoc to BaseFilterService explaining extension pattern
-   [ ] Document date range usage for Users (LastLogin filtering)
-   [ ] Add inline comments explaining 0-based vs 1-based pagination conversion

---

## Implementation Sequence

1. **BaseFilterService** (20 min)

    - Create base class with generics
    - Add filter management methods
    - Add comprehensive JSDoc

2. **LogManagementService** (10 min)

    - Extend BaseFilterService
    - Remove duplicate methods
    - Override clearFilters()

3. **UserService** (15 min)

    - Extend BaseFilterService
    - Update getAllUsers to use getPaged
    - Override clearFilters()

4. **UserList** (25 min)

    - Update computed signals
    - Wire up event handlers (search, pagination, date range)
    - Update template bindings

5. **Testing** (20 min)

    - Test both LogList and UserList
    - Verify network requests
    - Check pagination and date ranges

6. **Documentation** (10 min)
    - Update JSDoc comments
    - Add inline code comments

**Total Estimate**: 100 minutes

---

## Key Decisions Documented

### ✅ Create BaseFilterService Base Class

-   **Rationale**: Multiple DataTables planned, consistent pattern needed
-   **Benefit**: DRY principle, reduces duplication across features
-   **Implementation**: Generic base class with type parameter
-   **Extensibility**: Easy to add new features with consistent filter management

### ✅ Add Date Range for Users Using LastLogin

-   **Rationale**: Users have LastLogin timestamp, useful for activity analysis
-   **Use Cases**: Find inactive users, login activity reports
-   **Server Support**: BaseQueryRequest already supports StartDate/EndDate
-   **Consistency**: Matches LogList date range pattern

### ✅ Keep Quick Filters in Feature Components

-   **Rationale**: Feature-specific logic (LogLevel vs IsActive)
-   **Alternative**: Could create filter mapping interface
-   **Revisit When**: 5+ features with similar filter patterns

### ✅ Server-Side Filtering for All Lists

-   **Rationale**: Scalability (10,000+ records), consistency
-   **Trade-off**: Extra network requests vs. browser memory
-   **Benefit**: Single source of truth, search/filter in database

---

## Success Criteria

1. ✅ BaseFilterService created and working with generics
2. ✅ LogManagementService extends BaseFilterService (no regression)
3. ✅ UserService extends BaseFilterService
4. ✅ UserList uses server-side pagination (loads 50 users at a time)
5. ✅ UserList supports search across username/email/fullName
6. ✅ UserList supports quick filter (all/active/inactive)
7. ✅ UserList supports date range filter (LastLogin)
8. ✅ UserList matches LogList implementation pattern
9. ✅ DataTableComponent remains generic (no feature-specific logic)
10. ✅ TanStack Query cache invalidation works correctly
11. ✅ No duplicate code between services (inherited from BaseFilterService)
12. ✅ Network tab shows `GET /api/v1/users/paged?pageNumber=1&pageSize=50&startDate=...&endDate=...`

---

## Future Enhancements (Post-MVP)

### Phase 2 Considerations (Not in This Plan)

-   Advanced search (AND/OR conditions, field-specific filters)
-   Column sorting integration with server (already supported by BaseQueryRequest)
-   Export functionality (CSV, Excel)
-   Saved filter presets (localStorage)

### Technical Debt to Monitor

-   UserRepository already has `getPaged()` - good
-   LogRepository already has `getAllPaged()` - good
-   Both follow same pattern - no refactoring needed
-   Keep watching for duplication across 3+ features

---

## Rollback Plan

If issues arise:

1. Revert UserService to use `getAllUsers()` with `getAll()`
2. Revert UserList to client-side filtering
3. Keep DataTableComponent unchanged (generic, no rollback needed)
4. LogList remains unchanged (working reference implementation)

**Risk**: Low - pattern already proven with LogList

---

## Notes for Implementation

### Column Definitions (Feature-Specific)

```typescript
// Each feature defines its own columns
readonly columns: TableColumn<User>[] = [
	{ key: "username", label: "Username", type: "text", sortable: true },
	{ key: "email", label: "Email", type: "text", sortable: true },
	{ key: "isActive", label: "Status", type: "badge", badgeColor: ... }
];
```

### Quick Filters (Feature-Specific)

```typescript
// Each feature defines filter UI and maps to server filter
readonly quickFilters: QuickFilter<User>[] = [
	{ key: "all", label: "All Users", icon: "people" },
	{ key: "active", label: "Active", icon: "check_circle" }
];

// Feature component maps UI filter to server filter
onFilterChange(event: FilterChangeEvent): void {
	const isActive = event.filterKey === "active" ? true : undefined;
	this.service.updateFilter({ isActive });
}
```

### Row Actions (Feature-Specific)

```typescript
// Each feature defines available actions
readonly rowActions: RowAction<User>[] = [
	{ key: "view", label: "View", icon: "visibility" },
	{ key: "edit", label: "Edit", icon: "edit" },
	{ key: "delete", label: "Delete", icon: "delete", color: "warn" }
];
```

### Generic DataTable Events (Shared)

```typescript
// DataTableComponent emits these events (generic)
- searchChange(searchText: string)
- filterChange(event: FilterChangeEvent)
- dateRangeChange(event: DateRangeEvent)
- pageChange(pageIndex: number)
- pageSizeChange(pageSize: number)
- refreshClick()
- rowAction(event: RowActionEvent<T>)
- bulkAction(event: BulkActionEvent<T>)
```

---

## Conclusion

**Summary**: Refactor UserList to use server-side pagination matching LogList pattern. DataTableComponent remains generic. Services manage filter state. Feature components map UI interactions to server filters.

**Complexity**: Low - mostly wiring existing infrastructure
**Risk**: Low - pattern proven with LogList
**Benefit**: Consistency, scalability, maintainability

**Principles Applied**:

-   ✅ KISS: Use existing TanStack Query + Signal pattern, simple base class
-   ✅ DRY: Share DataTableComponent AND BaseFilterService across features
-   ✅ YAGNI: Build for planned features (multiple DataTables), not speculation
-   ✅ SRP: Services manage state, components handle UI, DataTable is generic
-   ✅ OCP: DataTableComponent and BaseFilterService open for extension, closed for modification
-   ✅ LSP: LogManagementService and UserService are substitutable for BaseFilterService
-   ✅ DIP: Services depend on BaseFilterService abstraction, not concrete implementations

