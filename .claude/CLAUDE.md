# SeventySix Development Guidelines

> Expert guidance for Angular 20+, .NET 10+, TypeScript, and full-stack development.
> Apply SOLID, KISS, DRY, YAGNI principles.

---

## Table of Contents

1. [Code Formatting](#code-formatting)
2. [Angular Guidelines](#angular-guidelines)
3. [.NET Guidelines](#net-guidelines)
4. [SCSS Guidelines](#scss-guidelines)
5. [Testing Guidelines](#testing-guidelines)
6. [Architecture](#architecture)
7. [Quick Reference](#quick-reference)

---

## Code Formatting

> **CRITICAL**: These rules apply to ALL `.ts` and `.cs` files.

### Summary Table

| Rule             | ✅ Do                            | ❌ Don't                 |
| ---------------- | -------------------------------- | ------------------------ |
| 2+ Parameters    | Each on new line                 | Multiple on same line    |
| Binary Operators | `\|\|`, `&&` on LEFT of new line | Operators at end of line |
| Assignment       | New line AFTER `=`               | Value on same line       |
| Method Chains    | New line BEFORE each `.`         | Chained on one line      |
| Closing Paren    | `)` with last param              | `)` alone on line        |
| Null Checks (C#) | `return x?.ToDto();`             | `if (x == null) {...}`   |

### Multi-Parameter Formatting

```typescript
// ✅ CORRECT - each param on new line
doSomething(firstParam, secondParam, thirdParam);

// ❌ WRONG - all on one line
doSomething(firstParam, secondParam, thirdParam);
```

```csharp
// ✅ CORRECT
public class UserService(
	IUserRepository repo,
	ILogger<UserService> logger)
{
}

// ❌ WRONG
public class UserService(IUserRepository repo, ILogger<UserService> logger)
```

### Binary Operators on Left

```typescript
// ✅ CORRECT - operators on LEFT of new line
const isValid: boolean = hasPermission && isActive && !isDeleted;

// ❌ WRONG - operators at end of line
const isValid: boolean = hasPermission && isActive && !isDeleted;
```

### New Line After Assignment

```typescript
// ✅ CORRECT - new line after =
const user: User = this.userService.getById(id);

// ❌ WRONG - value on same line
const user: User = this.userService.getById(id);
```

### Method Chains on New Lines

```typescript
// ✅ CORRECT - new line BEFORE each .
this.users
	.filter((user: User) => user.isActive)
	.map((user: User) => user.name)
	.join(", ");

// ❌ WRONG - all chained on one line
this.users
	.filter((user: User) => user.isActive)
	.map((user: User) => user.name)
	.join(", ");
```

### Null Check Simplification (C#)

```csharp
// ✅ CORRECT
return user?.ToDto();

// ❌ WRONG - Verbose (FORBIDDEN)
if (user == null)
{
	return null;
}
return user.ToDto();
```

---

## Angular Guidelines

### Critical Rules

| Rule             | ✅ Do                  | ❌ Don't                        |
| ---------------- | ---------------------- | ------------------------------- |
| Types            | `const x: string = ""` | `const x = ""`                  |
| DI               | `inject(Service)`      | `constructor(private svc)`      |
| Change Detection | `OnPush`               | `Default`                       |
| Inputs           | `input.required<T>()`  | `@Input()`                      |
| Outputs          | `output<T>()`          | `@Output() EventEmitter`        |
| Control Flow     | `@if`, `@for`          | `*ngIf`, `*ngFor`               |
| Host Bindings    | `host: {...}`          | `@HostBinding`, `@HostListener` |
| Classes          | `[class.active]="x()"` | `[ngClass]`                     |
| Styles           | `[style.width]="x()"`  | `[ngStyle]`                     |
| Zone             | Zoneless only          | Zone.js, NgZone, fakeAsync      |
| Templates        | `computed()` signals   | Method calls                    |
| Cleanup          | `takeUntilDestroyed()` | Manual unsubscribe              |

### Component Naming (Routed Pages)

| Scenario                    | Suffix       | Example                                         |
| --------------------------- | ------------ | ----------------------------------------------- |
| Model with same name exists | `*Page`      | `UserDetailPage` (User model exists)            |
| No naming conflict          | `*Component` | `RegisterEmailComponent`, `StyleGuideComponent` |

**Rule**: Use `*Page` suffix ONLY when there's a model/entity with the same name to avoid confusion (e.g., `User` model → `UserDetailPage`, `UserListPage`). Otherwise, use standard `*Component` suffix (e.g., `RegisterEmailComponent` - no `RegisterEmail` model exists).

### Component Pattern

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

	onClick(): void {
		this.selected.emit(this.user());
	}
}
```

### Service with Dependency Injection

```typescript
@Injectable()
export class UserService {
	private readonly http: HttpClient = inject(HttpClient);
	private readonly apiUrl: string = environment.apiUrl;

	getById(id: number): Observable<User> {
		return this.http.get<User>(`${this.apiUrl}/users/${id}`);
	}
}
```

### Signals & Computed State

```typescript
export class CounterComponent {
	count = signal<number>(0);

	doubled = computed(() => this.count() * 2);

	increment(): void {
		this.count.update((count: number) => count + 1);
	}
}
```

### Pre-computed List Pattern

```typescript
// Define extended interface
interface ProcessedItem extends Item {
	cssClass: string;
	displayValue: string;
}

// Pre-compute in signal
readonly processedItems: Signal<ProcessedItem[]> =
	computed(() =>
		this.items()
			.map((item: Item): ProcessedItem => ({
				...item,
				cssClass: getClass(item.status),
				displayValue: format(item.value),
			})));

// Template uses direct access
@for (item of processedItems(); track item.id) {
	<div [class]="item.cssClass">{{ item.displayValue }}</div>
}
```

### Subscription Cleanup

```typescript
export class DataComponent {
	private readonly dataService: DataService = inject(DataService);

	constructor() {
		this.dataService
			.getData()
			.pipe(takeUntilDestroyed())
			.subscribe((data: Data) => {
				// Handle data
			});
	}
}
```

### Service Scoping (CRITICAL)

| Service Type     | Scope                | Example                        |
| ---------------- | -------------------- | ------------------------------ |
| Cross-cutting    | `providedIn: 'root'` | `LoggerService`, `ApiService`  |
| Feature-specific | Route `providers`    | `UserService`, `LogRepository` |

```typescript
// ❌ WRONG - Feature service in root (memory leak)
@Injectable({ providedIn: "root" })
export class UserService {}

// ✅ CORRECT - Route-scoped
@Injectable()
export class UserService {}

// In routes:
export const ADMIN_ROUTES: Routes = [
	{
		path: "users",
		providers: [UserService, UserRepository],
		loadComponent: () => import("./users.component").then((module) => module.UsersComponent),
	},
];
```

### Path Aliases

| Alias               | Path                       |
| ------------------- | -------------------------- |
| `@infrastructure/*` | `src/app/infrastructure/*` |
| `@shared/*`         | `src/app/shared/*`         |
| `@admin/*`          | `src/app/features/admin/*` |
| `@game/*`           | `src/app/features/game/*`  |

**Rule**: Features import from `@infrastructure/` and `@shared/` only. Never cross-feature.

---

## .NET Guidelines

### Critical Rules

| Rule         | ✅ Do                         | ❌ Don't                 |
| ------------ | ----------------------------- | ------------------------ |
| Types        | `string x = ""`               | `var x = ""`             |
| Constructors | Primary: `class Svc(IRepo r)` | Traditional with fields  |
| Collections  | `[1, 2, 3]`                   | `new List<int>{...}`     |
| Async        | `GetUserAsync()`              | `GetUser()` for async    |
| Nulls        | `return x?.ToDto();`          | `if (x == null) {...}`   |
| DTOs         | `record UserDto(...)`         | class with props         |
| EF Config    | Fluent API                    | Data annotations         |
| Queries      | `AsNoTracking()`              | Tracked for reads        |
| Repository   | Domain-specific               | Generic `IRepository<T>` |

### Service Pattern

```csharp
public class UserService(
	IUserRepository repo,
	ILogger<UserService> logger)
{
	public async Task<User?> GetByIdAsync(int id) =>
		await repo.GetByIdAsync(id);

	public async Task CreateAsync(User user)
	{
		logger.LogInformation(
			"Creating user {Username}",
			user.Username);
		await repo.AddAsync(user);
	}
}
```

### Repository Pattern

```csharp
public class UserRepository(IdentityDbContext db)
{
	public async Task<User?> GetByIdAsync(int id) =>
		await db.Users
			.AsNoTracking()
			.FirstOrDefaultAsync(user => user.Id == id);

	public async Task<User?> GetByUsernameAsync(string username) =>
		await db.Users
			.AsNoTracking()
			.FirstOrDefaultAsync(user => user.Username == username);

	public async Task AddAsync(User user)
	{
		db.Users.Add(user);
		await db.SaveChangesAsync();
	}
}
```

### Entity Configuration (Fluent API)

```csharp
public class UserConfiguration : IEntityTypeConfiguration<User>
{
	public void Configure(EntityTypeBuilder<User> builder)
	{
		builder.ToTable(
			"users",
			"identity");
		builder.HasKey(user => user.Id);
		builder
			.Property(user => user.Username)
			.HasMaxLength(100)
			.IsRequired();
		builder
			.HasIndex(user => user.Username)
			.IsUnique();
		builder.HasQueryFilter(user => !user.IsDeleted);
	}
}
```

### Records for DTOs

```csharp
public record UserDto(
	int Id,
	string Username,
	string Email,
	bool IsActive);

public record CreateUserRequest(
	string Username,
	string Email,
	string Password);

public record UpdateUserRequest(
	int id,
	string Username,
	string Email,
	string Password);

public record PagedResult<T>(
	IReadOnlyList<T> Items,
	int TotalCount,
	int Page,
	int PageSize);
```

### API Controllers

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController(UserService userService) : ControllerBase
{
	[HttpGet("{id:int}")]
	public async Task<ActionResult<UserDto>> GetByIdAsync(int id)
	{
		Result<UserDto> result =
			await userService.GetByIdAsync(id);
		return result.IsSuccess
			? Ok(result.Value)
			: NotFound();
	}

	[HttpPost]
	public async Task<ActionResult<UserDto>> CreateAsync(CreateUserRequest request)
	{
		Result<UserDto> result =
			await userService.CreateAsync(request);
		return result.IsSuccess
			? CreatedAtAction(
				nameof(GetByIdAsync),
				new { id = result.Value!.Id },
				result.Value)
			: BadRequest(result.Error);
	}
}
```

### Pattern Matching

```csharp
string GetStatusMessage(OrderStatus status) =>
	status switch
	{
		OrderStatus.Pending => "Waiting",
		OrderStatus.Processing => "In progress",
		OrderStatus.Shipped => "On the way",
		_ => "Unknown",
	};

string GetUserCategory(User user) =>
	user switch
	{
		{ IsAdmin: true } => "Administrator",
		{ IsActive: false } => "Inactive",
		_ => "Regular",
	};
```

---

## SCSS Guidelines

### Units

| ✅ Use REM for           | ❌ Use PX only for |
| ------------------------ | ------------------ |
| Spacing, padding, margin | Border width       |
| Font sizes               | Border radius      |
| Widths, heights          | Box shadows        |
| Gap                      | Breakpoints        |

### Variables & Colors

```scss
@use "variables" as vars;

// ✅ CORRECT
.component {
	padding: vars.$spacing-lg;
	margin-bottom: vars.$spacing-xl;
	font-size: vars.$font-size-base;
	background-color: var(--color-info);
	color: var(--color-on-info);
}

// ❌ WRONG
.component {
	padding: 16px;
	margin-bottom: 24px;
	background-color: #2196f3;
}
```

### Mixins (DRY)

```scss
@use "mixins" as mixins;

// ✅ Use existing mixins
.my-component {
	@include mixins.loading-state();
}

.my-icon {
	@include mixins.icon-size(vars.$icon-size-xl);
}
```

**Rule**: Extract to mixin after 3rd occurrence (Rule of Three).

---

## Testing Guidelines

### Commands

| Platform | Command            | Notes                   |
| -------- | ------------------ | ----------------------- |
| Angular  | `npm test`         | Headless, no-watch      |
| .NET     | `dotnet test`      | Docker Desktop required |
| E2E      | `npm run test:e2e` | Manual only             |

**CRITICAL**: Never skip failing tests. Fix immediately.

### Angular Test Pattern

```typescript
describe("UserComponent", () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UserComponent],
			providers: [provideZonelessChangeDetection(), provideHttpClientTesting()],
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

// ❌ FORBIDDEN: fakeAsync(), tick(), flush(), Zone.js
```

### .NET Test Pattern

```csharp
public class UserServiceTests
{
	private readonly IUserRepository UserRepository =
		Substitute.For<IUserRepository>();
	private readonly UserService UserService;

	public UserServiceTests() =>
		UserService =
			new UserService(UserRepository);

	[Fact]
	public async Task GetByIdAsync_ReturnsUser_WhenExistsAsync()
	{
		// Arrange
		User user =
			new() { Id = 1, Username = "Test" };
		UserRepository
			.GetByIdAsync(1)
			.Returns(user);

		// Act
		User? result =
			await UserService.GetByIdAsync(1);

		// Assert
		result.ShouldNotBeNull();
		result.Username.ShouldBe("Test");
	}
}

// Libraries: NSubstitute, Shouldly, xUnit
// ❌ NEVER: Moq, FluentAssertions (license issues)
```

### Test Naming

```csharp
// Pattern: MethodName_ExpectedBehavior_WhenConditionAsync
[Fact]
public async Task GetByIdAsync_ReturnsUser_WhenExistsAsync()

[Fact]
public async Task CreateAsync_ThrowsException_WhenInvalidAsync()
```

---

## Architecture

### System Overview

```
SeventySix/
├── SeventySix.Client/           # Angular 20+ (Zoneless)
│   └── src/app/
│       ├── infrastructure/      # Cross-cutting only
│       ├── shared/              # Reusable UI
│       └── features/            # Bounded contexts
│           ├── admin/           # users/, logs/, api-tracking/
│           ├── game/
│           └── home/
│
├── SeventySix.Server/
│   ├── SeventySix.Api/          # HTTP entry point
│   └── SeventySix/              # Domain library
│       ├── Identity/            # User management
│       ├── Logging/             # System logging
│       ├── ApiTracking/         # API tracking
│       ├── ElectronicNotifications/  # Notifications (Emails, future: SignalR, SMS)
│       └── Shared/              # Common types
│
└── observability/               # Prometheus, Grafana
```

### Server-Client Alignment

| Server Context             | Client Feature        | Path Alias            |
| -------------------------- | --------------------- | --------------------- |
| `Identity/`                | `admin/users/`        | `@admin/users`        |
| `Logging/`                 | `admin/logs/`         | `@admin/logs`         |
| `ApiTracking/`             | `admin/api-tracking/` | `@admin/api-tracking` |
| `ElectronicNotifications/` | N/A (service-only)    | N/A                   |

### Bounded Context Structure (Server)

```
Context/
├── Configurations/    # EF Fluent API
├── DTOs/             # API contracts (records) - Request/Response/Dto types
├── Entities/         # DB-persisted models - EF tracked, saved to database
├── Extensions/       # ToDto mapping
├── Infrastructure/   # DbContext
├── Models/           # Internal non-persisted types (optional - create when needed)
├── Repositories/     # Domain-specific
├── Services/
├── Settings/         # appsettings.json binding classes (context-specific config)
└── Validators/       # FluentValidation
```

### ElectronicNotifications Context (Special Structure)

```
ElectronicNotifications/
├── Emails/                   # First notification channel
│   ├── Interfaces/
│   │   └── IEmailService.cs
│   ├── Models/               # Non-persisted
│   │   └── EmailMessage.cs
│   └── Services/
│       └── EmailService.cs
├── Extensions/
│   └── ServiceCollectionExtensions.cs
└── [Future: SignalR/, SMS/, Push/]
```

**Key Differences from Standard Contexts**:

-   **No database** - Pure service layer
-   **No DTOs** - Not exposed via API
-   **Subfolder per channel** - `Emails/`, `SignalR/`, `SMS/`
-   **Namespace**: `SeventySix.ElectronicNotifications.Emails`

### DTO vs Entity vs Model vs Settings

| Category     | Purpose                        | Persisted? | API? | Examples                                       |
| ------------ | ------------------------------ | ---------- | ---- | ---------------------------------------------- |
| **DTOs**     | API request/response contracts | No         | Yes  | `UserDto`, `LoginRequest`, `PagedResult<T>`    |
| **Entities** | Database-persisted models      | Yes        | No   | `User`, `RefreshToken`, `Log`                  |
| **Models**   | Internal non-persisted types   | No         | No   | `AuthResult`, `TokenPair`, `ValidationContext` |
| **Settings** | Configuration binding          | No         | No   | `JwtSettings`, `AuthSettings`                  |

**Key Rules**:

1. DTOs are **records** - immutable API contracts
2. Entities are **classes** - EF-tracked, persisted to database
3. Models are **records/classes** - internal business logic, not persisted
4. Settings are **records** - bound from `appsettings.json`
5. Controllers return DTOs, never Entities or Models
6. Repositories work with Entities internally
7. Services may use Models for internal operations
8. Context-specific settings live in their bounded context (e.g., `Identity/Settings/`)

### Feature Structure (Client)

```
feature/
├── components/
├── models/
├── repositories/
├── services/
├── feature.routes.ts    # REQUIRED
├── feature.component.ts
└── feature.component.spec.ts
```

### Client Model Organization

```
feature/
└── models/
    ├── index.ts              # Barrel export
    ├── feature.model.ts      # DTOs - API contracts (matches backend)
    └── feature.types.ts      # Models - internal types (optional, create when needed)
```

**Naming**:

-   `*Request`, `*Dto`, `*Response` = DTOs (API contracts)
-   `*Filter`, `*State`, `*Options` = Models (internal, not API)
-   No `entities/` folder on client (Entities are server-side DB models only)

### Feature Routes (Required)

```typescript
// features/game/game.routes.ts
export const GAME_ROUTES: Routes =
	[{
		path: "",
		loadComponent: () =>
			import("./world-map/world-map")
				.then((module) => module.WorldMap),
	}];

// app.routes.ts
{
	path: "game",
	loadChildren: () =>
		import("./features/game/game.routes")
			.then((module) => module.GAME_ROUTES),
}
```

### Architecture Decisions

| Decision   | Choice               | Rationale                |
| ---------- | -------------------- | ------------------------ |
| Repository | Domain-specific      | EF Core IS the pattern   |
| CQRS       | Not yet              | KISS until scale demands |
| Database   | PostgreSQL           | All contexts             |
| DbContext  | Separate per context | Clear boundaries         |

---

## Quick Reference

### Commands

| Task  | Angular            | .NET           |
| ----- | ------------------ | -------------- |
| Test  | `npm test`         | `dotnet test`  |
| Build | `npm run build`    | `dotnet build` |
| Start | `npm start`        | `dotnet run`   |
| E2E   | `npm run test:e2e` | N/A            |

### Configuration

| ❌ Never Hardcode  | ✅ Use Instead                        |
| ------------------ | ------------------------------------- |
| API URLs           | `environment.ts` / `appsettings.json` |
| Intervals, limits  | Configuration files                   |
| Connection strings | Environment variables                 |

### File Naming

| Type       | Pattern                 | Example                  |
| ---------- | ----------------------- | ------------------------ |
| Component  | `feature.component.ts`  | `user-list.component.ts` |
| Service    | `feature.service.ts`    | `user.service.ts`        |
| Repository | `feature.repository.ts` | `user.repository.ts`     |
| Routes     | `feature.routes.ts`     | `admin.routes.ts`        |

### Error Checklist

| Issue               | Solution                               |
| ------------------- | -------------------------------------- |
| Zone.js errors      | Add `provideZonelessChangeDetection()` |
| Testcontainers fail | Start Docker Desktop                   |
| Async test hangs    | Use `await fixture.whenStable()`       |
| Tests failing       | **Fix immediately**                    |

---

## Documentation Rules

-   **NEVER** create new .md files unless asked
-   **ALWAYS** use inline JSDoc/XML comments
-   Keep code self-documenting

```typescript
/**
 * Retrieves a user by ID.
 * @param id - User's unique identifier
 * @returns User if found, null otherwise
 */
getById(id: number): Observable<User | null> {
	return this.http
		.get<User>(`${this.apiUrl}/users/${id}`);
}
```

```csharp
/// <summary>
/// Retrieves a user by ID.
/// </summary>
/// <param name="id">User's unique identifier.</param>
/// <returns>User if found; otherwise, null.</returns>
public async Task<User?> GetByIdAsync(int id) =>
	await db.Users
		.AsNoTracking()
		.FirstOrDefaultAsync(user => user.Id == id);
```

---

## References

| Purpose         | File                                   |
| --------------- | -------------------------------------- |
| Quick rules     | `.github/copilot-instructions.md`      |
| C# details      | `.github/instructions/csharp.md`       |
| Angular details | `.github/instructions/angular.md`      |
| Testing         | `.github/instructions/testing.md`      |
| Architecture    | `.github/instructions/architecture.md` |

---

_Clean, simple code beats clever code. Readability first, performance second._
