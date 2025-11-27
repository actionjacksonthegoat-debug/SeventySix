# Angular 20+ Quick Reference

> **Full documentation**: See `.claude/CLAUDE.md` for comprehensive Angular guidelines.

---

## Critical Rules Summary

| Rule          | ✅ Do                         | ❌ Don't                       |
| ------------- | ----------------------------- | ------------------------------ |
| Types         | `const x: string = ""`        | `const x = ""`                 |
| DI            | `inject(Service)`             | `constructor(private svc)`     |
| Detection     | `OnPush`                      | `Default`                      |
| Inputs        | `input.required<T>()`         | `@Input()`                     |
| Outputs       | `output<T>()`                 | `@Output() EventEmitter`       |
| Control Flow  | `@if`, `@for`                 | `*ngIf`, `*ngFor`              |
| Zone          | Zoneless only                 | Zone.js, NgZone, fakeAsync     |
| Host          | `host: { '(click)': 'fn()' }` | `@HostListener('click')`       |
| Classes       | `[class.active]="isActive()"` | `[ngClass]="{ active: x }"`    |
| Styles        | `[style.color]="color()"`     | `[ngStyle]="{ color: x }"`     |
| Cleanup       | `takeUntilDestroyed()`        | Manual subscription management |
| Config        | `environment.ts`              | Hardcoded values               |
| Status colors | `var(--color-info)`, etc.     | Hardcoded hex values           |
| **CSS Units** | `rem` for all sizing          | `px` (except border/radius)    |

---

## 🚨 SCSS Semantic Status Colors (CRITICAL)

**ALWAYS use CSS custom properties for notifications, badges, status indicators (theme-aware):**

**Dark Mode (`:root`, `html.dark-theme`):** Info=`primary-container`, Success=`primary`, Warning=`error`, Error=`error-container`
**Light Mode (`html.light-theme`):** Info=`primary-container`, Success=`primary`, Warning=`error-container`, Error=`error`

| CSS Variable      | Usage                |
| ----------------- | -------------------- |
| `--color-info`    | Informational, debug |
| `--color-success` | Success, positive    |
| `--color-warning` | Warnings, caution    |
| `--color-error`   | Errors, destructive  |
| `--color-on-*`    | Text on backgrounds  |

```scss
// ✅ CORRECT - Theme-aware CSS custom properties
.badge {
	background-color: var(--color-info);
	color: var(--color-on-info);
}

// ❌ WRONG - Never hardcode
.badge {
	background-color: #2196f3;
}
```

---

## 🚨 REM Units for Sizing (CRITICAL)

**ALWAYS use `rem` for sizing. NEVER use `px` except for borders, border-radius, and shadows.**

| ✅ Use REM for         | ❌ PX only for (exceptions)     |
| ---------------------- | ------------------------------- |
| Spacing/padding/margin | Border widths (`1px solid`)     |
| Font sizes             | Border radius (`8px`, `12px`)   |
| Widths/heights         | Box shadows (`0 2px 4px`)       |
| Gap                    | Breakpoints (`960px`)           |
| Container sizes        | Outline widths for focus states |

```scss
@use "variables" as vars;

// ✅ CORRECT - REM via SCSS variables
.component {
	padding: vars.$spacing-lg; // 1rem
	margin: vars.$spacing-xl; // 1.5rem
	font-size: vars.$font-size-base; // 0.875rem
	max-width: vars.$container-width-md; // 60rem
}

// ✅ CORRECT - PX only for exceptions
.card {
	border: 1px solid var(--border-color);
	border-radius: 12px;
}

// ❌ WRONG - PX for sizing (FORBIDDEN)
.component {
	padding: 16px; // Should be vars.$spacing-lg
	font-size: 14px; // Should be vars.$font-size-base
}
```

**PX to REM**: `rem = px / 16` → `8px = 0.5rem`, `16px = 1rem`, `24px = 1.5rem`

---

## 🚨 SCSS Mixins & DRY (CRITICAL)

**ALWAYS prefer mixins over repeated CSS patterns.** Extract after 3rd occurrence.

| Pattern        | Use Mixin                          | Instead of                      |
| -------------- | ---------------------------------- | ------------------------------- |
| Icon sizing    | `@include mixins.icon-size($size)` | Repeated font-size/width/height |
| Loading states | `@include mixins.loading-state()`  | Repeated flex center layout     |
| Page headers   | `@include mixins.page-header()`    | Repeated header patterns        |
| Scrollbars     | `@include vars.custom-scrollbar()` | Repeated scrollbar CSS          |

```scss
@use "mixins" as mixins;

// ✅ CORRECT - Use mixin
.loading {
	@include mixins.loading-state();
}

// ❌ WRONG - Repeated pattern
.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	// ... repeated 5+ times across files
}
```

---

## Path Aliases

| Alias               | Path                       |
| ------------------- | -------------------------- |
| `@infrastructure/*` | `src/app/infrastructure/*` |
| `@shared/*`         | `src/app/shared/*`         |
| `@admin/*`          | `src/app/features/admin/*` |
| `@game/*`           | `src/app/features/game/*`  |
| `@home/*`           | `src/app/features/home/*`  |

**Feature Boundary Rule**: Features ONLY import from `@infrastructure/` and `@shared/`, NEVER from other features.

---

## Component Pattern

```typescript
@Component({
	selector: "app-user-card",
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (user()) {
		<div [class.active]="isActive()">{{ user()!.name }}</div>
		} @for (item of items(); track item.id) {
		<app-item [item]="item" />
		} @empty {
		<div>No items</div>
		}
	`,
	host: {
		"(click)": "onClick()",
		"[class.active]": "isActive()",
	},
})
export class UserCardComponent {
	private readonly service: UserService = inject(UserService);

	user = input.required<User>();
	items = input<Item[]>([]);
	selected = output<User>();

	isActive = computed(() => this.user()?.isActive ?? false);
}
```

---

## Test Pattern (Zoneless)

```typescript
describe("UserComponent", () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UserComponent],
			providers: [
				provideZonelessChangeDetection(), // REQUIRED
				provideHttpClientTesting(),
			],
		}).compileComponents();
	});

	it("should display user name", async () => {
		const fixture: ComponentFixture<UserComponent> = TestBed.createComponent(UserComponent);

		fixture.componentRef.setInput("user", { name: "Test" });
		await fixture.whenStable();
		fixture.detectChanges();

		expect(fixture.nativeElement.textContent).toContain("Test");
	});
});
```

---

## 🚨 Change Detection Performance (CRITICAL)

**NEVER** call methods directly in templates that run on every change detection cycle:

```typescript
// ❌ WRONG - Method called on EVERY change detection
<div [class]="getClass(item)">  // Runs repeatedly!
<span>{{ formatValue(item) }}</span>  // Runs repeatedly!
@if (shouldShow(item)) { ... }  // Runs repeatedly!

// ✅ CORRECT - Use computed signals (memoized)
class MyComponent {
    // Pre-compute in component
    itemClass = computed(() => this.computeClass(this.item()));
    formattedValue = computed(() => this.format(this.item()));
    shouldShow = computed(() => this.checkVisibility(this.item()));
}

// ✅ CORRECT - Use pure pipes for formatting
<span>{{ item | dateFormat }}</span>

// ✅ CORRECT - Pre-compute in @for with track
@for (item of itemsWithClass(); track item.id) {
    <div [class]="item.cssClass">{{ item.formattedValue }}</div>
}
```

**Rules:**

-   Use `computed()` signals for derived state
-   Use pure pipes for value transformations
-   Pre-compute values before iteration (map data with computed properties)
-   Use Material's built-in CSS classes instead of dynamic class methods
-   Cache expensive calculations in signals

---

## File Naming

| Type       | Pattern                 | Example                  |
| ---------- | ----------------------- | ------------------------ |
| Component  | `feature.component.ts`  | `user-list.component.ts` |
| Service    | `feature.service.ts`    | `user.service.ts`        |
| Repository | `feature.repository.ts` | `user.repository.ts`     |
| Model      | `feature.model.ts`      | `user.model.ts`          |
