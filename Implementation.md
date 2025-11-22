# Implementation Plan: Style Guide Color Palette Theme Correction

## 🧠 PROBLEM ANALYSIS (KISS Principle)

### The Issue

Color swatches in the Style Guide's "Colors" tab all look the same because they only show one color variant per role (Primary, Secondary, Tertiary, Error). Material Design 3 provides multiple color variants that make themes visually distinct.

### Current State

-   **Blue theme**: Blue primary + Green tertiary
-   **Cyan-Orange theme**: Cyan primary + Orange tertiary
-   **Current display**: Single swatch per color role (not enough to see theme differences)

### Solution (Keep It Simple)

Show 2-3 key color variants per role instead of just one:

-   **Base color** (e.g., `--mat-sys-primary`)
-   **Container color** (e.g., `--mat-sys-primary-container`)
-   **On-color** for text contrast demonstration (e.g., text using `--mat-sys-on-primary`)

This minimal set will clearly differentiate themes without over-engineering.

---

## 📋 IMPLEMENTATION STEPS (DRY + YAGNI Principles)

### Step 1: Update HTML Template

**File**: `style-guide.component.html` (lines 47-93)

**What to change**: For each color card (Primary, Secondary, Tertiary, Error), replace the single swatch with 2-3 swatches showing base color + container variant.

**YAGNI**: Don't add Surface colors or extra variants unless needed. The 4 existing cards are sufficient.

**DRY**: All 4 cards follow the same pattern - update one, then copy the pattern.

**Pattern** (repeat for all 4 color roles):

```html
<mat-card class="color-card">
	<mat-card-header>
		<mat-card-title>Primary</mat-card-title>
	</mat-card-header>
	<mat-card-content>
		<div class="color-swatches">
			<div class="color-swatch primary">
				<span>Primary</span>
			</div>
			<div class="color-swatch primary-container">
				<span>Container</span>
			</div>
		</div>
		<p class="mat-body-2">Main brand color for primary actions</p>
	</mat-card-content>
</mat-card>
```

**CSS Variables needed**:

-   Primary: `--mat-sys-primary`, `--mat-sys-primary-container`
-   Secondary: `--mat-sys-secondary`, `--mat-sys-secondary-container`
-   Tertiary: `--mat-sys-tertiary`, `--mat-sys-tertiary-container` (shows theme difference!)
-   Error: `--mat-sys-error`, `--mat-sys-error-container`

---

### Step 2: Update SCSS Styling

**File**: `style-guide.component.scss` (lines 58-87)

**Add at top** (CRITICAL):

```scss
@use "variables" as vars;
```

**Update styles** (keep simple, avoid over-engineering):

```scss
.color-swatches {
	display: flex;
	gap: vars.$spacing-md;
	margin-bottom: vars.$spacing-sm;
}

.color-swatch {
	flex: 1;
	height: 80px;
	border-radius: vars.$border-radius-base;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid rgba(var(--mat-outline-rgb), 0.12);

	span {
		font-size: 12px;
		font-weight: 500;
		padding: vars.$spacing-xs;
		border-radius: vars.$border-radius-base;
		background: rgba(0, 0, 0, 0.1);
	}

	&.primary {
		background-color: var(--mat-sys-primary);
		span {
			color: var(--mat-sys-on-primary);
		}
	}

	&.primary-container {
		background-color: var(--mat-sys-primary-container);
		span {
			color: var(--mat-sys-on-primary-container);
		}
	}

	// Repeat for secondary, tertiary, error
}

// Responsive (mobile)
@media #{vars.$breakpoint-mobile} {
	.color-swatches {
		flex-direction: column;
	}
}
```

**KISS**: Simple flexbox layout, no complex grid calculations.
**DRY**: Same pattern for all color roles, just change the CSS variable names.

---

### Step 3: Test Visually

Test the 4 theme combinations:

1. Blue + Light
2. Blue + Dark
3. Cyan-Orange + Light
4. Cyan-Orange + Dark

**Expected**: Tertiary colors should clearly show green (blue theme) vs. orange (cyan-orange theme).

---

### Step 4: Add Inline Comments (If Time Permits)

Add JSDoc to component.ts only if there's new TypeScript code. Since this is purely HTML/CSS, skip unless complexity requires it.

---

## ✅ COMPLIANCE CHECKLIST

### KISS (Keep It Simple, Stupid)

-   ✅ Minimal changes: Just add 1-2 extra swatches per color card
-   ✅ No new components or complex data models
-   ✅ Use existing Material Design 3 CSS variables (no custom color logic)
-   ✅ Simple flexbox layout (no complex grid calculations)
-   ✅ No TypeScript changes needed (purely presentational)

### DRY (Don't Repeat Yourself)

-   ✅ Same HTML pattern for all 4 color cards (copy/paste with variable names changed)
-   ✅ Same SCSS pattern for all color variants (one mixin-like structure)
-   ✅ Reuse existing `vars.$spacing-*` and `vars.$border-radius-*` variables
-   ✅ No duplicate color definitions (use Material's CSS variables)

### YAGNI (You Aren't Gonna Need It)

-   ❌ Don't add Surface color card (not requested, adds complexity)
-   ❌ Don't create TypeScript data model unless HTML becomes unmanageable
-   ❌ Don't add copy-to-clipboard, hex codes, or other fancy features
-   ❌ Don't add extra color variants beyond base + container
-   ❌ Don't create new documentation files (use inline comments only)
-   ✅ Build what's needed: Show theme differences clearly with minimal changes

### Formatting (.editorconfig)

-   ✅ Use tabs (indent_size=4) for all files
-   ✅ Use LF line endings for client files
-   ✅ No trailing whitespace
-   ✅ UTF-8 encoding

### Required Standards

-   ✅ **CRITICAL**: Add `@use "variables" as vars;` to SCSS
-   ✅ Use `vars.$spacing-*` for all spacing (8px grid system)
-   ✅ Use `vars.$border-radius-*` for border radius
-   ✅ Use `vars.$breakpoint-*` for responsive breakpoints
-   ✅ Material Design 3 CSS variables for colors

---

## 🎯 QUICK IMPLEMENTATION CHECKLIST

### HTML Updates (30 min)

-   [ ] Update Primary card: Add base + container swatches
-   [ ] Update Secondary card: Copy Primary pattern, change CSS variable names
-   [ ] Update Tertiary card: Copy Primary pattern, change CSS variable names
-   [ ] Update Error card: Copy Primary pattern, change CSS variable names

### SCSS Updates (20 min)

-   [ ] Add `@use "variables" as vars;` at top
-   [ ] Add `.color-swatches` flexbox container with `vars.$spacing-md` gap
-   [ ] Update `.color-swatch` with height, border-radius, flex layout
-   [ ] Add background colors for all variants (primary, primary-container, etc.)
-   [ ] Add text colors (on-primary, on-primary-container, etc.)
-   [ ] Add mobile responsive using `vars.$breakpoint-mobile`

### Testing (15 min)

-   [ ] Test Blue Light theme (blue primary, green tertiary)
-   [ ] Test Cyan-Orange Light theme (cyan primary, orange tertiary)
-   [ ] Toggle Dark mode and verify colors change
-   [ ] Test on mobile width (< 600px)

### Validation

-   [ ] No console errors
-   [ ] Theme switching works smoothly
-   [ ] Colors are visually distinct between themes

**Total Time**: ~1 hour (KISS principle in action)

---

## 📚 REFERENCE

### CSS Variables to Use

```scss
// Material Design 3 System Color Tokens (auto-generated by Angular Material)
// These variables are ALWAYS available and change based on the active theme

// For each color role, use base + container variant:
--mat-sys-primary / --mat-sys-primary-container
--mat-sys-secondary / --mat-sys-secondary-container
--mat-sys-tertiary / --mat-sys-tertiary-container (shows blue vs cyan-orange difference!)
--mat-sys-error / --mat-sys-error-container

// For text on colors (proper contrast):
--mat-sys-on-primary / --mat-sys-on-primary-container
--mat-sys-on-secondary / --mat-sys-on-secondary-container
--mat-sys-on-tertiary / --mat-sys-on-tertiary-container
--mat-sys-on-error / --mat-sys-on-error-container

// Other useful system tokens:
--mat-sys-surface / --mat-sys-on-surface
--mat-sys-surface-variant / --mat-sys-on-surface-variant
--mat-sys-outline / --mat-sys-outline-variant
```

**Best Practice**: ALWAYS use these CSS variables instead of hex colors. They automatically update when themes change.

### Files to Edit

1. `style-guide.component.html` (lines 47-93)
2. `style-guide.component.scss` (lines 58-87)

---

**Implementation Plan**: November 22, 2025
**Estimated Time**: ~1 hour (following KISS, DRY, YAGNI)
**Complexity**: Low (simple HTML/CSS changes)
**Risk**: Minimal (isolated to one component)

---

_This refined plan follows KISS (minimal changes), DRY (reusable patterns), and YAGNI (no unnecessary features) principles from CLAUDE.md._
