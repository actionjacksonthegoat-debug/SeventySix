# Style Guide Documentation

## SeventySix Application - Material Design 3 Patterns

This document outlines the design patterns, architectural decisions, and Material Design 3 usage throughout the SeventySix application.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Material Design Patterns](#material-design-patterns)
3. [Component Patterns](#component-patterns)
4. [State Management Patterns](#state-management-patterns)
5. [Navigation Patterns](#navigation-patterns)
6. [Data Presentation Patterns](#data-presentation-patterns)
7. [Form Patterns](#form-patterns)
8. [Feedback Patterns](#feedback-patterns)
9. [Responsive Patterns](#responsive-patterns)
10. [Accessibility Patterns](#accessibility-patterns)

---

## Design Philosophy

### Material-First Approach

**Core Principle**: Use Angular Material components as the foundation for ALL UI elements.

**Guidelines**:

-   ✅ **DO**: Use Material components (mat-button, mat-table, mat-form-field, etc.)
-   ✅ **DO**: Create composite components that combine multiple Material components
-   ✅ **DO**: Use Material theming system for colors and typography
-   ❌ **DON'T**: Create custom UI components when Material provides the functionality
-   ❌ **DON'T**: Use third-party UI libraries that conflict with Material Design

**When to Create Custom Components**:

1. Domain-specific business logic components (e.g., user-list, weather-forecast)
2. Composite components combining multiple Material components (e.g., chart wrapper)
3. Layout containers not provided by Material (e.g., page layouts)
4. Application-specific utilities (e.g., breadcrumb navigation)

### 🚨 CRITICAL: SCSS Variables Import Rule

**EVERY component SCSS file MUST start with:**

```scss
@use "variables" as vars;
```

This import provides access to:

-   **Spacing system** (`vars.$spacing-xs`, `vars.$spacing-lg`, etc.) - 8px grid
-   **Breakpoints** (`vars.$breakpoint-mobile`, `vars.$breakpoint-tablet`, `vars.$breakpoint-desktop`)
-   **Typography** (`vars.$font-family-base`, `vars.$font-family-monospace`)
-   **Border radius** (`vars.$border-radius-base`, `vars.$border-radius-card`)
-   **Transitions** (`vars.$transition-all`, `vars.$transition-duration-base`)
-   **Mixins** (`@include vars.responsive-padding()`, `@include vars.truncate-text()`)

**Why This Is Critical**:

1. **Consistency**: All spacing/sizing values come from a single source of truth
2. **Maintainability**: Change values in one place, not scattered across 100+ files
3. **Responsive Design**: Breakpoint variables ensure consistent responsive behavior
4. **Theme Compatibility**: Variables work seamlessly with Material Design 3 theming

**Example**:

```scss
@use "variables" as vars;

.my-component {
	padding: vars.$spacing-lg; // 16px - from 8px grid
	gap: vars.$spacing-md; // 12px
	border-radius: vars.$border-radius-card; // 12px

	@media #{vars.$breakpoint-mobile} {
		padding: vars.$spacing-sm; // 8px on mobile
	}
}
```

````

---

## Material Design Patterns

### 1. Material Design 3 (M3) Theming

**Implementation**: `src/app/shared/styles/material-theme.scss`

**Color System**:

-   Primary: Main brand color (blue or cyan)
-   Secondary: Supporting color (automatically derived)
-   Tertiary: Accent color (orange in cyan-orange scheme)
-   Error: Error states (Material's default red)
-   Neutral: Surface backgrounds and text

**Theme Variants**:

```typescript
// Light Blue Theme
html.light - theme.blue - scheme;

// Dark Blue Theme
html.dark - theme.blue - scheme;

// Light Cyan-Orange Theme
html.light - theme.cyan - orange - scheme;

// Dark Cyan-Orange Theme
html.dark - theme.cyan - orange - scheme;
````

**Usage**:

```scss
// Use Material theme variables
background-color: var(--mat-sys-surface);
color: var(--mat-sys-on-surface);
border-color: rgba(var(--mat-outline-rgb), 0.12);
```

### 2. Typography Scale

**Material's Type Scale**:

-   `mat-display-large`: Hero text (57px)
-   `mat-display-medium`: Large headings (45px)
-   `mat-display-small`: Section headings (36px)
-   `mat-headline-large`: Page titles (32px)
-   `mat-headline-medium`: Card titles (28px)
-   `mat-headline-small`: Subsection headings (24px)
-   `mat-title-large`: Dialog titles (22px)
-   `mat-title-medium`: List headers (16px)
-   `mat-title-small`: Captions (14px)
-   `mat-body-large`: Body text (16px)
-   `mat-body-medium`: Default body (14px)
-   `mat-body-small`: Helper text (12px)
-   `mat-label-large`: Button text (14px)
-   `mat-label-medium`: Input labels (12px)
-   `mat-label-small`: Overlines (11px)

**Usage**:

```html
<h1 class="mat-headline-large">Page Title</h1>
<p class="mat-body-medium">Body content</p>
```

### 3. Elevation & Shadows

**Material's Elevation System**:

-   Level 0: No elevation (flat surfaces)
-   Level 1: Cards, buttons at rest
-   Level 2: Hover states, raised buttons
-   Level 3: Dropdown menus, dialogs
-   Level 4: App bar, modal backdrops
-   Level 5: Navigation drawer

**Applied Automatically**: Material components handle elevation.

### 4. Motion & Animations

**Material Motion Principles**:

-   **Duration**: 200-300ms for most transitions
-   **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (standard curve)
-   **Ripple Effects**: Built into Material buttons and interactive elements

**Custom Animations**: See `src/app/shared/animations/animations.ts`

-   `fadeInOut`: Opacity transitions
-   `slideIn`: Horizontal slide transitions
-   `scaleIn`: Scale-based transitions
-   `expandCollapse`: Height animations
-   `bounce`: Notification entrance
-   `shake`: Error feedback

---

## Component Patterns

### 1. Standalone Components (Angular 20+)

**Pattern**: All components are standalone (no `@NgModule`).

```typescript
@Component({
	selector: "app-example",
	imports: [CommonModule, MatButtonModule, MatIconModule],
	// NO standalone: true (default behavior)
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {}
```

### 2. Signal-Based State Management

**Pattern**: Use signals for reactive state, computed for derived values.

```typescript
export class UserList {
	// State signals
	users = signal<User[]>([]);
	searchFilter = signal<string>("");

	// Computed values
	filteredUsers = computed(() => {
		const filter = this.searchFilter().toLowerCase();
		return this.users().filter((u) => u.username.toLowerCase().includes(filter));
	});

	userCount = computed(() => this.users().length);
}
```

**Benefits**:

-   Automatic dependency tracking
-   Fine-grained reactivity
-   Better performance than observables for local state
-   Type-safe

### 3. Input/Output Functions (Not Decorators)

**Pattern**: Use `input()` and `output()` functions instead of decorators.

```typescript
export class ChartComponent {
	// Inputs
	title = input<string>("Chart");
	chartData = input.required<ChartConfiguration["data"]>();

	// Outputs
	refresh = output<void>();
	exportPng = output<void>();

	onRefresh(): void {
		this.refresh.emit();
	}
}
```

### 4. OnPush Change Detection

**Pattern**: Always use `ChangeDetectionStrategy.OnPush` for better performance.

```typescript
@Component({
	selector: 'app-example',
	changeDetection: ChangeDetectionStrategy.OnPush
})
```

**Requirements**:

-   Use signals or immutable data
-   Emit new object references for changes
-   Material components are OnPush-compatible

---

## State Management Patterns

### 1. Local Component State

**Pattern**: Signals for component-local state.

```typescript
isLoading = signal<boolean>(false);
error = signal<string | null>(null);
data = signal<Data[]>([]);
```

### 2. Service State

**Pattern**: Injectable services with signals for shared state.

```typescript
@Injectable({ providedIn: "root" })
export class ThemeService {
	private _isDark = signal<boolean>(false);
	isDark = this._isDark.asReadonly();

	toggleBrightness(): void {
		this._isDark.update((v) => !v);
	}
}
```

### 3. RxJS to Signals

**Pattern**: Convert observables to signals using `toSignal()`.

```typescript
private breakpoints$ = this.breakpointObserver.observe([...]);
breakpoints = toSignal(this.breakpoints$, {
	initialValue: { matches: false, breakpoints: {} }
});
```

---

## Navigation Patterns

### 1. Hierarchical Breadcrumb Navigation

**Component**: `BreadcrumbComponent`

**Pattern**: Auto-generated from route configuration.

```typescript
// Route configuration
{
	path: 'users/:id',
	component: UserPage,
	data: { breadcrumb: 'User Details' }
}
```

**Features**:

-   Automatic hierarchy detection
-   Click navigation to ancestors
-   Material Design styling
-   Responsive (hidden on very small screens)

### 2. Sidebar Navigation

**Component**: `SidebarComponent`

**Pattern**: Material sidenav with responsive behavior.

**Modes**:

-   Desktop (≥960px): `side` mode (push content)
-   Mobile/Tablet (<960px): `over` mode (overlay)

**Features**:

-   Swipe gestures (open/close)
-   Persistent state (localStorage)
-   Auto-close on navigation (mobile)
-   Touch-friendly

### 3. Lazy Loading

**Pattern**: Route-based code splitting for features.

```typescript
{
	path: 'users',
	loadComponent: () => import('./features/users/users-page').then(m => m.UsersPage)
}
```

---

## Data Presentation Patterns

### 1. Material Table with Advanced Features

**Component**: `UserList`

**Features**:

-   Sorting (mat-sort)
-   Pagination (mat-paginator)
-   Filtering (custom filter predicate)
-   Column customization (show/hide)
-   Bulk selection (SelectionModel)
-   Status filtering (mat-chip-listbox)
-   Responsive (horizontal scroll on mobile)

**Pattern**:

```typescript
dataSource = new MatTableDataSource<T>([]);
@ViewChild(MatSort) sort!: MatSort;
@ViewChild(MatPaginator) paginator!: MatPaginator;

ngAfterViewInit(): void {
	this.dataSource.sort = this.sort;
	this.dataSource.paginator = this.paginator;
}
```

### 2. Data Visualization (Charts)

**Component**: `ChartComponent`

**Pattern**: Wrap Chart.js in Material card with controls.

**Features**:

-   Material card container
-   Refresh button
-   Export menu (PNG, CSV)
-   Responsive sizing
-   Theme-aware colors

### 3. Loading States

**Pattern**: Show Material spinner during data fetching.

```html
@if (isLoading()) {
<mat-spinner></mat-spinner>
} @else if (error()) {
<mat-card>Error: {{ error() }}</mat-card>
} @else {
<!-- Data display -->
}
```

---

## Form Patterns

### 1. Reactive Forms with Material

**Pattern**: FormBuilder + Material form components.

```typescript
form = this.fb.group({
	username: ["", [Validators.required, Validators.minLength(3)]],
	email: ["", [Validators.required, Validators.email]],
});
```

```html
<mat-form-field appearance="outline">
	<mat-label>Username</mat-label>
	<input matInput formControlName="username" />
	@if (form.get('username')?.hasError('required')) {
	<mat-error>Username is required</mat-error>
	}
</mat-form-field>
```

### 2. Multi-Step Wizards

**Component**: `UserCreate`

**Pattern**: mat-stepper with separate FormGroups per step.

```html
<mat-stepper linear>
	<mat-step [stepControl]="basicInfoForm">
		<!-- Step 1 content -->
	</mat-step>
	<mat-step [stepControl]="accountDetailsForm">
		<!-- Step 2 content -->
	</mat-step>
</mat-stepper>
```

### 3. Form Validation

**Material Error Messages**:

```html
@if (control.hasError('required')) {
<mat-error>Field is required</mat-error>
} @if (control.hasError('email')) {
<mat-error>Invalid email format</mat-error>
}
```

---

## Feedback Patterns

### 1. Confirmation Dialogs

**Component**: `ConfirmDialogComponent`

**Pattern**: MatDialog for critical actions.

```typescript
const dialogRef = this.dialog.open(ConfirmDialogComponent, {
	data: {
		title: "Delete User",
		message: "Are you sure?",
		confirmText: "Delete",
		confirmColor: "warn",
		icon: "warning",
	},
});

dialogRef.afterClosed().subscribe((confirmed) => {
	if (confirmed) {
		// Execute action
	}
});
```

### 2. Snackbar Notifications

**Pattern**: MatSnackBar for success/info messages.

```typescript
this.snackBar.open("User created successfully", "UNDO", {
	duration: 5000,
	horizontalPosition: "end",
	verticalPosition: "bottom",
});
```

### 3. Loading Indicators

**Global**: mat-progress-bar at top of app
**Local**: mat-spinner in components

---

## Responsive Patterns

### 1. Breakpoint Observer

**Service**: `ViewportService`, `LayoutService`

**Pattern**: CDK BreakpointObserver with computed signals.

```typescript
isHandset = computed(() => {
	const bp = this.breakpoints().breakpoints;
	return !!bp[Breakpoints.Handset];
});

isMobile = computed(() => this.isHandset());
```

### 2. Conditional Rendering

**Pattern**: Show/hide elements based on breakpoints.

```html
<!-- Using directives -->
<div [hideOn]="'mobile'">Desktop only</div>
<div [showOn]="'mobile'">Mobile only</div>

<!-- Using signals -->
@if (viewportService.isDesktop()) {
<div>Desktop content</div>
}
```

### 3. Responsive Styles

**Pattern**: Mobile-first with media queries.

```scss
.component {
	padding: 24px;

	@media (max-width: 959px) {
		padding: 16px;
	}

	@media (max-width: 599px) {
		padding: 12px;
	}
}
```

### 4. Page Layout and Scrolling

**Pattern**: Use main application scrollbar, avoid nested scrollbars.

**Guidelines for Page Components**:

-   ✅ **DO** let page content flow naturally
-   ✅ **DO** use padding for spacing
-   ❌ **DON'T** set `height: 100%` or `height: 100vh` on page containers
-   ❌ **DON'T** add `overflow: auto` or `overflow-y: auto` to page containers
-   ✅ **DO** use `overflow-x: auto` for wide tables/data grids only
-   ✅ **DO** use `overflow-y: auto` for modals/dialogs with `max-height`

```

---

## Accessibility Patterns

### 1. Keyboard Navigation

**Pattern**: Skip link + focus management.

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<main id="main-content" tabindex="-1">
	<!-- Content -->
</main>
```

**Focus Indicators**:

```scss
*:focus-visible {
	outline: 2px solid var(--mat-sys-primary);
	outline-offset: 2px;
}
```

### 2. ARIA Labels

**Pattern**: Descriptive labels for screen readers.

```html
<button mat-icon-button aria-label="Delete user">
	<mat-icon aria-hidden="true">delete</mat-icon>
</button>

<div role="status" aria-live="polite">{{ message }}</div>
```

### 3. Live Regions

**Pattern**: Announce dynamic content changes.

```html
<!-- Loading -->
<div role="status" aria-live="polite">
	<mat-spinner aria-label="Loading users"></mat-spinner>
</div>

<!-- Errors -->
<mat-card role="alert" aria-live="assertive"> Error message </mat-card>
```

---

## Best Practices Summary

### Component Creation

1. ✅ Use standalone components (default)
2. ✅ Use OnPush change detection
3. ✅ Use signals for state
4. ✅ Use input()/output() functions
5. ✅ Import only needed Material modules

### Material Usage

1. ✅ Use Material components for all UI
2. ✅ Use Material theming variables
3. ✅ Follow Material Design 3 guidelines
4. ✅ Use Material's built-in accessibility features
5. ✅ Leverage Material's responsive behavior

### Performance

1. ✅ Lazy load routes
2. ✅ Use OnPush change detection
3. ✅ Use trackBy in @for loops
4. ✅ Minimize bundle sizes
5. ✅ Use service worker for caching

### Accessibility

1. ✅ Provide ARIA labels
2. ✅ Ensure keyboard navigation
3. ✅ Use semantic HTML
4. ✅ Maintain focus management
5. ✅ Test with screen readers

---

## References

-   [Material Design 3](https://m3.material.io/)
-   [Angular Material](https://material.angular.io/)
-   [Angular Signals](https://angular.io/guide/signals)
-   [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)
