# Angular 20+ Quick Reference

> **Full documentation**: `.claude/CLAUDE.md`

---

## Critical Rules

| Rule         | ✅ Do                         | ❌ Don't                   |
| ------------ | ----------------------------- | -------------------------- |
| Types        | `const x: string = ""`        | `const x = ""`             |
| DI           | `inject(Service)`             | `constructor(private svc)` |
| Detection    | `OnPush`                      | `Default`                  |
| Inputs       | `input.required<T>()`         | `@Input()`                 |
| Outputs      | `output<T>()`                 | `@Output() EventEmitter`   |
| Control Flow | `@if`, `@for`                 | `*ngIf`, `*ngFor`          |
| Zone         | Zoneless only                 | Zone.js, NgZone, fakeAsync |
| Host         | `host: { '(click)': 'fn()' }` | `@HostListener`            |
| Classes      | `[class.active]="isActive()"` | `[ngClass]`                |
| Templates    | `computed()`, pre-compute     | Method calls               |
| Cleanup      | `takeUntilDestroyed()`        | Manual subscriptions       |

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
		}
	`,
	host: { "(click)": "onClick()", "[class.active]": "isActive()" },
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

## Change Detection Performance

**NEVER call methods in templates** - they run on EVERY CD cycle.

```typescript
// ❌ WRONG - Runs on every CD
<div [class]="getClass(item)">{{ formatValue(item) }}</div>

// ✅ CORRECT - Computed signals (memoized)
itemClass = computed(() => this.computeClass(this.item()));
formattedValue = computed(() => this.format(this.item()));

// ✅ CORRECT - Pre-compute for lists
readonly processedItems: Signal<ProcessedItem[]> = computed(() =>
	this.items().map((item) => ({
		...item,
		cssClass: getItemClass(item.status),
		formattedValue: formatValue(item)
	}))
);
```

**When method calls are OK (KISS)**: Column visibility toggles, action menus (small arrays, not per-row).

---

## SCSS Rules

| Rule          | ✅ Do                       | ❌ Don't         |
| ------------- | --------------------------- | ---------------- |
| Sizing        | `rem` via `vars.$spacing-*` | `px` for spacing |
| Colors        | `var(--color-info)` etc.    | Hardcoded hex    |
| Repeated CSS  | `@include mixins.*`         | Copy-paste 3x    |
| PX exceptions | border, radius, shadow      | padding, margin  |

---

## Path Aliases

| Alias               | Path                       |
| ------------------- | -------------------------- |
| `@infrastructure/*` | `src/app/infrastructure/*` |
| `@shared/*`         | `src/app/shared/*`         |
| `@admin/*`          | `src/app/features/admin/*` |
| `@game/*`           | `src/app/features/game/*`  |

**Rule**: Features import from `@infrastructure/` and `@shared/` only. Never cross-feature.

---

## Service Scoping (CRITICAL)

| Service Type     | Scope                | Example                        |
| ---------------- | -------------------- | ------------------------------ |
| Cross-cutting    | `providedIn: 'root'` | `LoggerService`, `ApiService`  |
| Feature-specific | Route `providers`    | `UserService`, `LogRepository` |

```typescript
// ❌ Feature service in root = memory leak
@Injectable({ providedIn: "root" })
export class UserService { }

// ✅ Route-scoped (bounded context)
@Injectable()
export class UserService { }

// In routes:
{ path: "users", providers: [UserService, UserRepository], loadComponent: ... }
```

---

## Test Pattern (Zoneless)

```typescript
beforeEach(async () => {
	await TestBed.configureTestingModule({
		imports: [UserComponent],
		providers: [provideZonelessChangeDetection(), provideHttpClientTesting()],
	}).compileComponents();
});

it("should display user", async () => {
	const fixture: ComponentFixture<UserComponent> = TestBed.createComponent(UserComponent);
	fixture.componentRef.setInput("user", { name: "Test" });
	await fixture.whenStable();
	fixture.detectChanges();
	expect(fixture.nativeElement.textContent).toContain("Test");
});
```

---

## File Naming

| Type       | Pattern                 | Example                  |
| ---------- | ----------------------- | ------------------------ |
| Component  | `feature.component.ts`  | `user-list.component.ts` |
| Service    | `feature.service.ts`    | `user.service.ts`        |
| Repository | `feature.repository.ts` | `user.repository.ts`     |
| Routes     | `feature.routes.ts`     | `admin.routes.ts`        |
| Utilities  | `feature.utilities.ts`  | `log.utilities.ts`       |
