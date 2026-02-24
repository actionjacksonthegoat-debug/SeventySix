---
description: Code formatting rules for all TypeScript and C# files
applyTo: "**/SeventySix.Client/src/**/*.{ts,html,scss,css},**/SeventySix.Server/**/*.cs"
---

# Formatting Instructions

> **ESLint** is the enforced lint gate for CI and completion status. **dprint** is a local-only formatting tool — not enforced in CI or GitHub Actions.

## Format Command (CRITICAL — NEVER Run dprint Directly)

> **`npm run format` is the ONLY command for formatting files. `dprint` must NEVER be run standalone.**

| [NEVER] | [ALWAYS] |
| ------- | -------- |
| Run `dprint` standalone | `npm run format` (full pipeline) |
| Run `npx dprint fmt` | `npm run format:client` (ESLint → dprint → ESLint) |
| Run `dprint` as a pre-step | Manually fix formatting during development |

**Why**: `npm run format:client` runs ESLint → dprint → ESLint in that exact order. Running `dprint` directly bypasses the ESLint pre/post passes. Run format only at the end of implementation phases, right before the test gate.

## End-of-File Newlines (CRITICAL — NO TRAILING NEWLINE)

> **Policy**: Files MUST NOT end with a newline character.

| Layer | Enforcement | Rule |
| ----- | ----------- | ---- |
| TypeScript/JS/SCSS | ESLint `@stylistic/eol-last: ["error", "never"]` | Second ESLint pass in `npm run format:client` removes any final newline dprint adds |
| C# | `.editorconfig` `insert_final_newline = false` | `dotnet format whitespace` strips final newlines |
| All files | `.editorconfig` `insert_final_newline = false` + `.vscode/settings.json` `"files.insertFinalNewline": false` | Both layers agree — VS Code's explicit setting prevents it from overriding EditorConfig |

**Why dprint doesn't conflict**: dprint runs between the two ESLint passes; the second `eslint --fix` removes the trailing newline dprint adds. **Never add `insert_final_newline` back to `.editorconfig`.**

## Variable Naming (CRITICAL - 3+ Characters)

| Context        | [NEVER]                 | [ALWAYS]                               |
| -------------- | ----------------------- | -------------------------------------- |
| Lambdas        | `x => x.Id`             | `user => user.Id`                      |
| Array methods  | `.filter(s => s.title)` | `.filter(section => section.title)`    |
| Loop variables | `for (int i = 0; ...)`  | `foreach` or `for (int index = 0;...)` |
| Destructuring  | `const { n, c } = obj`  | `const { name, config } = obj`         |

**Only Exception**: Angular dynamic imports `(m) => m.Component`

## Code Structure

| Rule           | Do                                 | Don't                  |
| -------------- | ---------------------------------- | ---------------------- |
| 2+ params      | Each on new line, indented         | Same line              |
| Lambda params  | Lambda on new line after `(`       | Lambda inline with `(` |
| Binary ops     | `\|\|`, `??` on LEFT of new line   | End of line            |
| Assignment `=` | New line after `=`, value indented | Value on same line     |
| Chains         | New line BEFORE `.`, indented      | One line               |
| Closing `)`    | On same line as last param/arg     | Alone on its own line  |

## Null Coercion (BANNED)

| [NEVER]                | [ALWAYS]                        |
| ---------------------- | ------------------------------- |
| `!!value`              | `isPresent(value)`              |
| `if (!value)`          | `if (isNullOrUndefined(value))` |
| `value \|\| "default"` | `value ?? "default"`            |
| `items?.length \|\| 0` | `items?.length ?? 0`            |

**Import**: `import { isNullOrUndefined, isPresent } from "@shared/utilities/null-check.utility";`

**Exceptions** (allowed `||` and `!`):

- Boolean comparisons: `isLoading || isError`
- Value comparisons: `if (a === "x" || b === "y")`
- Boolean negation: `!isLoading`
- Method results: `!items.includes(x)`

## Constants (No Magic Values)

| [NEVER]              | [ALWAYS]                                |
| -------------------- | --------------------------------------- |
| `{ duration: 5000 }` | `{ duration: SNACKBAR_DURATION.error }` |
| `"Developer"` inline | `RoleConstants.Developer`               |
| Repeated literal 2x+ | Extract to constant                     |

## Method Return Types (REQUIRED)

All TypeScript method and function declarations MUST have explicit return types.

| Context           | [NEVER]          | [ALWAYS]                              |
| ----------------- | ---------------- | ------------------------------------- |
| Lifecycle hooks   | `ngOnInit() {`   | `ngOnInit(): void {`                  |
| Service methods   | `getUsers() {`   | `getUsers(): Observable<UserDto[]> {` |
| Boolean accessors | `canSubmit() {`  | `canSubmit(): boolean {`              |
| Async methods     | `async save() {` | `async save(): Promise<void> {`       |
| Void handlers     | `onClick() {`    | `onClick(): void {`                   |

**Exception**: Inline arrow callbacks where return type is inferred from typed context.

## SCSS Color Patterns (CRITICAL — MD3)

> **Rule**: Angular Material 3 does NOT emit RGB-split custom properties. The `rgba(var(--mat-*-rgb), N)` pattern produces **invisible** colors and must NEVER be used.

| [NEVER] | [ALWAYS] |
| ------- | -------- |
| `rgba(var(--mat-sys-primary-rgb), 0.12)` | `color-mix(in srgb, var(--mat-sys-primary) 12%, transparent)` |
| `rgba(var(--mat-outline-rgb), 0.6)` | `color-mix(in srgb, var(--mat-sys-outline) 60%, transparent)` |
| `rgb(var(--mat-sys-primary-rgb))` | `var(--mat-sys-primary)` |
| `var(--mat-primary-default)` | `var(--mat-sys-primary)` — use stable MD3 token |

`color-mix()` is already used throughout `_base.scss` and is fully supported in all modern browsers.

### Documentation Style

C# XML doc: tags on their own lines. TypeScript: JSDoc with `@param`/`@returns` on separate lines.

## SCSS / CSS Rules (CRITICAL — Required for ALL Style Changes)

> **RULE**: Every CSS/SCSS change must be intentional, minimal, and DRY.
> Think before adding rules. Prefer reusing existing variables, mixins, or Material tokens over writing new CSS.

### Sources of Truth (use in this order)

| Source | Import | When |
|--------|--------|------|
| `_variables.scss` | `@use "variables" as vars;` | Spacing, font size, color tokens, z-index, transitions; also `truncate-text()` and `focus-visible()` mixins |
| `_mixins.scss` | `@use "mixins";` | Elevation, glassmorphism, scroll-reveal |
| Angular Material Design tokens | `var(--mat-sys-*)` | Theme colors, state layers |
| `_utilities.scss` shared classes | No import (global) | Display, flex, margin, overflow helpers |

### Forbidden Patterns

| [NEVER] | [ALWAYS] |
|---------|----------|
| Hard-coded hex colors (`#4169E1`) | `var(--mat-sys-primary)` or token from `_variables.scss` |
| Hard-coded pixel spacing (`margin: 16px`) | `vars.$spacing-md`, `vars.$spacing-lg`, etc. |
| Duplicate `display: flex; align-items: center; gap: X` blocks | Extract to a mixin or reuse an existing layout class |
| `!important` in component SCSS | Never (only allowed in `_utilities.scss` for utility classes) |
| Inline styles on HTML elements (other than `host.style` in directives) | Bind via `[style.x]` or component CSS |
| New single-component classes that duplicate shared patterns | Use shared class or mixin |
| Repeated `text-overflow: ellipsis; overflow: hidden; white-space: nowrap;` | Use `@include vars.truncate-text()` |
| Overriding Material component styles with deep selectors (`::ng-deep`) | Use `@include mat.{component}-overrides(...)` from the Material theming API |

### When Adding a New CSS Rule

1. **Search first**: `grep_search` for the property across `*.scss` — does a mixin or variable already express it?
2. **Place correctly**:
   - Shared pattern used in 2+ places → `_mixins.scss` or `_utilities.scss`
   - Component-specific, used once → component `.scss` file
   - Design token (color, spacing, z-index) → `_variables.scss`
3. **No `!important` in components** — if a Material override requires force, use the Material theming mixin API.
4. **Responsive breakpoints**: always use `vars.$breakpoint-*` variables; never hard-code `max-width` pixel values.
5. **No trailing `!important`** in component files — the formatter (ESLint pass) will flag this as a violation.
