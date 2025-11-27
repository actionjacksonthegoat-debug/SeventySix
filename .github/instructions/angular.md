# Angular 20+ Quick Reference

> **Full documentation**: See `.claude/CLAUDE.md` for comprehensive Angular guidelines.

---

## Critical Rules Summary

| Rule         | ✅ Do                         | ❌ Don't                       |
| ------------ | ----------------------------- | ------------------------------ |
| Types        | `const x: string = ""`        | `const x = ""`                 |
| DI           | `inject(Service)`             | `constructor(private svc)`     |
| Detection    | `OnPush`                      | `Default`                      |
| Inputs       | `input.required<T>()`         | `@Input()`                     |
| Outputs      | `output<T>()`                 | `@Output() EventEmitter`       |
| Control Flow | `@if`, `@for`                 | `*ngIf`, `*ngFor`              |
| Zone         | Zoneless only                 | Zone.js, NgZone, fakeAsync     |
| Host         | `host: { '(click)': 'fn()' }` | `@HostListener('click')`       |
| Classes      | `[class.active]="isActive()"` | `[ngClass]="{ active: x }"`    |
| Styles       | `[style.color]="color()"`     | `[ngStyle]="{ color: x }"`     |
| Cleanup      | `takeUntilDestroyed()`        | Manual subscription management |
| Config       | `environment.ts`              | Hardcoded values               |

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

## File Naming

| Type       | Pattern                 | Example                  |
| ---------- | ----------------------- | ------------------------ |
| Component  | `feature.component.ts`  | `user-list.component.ts` |
| Service    | `feature.service.ts`    | `user.service.ts`        |
| Repository | `feature.repository.ts` | `user.repository.ts`     |
| Model      | `feature.model.ts`      | `user.model.ts`          |

