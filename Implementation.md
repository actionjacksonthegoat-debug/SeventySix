# Implementation Plan: Three-Feature Navigation System

**Status**: 🟢 READY FOR IMPLEMENTATION
**Created**: 2025-11-23
**Complexity**: Low-Medium
**Estimated Time**: 2-3 hours

---

## 🎯 OBJECTIVE

Create a simplified three-feature navigation system with:

1. **Physics** - Empty page for electricity/buoyancy calculations
2. **RVCamper** - Empty page for RV Airbnb sample codebase
3. **WorldMap** - Existing scifi pixel RPG feature
4. Simplified HomePage with 3 feature links
5. Enhanced sidebar navigation with icons and themed styling

---

## 📋 ULTRATHINK ANALYSIS

### Architecture Alignment

-   ✅ Follows existing Feature Module Pattern (self-contained features)
-   ✅ Uses lazy loading for optimal bundle size
-   ✅ Implements OnPush change detection
-   ✅ Standalone components (no NgModule)
-   ✅ Signal-based state management
-   ✅ Material Design 3 theming

### Code Quality Principles

-   ✅ **KISS**: Simple empty pages to start, build complexity later
-   ✅ **DRY**: Reuse existing component patterns and styling
-   ✅ **YAGNI**: Only create what's needed now (empty pages, basic navigation)
-   ✅ Follows .editorconfig (tabs, LF endings for TS/HTML, **explicit types**)
-   ✅ **Zoneless Angular**: No Zone.js, use `provideZonelessChangeDetection()` in tests
-   ✅ **Explicit types**: NEVER use `var`, ALWAYS use explicit type annotations
-   ✅ **Modern C# patterns**: Primary constructors, collection expressions (N/A for frontend-only)

### Testing Strategy

-   ✅ Client-side tests: `npm test` (headless, no-watch, ChromeHeadless)
-   ✅ Use `provideZonelessChangeDetection()` in all test configurations
-   ✅ **NEVER** use `fakeAsync()`, `tick()`, or `flush()` (Zone.js dependent)
-   ✅ Use `done` callback or `async/await` for async tests
-   ✅ Create basic component tests for each new feature
-   ✅ Fix all failing tests immediately before proceeding
-   ✅ No backend changes = no server tests needed

---

## 📁 FILE STRUCTURE

### New Files to Create

```
SeventySix.Client/src/app/features/
├── physics/
│   └── physics-page/
│       ├── physics-page.ts          (Component)
│       ├── physics-page.html        (Template)
│       ├── physics-page.scss        (Styles)
│       └── physics-page.spec.ts     (Tests)
└── rvcamper/
    └── rvcamper-page/
        ├── rvcamper-page.ts         (Component)
        ├── rvcamper-page.html       (Template)
        ├── rvcamper-page.scss       (Styles)
        └── rvcamper-page.spec.ts    (Tests)
```

### Files to Modify

```
SeventySix.Client/src/app/
├── app.routes.ts                    (Add new routes)
├── core/layout/sidebar/
│   ├── sidebar.component.ts         (Update navigation items)
│   └── sidebar.component.scss       (Add themed icons)
└── features/home/home-page/
    ├── home-page.ts                 (Simplify to 3 actions)
    └── home-page.html               (Update template)
```

---

## 🔨 IMPLEMENTATION STEPS

### Phase 1: Create Physics Feature (15-20 mins)

**1.1 Create Component Files**

-   Create `physics-page.ts` with empty placeholder
-   Create `physics-page.html` with themed card layout
-   Create `physics-page.scss` with electric blue/yellow theme
-   Create `physics-page.spec.ts` with basic tests

**Component Theme**: Electric/Science

-   **Material Color**: Secondary (auto-generated from primary palette)
-   **CSS Variable**: `var(--mat-sys-secondary)` for backgrounds, `var(--mat-sys-on-secondary)` for text
-   **HTML Attribute**: N/A (Angular Material doesn't support `color="secondary"` on buttons)
-   **Icon**: `bolt` or `science`
-   **Purpose**: Buoyancy electricity calculations

**Template Structure**:

```html
<div class="physics-container">
	<mat-card class="feature-card physics-theme">
		<mat-icon>bolt</mat-icon>
		<h1>Physics Calculations</h1>
		<p>Electricity generation from buoyancy and future calculations</p>
		<div class="coming-soon">Coming Soon</div>
	</mat-card>
</div>
```

**Component Structure** (TypeScript):

```typescript
export class PhysicsPage {
	// CRITICAL: Explicit type annotations required
	protected readonly title: string = "Physics Calculations";
	protected readonly description: string = "Electricity generation from buoyancy";

	// NOT: const title = "Physics"; (missing type annotation)
}
```

**Test Structure** (Zoneless):

```typescript
TestBed.configureTestingModule({
	imports: [PhysicsPage],
	providers: [provideZonelessChangeDetection()],
});

// Use done callback or async/await, NEVER fakeAsync/tick/flush
```

**1.2 Add Route**

```typescript
{
  path: "physics",
  loadComponent: () =>
    import("./features/physics/physics-page/physics-page")
      .then((m) => m.PhysicsPage),
  title: "Physics - Calculations",
  data: { breadcrumb: "Physics" }
}
```

---

### Phase 2: Create RVCamper Feature (15-20 mins)

**2.1 Create Component Files**

-   Create `rvcamper-page.ts` with empty placeholder
-   Create `rvcamper-page.html` with themed card layout
-   Create `rvcamper-page.scss` with earthy/travel theme
-   Create `rvcamper-page.spec.ts` with basic tests

**Component Theme**: Travel/Outdoor

-   **Material Color**: Tertiary (green palette from theme)
-   **CSS Variable**: `var(--mat-sys-tertiary)` for backgrounds, `var(--mat-sys-on-tertiary)` for text
-   **HTML Attribute**: N/A (Angular Material doesn't support `color="tertiary"` on buttons)
-   **Icon**: `rv_hookup` or `local_shipping`
-   **Purpose**: RV-based Airbnb full site sample

**Template Structure**:

```html
<div class="rvcamper-container">
	<mat-card class="feature-card rvcamper-theme">
		<mat-icon>rv_hookup</mat-icon>
		<h1>RV Camper</h1>
		<p>Sample codebase for RV-based Airbnb rental platform</p>
		<div class="coming-soon">Coming Soon</div>
	</mat-card>
</div>
```

**SCSS Structure** (Variables Import):

```scss
@use "variables" as vars;

.rvcamper-container {
	padding: vars.$spacing-lg;

	.feature-card {
		border-radius: vars.$border-radius-card;
	}
}
```

**2.2 Add Route**

```typescript
{
  path: "rvcamper",
  loadComponent: () =>
    import("./features/rvcamper/rvcamper-page/rvcamper-page")
      .then((m) => m.RVCamperPage),
  title: "RV Camper - Airbnb Platform",
  data: { breadcrumb: "RV Camper" }
}
```

---

### Phase 3: Update WorldMap Feature (5-10 mins)

**3.1 Add Theme Styling**

-   Add scifi/pixel theme to existing component
-   **Material Color**: Primary (blue palette from theme)
-   **CSS Variable**: `var(--mat-sys-primary)` for backgrounds, `var(--mat-sys-on-primary)` for text
-   **HTML Attribute**: `color="primary"` for Material buttons/components
-   **Icon**: `map` or `videogame_asset`

**3.2 Clean Up Template**

-   Remove UserList import (placeholder from old code)
-   Add proper themed card layout matching Physics/RVCamper

---

### Phase 4: Simplify HomePage (10-15 mins)

**4.1 Update Quick Actions**
Remove existing actions, replace with 3 feature-focused actions:

```typescript
// CRITICAL: Explicit type annotations required
protected readonly quickActions: QuickAction[] = [
	{
		title: "World Map",
		description: "Explore the scifi pixel-based RPG world",
		icon: "map",
		route: "/game",
		color: "primary",  // Material primary color
		theme: "worldmap"
	},
	{
		title: "Physics",
		description: "Calculate electricity from buoyancy and more",
		icon: "bolt",
		route: "/physics",
		color: undefined,  // No HTML attribute for secondary
		theme: "physics"
	},
	{
		title: "RV Camper",
		description: "RV-based Airbnb rental platform sample",
		icon: "rv_hookup",
		route: "/rvcamper",
		color: undefined,  // No HTML attribute for tertiary
		theme: "rvcamper"
	}
];

// Update QuickAction interface to include theme property
interface QuickAction
{
	title: string;
	description: string;
	icon: string;
	route: string;
	color?: string;
	theme?: string;  // Add this property
}
```

**4.2 Update Template**

-   Keep hero section with updated buttons
-   Remove stats section entirely (YAGNI - simplify)
-   Keep actions section with 3 themed cards
-   Remove activity section entirely (YAGNI - simplify)
-   Use `@for` loop (NOT `*ngFor`)
-   Use `[class.theme-name]` bindings (NOT `ngClass`)

**Example Template Pattern**:

```html
<!-- Use native @for, NOT *ngFor -->
@for (action of quickActions; track action.route) {
<mat-card class="action-card" [class.worldmap-theme]="action.theme === 'worldmap'" [class.physics-theme]="action.theme === 'physics'" [class.rvcamper-theme]="action.theme === 'rvcamper'" [routerLink]="action.route">
	<mat-card-header>
		<mat-icon mat-card-avatar [color]="action.color">{{ action.icon }}</mat-icon>
		<mat-card-title>{{ action.title }}</mat-card-title>
	</mat-card-header>
</mat-card>
}
```

**Example SCSS Pattern** (using Material CSS variables):

```scss
@use "variables" as vars;

.action-card {
	&.worldmap-theme {
		background: var(--mat-sys-primary-container);
		color: var(--mat-sys-on-primary-container);

		mat-icon {
			color: var(--mat-sys-primary);
		}
	}

	&.physics-theme {
		background: var(--mat-sys-secondary-container);
		color: var(--mat-sys-on-secondary-container);

		mat-icon {
			color: var(--mat-sys-secondary);
		}
	}

	&.rvcamper-theme {
		background: var(--mat-sys-tertiary-container);
		color: var(--mat-sys-on-tertiary-container);

		mat-icon {
			color: var(--mat-sys-tertiary);
		}
	}
}
```

**4.3 Add Theme Classes**

-   Add `.worldmap-theme`, `.physics-theme`, `.rvcamper-theme` to SCSS
-   Use Material CSS variables: `var(--mat-sys-primary)`, `var(--mat-sys-secondary)`, `var(--mat-sys-tertiary)`
-   Use container variants for backgrounds: `var(--mat-sys-primary-container)`
-   Use on-container variants for text: `var(--mat-sys-on-primary-container)`
-   **CRITICAL**: Start SCSS file with `@use "variables" as vars;`
-   **CRITICAL**: NO hardcoded hex colors (e.g., `#9C27B0`) - Material variables only

---

### Phase 5: Update Sidebar Navigation (15-20 mins)

**5.1 Add Features Section**
Add new nav section between "Main" and "Management":

```typescript
// Update NavItem interface to include theme
interface NavItem
{
	label: string;
	icon: string;
	route: string;
	disabled?: boolean;
	theme?: string;  // Add this property
}

// Add Features section to navSections array
protected readonly navSections: NavSection[] = [
	{
		title: "Main",
		items: [{ label: "Dashboard", icon: "dashboard", route: "/" }]
	},
	{
		title: "Features",  // NEW SECTION
		items: [
			{
				label: "World Map",
				icon: "map",
				route: "/game",
				theme: "worldmap"
			},
			{
				label: "Physics",
				icon: "bolt",
				route: "/physics",
				theme: "physics"
			},
			{
				label: "RV Camper",
				icon: "rv_hookup",
				route: "/rvcamper",
				theme: "rvcamper"
			}
		]
	},
	{
		title: "Management",
		items: [
			// ... existing management items
		]
	}
	// ... rest of sections
];
```

**5.2 Update Sidebar Styling**
Add themed icon colors to `sidebar.component.scss` using Material CSS variables:

```scss
@use "variables" as vars; // CRITICAL: Must be first line

.nav-item {
	&.worldmap-theme mat-icon {
		color: var(--mat-sys-primary); // Material primary
	}

	&.physics-theme mat-icon {
		color: var(--mat-sys-secondary); // Material secondary
	}

	&.rvcamper-theme mat-icon {
		color: var(--mat-sys-tertiary); // Material tertiary
	}
}
```

**5.3 Update Template**
Add theme class binding to nav items using `[class]` binding (NOT `ngClass`):

```html
<!-- Use @for NOT *ngFor -->
@for (item of section.items; track item.route) {
<a mat-list-item [routerLink]="item.route" [class]="item.theme ? item.theme + '-theme' : ''" routerLinkActive="active">
	<mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
	<span matListItemTitle>{{ item.label }}</span>
</a>
}
```

---

### Phase 6: Testing & Validation (15-20 mins)

**6.1 Run Unit Tests (Headless, No-Watch)**

```powershell
npm test
```

**CRITICAL**: All tests MUST pass before proceeding. Fix any failures immediately.

**6.2 Verify Test Configuration**

-   [ ] All test files use `provideZonelessChangeDetection()`
-   [ ] No tests use `fakeAsync()`, `tick()`, or `flush()`
-   [ ] Tests use `done` callback or `async/await` patterns
-   [ ] ChromeHeadless configured (no watch mode)

**6.3 Manual Testing Checklist**

-   [ ] Physics page loads at `/physics`
-   [ ] RVCamper page loads at `/rvcamper`
-   [ ] WorldMap page loads at `/game`
-   [ ] HomePage shows 3 themed cards
-   [ ] Sidebar shows Features section with 3 items
-   [ ] Navigation works from HomePage
-   [ ] Navigation works from Sidebar
-   [ ] Breadcrumbs show correctly
-   [ ] Themes display correctly (colors, icons)
-   [ ] Responsive layout works on mobile

**6.4 Visual Testing**

-   [ ] Check color consistency across features
-   [ ] Verify icon choices make sense
-   [ ] Ensure readable contrast ratios
-   [ ] Test dark/light theme compatibility

---

## 🎨 THEME SPECIFICATIONS

### ⚠️ CRITICAL: Material Design 3 Colors Only

**STRICT REQUIREMENT**: Use Material CSS variables exclusively (NO hardcoded colors)

**Available Material Color Tokens**:

-   Primary: `var(--mat-sys-primary)`, `var(--mat-sys-primary-container)`, `var(--mat-sys-on-primary)`
-   Secondary: `var(--mat-sys-secondary)`, `var(--mat-sys-secondary-container)`, `var(--mat-sys-on-secondary)`
-   Tertiary: `var(--mat-sys-tertiary)`, `var(--mat-sys-tertiary-container)`, `var(--mat-sys-on-tertiary)`
-   RGB variants: `rgba(var(--mat-sys-primary-rgb), 0.12)` for opacity

**HTML Color Attributes** (Material components only):

-   `color="primary"` - Supported ✅
-   `color="warn"` - Supported ✅
-   `color="secondary"` - NOT supported ❌ (use CSS variables in SCSS)
-   `color="tertiary"` - NOT supported ❌ (use CSS variables in SCSS)

**Current Theme** (from `_material-theme.scss`):

-   Primary: `mat.$blue-palette` (blue)
-   Secondary: Auto-generated from primary
-   Tertiary: `mat.$green-palette` (green)

---

### Material Design 3 Color System

All features use **Material Design 3** color tokens (NO hardcoded hex values):

### WorldMap (Scifi Pixel RPG)

-   **Material Color**: Primary (blue palette)
-   **CSS Variables**:
    -   Background: `var(--mat-sys-primary)` or `var(--mat-sys-primary-container)`
    -   Text: `var(--mat-sys-on-primary)` or `var(--mat-sys-on-primary-container)`
    -   RGB (for opacity): `rgba(var(--mat-sys-primary-rgb), 0.12)`
-   **HTML Attribute**: `color="primary"` (for Material components)
-   **Icon**: `map` or `videogame_asset`
-   **Vibe**: Professional, primary feature

### Physics (Calculations)

-   **Material Color**: Secondary (auto-generated from primary)
-   **CSS Variables**:
    -   Background: `var(--mat-sys-secondary)` or `var(--mat-sys-secondary-container)`
    -   Text: `var(--mat-sys-on-secondary)` or `var(--mat-sys-on-secondary-container)`
    -   RGB (for opacity): `rgba(var(--mat-sys-secondary-rgb), 0.12)`
-   **HTML Attribute**: N/A (not supported by Angular Material)
-   **Icon**: `bolt` or `science`
-   **Vibe**: Scientific, computational

### RVCamper (Airbnb Platform)

-   **Material Color**: Tertiary (green palette)
-   **CSS Variables**:
    -   Background: `var(--mat-sys-tertiary)` or `var(--mat-sys-tertiary-container)`
    -   Text: `var(--mat-sys-on-tertiary)` or `var(--mat-sys-on-tertiary-container)`
    -   RGB (for opacity): `rgba(var(--mat-sys-tertiary-rgb), 0.12)`
-   **HTML Attribute**: N/A (not supported by Angular Material)
-   **Icon**: `rv_hookup` or `local_shipping`
-   **Vibe**: Outdoor, travel, adventure

### Examples from Existing Codebase

**HTML Color Attribute Usage** (see `home-page.html`, `header.component.html`):

```html
<!-- Primary color (supported) -->
<button mat-raised-button color="primary">Get Started</button>
<mat-toolbar color="primary">Header</mat-toolbar>

<!-- Warn color (supported) -->
<mat-icon color="warn">error</mat-icon>
```

**SCSS CSS Variable Usage** (see `_base.scss`, `sidebar.component.scss`):

```scss
// Primary color
a {
	color: var(--mat-sys-primary);
	&:hover {
		color: var(--mat-sys-primary-container);
	}
}

// Tertiary color
a:visited {
	color: var(--mat-sys-tertiary);
}

// With opacity
.active {
	background-color: rgba(var(--mat-sys-primary-rgb), 0.12);
	color: var(--mat-sys-primary);
}
```

---

## 🚨 CRITICAL REQUIREMENTS

### Must Follow

1. ✅ All TypeScript files use tabs (4 spaces), LF line endings
2. ✅ All HTML files use tabs (4 spaces), LF line endings
3. ✅ All SCSS files start with `@use "variables" as vars;`
4. ✅ All components use `ChangeDetectionStrategy.OnPush`
5. ✅ All components are standalone (do NOT set `standalone: true` - it's default)
6. ✅ Use `input()` and `output()` functions (NEVER use `@Input()` or `@Output()` decorators)
7. ✅ **CRITICAL**: Explicit type annotations on ALL variables (e.g., `const test: string = "";`)
8. ✅ **CRITICAL**: NEVER use `var` keyword anywhere
9. ✅ Run tests headless: `npm test` (NEVER use `npm run test:watch`)
10. ✅ Use `provideZonelessChangeDetection()` in all test configurations
11. ✅ NEVER use `fakeAsync()`, `tick()`, `flush()` in tests (Zone.js dependent)
12. ✅ Use `host` object instead of `@HostBinding` or `@HostListener`
13. ✅ Use native control flow: `@if`, `@for`, `@switch` (NEVER `*ngIf`, `*ngFor`, `*ngSwitch`)
14. ✅ Use `[class.name]` bindings (NEVER `ngClass` or `ngStyle`)

### Must NOT Do

1. ❌ Create documentation files (only update Implementation.md)
2. ❌ Use hardcoded values for configuration (intervals, timeouts, API keys, etc.)
3. ❌ **CRITICAL**: Use hardcoded hex colors (e.g., `#9C27B0`) - use Material CSS variables only
4. ❌ Use `var` keyword - always use explicit types: `const x: string = "";` not `const x = "";`
5. ❌ Use `@Input()` or `@Output()` decorators - use `input()` and `output()` functions
6. ❌ Skip failing tests - fix immediately
7. ❌ Use ANY Zone.js APIs (`NgZone`, `fakeAsync`, `tick`, `flush`, etc.)
8. ❌ Create new Markdown documentation files
9. ❌ Use `@HostBinding` or `@HostListener` - use `host` object
10. ❌ Use `*ngIf`, `*ngFor`, `*ngSwitch` - use `@if`, `@for`, `@switch`
11. ❌ Use `ngClass` or `ngStyle` - use direct bindings
12. ❌ Set `standalone: true` explicitly (it's the default behavior)

---

## 📊 SUCCESS CRITERIA

### Functional

-   [ ] Physics page accessible at `/physics`
-   [ ] RVCamper page accessible at `/rvcamper`
-   [ ] WorldMap page accessible at `/game`
-   [ ] HomePage displays 3 feature cards
-   [ ] Sidebar displays Features section
-   [ ] All navigation links work correctly
-   [ ] Breadcrumbs work for all pages

### Quality

-   [ ] All tests pass: `npm test`
-   [ ] No console errors
-   [ ] No TypeScript errors
-   [ ] Follows .editorconfig rules
-   [ ] Themes visually distinct
-   [ ] Responsive on mobile/tablet/desktop
-   [ ] Accessible (ARIA, keyboard nav)

### Performance

-   [ ] Lazy loading working (check Network tab)
-   [ ] Bundle size reasonable (<2MB initial)
-   [ ] No performance warnings

---

## 🔄 ROLLBACK PLAN

If issues arise:

1. Revert `app.routes.ts` changes
2. Revert `sidebar.component.ts` changes
3. Delete new feature folders
4. Restore original `home-page.ts` and template
5. Run `npm test` to verify clean state

---

## 📝 NOTES

### Design Decisions

-   **Empty pages**: Start simple, build functionality later (YAGNI)
-   **Themed navigation**: Visual distinction helps users understand purpose
-   **Simplified HomePage**: Focus on 3 main features reduces cognitive load
-   **Sidebar placement**: Below Dashboard, above Admin (logical hierarchy)
-   **Explicit types**: All variables have type annotations per CLAUDE.md
-   **Zoneless architecture**: No Zone.js dependencies anywhere
-   **Native control flow**: Use `@if`, `@for`, `@switch` throughout
-   **Direct bindings**: Use `[class.name]` instead of `ngClass`/`ngStyle`

### Configuration Management

**NO HARDCODED VALUES**:

-   **CRITICAL**: Use Material CSS variables for ALL colors: `var(--mat-sys-primary)`, etc.
-   **NEVER** use hex color codes (e.g., `#9C27B0`) - use Material tokens only
-   Spacing uses `vars.$spacing-*` from `_variables.scss`
-   Border radius uses `vars.$border-radius-*`
-   All configurable values in environment files or configuration
-   Material theme colors defined in `_material-theme.scss` (blue primary, green tertiary)

### Future Enhancements (Post-Implementation)

-   Physics: Add calculation forms, visualization charts
-   RVCamper: Add listing grid, search, booking flow
-   WorldMap: Add canvas-based pixel map, character movement
-   HomePage: Add feature-specific stats (when features implemented)

### Dependencies

-   No new npm packages needed
-   No backend changes required
-   Uses existing Material Design components
-   Compatible with current Angular 19 setup

---

## 🚀 READY TO IMPLEMENT

This plan provides:

-   ✅ Clear step-by-step instructions
-   ✅ Adherence to architecture guidelines
-   ✅ Compliance with code standards
-   ✅ Comprehensive testing strategy
-   ✅ Visual design specifications
-   ✅ Rollback procedures

**Estimated Total Time**: 2-3 hours
**Risk Level**: Low (no breaking changes)
**Team Members Needed**: 1 developer

---

**Next Steps**: Proceed to Phase 1 - Create Physics Feature

