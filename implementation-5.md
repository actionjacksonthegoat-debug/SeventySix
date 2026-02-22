# Implementation 5 — FieldMessageDirective

> **Scope**: Add single-line ellipsis truncation to `mat-hint` / `mat-error` text,
> with a Material tooltip that activates only when text is actually clipped.
> Apply to the change-password page and document the pattern in the style guide.

---

## ⚠️ GATE CONDITION

> All required test suites **MUST** pass before this plan is complete:
> - `npm run test:client` → `X passed`
> - No new IDE warnings

---

## Phase 1 — Create `FieldMessageDirective`

**File:** `SeventySix.Client/src/app/shared/directives/field-message.directive.ts`

- Selector: `[appFieldMessage]`
- `hostDirectives: [MatTooltip]` — composes tooltip without wrapping element
- Host styles: `display: block; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`
- `inject(MatTooltip)` in field initialiser — valid due to Angular 15+ hostDirectives instantiation order
- `ngAfterViewInit`: capture `textContent`, set `tooltip.message` and `tooltip.touchGestures = "on"`, start `ResizeObserver`
- ResizeObserver callback: `tooltip.disabled = el.scrollWidth <= el.clientWidth`
- `ngOnDestroy`: disconnect the ResizeObserver

## Phase 2 — Export from barrel

**File:** `SeventySix.Client/src/app/shared/directives/index.ts`

Add: `export { FieldMessageDirective } from "./field-message.directive";`

## Phase 3 — Apply to `change-password.html`

Add `appFieldMessage` to the `<mat-hint>` on the New Password field.

## Phase 4 — Import directive in `change-password.ts`

Add `FieldMessageDirective` to the component's `imports` array (inside `FORM_MATERIAL_MODULES` won't cover it; it goes in the component imports directly).

## Phase 5 — Update Style Guide

**`style-guide.ts`:** Import `FieldMessageDirective` from `@shared/directives`, add to `imports` array.

**`style-guide.html`:** In the Forms tab, add a new "Field Messages" card after the Text Inputs card that demonstrates:
1. A hint with short text (no ellipsis — tooltip disabled)
2. A hint with long text that truncates (tooltip active on hover)
3. A style note explaining the `appFieldMessage` directive pattern

Also apply `appFieldMessage` to the existing `<mat-hint>` and `<mat-error>` in the Text Inputs card.

## Phase 6 — Unit Tests

**File:** `SeventySix.Client/src/app/shared/directives/field-message.directive.spec.ts`

Tests:
- Directive instantiates and applies host styles
- `tooltip.disabled = true` when text fits (scrollWidth ≤ clientWidth)
- `tooltip.disabled = false` when text overflows (scrollWidth > clientWidth)
- `tooltip.message` equals the element's `textContent.trim()`
- `tooltip.touchGestures` is `"on"`

## Phase 7 — Format + Test Gate

```bash
npm run format:client
npm run test:client
```

Expected: all existing tests pass, new spec file passes.

