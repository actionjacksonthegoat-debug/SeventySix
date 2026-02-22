# Implementation 6 — Style Guide Comprehensive Pass

> **Scope**: Fix form input alignment, skeleton table demo, and perform a full
> style guide review pass for layout, visual polish, and documentation accuracy.

---

## ⚠️ GATE CONDITION

> - `npm run test:client` → `X passed`
> - Visual correctness confirmed in style guide

---

## Phase 1 — Fix Form Input Alignment

**File:** `style-guide.scss`

Inside `.form-grid`, add `mat-form-field { width: 100%; }` so all form fields
stretch to fill their grid columns — prevents narrow fields from misaligning
with taller fields in adjacent columns.

## Phase 2 — Improve Skeleton Table Section

**`style-guide.html` — Container Elements card:**

Replace the bare single-cell `SKELETON_TABLE_CELL` demo item with a
`skeleton-table-row` row showing 4 cells side by side — this demonstrates the
component as it's actually used in a real table row context.

## Phase 3 — Fix Table Loading State Composite Example

**`style-guide.html` — Composite Examples / Table Loading State card:**

Add a `.skeleton-table-row` header row above the `@for` loop of 3 data rows.
Use `skeletonTitle` (shorter, bolder) for the header cells to visually
distinguish them from data cells.

## Phase 4 — Full Style Guide Polish Pass

Review all tab content for:
- Missing `width: 100%` on any standalone `mat-form-field` outside `.form-grid`
- Any cards without consistent `margin-bottom`
- Code snippets that don't match current API
- Style notes that reference outdated patterns

## Phase 5 — Format + Test Gate

```bash
npm run format:client
npm run test:client
```

