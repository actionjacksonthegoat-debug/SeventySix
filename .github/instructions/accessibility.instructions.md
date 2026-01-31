````instructions
---
description: WCAG AA accessibility rules for Angular components and HTML templates
applyTo: "**/SeventySix.Client/src/**/*.{ts,html,scss}"
---

# Accessibility (WCAG 2.2 AA)

## Icons

| Context | Required |
|---------|----------|
| Icon + text | `<mat-icon aria-hidden="true">` |
| Icon-only button | `aria-label` on button + `aria-hidden="true"` on icon |
| Toggle button | Add `[attr.aria-expanded]` and `[attr.aria-controls]` |

```html
<!-- Icon + text -->
<button mat-button>
	<mat-icon aria-hidden="true">
		save
	</mat-icon>
	Save
</button>

<!-- Icon-only -->
<button mat-icon-button
	aria-label="Save document">
	<mat-icon aria-hidden="true">
		save
	</mat-icon>
</button>

<!-- Toggle -->
<button mat-icon-button
	[attr.aria-expanded]="isExpanded()"
	[attr.aria-label]="isExpanded() ? 'Collapse' : 'Expand'">
	<mat-icon aria-hidden="true">
		{{ isExpanded() ? "expand_less" : "expand_more" }}
	</mat-icon>
</button>
```

## Loading & Progress

```html
<mat-spinner aria-label="Loading">
</mat-spinner>
<mat-progress-bar aria-label="Loading">
</mat-progress-bar>
```

## Live Regions

| Use Case | Pattern |
|----------|---------|
| Status | `aria-live="polite"` |
| Errors | `aria-live="assertive" role="alert"` |

## Angular Material (Already Accessible)

- `mat-form-field` + `mat-label`
- `mat-checkbox`, `mat-radio-button`
- `mat-dialog` (focus trap)
- `mat-table`

## Requires Attention

- `mat-icon-button`  add `aria-label`
- `mat-icon`  add `aria-hidden="true"`
- `mat-spinner`  add `aria-label`

## Structure

- One `<h1>` per page, headings in order (h1h2h3)
- Use landmarks: `role="banner"`, `role="navigation"`, `role="main"`, `role="contentinfo"`
- Focus: use `@include vars.focus-visible()` for custom elements
- Dialogs: use `cdkFocusInitial` for initial focus


````

