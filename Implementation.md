# Implementation Plan: Angular Material Form Validation Error Messages

> **Principles**: KISS, DRY, YAGNI | **Testing**: TDD with 80/20 rule | **Logging**: Warning/Error only

---

## ULTRATHINK Analysis

### Problem Statement

The current codebase uses repetitive `@if` blocks with `hasError()` checks for displaying `<mat-error>` messages. This pattern violates DRY and KISS principles:

```html
<!-- Current Code Smell Pattern -->
@if (accountDetailsForm.get("fullName")?.hasError("required")) {
<mat-error>Display name is required</mat-error>
} @if (accountDetailsForm.get("fullName")?.hasError("maxlength")) {
<mat-error>Display name must not exceed 100 characters</mat-error>
}
```

**Issues Identified:**

| #   | Issue                     | Impact                                                             |
| --- | ------------------------- | ------------------------------------------------------------------ |
| 1   | **DRY Violation**         | Same pattern repeated 20+ times across 4 files                     |
| 2   | **Maintenance Burden**    | Adding new validations requires changes in multiple places         |
| 3   | **Inconsistent Messages** | Error messages vary for same validation type                       |
| 4   | **Template Bloat**        | Each field needs 3-5 `@if` blocks                                  |
| 5   | **Dead Code**             | `user-detail.ts` has `getFieldError()` method not used in template |

### Research Findings - Angular 20 Best Practices

Based on Angular Material documentation and Angular 20 reactive forms:

1. **Angular Material `<mat-form-field>`** automatically shows/hides `<mat-error>` based on control validity and touch state
2. **`hasError()` method** is the standard API for checking specific errors
3. **Recommended patterns:**
    - Use a **single `<mat-error>` per field** (Angular Material shows only one at a time)
    - Centralize error message logic in **utility functions** or **pipes**
    - Use **error message constants** for consistency
4. **The existing `getFieldError()` method in `user-detail.ts`** is the right approach but needs to be extracted to shared code

### Decision: Pipe vs Utility Function

| Approach                       | Pros                                 | Cons                                   |
| ------------------------------ | ------------------------------------ | -------------------------------------- |
| **Impure Pipe**                | Clean template syntax                | Performance cost (runs every CD cycle) |
| **Utility + Component Method** | Better performance, explicit control | Slightly more boilerplate              |

**Decision:** Use **utility function** called via component method. Avoids impure pipe performance issues while still centralizing logic. This follows KISS - no magic, easy to understand and debug.

---

## Implementation Plan

### Phase 1: Create Shared Error Message Utilities

#### Task 1.1: Create Validation Error Constants

**File:** `SeventySix.Client/src/app/shared/constants/validation-error.constants.ts`

**Purpose:** Centralize all error message templates for consistency

```typescript
/**
 * Validation error message templates.
 * Use {field} placeholder for field name substitution.
 * Functions receive the Angular validation error object as params.
 */
export type ValidationMessageTemplate = string | ((params: Record<string, unknown>) => string);

export const VALIDATION_ERROR_MESSAGES: Record<string, ValidationMessageTemplate> = {
	required: "{field} is required",
	email: "Invalid email format",
	minlength: (params: Record<string, unknown>) => `{field} must be at least ${params["requiredLength"]} characters`,
	maxlength: (params: Record<string, unknown>) => `{field} must not exceed ${params["requiredLength"]} characters`,
	pattern: "{field} format is invalid",
	min: (params: Record<string, unknown>) => `{field} must be at least ${params["min"]}`,
	max: (params: Record<string, unknown>) => `{field} must not exceed ${params["max"]}`,
	usernameTaken: "Username is already taken",
};
```

**Note:** `matchField` removed per YAGNI - not currently used. Add when needed.

#### Task 1.2: Create `getValidationError()` Utility Function

**File:** `SeventySix.Client/src/app/shared/utilities/validation-error.utilities.ts`

**Purpose:** Reusable function to extract first error message from a form control

```typescript
import { AbstractControl } from "@angular/forms";
import { VALIDATION_ERROR_MESSAGES, ValidationMessageTemplate } from "../constants/validation-error.constants";

/**
 * Gets the first validation error message for a form control.
 * Returns null if control is valid or has no errors.
 */
export function getValidationError(control: AbstractControl | null | undefined, fieldLabel: string): string | null {
	if (!control?.errors) {
		return null;
	}

	const errorKeys: string[] = Object.keys(control.errors);
	if (errorKeys.length === 0) {
		return null;
	}

	const firstErrorKey: string = errorKeys[0];
	const errorValue: unknown = control.errors[firstErrorKey];
	const messageTemplate: ValidationMessageTemplate | undefined = VALIDATION_ERROR_MESSAGES[firstErrorKey];

	if (!messageTemplate) {
		// Fallback for custom validators with message property
		if (typeof errorValue === "object" && errorValue !== null && "message" in errorValue) {
			return (errorValue as { message: string }).message;
		}
		return `${fieldLabel} is invalid`;
	}

	if (typeof messageTemplate === "function") {
		const params: Record<string, unknown> = typeof errorValue === "object" && errorValue !== null ? (errorValue as Record<string, unknown>) : {};
		return messageTemplate(params).replace("{field}", fieldLabel);
	}

	return messageTemplate.replace("{field}", fieldLabel);
}
```

---

### Phase 2: Refactor Components to Use Shared Utility

Each form component will add a simple wrapper method that calls the shared utility.

#### Task 2.1: Update `user-create.ts`

Add method to component:

```typescript
/**
 * Gets validation error message for a form field.
 */
protected getFieldError(
	formGroup: FormGroup,
	fieldName: string,
	fieldLabel: string
): string | null
{
	return getValidationError(formGroup.get(fieldName), fieldLabel);
}
```

Import: `import { getValidationError } from "@shared/utilities/validation-error.utilities";`

#### Task 2.2: Update `profile.ts`

Same pattern as above.

#### Task 2.3: Refactor `user-detail.ts`

**CRITICAL CODE CLEANUP:** Remove the existing `getFieldError()` and `getFieldLabel()` methods (lines ~312-365) and replace with the shared utility pattern. This eliminates ~50 lines of duplicated code.

**Remove these methods:**

-   `getFieldError(fieldName: string): string | null`
-   `getFieldLabel(fieldName: string): string`
-   `hasFieldError(fieldName: string): boolean`

**Replace with:**

```typescript
/**
 * Gets validation error message for a form field.
 */
protected getFieldError(
	fieldName: string,
	fieldLabel: string
): string | null
{
	return getValidationError(this.userForm.get(fieldName), fieldLabel);
}
```

---

### Phase 3: Refactor Templates

#### Current Pattern (To Replace)

```html
@if (basicInfoForm.get("username")?.hasError("required")) {
<mat-error>Username is required</mat-error>
} @if (basicInfoForm.get("username")?.hasError("minlength")) {
<mat-error>Username must be at least 3 characters</mat-error>
} @if (basicInfoForm.get("username")?.hasError("maxlength")) {
<mat-error>Username must not exceed 50 characters</mat-error>
} @if (basicInfoForm.get("username")?.hasError("usernameTaken")) {
<mat-error>Username is already taken</mat-error>
}
```

#### New Pattern (Replacement)

```html
<mat-error> {{ getFieldError(basicInfoForm, "username", "Username") }} </mat-error>
```

**Reduction:** 16 lines → 3 lines per field (81% reduction)

---

### Phase 4: Files to Update

#### 4.1 `user-create.html` (Highest Priority)

**Location:** `SeventySix.Client/src/app/features/admin/users/user-create/`

**Fields to refactor:**

-   `username` (4 error checks → 1)
-   `email` (3 error checks → 1)
-   `fullName` (2 error checks → 1)

**Changes needed:**

1. Add `getFieldError()` method to `user-create.ts`
2. Add import for `getValidationError` utility
3. Replace all `@if` + `<mat-error>` blocks with single `<mat-error>`

#### 4.2 `user-detail.html`

**Location:** `SeventySix.Client/src/app/features/admin/users/user-detail/`

**Fields to refactor:**

-   `username` (3 error checks → 1)
-   `email` (3 error checks → 1)
-   `fullName` (1 error check → 1)

**Code Cleanup:** Remove `getFieldError()`, `getFieldLabel()`, and `hasFieldError()` methods (~50 lines).

#### 4.3 `profile.html`

**Location:** `SeventySix.Client/src/app/features/account/profile/`

**Fields to refactor:**

-   `email` (2 error checks → 1)

#### 4.4 `style-guide.html` (Optional - Documentation Only)

**Location:** `SeventySix.Client/src/app/features/developer/style-guide/`

**Note:** This is a demo page. Update example to show the new pattern if time permits.

---

### Phase 5: Implementation Checklist (TDD Order)

Following TDD: Write failing test first, then implement.

| #   | Task                                              | File(s)                                               | Status |
| --- | ------------------------------------------------- | ----------------------------------------------------- | ------ |
| 1   | **TEST**: Create unit tests for utility (3 tests) | `shared/utilities/validation-error.utilities.spec.ts` | ⬜     |
| 2   | Create validation error constants                 | `shared/constants/validation-error.constants.ts`      | ⬜     |
| 3   | Create validation error utility function          | `shared/utilities/validation-error.utilities.ts`      | ⬜     |
| 4   | Run tests - verify passing                        | -                                                     | ⬜     |
| 5   | Refactor user-create.ts (add method + import)     | `features/admin/users/user-create/`                   | ⬜     |
| 6   | Refactor user-create.html                         | `features/admin/users/user-create/`                   | ⬜     |
| 7   | Refactor user-detail.ts (replace + cleanup)       | `features/admin/users/user-detail/`                   | ⬜     |
| 8   | Refactor user-detail.html                         | `features/admin/users/user-detail/`                   | ⬜     |
| 9   | Refactor profile.ts (add method + import)         | `features/account/profile/`                           | ⬜     |
| 10  | Refactor profile.html                             | `features/account/profile/`                           | ⬜     |
| 11  | Export from barrel file                           | `shared/utilities/index.ts`                           | ⬜     |
| 12  | Run all tests                                     | `npm test`                                            | ⬜     |

**Removed from checklist per YAGNI:**

-   ❌ ValidationErrorPipe (not needed - using component methods)
-   ❌ STYLE_GUIDE.md update (low value)
-   ❌ style-guide.html update (demo page, optional)

---

## Testing Strategy (80/20 Rule)

### Unit Tests for Utility Function

**File:** `shared/utilities/validation-error.utilities.spec.ts`

Only test the **critical paths** - 3 tests total:

```typescript
import { FormControl, Validators } from "@angular/forms";
import { getValidationError } from "./validation-error.utilities";

describe("getValidationError", () => {
	it("should return null when control has no errors", () => {
		const control: FormControl = new FormControl("valid");

		const result: string | null = getValidationError(control, "Field");

		expect(result).toBeNull();
	});

	it("should return required message with field label", () => {
		const control: FormControl = new FormControl("", Validators.required);

		const result: string | null = getValidationError(control, "Email");

		expect(result).toBe("Email is required");
	});

	it("should return minlength message with character count", () => {
		const control: FormControl = new FormControl("ab", Validators.minLength(3));

		const result: string | null = getValidationError(control, "Username");

		expect(result).toBe("Username must be at least 3 characters");
	});
});
```

**Why only 3 tests:**

-   Tests cover null case, simple template, and function template
-   Other validators follow same patterns (maxlength, min, max, etc.)
-   If required + minlength work, the mechanism is proven
-   Testing every validator would be exhaustive edge-case testing (violates 80/20)

**NOT testing:**

-   ❌ Every validator type (YAGNI)
-   ❌ Custom validator fallback (test when we have a custom validator)
-   ❌ Null/undefined control edge cases (TypeScript handles)

---

## Final Code Reference

### validation-error.constants.ts

```typescript
/**
 * Validation error message templates.
 * Use {field} placeholder for field name substitution.
 */
export type ValidationMessageTemplate = string | ((params: Record<string, unknown>) => string);

export const VALIDATION_ERROR_MESSAGES: Record<string, ValidationMessageTemplate> = {
	required: "{field} is required",
	email: "Invalid email format",
	minlength: (params: Record<string, unknown>) => `{field} must be at least ${params["requiredLength"]} characters`,
	maxlength: (params: Record<string, unknown>) => `{field} must not exceed ${params["requiredLength"]} characters`,
	pattern: "{field} format is invalid",
	min: (params: Record<string, unknown>) => `{field} must be at least ${params["min"]}`,
	max: (params: Record<string, unknown>) => `{field} must not exceed ${params["max"]}`,
	usernameTaken: "Username is already taken",
};
```

### Template Usage Example

```html
<!-- Before: 16 lines per field -->
@if (basicInfoForm.get("username")?.hasError("required")) {
<mat-error>Username is required</mat-error>
} @if (basicInfoForm.get("username")?.hasError("minlength")) {
<mat-error>Username must be at least 3 characters</mat-error>
} @if (basicInfoForm.get("username")?.hasError("maxlength")) {
<mat-error>Username must not exceed 50 characters</mat-error>
} @if (basicInfoForm.get("username")?.hasError("usernameTaken")) {
<mat-error>Username is already taken</mat-error>
}

<!-- After: 3 lines per field -->
<mat-error> {{ getFieldError(basicInfoForm, "username", "Username") }} </mat-error>
```

---

## Extensibility

### Adding New Validators

1. Add error key to `VALIDATION_ERROR_MESSAGES` constant:

```typescript
myCustomValidator: (params: Record<string, unknown>) => `{field} failed: ${params["reason"]}`;
```

2. That's it! All components using the utility automatically pick it up.

### Custom Per-Field Messages

If a specific field needs a unique message, override with `@if`:

```html
@if (form.get("specialField")?.hasError("customError")) {
<mat-error>Custom message only for this field</mat-error>
} @else {
<mat-error>{{ getFieldError(form, "specialField", "Special Field") }}</mat-error>
}
```

---

## Summary

| Metric                    | Before             | After                         | Improvement       |
| ------------------------- | ------------------ | ----------------------------- | ----------------- |
| Lines per field (avg)     | 12                 | 3                             | **75% reduction** |
| Total template lines      | ~150               | ~40                           | **73% reduction** |
| Validation logic location | 4 templates + 1 TS | 2 shared files                | **Centralized**   |
| Adding new validator      | Edit all templates | Edit 1 constant file          | **Single change** |
| Message consistency       | Manual             | Guaranteed                    | **Standardized**  |
| Dead code removed         | N/A                | ~50 lines from user-detail.ts | **Cleanup**       |

---

## Decision Log

| Decision                           | Rationale                                                          |
| ---------------------------------- | ------------------------------------------------------------------ |
| Utility function over Pipe         | Avoids impure pipe performance cost; explicit is better than magic |
| Component method wrapper           | Keeps template syntax clean while avoiding pipe overhead           |
| 3 unit tests only                  | 80/20 rule - covers critical paths without exhaustive edge cases   |
| Remove `matchField` from constants | YAGNI - not currently used; add when needed                        |
| Skip STYLE_GUIDE.md update         | Low value; code is self-documenting                                |
| Delete `getFieldLabel()` method    | Unused after refactor; field labels passed as parameters           |

---

## Next Steps (Execution Order)

1. **TDD**: Write failing tests for utility function
2. Create `validation-error.constants.ts`
3. Create `validation-error.utilities.ts`
4. Run tests - verify passing
5. Refactor `user-create.ts` + `user-create.html` (highest impact)
6. Refactor `user-detail.ts` + `user-detail.html` (includes ~50 line cleanup)
7. Refactor `profile.ts` + `profile.html`
8. Export from barrel file
9. Final test run: `npm test`
