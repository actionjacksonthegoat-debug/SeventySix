# Implementation 2 — Auth Form Layout Fixes

> **CRITICAL — NO SKIPPING**: Run `npm test` before AND after this file. Zero failures required.

## Problem

Auth pages must use `display: flex; flex-direction: column; gap: $spacing-lg` on the form element so that:
1. All form fields are evenly spaced
2. Material's subscript space (20px reserved for errors/hints) is accounted for naturally
3. Validation errors do not collide with the next sibling field

**`change-password`** is the only auth page missing this pattern. All others (`login`, `register-email`, `forgot-password`, `set-password`, `mfa-verify`) already have it.

**`profile`** uses the anti-pattern `mat-form-field { margin-bottom }` which collides with Material's own subscript handling.

---

## Phase 1 — Fix `change-password` form layout

### 1.1 — Add form class to HTML

**File**: `SeventySix.Client/src/app/domains/auth/pages/change-password/change-password.html`

Find:
```html
		<form
			[formGroup]="changePasswordForm"
			(ngSubmit)="onSubmit()">
```
Replace with:
```html
		<form
			class="change-password-form"
			[formGroup]="changePasswordForm"
			(ngSubmit)="onSubmit()">
```

### 1.2 — Add flex layout class to SCSS

**File**: `SeventySix.Client/src/app/domains/auth/pages/change-password/change-password.scss`

Find:
```scss
@include mixins.form-field-full-width();

.submit-button {
	width: 100%;
	margin-top: vars.$spacing-lg;
}
```
Replace with:
```scss
@include mixins.form-field-full-width();

.change-password-form {
	display: flex;
	flex-direction: column;
	gap: vars.$spacing-lg;
}

.submit-button {
	width: 100%;
}
```

> **Note**: Remove `margin-top: vars.$spacing-lg` from `.submit-button` — the form's `gap` now handles the spacing. This prevents double-spacing between the last field and the button.

---

## Phase 2 — Fix `profile` form layout

### 2.1 — Add wrapper class to form in HTML

**File**: `SeventySix.Client/src/app/domains/account/pages/profile/profile.html`

Find:
```html
			<form
				[formGroup]="profileForm"
				(ngSubmit)="onSubmit()">
```
Replace with:
```html
			<form
				class="profile-form"
				[formGroup]="profileForm"
				(ngSubmit)="onSubmit()">
```

### 2.2 — Fix SCSS to use flex+gap instead of margin-bottom

**File**: `SeventySix.Client/src/app/domains/account/pages/profile/profile.scss`

Find:
```scss
	mat-form-field {
		width: 100%;
		margin-bottom: vars.$spacing-md;
	}
```
Replace with:
```scss
	.profile-form {
		display: flex;
		flex-direction: column;
		gap: vars.$spacing-lg;

		mat-form-field {
			width: 100%;
		}
	}
```

---

## Phase 3 — Fix raw font-size tokens in `profile.scss`

**File**: `SeventySix.Client/src/app/domains/account/pages/profile/profile.scss`

### 3.1 — Linked accounts heading font-size

Find:
```scss
		h3 {
			margin: 0 0 vars.$spacing-xs;
			font-size: 1rem;
			font-weight: 500;
			color: var(--mat-sys-on-surface);
		}
```
Replace with:
```scss
		h3 {
			margin: 0 0 vars.$spacing-xs;
			font-size: vars.$font-size-base;
			font-weight: vars.$font-weight-medium;
			color: var(--mat-sys-on-surface);
		}
```

### 3.2 — Linked accounts description font-size

Find:
```scss
	.linked-accounts-description {
		margin: 0 0 vars.$spacing-lg;
		font-size: 0.875rem;
		color: var(--mat-sys-on-surface-variant);
	}
```
Replace with:
```scss
	.linked-accounts-description {
		margin: 0 0 vars.$spacing-lg;
		font-size: vars.$font-size-sm;
		color: var(--mat-sys-on-surface-variant);
	}
```

### 3.3 — Provider name font-size

Find:
```scss
		.provider-name {
			flex: 1;
			font-size: 0.875rem;
			color: var(--mat-sys-on-surface);
		}
```
Replace with:
```scss
		.provider-name {
			flex: 1;
			font-size: vars.$font-size-sm;
			color: var(--mat-sys-on-surface);
		}
```

---

## Phase 4 — Fix `login.scss` hint-text negative margin

**File**: `SeventySix.Client/src/app/domains/auth/pages/login/login.scss`

Read the current hint-text rule. The pattern `margin-top: calc(-1 * vars.$spacing-sm)` is a fragile negative-margin hack used to pull the "Your session will last 14 days" hint text closer to the remember-me checkbox.

**Decision**: If the login form uses `gap: vars.$spacing-lg` on its flex column, the gap between the checkbox row and the hint text is already controlled. Remove the negative margin.

Find the hint-text rule and remove the negative `margin-top`. If the result causes too much spacing visually verified in browser, set `margin-top: 0` instead (flush).

---

## Phase 5 — Verify `mfa-verify.scss` hint-text

**File**: `SeventySix.Client/src/app/domains/auth/pages/mfa-verify/mfa-verify.scss`

Read the file. If it also has `margin-top: calc(-1 * vars.$spacing-sm)` on `.hint-text`, apply the same fix as Phase 4.

---

## Verification

After all phases:

1. Run `npm run format` — required before the test gate
2. Run `npm run test:client` — zero failures
3. Navigate to `https://localhost:4200/auth/change-password` in the browser
4. Trigger validation by clicking each field then tabbing away without input
5. Confirm: validation error subscripts no longer collide with the border of the field below
6. Confirm: all three password fields have `gap: $spacing-lg` (16px) between them
7. Confirm: the submit button has no extra top margin doubling the spacing
8. Navigate to `https://localhost:4200/account/profile`
9. Confirm: form fields have consistent spacing, no margin-bottom artifacts
10. Navigate to `https://localhost:4200/auth/login`
11. Confirm: "Your session will last 14 days" hint text reads cleanly under the checkbox

> **CRITICAL — NO SKIPPING**: `npm test` must pass before moving to next implementation file.
