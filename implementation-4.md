# Implementation 4 — Style Guide Update + Regression Walkthrough

> **CRITICAL — NO SKIPPING**: Run `npm test` before AND after this file. Zero failures required.

## Overview

This implementation file covers two responsibilities:

1. **Style guide update** — Document the `color-mix()` pattern (the correct MD3 approach for transparent color overlays) in the Colors tab, replacing any mention of the invalid `rgba(var(--mat-sys-*-rgb))` pattern
2. **Full regression walkthrough** — Re-run the complete `/run-site-base` screenshot sequence to confirm zero visual regressions from implementations 1–3

---

## Phase 1 — Update the Style Guide Colors tab

### 1.1 — Read the style guide component

**File**: `SeventySix.Client/src/app/domains/developer/pages/style-guide/style-guide.component.html`

Read the Colors tab section. Find where CSS custom property usage is documented (if any). Identify the relevant template section.

### 1.2 — Add `color-mix()` pattern documentation

In the Colors tab, after the existing semantic status color swatches (success, warning, error, info), add a new subsection: **"Transparent Overlay Pattern (MD3)"** with the following content:

```html
<h3>Transparent Overlay Pattern (MD3)</h3>
<p class="pattern-description">
  Angular Material 3 only emits full-value color tokens (e.g. <code>--mat-sys-primary</code>).
  The <code>rgba(var(--token-rgb), N)</code> pattern is invalid — use <code>color-mix()</code> instead.
</p>
<div class="code-example">
  <pre><code>// ✅ Correct — MD3 compatible
background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
border: 1px solid color-mix(in srgb, var(--mat-sys-outline) 12%, transparent);

// ❌ Wrong — --mat-sys-primary-rgb is UNDEFINED, color is invisible
background: rgba(var(--mat-sys-primary-rgb), 0.12);</code></pre>
</div>
```

Apply appropriate CSS class wrappers consistent with the existing style guide tab structure.

### 1.3 — Update the style guide SCSS if needed

**File**: `SeventySix.Client/src/app/domains/developer/pages/style-guide/style-guide.scss`

If a `.pattern-description` or `.code-example` class is not already defined, add minimal styles consistent with the existing style guide SCSS patterns. Keep DRY — use existing code-block styles from `_base.scss` (`pre`, `code`) before adding new classes.

---

## Phase 2 — Full Regression Walkthrough

Run the complete `/run-site-base` screenshot sequence using Chrome DevTools MCP. Capture all pages at 1440×900 viewport. Compare each against the original screenshots in `.dev-tools-output/screenshots/`. Report any regressions.

### Walkthrough sequence (abbreviated for regression pass):

1. **Landing page** — full page + footer visible
2. **Sandbox**
3. **Auth pages** (view-only, not logged in):
   - `/auth/login` — clean state + triggered validation state
   - `/auth/register` — clean state
   - `/auth/forgot-password`
   - `/auth/change-password` — clean state + triggered validation state (**key regression check**)
4. **Log in as admin** (`contactseventysix@gmail.com` / `SeventySixAdmin76!`) — complete MFA
5. **Admin Dashboard** — all 4 tabs
6. **User Management** — list, search, user detail
7. **Log Management** — list + log detail dialog
8. **Permission Requests**
9. **Profile** (**key regression check** — form spacing)
10. **Request Permissions**
11. **Style Guide** — all 8 tabs (especially Colors tab — confirm new content renders)
12. **Error pages** — 404, 401, 403

### Key regressions to look for:

| Area | What to check |
|------|--------------|
| Header | Breadcrumb container has visible background and border below the header bar |
| Footer | Footer has visible background and border |
| Sidebar | Active nav item has a visible primary-tinted background highlight |
| Sidebar (mobile) | Close button does not overlap nav section title (test at 768px) |
| Change-password | Form fields have visible gap; validation errors do not collide with next field |
| Profile | Form fields have consistent spacing, no double-margin artifacts |
| Admin Dashboard | Toolbar icon is correctly sized |
| Data Table | Date range chip button is visible with border and text |
| Breadcrumbs | Active breadcrumb item shows primary color; separator shows subdued color |
| Request Permissions | Role description stacks cleanly below role name with no margin-left offset; description is in subdued color |
| Log Detail Dialog | Error section background uses correct theme error tint; stack trace section uses correct theme tertiary tint |

### Save screenshots to:

`.dev-tools-output/screenshots/regression-pass/`

Name pattern: `regression-{page-name}.png`

---

## Phase 3 — Documentation check

After regression walkthrough passes, verify:

- [ ] `SeventySix.Client/README.md` — no stale SCSS references
- [ ] `.github/instructions/angular.instructions.md` — if it mentions `rgba(var(--mat-*-rgb))` anywhere, update to `color-mix()` pattern
- [ ] `.github/instructions/formatting.instructions.md` — add note that `color-mix()` is the correct pattern for transparent overlays from MD3 tokens
- [ ] Style Guide Colors tab now documents the `color-mix()` pattern (done in Phase 1)

---

## Verification

1. Run `npm run format` — required before the test gate
2. Run `npm run test:client` — zero failures
3. Regression walkthrough screenshots all match expected layout
4. No new console errors in browser
5. Style guide Colors tab renders new pattern documentation correctly

> **CRITICAL — NO SKIPPING**: `npm test` must pass. This is the final implementation step before the orchestrator's full test gate.
