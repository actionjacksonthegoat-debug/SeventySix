# Implementation 1 — Fix Undefined CSS Custom Properties (RGB Variants)

> **CRITICAL — NO SKIPPING**: Run `npm test` before AND after this file. Zero failures required.

## Problem

Angular Material 3 only emits full-value CSS custom properties (e.g., `--mat-sys-surface: #101414`). It does **not** emit RGB-channel-split variants (e.g., `--mat-sys-surface-rgb`, `--mat-surface-rgb`, `--mat-outline-rgb`, `--mat-primary-rgb`). Any `rgba(var(--mat-*-rgb), N)` call is syntactically invalid CSS and is silently discarded by the browser.

Confirmed via `getComputedStyle(document.documentElement)` in the running app:
- `--mat-surface-rgb` → `""` (empty)
- `--mat-outline-rgb` → `""` (empty)
- `--mat-primary-rgb` → `""` (empty)
- `--mat-sys-surface-rgb` → `""` (empty)
- `--mat-sys-outline-rgb` → `""` (empty)
- `--mat-sys-primary-rgb` → `""` (empty)
- `--mat-sys-on-surface-rgb` → `""` (empty)

This means:
- The **breadcrumb** active link color is _invisible_ (no color applied)
- The **breadcrumb** separator color is _invisible_
- The **header breadcrumb container** background and border are _invisible_
- The **footer** background and border are _invisible_
- The **sidebar active nav item** highlight background is _invisible_
- The **page-header icon** color is _invisible_
- The **data-table** date-range-chip-button border/color are _invisible_
- The **CLS loading overlay** background is _invisible_ (spinner floats over content with no backdrop)

## Correct Pattern

The MD3-compatible replacement for `rgba(var(--token), N)` is:

```scss
// BEFORE (broken):
background-color: rgba(var(--mat-sys-surface-rgb), 0.8);
border: 1px solid rgba(var(--mat-outline-rgb), 0.12);

// AFTER (correct):
background-color: color-mix(in srgb, var(--mat-sys-surface) 80%, transparent);
border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 12%, transparent);
```

`color-mix()` is already used successfully throughout `_base.scss` (e.g., `--color-log-debug-surface`, shadow colors) and works correctly with all MD3 theme tokens.

For full-opacity color (replacing `rgba(var(--mat-primary-rgb), 1)`): just use `var(--mat-sys-primary)` directly.

---

## Phase 1 — Fix `_mixins.scss`

**File**: `SeventySix.Client/src/app/shared/styles/_mixins.scss`

### 1.1 — Fix `cls-loading-overlay` mixin (line ~643)

Find:
```scss
background-color: rgba(var(--mat-sys-surface-rgb), 0.8);
```
Replace with:
```scss
background-color: color-mix(in srgb, var(--mat-sys-surface) 80%, transparent);
```

### 1.2 — Fix `page-header` mixin — `.page-icon` color (line ~710)

Find:
```scss
color: var(--mat-primary-default);
```
Replace with:
```scss
color: var(--mat-sys-primary);
```

### 1.3 — Fix `page-header` mixin — `.breadcrumb-separator` color (line ~722)

Find:
```scss
color: rgba(var(--mat-outline-rgb), 0.6);
```
Replace with:
```scss
color: color-mix(in srgb, var(--mat-sys-outline) 60%, transparent);
```

---

## Phase 2 — Fix `header.component.scss`

**File**: `SeventySix.Client/src/app/shared/components/layout/header/header.component.scss`

Find:
```scss
.breadcrumb-container {
	padding: 0 vars.$spacing-md;
	background-color: rgba(var(--mat-surface-rgb), 1);
	border-bottom: 1px solid rgba(var(--mat-outline-rgb), 0.12);
```
Replace with:
```scss
.breadcrumb-container {
	padding: 0 vars.$spacing-md;
	background-color: var(--mat-sys-surface);
	border-bottom: 1px solid color-mix(in srgb, var(--mat-sys-outline) 12%, transparent);
```

---

## Phase 3 — Fix `footer.component.scss`

**File**: `SeventySix.Client/src/app/shared/components/layout/footer/footer.component.scss`

Read the file first to get full context, then replace the two broken lines:
- `rgba(var(--mat-surface-rgb), 0.8)` → `color-mix(in srgb, var(--mat-sys-surface) 80%, transparent)`
- `rgba(var(--mat-outline-rgb), 0.12)` → `color-mix(in srgb, var(--mat-sys-outline) 12%, transparent)`

---

## Phase 4 — Fix `sidebar.component.scss`

**File**: `SeventySix.Client/src/app/shared/components/layout/sidebar/sidebar.component.scss`

Find:
```scss
background-color: rgba(var(--mat-primary-rgb), 0.12);
color: var(--mat-primary-default);
```
Replace with:
```scss
background-color: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
color: var(--mat-sys-primary);
```

---

## Phase 5 — Fix `breadcrumb.component.ts` inline styles

**File**: `SeventySix.Client/src/app/shared/components/breadcrumb/breadcrumb.component.ts`

The inline `styles` string in this component contains:

Find:
```typescript
			&.breadcrumb-active {
					color: rgba(var(--mat-primary-rgb), 1);
					font-weight: 500;
				}
```
Replace with:
```typescript
			&.breadcrumb-active {
					color: var(--mat-sys-primary);
					font-weight: 500;
				}
```

Find:
```typescript
			.breadcrumb-separator {
				font-size: 18px;
				width: 18px;
				height: 18px;
				color: rgba(var(--mat-outline-rgb), 0.6);
			}
```
Replace with:
```typescript
			.breadcrumb-separator {
				font-size: 18px;
				width: 18px;
				height: 18px;
				color: color-mix(in srgb, var(--mat-sys-outline) 60%, transparent);
			}
```

Note: The breadcrumb also uses raw `px` values (`0.5rem`, `0.875rem`, `768px`, `18px`, `16px`) in its inline styles. These are scoped to the component template and acceptable as-is for now — the critical fix is the undefined CSS token.

---

## Phase 6 — Fix `server-error.scss`

**File**: `SeventySix.Client/src/app/shared/pages/server-error/server-error.scss`

Find:
```scss
color: rgba(var(--mat-outline-rgb), 0.7);
```
Replace with:
```scss
color: color-mix(in srgb, var(--mat-sys-outline) 70%, transparent);
```

---

## Phase 7 — Fix `user-create.scss` and `user-detail.scss`

**File**: `SeventySix.Client/src/app/domains/admin/users/pages/user-create/user-create.scss`

Find (around line 59):
```scss
color: rgba(var(--mat-outline-rgb), 0.6);
```
Replace with:
```scss
color: color-mix(in srgb, var(--mat-sys-outline) 60%, transparent);
```

**File**: `SeventySix.Client/src/app/domains/admin/users/pages/user-detail/user-detail.scss`

Same fix — same pattern, same replacement.

---

## Phase 8 — Fix `data-table.component.scss`

**File**: `SeventySix.Client/src/app/shared/components/data-table/data-table.component.scss`

Four fixes:

1. `.date-range-chip-button` border:
   `rgba(var(--mat-sys-outline-rgb), 0.38)` → `color-mix(in srgb, var(--mat-sys-outline) 38%, transparent)`

2. `.date-range-chip-button` color:
   `rgba(var(--mat-sys-on-surface-rgb), 0.87)` → `color-mix(in srgb, var(--mat-sys-on-surface) 87%, transparent)`

3. `.date-range-chip-button:hover` background:
   `rgba(var(--mat-sys-on-surface-rgb), 0.04)` → `color-mix(in srgb, var(--mat-sys-on-surface) 4%, transparent)`

4. `.date-range-chip-button:hover` border:
   `rgba(var(--mat-sys-outline-rgb), 0.6)` → `color-mix(in srgb, var(--mat-sys-outline) 60%, transparent)`

5. `.active-range` background:
   `rgba(var(--mat-sys-primary-rgb), 0.08)` → `color-mix(in srgb, var(--mat-sys-primary) 8%, transparent)`

6. `.active-range` color:
   `rgb(var(--mat-sys-primary-rgb))` → `var(--mat-sys-primary)`

7. `.active-range mat-icon` color:
   `rgb(var(--mat-sys-primary-rgb))` → `var(--mat-sys-primary)`

8. `.result-count-chip` background:
   `rgba(var(--mat-sys-primary-rgb), 0.12)` → `color-mix(in srgb, var(--mat-sys-primary) 12%, transparent)`

9. `.result-count-chip` color:
   `rgb(var(--mat-sys-primary-rgb))` → `var(--mat-sys-primary)`

10. `.selection-panel` background uses `var(--mat-sys-primary-container)` ✓ — already correct
11. In `.selection-panel .selection-info mat-icon`, already uses `@include mixins.icon-size(vars.$icon-size-md)` ✓ — already correct

---

## Phase 9 — Fix `log-detail-dialog.component.scss` RGB fallbacks

**File**: `SeventySix.Client/src/app/domains/admin/logs/components/log-detail-dialog/log-detail-dialog.component.scss`

This file uses `rgba(var(--mat-sys-error-rgb, fallback), N)` — the fallback values (`179, 38, 30` for error, `103, 80, 164` for tertiary) are Material Design default palette values that **do not match** the app's actual cyan-orange or blue themes. They degrade silently to wrong colors.

Find:
```scss
			background-color: rgba(var(--mat-sys-error-rgb, 179, 38, 30), 0.05);
```
Replace with:
```scss
			background-color: color-mix(in srgb, var(--mat-sys-error) 5%, transparent);
```

Find:
```scss
			background-color: rgba(
				var(--mat-sys-tertiary-rgb, 103, 80, 164),
				0.05
			);
```
Replace with:
```scss
			background-color: color-mix(in srgb, var(--mat-sys-tertiary) 5%, transparent);
```

---

## Verification

After all phases in this file:
1. Run `npm run format` — required before the test gate
2. Run `npm run test:client` — zero failures
3. Open `https://localhost:4200` in browser (dev env must be running)
4. Confirm in DevTools Console — no CSS errors
5. Confirm visually:
   - Header breadcrumb container has a surface-color background and a visible outline border
   - Footer has a surface-color background and visible top border
   - Active sidebar nav item has a primary-tinted highlight
   - Data table date range chip button has visible border and text
   - Breadcrumb active item shows primary color, separator shows subdued outline color

> **CRITICAL — NO SKIPPING**: `npm test` must pass before moving to next implementation file.
