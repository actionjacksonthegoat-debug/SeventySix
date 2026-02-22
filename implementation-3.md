# Implementation 3 — Component & DRY Fixes

> **CRITICAL — NO SKIPPING**: Run `npm test` before AND after this file. Zero failures required.

## Problems Addressed

1. Sidebar close button absolute positioning causes mobile nav overlap
2. Sidebar active nav item `--mat-primary-default` undefined color token (fixed in impl-1, verify here)
3. Admin dashboard manually sizes icons instead of using the `@include icon-size()` mixin
4. `request-permissions.scss` uses undefined `--color-on-surface-variant` token
5. Request Permissions role description misaligned relative to role name label
6. `--mat-primary-default` used as color on active nav item and page-header icon

---

## Phase 1 — Fix `sidebar.component.scss` close-button layout

### Problem

`.sidebar-header` uses `position: absolute; top: 0; right: 0` for the close button. This means the button floats over the sidebar's scroll content. The only guard is `padding-top: vars.$spacing-md` (12px) on the first nav section title — but the close button occupies 48px (`$form-field-height-dense`). On mobile (<960px), the first section title text and its first nav items are partially under the close button.

### Fix

**File**: `SeventySix.Client/src/app/shared/components/layout/sidebar/sidebar.component.scss`

Change `.sidebar-header` from absolute positioning to a normal flex item:

Find:
```scss
.sidebar-header {
	display: flex;
	justify-content: flex-end;
	padding: vars.$spacing-xs vars.$spacing-sm;
	min-height: vars.$form-field-height-dense; // 48px
	align-items: center;
	position: absolute;
	top: 0;
	right: 0;
	z-index: 10;

	// Only show close button when sidebar is in overlay mode (< 960px)
	@media (min-width: vars.$breakpoint-md-min) {
		display: none;
	}

	.close-sidebar-btn {
		// Ensure the button is visible and accessible
		mat-icon {
			font-size: vars.$icon-size-base;
		}
	}
}

// Add top padding to first section title to account for absolute positioned close button
.nav-section-title:first-of-type {
	padding-top: vars.$spacing-md;

	// No extra padding needed when close button is hidden
	@media (min-width: vars.$breakpoint-md-min) {
		padding-top: vars.$spacing-md;
	}
}
```
Replace with:
```scss
.sidebar-header {
	display: flex;
	justify-content: flex-end;
	padding: vars.$spacing-xs vars.$spacing-sm;
	min-height: vars.$form-field-height-dense; // 48px
	align-items: center;
	flex-shrink: 0;

	// Only show close button when sidebar is in overlay mode (< 960px)
	@media (min-width: vars.$breakpoint-md-min) {
		display: none;
	}

	.close-sidebar-btn {
		mat-icon {
			font-size: vars.$icon-size-base;
		}
	}
}

.nav-section-title:first-of-type {
	padding-top: vars.$spacing-md;
}
```

**Why**: Removing absolute positioning lets `.sidebar-header` participate in the sidebar's flex column layout as a normal item. The nav list begins below it, not under it. On desktop (≥960px), the header `display: none` means the first nav title gets its normal `padding-top: $spacing-md` with nothing over it. On mobile, the header occupies its 48px height in the flow, pushing content below it cleanly.

---

## Phase 2 — Fix `sidebar.component.scss` — nav icon `margin-right`

### Problem

```scss
a[mat-list-item] {
	mat-icon {
		margin-right: vars.$spacing-md;
	}
}
```

Angular Material's `mat-list-item` with `matListItemIcon` handles icon-to-text spacing internally. The extra `margin-right` on icons can cause the icon to appear too far from the text label, or to push content outside the list item's internal layout.

### Step 2.1 — Verify the HTML template

**File**: `SeventySix.Client/src/app/shared/components/layout/sidebar/sidebar.component.html`

Read the file and check whether the icons use `matListItemIcon` attribute.

- **If icons DO use `matListItemIcon`**: Remove the `mat-icon { margin-right }` rule — Material handles spacing internally.
- **If icons do NOT use `matListItemIcon`**: Keep the `margin-right` rule as-is — it is providing the only spacing.

Make the change appropriate to what you find.

---

## Phase 3 — Fix `admin-dashboard.scss` icon-size DRY violation

**File**: `SeventySix.Client/src/app/domains/admin/pages/admin-dashboard/admin-dashboard.scss`

The pattern:
```scss
mat-icon {
	font-size: vars.$icon-size-md;
	width: vars.$icon-size-md;
	height: vars.$icon-size-md;
}
```

is the exact pattern encapsulated by `@include mixins.icon-size(vars.$icon-size-md)`. This file manually duplicates it.

### Fix

Add `@use "mixins" as mixins;` at the top of the file alongside the existing `@use "variables" as vars;`.

Then replace:
```scss
		mat-icon {
			font-size: vars.$icon-size-md;
			width: vars.$icon-size-md;
			height: vars.$icon-size-md;
		}
```
With:
```scss
		mat-icon {
			@include mixins.icon-size(vars.$icon-size-md);
		}
```

---

## Phase 4 — Fix `request-permissions.scss` undefined color token

**Confirmed**: `--color-on-surface-variant` is NOT defined anywhere in `_base.scss` or any other SCSS file. It is used only in `request-permissions.scss` as a reference with no definition. The correct MD3 token is `--mat-sys-on-surface-variant`.

**File**: `SeventySix.Client/src/app/domains/account/pages/request-permissions/request-permissions.scss`

Find:
```scss
		.role-description {
			display: block;
			font-size: vars.$font-size-sm;
			color: var(--color-on-surface-variant);
			margin-left: vars.$spacing-xl;
		}
```
Replace with:
```scss
		.role-description {
			font-size: vars.$font-size-sm;
			color: var(--mat-sys-on-surface-variant);
		}
```

> **Note**: `display: block` and `margin-left` are removed here because Phase 5 replaces the layout entirely with a proper wrapper structure.

Find:
```scss
	.no-roles {
		color: var(--color-on-surface-variant);
		font-style: italic;
	}
```
Replace with:
```scss
	.no-roles {
		color: var(--mat-sys-on-surface-variant);
		font-style: italic;
	}
```

---

## Phase 5 — Fix Request Permissions role description alignment

### Problem

The `<mat-checkbox>` for each role wraps both the role name and description as projected label content. The current SCSS applies `display: flex; flex-direction: column` directly on `mat-checkbox`, overriding Material's internal checkbox layout. The description uses `margin-left: vars.$spacing-xl` to approximate alignment but it doesn't match the actual label indent, producing the misalignment visible in the screenshot.

### Fix — HTML template

**File**: `SeventySix.Client/src/app/domains/account/pages/request-permissions/request-permissions.html`

Find:
```html
				@for (role of availableRoles(); track role.name) {
				<mat-checkbox
					[checked]="selectedRoles().has(role.name)"
					(change)="toggleRole(role.name)">
					<strong>{{ role.name }}</strong>
					<span class="role-description">{{ role.description }}</span>
				</mat-checkbox>
```
Replace with:
```html
				@for (role of availableRoles(); track role.name) {
				<mat-checkbox
					[checked]="selectedRoles().has(role.name)"
					(change)="toggleRole(role.name)">
					<span class="role-label">
						<strong class="role-name">{{ role.name }}</strong>
						<span class="role-description">{{ role.description }}</span>
					</span>
				</mat-checkbox>
```

### Fix — SCSS

**File**: `SeventySix.Client/src/app/domains/account/pages/request-permissions/request-permissions.scss`

Find:
```scss
	.roles-list {
		display: flex;
		flex-direction: column;
		gap: vars.$spacing-sm;
		margin-bottom: vars.$spacing-lg;

		mat-checkbox {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
		}

		.role-description {
			display: block;
			font-size: vars.$font-size-sm;
			color: var(--mat-sys-on-surface-variant);
			margin-left: vars.$spacing-xl;
		}
	}
```
Replace with:
```scss
	.roles-list {
		display: flex;
		flex-direction: column;
		gap: vars.$spacing-sm;
		margin-bottom: vars.$spacing-lg;

		mat-checkbox {
			align-items: flex-start; // Align checkbox indicator to top of multi-line label
		}

		.role-label {
			display: flex;
			flex-direction: column;
			gap: vars.$spacing-xs;
		}

		.role-description {
			font-size: vars.$font-size-sm;
			color: var(--mat-sys-on-surface-variant);
		}
	}
```

**Why**: Wrapping the label content in a `.role-label` flex column keeps Material's checkbox layout intact (no overrides on `mat-checkbox` itself). The description naturally aligns under the role name because they share the same flex column. No `margin-left` hack needed — the indent is provided by Material's own label offset.

---

## Phase 6 — Verify `--mat-primary-default` usages

The token `--mat-primary-default` (used in `_mixins.scss` `.page-icon` and `sidebar.component.scss` `.active` color) is an Angular Material internal token, not a stable MD3 system token.

**File**: `SeventySix.Client/src/app/shared/styles/_mixins.scss`

Search for `--mat-primary-default` and replace with `var(--mat-sys-primary)`.

**File**: `SeventySix.Client/src/app/shared/components/layout/sidebar/sidebar.component.scss`

Search for `--mat-primary-default` in the active nav item rule and replace with `var(--mat-sys-primary)`.

---

## Verification

After all phases:

1. Run `npm run format` — required before the test gate
2. Run `npm run test:client` — zero failures
3. Open `https://localhost:4200` — log in as admin
4. On a viewport < 960px wide (use DevTools device emulation at 768px), open the sidebar
5. Confirm: close button does not overlap the first nav section title or nav items
6. Confirm: closing the sidebar works as expected
7. Navigate to Admin Dashboard
8. Confirm: the toolbar icon has the correct size (consistent with other dashboard icons)
9. Navigate to Account → Request Permissions
10. Confirm: each role row shows the role name in bold with the description cleanly stacked below it and left-aligned with the label text (not offset by a manual `margin-left`)
11. Confirm: description text is rendered in the subdued on-surface-variant color

> **CRITICAL — NO SKIPPING**: `npm test` must pass before moving to next implementation file.
