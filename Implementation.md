# Implementation-Now: Critical Fixes Before Game Development

**Project**: SeventySix.Client
**Date**: November 22, 2025
**Priority**: HIGH - Fix Before Building Game Features
**Principles**: KISS, DRY, YAGNI

---

## Critical Issues Summary

### 🔴 CRITICAL (Fix Before Game Development)

**Issue 1: No Virtual Scrolling for Large Data Tables**

-   **Cause:** Tables use standard MatTable without CDK virtual scrolling, causing UI freeze with 1,000+ rows
-   **Priority:** 🔴 CRITICAL - Required for large dataset requirement
-   **KISS/DRY/YAGNI Compliance:** ✅ Uses existing @angular/cdk (already installed), simple addition

**Issue 3: Subscription Memory Leaks in Services**

-   **Cause:** Services use `.subscribe()` without `takeUntilDestroyed()` cleanup, creating memory leaks
-   **Priority:** 🔴 CRITICAL - Game loops will compound memory leaks exponentially
-   **KISS/DRY/YAGNI Compliance:** ✅ Uses Angular built-in `takeUntilDestroyed()` (already in codebase), zero custom code

---

### 🟡 HIGH (Fix Before Production)

**Issue 2: Direct localStorage Access (SSR Risk)**

-   **Cause:** Components directly access `localStorage` without browser checks, breaking SSR
-   **Priority:** 🟡 HIGH - SSR safety and security concern
-   **KISS/DRY/YAGNI Compliance:** ✅ Uses Angular native `PLATFORM_ID` pattern (built-in, zero dependencies), follows CLAUDE.md "no hardcoded values" rule

**Issue 4: Missing Error Boundaries for Component Errors**

-   **Cause:** No component-level error boundaries, single error crashes entire app
-   **Priority:** 🟡 HIGH - Production resilience, game errors shouldn't crash admin panel
-   **KISS/DRY/YAGNI Compliance:** ✅ Simple directive pattern, reusable across components (DRY)

**Issue 5: No Performance Monitoring for Large Data Operations**

-   **Cause:** No timing/profiling infrastructure for detecting performance regressions
-   **Priority:** 🟡 HIGH - Critical for game development (FPS tracking), required before optimization
-   **KISS/DRY/YAGNI Compliance:** ✅ Single service using `requestAnimationFrame`, dev-mode only (YAGNI)

---

### 🟢 MEDIUM (Best Practice Improvements)

**Issue 6: Hardcoded Pagination Values**

-   **Cause:** Pagination sizes hardcoded in components instead of environment configuration
-   **Priority:** 🟢 MEDIUM - Violates CLAUDE.md "no hardcoded configurable values" rule
-   **KISS/DRY/YAGNI Compliance:** ✅ Moves to `environment.ts` (CLAUDE.md requirement), simple refactor

**Issue 7: No Shared Table Component (Violates DRY)**

-   **Cause:** UserList and LogTableComponent duplicate ~40% of table logic
-   **Priority:** 🟢 MEDIUM - Maintainability, but acceptable with only 2 tables
-   **KISS/DRY/YAGNI Compliance:** ⚠️ **SKIP UNLESS 3+ TABLES** (YAGNI - Rule of Three), current duplication acceptable

---

## CLAUDE.md Compliance Analysis

### ✅ Fully Compliant

1. **KISS Principle:** All fixes use simple, built-in Angular solutions (no over-engineering)
2. **DRY Principle:** Storage abstraction eliminates localStorage duplication
3. **YAGNI Principle:** Skipping shared table component until 3+ tables needed
4. **Configuration Management:** Issue 6 addresses CLAUDE.md "no hardcoded values" requirement
5. **Zoneless Architecture:** All solutions compatible with zoneless Angular
6. **Testing:** No `fakeAsync()`/`tick()` patterns (Zone.js free)
7. **TypeScript:** All examples use explicit types (no inference)
8. **Component Best Practices:** Uses `input()`, `output()`, `computed()`, signals

### Effort Breakdown

-   **Phase 1 (Critical):** 5-7 hours
    -   Task 1.1 (Virtual Scrolling): 2-4 hours
    -   Task 1.2 (Storage Service): 1-2 hours (simplified with native pattern)
    -   Task 1.3 (Subscription Cleanup): 1-2 hours (already using in codebase)
-   **Phase 2 (High Priority):** 7-10 hours
    -   Task 2.1 (Performance Monitor): 4-6 hours
    -   Task 2.2 (Error Boundaries): 3-4 hours
-   **Phase 3 (Best Practice):** 1-2 hours
    -   Task 3.1 (Configuration): 1-2 hours
    -   Task 3.2 (Shared Table): **SKIP** (YAGNI until 3+ tables)

**Total Estimated Time:** 13-19 hours (excluding Task 3.2)

---

## Actionable Implementation Plan

### Phase 1: Critical Fixes (Do This Week)

#### Task 1.1: Add Virtual Scrolling to Tables ✅

**Estimated Time**: 2-4 hours
**Priority**: 🔴 CRITICAL

**Steps**:

1. **Install CDK Scrolling** (if not already installed)

    ```bash
    # Already in package.json via @angular/cdk
    ```

2. **Update UserList Component**

    **File**: `src/app/features/admin/users/components/user-list/user-list.ts`

    **Changes**:

    ```typescript
    // Add import
    import { ScrollingModule } from "@angular/cdk/scrolling";

    // Add to imports array
    imports: [
    	// ... existing imports
    	ScrollingModule,
    ];
    ```

3. **Update UserList Template**

    **File**: `src/app/features/admin/users/components/user-list/user-list.html`

    **Find**:

    ```html
    <mat-table [dataSource]="dataSource" matSort></mat-table>
    ```

    **Replace with**:

    ```html
    <cdk-virtual-scroll-viewport itemSize="48" class="table-viewport">
    	<mat-table [dataSource]="dataSource" matSort>
    		<!-- existing table content -->
    	</mat-table>
    </cdk-virtual-scroll-viewport>
    ```

4. **Add Styles**

    **File**: `src/app/features/admin/users/components/user-list/user-list.scss`

    **Add**:

    ```scss
    @use "variables" as vars;

    .table-viewport {
    	height: 600px; // Configurable based on viewport
    	overflow-y: auto;

    	@media #{vars.$breakpoint-mobile} {
    		height: 400px;
    	}
    }
    ```

5. **Repeat for LogTableComponent**

    Same changes for:

    - `src/app/features/admin/log-management/components/log-table/log-table.component.ts`
    - `src/app/features/admin/log-management/components/log-table/log-table.component.html`
    - `src/app/features/admin/log-management/components/log-table/log-table.component.scss`

**Testing**:

-   Test with 1,000 rows
-   Test with 10,000 rows
-   Verify smooth scrolling
-   Verify sorting still works
-   Verify pagination still works

**Success Criteria**:

-   ✅ Tables render 10,000+ rows without lag
-   ✅ Scroll performance is smooth
-   ✅ Memory usage is constant (not growing with row count)

---

#### Task 1.2: Create Storage Abstraction Service ✅

**Estimated Time**: 1-2 hours (SIMPLIFIED - Using Angular Best Practice)
**Priority**: 🟡 HIGH

**RECOMMENDED APPROACH**: Use Angular's native `PLATFORM_ID` + Injection Token pattern (zero dependencies, official Angular recommendation)

**Alternative**: Install `@ngx-pwa/local-storage` (if you need IndexedDB fallback, encryption, or RxJS observables)

**Steps (Angular Native Approach - RECOMMENDED)**:

1. **Create Storage Service (Simplified Angular Pattern)**

    **File**: `src/app/core/services/storage.service.ts`

    ```typescript
    import { Injectable, inject, PLATFORM_ID } from "@angular/core";
    import { isPlatformBrowser } from "@angular/common";

    /**
     * Storage abstraction service using Angular best practices
     * SSR-safe localStorage wrapper with minimal abstraction (KISS principle)
     * Based on official Angular SSR documentation pattern
     */
    @Injectable({
    	providedIn: "root",
    })
    export class StorageService {
    	private readonly platformId = inject(PLATFORM_ID);
    	private readonly isBrowser = isPlatformBrowser(this.platformId);

    	/**
    	 * Get item from localStorage (SSR-safe)
    	 * Returns null if not in browser or item doesn't exist
    	 */
    	getItem<T = string>(key: string): T | null {
    		if (!this.isBrowser) return null;

    		try {
    			const value: string | null = localStorage.getItem(key);
    			if (!value) return null;

    			// Try to parse as JSON, fallback to string
    			try {
    				return JSON.parse(value) as T;
    			} catch {
    				return value as T;
    			}
    		} catch (error) {
    			console.error(`StorageService: Failed to get "${key}"`, error);
    			return null;
    		}
    	}

    	/**
    	 * Set item in localStorage (SSR-safe)
    	 * Returns true on success, false on failure
    	 */
    	setItem<T>(key: string, value: T): boolean {
    		if (!this.isBrowser) return false;

    		try {
    			const stringValue: string = typeof value === "string" ? value : JSON.stringify(value);
    			localStorage.setItem(key, stringValue);
    			return true;
    		} catch (error) {
    			// Handle quota exceeded
    			if (error instanceof DOMException && error.name === "QuotaExceededError") {
    				console.error("StorageService: Quota exceeded");
    			}
    			console.error(`StorageService: Failed to set "${key}"`, error);
    			return false;
    		}
    	}

    	/**
    	 * Remove item from localStorage (SSR-safe)
    	 */
    	removeItem(key: string): void {
    		if (!this.isBrowser) return;
    		try {
    			localStorage.removeItem(key);
    		} catch (error) {
    			console.error(`StorageService: Failed to remove "${key}"`, error);
    		}
    	}

    	/**
    	 * Clear all items from localStorage (SSR-safe)
    	 */
    	clear(): void {
    		if (!this.isBrowser) return;
    		try {
    			localStorage.clear();
    		} catch (error) {
    			console.error("StorageService: Failed to clear localStorage", error);
    		}
    	}
    }
    ```

**Alternative Steps (Using @ngx-pwa/local-storage - If You Need More Features)**:

1. **Install Library**:

    ```bash
    npm install @ngx-pwa/local-storage
    ```

2. **Use in Services** (RxJS-based, supports IndexedDB fallback):

    ```typescript
    import { inject } from "@angular/core";
    import { StorageMap } from "@ngx-pwa/local-storage";

    export class ThemeService {
    	private storage = inject(StorageMap);

    	getTheme() {
    		// Returns Observable<string | undefined>
    		return this.storage.get("theme");
    	}

    	setTheme(theme: string) {
    		// Returns Observable<undefined>
    		return this.storage.set("theme", theme);
    	}
    }
    ```

**Benefits of @ngx-pwa/local-storage**:

-   ✅ RxJS Observable-based (Angular idiomatic)
-   ✅ Automatic fallback: localStorage → IndexedDB → in-memory
-   ✅ SSR-safe by default
-   ✅ Better type safety
-   ✅ Built-in JSON serialization
-   ✅ 5MB+ storage (IndexedDB fallback)

**Recommendation**:

-   **Use native pattern** (Task 1.2 above) if you only need simple localStorage
-   **Use @ngx-pwa/local-storage** if you need:
    -   Observable-based API
    -   IndexedDB support (larger storage)
    -   Better browser compatibility
    -   Built-in encryption support

2. **Create Unit Tests**

    **File**: `src/app/core/services/storage.service.spec.ts`

    ```typescript
    import { TestBed } from "@angular/core/testing";
    import { StorageService } from "./storage.service";
    import { provideZonelessChangeDetection } from "@angular/core";

    describe("StorageService", () => {
    	let service: StorageService;

    	beforeEach(() => {
    		TestBed.configureTestingModule({
    			providers: [provideZonelessChangeDetection()],
    		});
    		service = TestBed.inject(StorageService);
    		localStorage.clear();
    	});

    	afterEach(() => {
    		localStorage.clear();
    	});

    	it("should be created", () => {
    		expect(service).toBeTruthy();
    	});

    	it("should store and retrieve data", () => {
    		const data = { test: "value" };
    		service.setItem("test-key", data);
    		const retrieved = service.getItem("test-key");
    		expect(retrieved).toEqual(data);
    	});

    	it("should return null for non-existent key", () => {
    		const value = service.getItem("non-existent");
    		expect(value).toBeNull();
    	});

    	it("should remove item", () => {
    		service.setItem("test", "value");
    		service.removeItem("test");
    		expect(service.getItem("test")).toBeNull();
    	});
    });
    ```

3. **Update ThemeService to use StorageService**

    **File**: `src/app/core/services/theme.service.ts`

    **Before**:

    ```typescript
    const saved: string | null = localStorage.getItem(this.BRIGHTNESS_STORAGE_KEY);
    ```

    **After**:

    ```typescript
    private storage = inject(StorageService);

    private getInitialBrightness(): ThemeBrightness {
      const saved = this.storage.getItem<ThemeBrightness>(this.BRIGHTNESS_STORAGE_KEY);
      return saved === "dark" || saved === "light" ? saved : "light";
    }

    private applyTheme(brightness: ThemeBrightness, scheme: ColorScheme): void {
      // ... existing code ...
      this.storage.setItem(this.BRIGHTNESS_STORAGE_KEY, brightness);
      this.storage.setItem(this.SCHEME_STORAGE_KEY, scheme);
    }
    ```

4. **Update UserList to use StorageService**

    **File**: `src/app/features/admin/users/components/user-list/user-list.ts`

    **Add**:

    ```typescript
    private storage = inject(StorageService);

    loadColumnPreferences(): void {
      const prefs = this.storage.getItem<Record<string, boolean>>('userListColumns');
      if (prefs) {
        this.columnDefs.update((cols) =>
          cols.map((col) => ({
            ...col,
            visible: prefs[col.key] ?? col.visible
          }))
        );
      }
    }

    saveColumnPreferences(): void {
      const prefs = this.columnDefs().reduce((acc, col) => {
        acc[col.key] = col.visible;
        return acc;
      }, {} as Record<string, boolean>);
      this.storage.setItem('userListColumns', prefs);
    }
    ```

5. **Update Other Services**

    Apply same pattern to:

    - `src/app/core/services/error-queue.service.ts`
    - `src/app/core/services/token-storage.service.ts`

**Testing**:

-   Test in browser
-   Test in SSR environment (simulate)
-   Test quota exceeded scenario
-   Test invalid JSON handling

**Success Criteria**:

-   ✅ All localStorage access goes through StorageService
-   ✅ No direct localStorage calls in application code
-   ✅ SSR-safe (checks isPlatformBrowser)
-   ✅ Handles errors gracefully

---

#### Task 1.3: Fix Subscription Memory Leaks

**Estimated Time**: 1-2 hours
**Priority**: 🔴 CRITICAL

**✅ Solution: Use `takeUntilDestroyed()` - Already in Your Codebase!**

You're already using this pattern in `log-filters.component.ts` (line 86). Just apply it consistently across all services.

**Steps**:

1. **Update ErrorQueueService**

    **File**: `src/app/core/services/error-queue.service.ts`

    **Before**:

    ```typescript
    import { Injectable, OnDestroy, inject } from "@angular/core";
    import { interval, Subscription } from "rxjs";

    export class ErrorQueueService implements OnDestroy {
    	private batchProcessorSubscription?: Subscription;

    	constructor() {
    		this.batchProcessorSubscription = interval(this.batchInterval).subscribe(() => {
    			this.processBatch();
    		});
    	}

    	ngOnDestroy(): void {
    		this.batchProcessorSubscription?.unsubscribe();
    	}
    }
    ```

    **After**:

    ```typescript
    import { Injectable, inject } from "@angular/core";
    import { interval } from "rxjs";
    import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

    export class ErrorQueueService {
      // No DestroyRef injection needed in constructor!
      constructor() {
        interval(this.batchInterval)
          .pipe(
            takeUntilDestroyed()  // ✅ Automatic cleanup - that's it!
          )
          .subscribe(() => {
            this.processBatch();
          });
      }

      // No ngOnDestroy needed!
      // No Subscription variable needed!
    ```

2. **Update SwUpdateService**

    **File**: `src/app/core/services/sw-update.service.ts`

    **Pattern**: Same as above - just add `.pipe(takeUntilDestroyed())` to constructor subscriptions

    ```typescript
    import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

    export class SwUpdateService {
      constructor() {
        // ✅ All three subscriptions auto-cleanup
        everySixHoursOnceAppIsStable$
          .pipe(takeUntilDestroyed())
          .subscribe(async () => { ... });

        this.swUpdate.versionUpdates
          .pipe(takeUntilDestroyed())
          .subscribe((evt) => { ... });

        this.swUpdate.unrecoverable
          .pipe(takeUntilDestroyed())
          .subscribe((event) => { ... });
      }
    }
    ```

3. **Update LoadingService, LoggerService** (same pattern)

    **Files**:

    - `src/app/core/services/loading.service.ts`
    - `src/app/core/services/logger.service.ts`

    Just add `.pipe(takeUntilDestroyed())` to any subscriptions in constructor.

4. **Update SiteLayoutChangedDirective** (needs DestroyRef)

    **File**: `src/app/shared/directives/site-layout-changed.directive.ts`

    **⚠️ Different Pattern**: Subscription in `ngOnInit()` (not constructor), so we need `DestroyRef`:

    ```typescript
    import { DestroyRef, inject } from '@angular/core';
    import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

    export class SiteLayoutChangedDirective {
      private destroyRef = inject(DestroyRef);  // ⚠️ Required for non-constructor

      ngOnInit(): void {
        this.breakpointObserver
          .observe(this.breakpoints)
          .pipe(takeUntilDestroyed(this.destroyRef))  // Pass DestroyRef
          .subscribe(() => { ... });
      }
    }
    ```

**🔑 Key Rules:**

-   **In Constructor**: Just use `.pipe(takeUntilDestroyed())` - no DestroyRef needed!
-   **Outside Constructor** (ngOnInit, methods): Inject `DestroyRef` and pass it: `.pipe(takeUntilDestroyed(this.destroyRef))`

    ```

    ```

**Testing**:

-   Search for all `.subscribe(` calls: `grep -r "\.subscribe\(" src/app/core/services/`
-   Verify each has `.pipe(takeUntilDestroyed())` before it
-   Open app and verify no console errors
-   Navigate between routes multiple times
-   Check Chrome DevTools → Performance → Memory → Take heap snapshot
-   Verify subscriptions are cleaned up (detached listeners count should not grow)

**Success Criteria**:

-   ✅ All subscriptions use `takeUntilDestroyed()`
-   ✅ No manual `Subscription` variables or `ngOnDestroy()` cleanup
-   ✅ No memory leaks in Chrome DevTools memory profiler
-   ✅ Simpler code (less boilerplate)
-   ✅ Memory usage stable after route changes

---

### Phase 2: High-Priority Improvements (Do This Month)

#### Task 2.1: Add Performance Monitoring Service

**Estimated Time**: 4-6 hours
**Priority**: 🟡 HIGH

**Steps**:

1. **Create Performance Monitor Service**

    **File**: `src/app/core/performance/performance-monitor.service.ts`

    ```typescript
    import { Injectable, signal, computed, WritableSignal } from "@angular/core";

    export interface PerformanceMetrics {
    	fps: number;
    	frameTime: number; // ms
    	memoryUsed: number; // MB
    	memoryTotal: number; // MB
    }

    @Injectable({
    	providedIn: "root",
    })
    export class PerformanceMonitorService {
    	private isMonitoring = signal<boolean>(false);
    	private metrics = signal<PerformanceMetrics>({
    		fps: 0,
    		frameTime: 0,
    		memoryUsed: 0,
    		memoryTotal: 0,
    	});

    	readonly currentMetrics = this.metrics.asReadonly();
    	readonly isHealthy = computed(() => this.metrics().fps >= 50);

    	private frameCount = 0;
    	private lastTime = performance.now();
    	private animationFrameId: number | null = null;

    	startMonitoring(): void {
    		if (this.isMonitoring()) return;
    		this.isMonitoring.set(true);
    		this.monitorFrame();
    	}

    	stopMonitoring(): void {
    		this.isMonitoring.set(false);
    		if (this.animationFrameId !== null) {
    			cancelAnimationFrame(this.animationFrameId);
    			this.animationFrameId = null;
    		}
    	}

    	private monitorFrame = (): void => {
    		if (!this.isMonitoring()) return;

    		const now = performance.now();
    		const delta = now - this.lastTime;

    		this.frameCount++;

    		// Update metrics every second
    		if (delta >= 1000) {
    			const fps = Math.round((this.frameCount * 1000) / delta);
    			const frameTime = delta / this.frameCount;

    			// Get memory info (if available)
    			const memory = (performance as any).memory;
    			const memoryUsed = memory ? Math.round(memory.usedJSHeapSize / 1048576) : 0;
    			const memoryTotal = memory ? Math.round(memory.totalJSHeapSize / 1048576) : 0;

    			this.metrics.set({
    				fps,
    				frameTime: Math.round(frameTime * 100) / 100,
    				memoryUsed,
    				memoryTotal,
    			});

    			this.frameCount = 0;
    			this.lastTime = now;
    		}

    		this.animationFrameId = requestAnimationFrame(this.monitorFrame);
    	};

    	/**
    	 * Mark a performance timing
    	 */
    	mark(name: string): void {
    		performance.mark(name);
    	}

    	/**
    	 * Measure performance between two marks
    	 */
    	measure(name: string, startMark: string, endMark: string): number {
    		performance.measure(name, startMark, endMark);
    		const entries = performance.getEntriesByName(name);
    		return entries[entries.length - 1]?.duration ?? 0;
    	}
    }
    ```

2. **Create Performance Monitor Component** (for dev tools)

    **File**: `src/app/shared/components/performance-monitor/performance-monitor.component.ts`

    ```typescript
    import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
    import { PerformanceMonitorService } from "@core/performance/performance-monitor.service";

    @Component({
    	selector: "app-performance-monitor",
    	template: `
    		<div class="perf-monitor" [class.healthy]="perfMonitor.isHealthy()">
    			<div class="metric">
    				<span class="label">FPS:</span>
    				<span class="value">{{ perfMonitor.currentMetrics().fps }}</span>
    			</div>
    			<div class="metric">
    				<span class="label">Frame:</span>
    				<span class="value">{{ perfMonitor.currentMetrics().frameTime }}ms</span>
    			</div>
    			<div class="metric">
    				<span class="label">Memory:</span>
    				<span class="value"> {{ perfMonitor.currentMetrics().memoryUsed }}MB / {{ perfMonitor.currentMetrics().memoryTotal }}MB </span>
    			</div>
    		</div>
    	`,
    	styles: [
    		`
    			.perf-monitor {
    				position: fixed;
    				top: 60px;
    				right: 10px;
    				background: rgba(0, 0, 0, 0.8);
    				color: #ff0000;
    				padding: 8px;
    				font-family: monospace;
    				font-size: 12px;
    				z-index: 9999;
    				border-radius: 4px;

    				&.healthy {
    					color: #00ff00;
    				}

    				.metric {
    					display: flex;
    					justify-content: space-between;
    					gap: 8px;

    					.label {
    						color: #888;
    					}
    				}
    			}
    		`,
    	],
    	changeDetection: ChangeDetectionStrategy.OnPush,
    })
    export class PerformanceMonitorComponent {
    	protected perfMonitor = inject(PerformanceMonitorService);

    	constructor() {
    		this.perfMonitor.startMonitoring();
    	}
    }
    ```

3. **Add to App Component** (dev mode only)

    **File**: `src/app/app.ts`

    ```typescript
    import { isDevMode } from "@angular/core";
    import { PerformanceMonitorComponent } from "@shared/components/performance-monitor/performance-monitor.component";

    @Component({
    	// ... existing config ...
    	imports: [
    		// ... existing imports ...
    		...(isDevMode() ? [PerformanceMonitorComponent] : []),
    	],
    	template: `
    		<router-outlet />
    		@if (isDevMode) {
    		<app-performance-monitor />
    		}
    	`,
    })
    export class App {
    	protected isDevMode = isDevMode();
    }
    ```

**Testing**:

-   Verify FPS counter appears in dev mode
-   Test with heavy table rendering
-   Verify memory tracking works
-   Check performance.mark/measure utility

**Success Criteria**:

-   ✅ Performance metrics visible in dev mode
-   ✅ FPS tracked in real-time
-   ✅ Memory usage tracked
-   ✅ Performance marks/measures work

---

#### Task 2.2: Add Error Boundary Pattern

**Estimated Time**: 3-4 hours
**Priority**: 🟡 HIGH

**Steps**:

1. **Create Error Boundary Directive**

    **File**: `src/app/core/directives/error-boundary.directive.ts`

    ```typescript
    import { Directive, input, output, ViewContainerRef, TemplateRef, effect, inject, ErrorHandler } from "@angular/core";

    @Directive({
    	selector: "[errorBoundary]",
    	standalone: true,
    })
    export class ErrorBoundaryDirective {
    	private vcr = inject(ViewContainerRef);
    	private templateRef = inject(TemplateRef);
    	private errorHandler = inject(ErrorHandler);

    	// Optional fallback template
    	errorTemplate = input<TemplateRef<any> | null>(null);

    	// Error output
    	errorCaught = output<Error>();

    	constructor() {
    		effect(() => {
    			try {
    				this.vcr.clear();
    				this.vcr.createEmbeddedView(this.templateRef);
    			} catch (error) {
    				this.handleError(error as Error);
    			}
    		});
    	}

    	private handleError(error: Error): void {
    		this.errorCaught.emit(error);
    		this.errorHandler.handleError(error);

    		const fallback = this.errorTemplate();
    		if (fallback) {
    			this.vcr.clear();
    			this.vcr.createEmbeddedView(fallback);
    		}
    	}
    }
    ```

2. **Create Error Fallback Component**

    **File**: `src/app/shared/components/error-fallback/error-fallback.component.ts`

    ```typescript
    import { Component, input } from "@angular/core";
    import { MatCardModule } from "@angular/material/card";
    import { MatIconModule } from "@angular/material/icon";
    import { MatButtonModule } from "@angular/material/button";

    @Component({
    	selector: "app-error-fallback",
    	imports: [MatCardModule, MatIconModule, MatButtonModule],
    	template: `
    		<mat-card class="error-fallback">
    			<mat-icon class="error-icon">error</mat-icon>
    			<h2>Something went wrong</h2>
    			<p>{{ message() }}</p>
    			<button mat-raised-button color="primary" (click)="reload()">Reload Page</button>
    		</mat-card>
    	`,
    	styles: [
    		`
    			.error-fallback {
    				text-align: center;
    				padding: 32px;
    				margin: 16px;

    				.error-icon {
    					font-size: 48px;
    					width: 48px;
    					height: 48px;
    					color: #f44336;
    				}
    			}
    		`,
    	],
    })
    export class ErrorFallbackComponent {
    	message = input<string>("An unexpected error occurred.");

    	reload(): void {
    		window.location.reload();
    	}
    }
    ```

3. **Use in Components**

    **Example**:

    ```html
    <div *errorBoundary="let error; fallback: errorTemplate">
    	<!-- Component content that might error -->
    </div>

    <ng-template #errorTemplate>
    	<app-error-fallback [message]="'This section failed to load'" />
    </ng-template>
    ```

**Testing**:

-   Simulate component errors
-   Verify fallback UI appears
-   Verify app doesn't crash
-   Test error reporting

**Success Criteria**:

-   ✅ Component errors don't crash app
-   ✅ Fallback UI displays
-   ✅ Errors logged properly
-   ✅ Can recover gracefully

---

### Phase 3: Best Practice Improvements (Do Next Sprint)

#### Task 3.1: Move Configuration to Environment

**Estimated Time**: 1-2 hours
**Priority**: 🟢 MEDIUM

**Steps**:

1. **Update Environment Interface**

    **File**: `src/environments/environment.ts`

    **Add**:

    ```typescript
    export const environment = {
    	// ... existing config ...

    	// NEW: UI Configuration
    	ui: {
    		tables: {
    			defaultPageSize: 50,
    			pageSizeOptions: [25, 50, 100],
    			virtualScrollItemSize: 48,
    		},
    		performance: {
    			enableMonitoring: true, // Dev mode only
    			fpsWarningThreshold: 30,
    		},
    	},
    };
    ```

2. **Update Components to Use Config**

    **File**: `src/app/features/admin/users/components/user-list/user-list.ts`

    **Change**:

    ```typescript
    import { environment } from '@environments/environment';

    // Before:
    readonly pageSizeOptions: number[] = [25, 50, 100];

    // After:
    readonly pageSizeOptions: number[] = environment.ui.tables.pageSizeOptions;
    ```

**Success Criteria**:

-   ✅ All hardcoded UI values moved to environment
-   ✅ Can tune settings per environment
-   ✅ Follows CLAUDE.md configuration rules

---

#### Task 3.2: Create Shared DataTable Component

**Estimated Time**: 6-8 hours
**Priority**: 🟢 MEDIUM (YAGNI - only if building 3+ tables)

**Note**: Skip this for now unless you plan to add more tables. Current duplication is acceptable with only 2 tables.

**IF IMPLEMENTING**:

1. Create `src/app/shared/components/data-table/data-table.component.ts`
2. Extract common logic from UserList and LogTableComponent
3. Make generic with type parameter `<T>`
4. Add column configuration input
5. Add selection, sorting, pagination, filtering
6. Update existing components to use shared component

**Decision Point**: Only implement when you have 3+ tables (Rule of Three - DRY)

---

## Testing Checklist

After implementing fixes, verify:

### Virtual Scrolling Tests

-   [ ] Load table with 1,000 rows - smooth scrolling
-   [ ] Load table with 10,000 rows - smooth scrolling
-   [ ] Sorting works with virtual scroll
-   [ ] Pagination works with virtual scroll
-   [ ] Selection works with virtual scroll
-   [ ] Memory usage is constant (not growing with rows)

### Storage Service Tests

-   [ ] Theme preferences persist
-   [ ] Column preferences persist
-   [ ] SSR mode doesn't crash
-   [ ] Quota exceeded handled gracefully
-   [ ] Invalid JSON handled gracefully

### Memory Leak Tests

-   [ ] Navigate between routes 20 times
-   [ ] Check Chrome DevTools Memory profile
-   [ ] Verify subscriptions cleaned up
-   [ ] No warning in console about leaks

### Performance Monitor Tests

-   [ ] FPS counter visible in dev mode
-   [ ] FPS drops when rendering heavy content
-   [ ] Memory tracking shows realistic values
-   [ ] performance.mark/measure work

### Error Boundary Tests

-   [ ] Component error shows fallback
-   [ ] App doesn't crash
-   [ ] Error logged correctly
-   [ ] Can recover from error

---

## Priority Summary

### Must Fix NOW (Before Game Development)

1. 🔴 **Virtual Scrolling** - Critical for large datasets
2. 🔴 **Subscription Leaks** - Critical for memory management
3. 🟡 **Storage Abstraction** - Important for SSR and security

### Fix This Month (Before Production)

4. 🟡 **Performance Monitoring** - Important for optimization
5. 🟡 **Error Boundaries** - Important for resilience
6. 🟢 **Configuration Management** - Best practice

### Optional (Apply Rule of Three)

7. 🟢 **Shared Table Component** - Only if building 3+ tables

---

## Alignment with CLAUDE.md Guidelines

### ✅ Follows KISS Principle

-   Simple, focused solutions
-   No over-engineering
-   Incremental improvements

### ✅ Follows DRY Principle

-   Storage abstraction eliminates duplication
-   Shared table component (if 3+ tables)
-   Performance monitoring service (reusable)

### ✅ Follows YAGNI Principle

-   Only fixing what's needed NOW
-   Skipping shared table until needed
-   Not building speculative features

### ✅ Follows CLAUDE.md Rules

-   No hardcoded configuration values
-   Explicit types everywhere
-   Proper cleanup with `takeUntilDestroyed()`
-   SSR-safe code
-   Performance-focused

---

## Conclusion

**7 issues identified**, **5 must fix NOW**, **2 can wait**.

**Estimated Total Time**: 12-17 hours (1-2 weeks)

**Impact**:

-   ✅ Ready for large datasets (10,000+ rows)
-   ✅ No memory leaks (safe for game loops)
-   ✅ SSR-safe (future-proof)
-   ✅ Performance visibility (can optimize)
-   ✅ Production-ready error handling

**After these fixes**, your application will be ready for:

-   Game development with real-time loops
-   Large dataset management
-   Server-side rendering
-   Production deployment
-   Performance optimization

---

**Next Steps**:

1. Review this plan
2. Prioritize tasks based on timeline
3. Implement Phase 1 (critical fixes) first
4. Test thoroughly
5. Then proceed with game development from main Implementation.md
