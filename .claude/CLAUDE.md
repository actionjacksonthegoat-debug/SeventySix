# SeventySix Development Guidelines

> **Expert-level guidance for TypeScript, Angular 20+, .NET 10+, and full-stack development.**
> Follow SOLID principles, clean architecture, and industry best practices.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Critical Rules](#critical-rules)
3. [Angular Guidelines](#angular-guidelines)
4. [.NET Guidelines](#net-guidelines)
5. [Testing Guidelines](#testing-guidelines)
6. [Architecture](#architecture)
7. [Configuration Management](#configuration-management)
8. [Documentation](#documentation)
9. [Design Patterns](#design-patterns)

---

## Core Principles

### SOLID Principles

| Principle | Description                                                    |
| --------- | -------------------------------------------------------------- |
| **SRP**   | Single Responsibility - each class has one reason to change    |
| **OCP**   | Open/Closed - open for extension, closed for modification      |
| **LSP**   | Liskov Substitution - subtypes must substitute for base types  |
| **ISP**   | Interface Segregation - no client depends on unused methods    |
| **DIP**   | Dependency Inversion - depend on abstractions, not concretions |

### KISS (Keep It Simple, Stupid)

-   Favor simple, straightforward solutions over complex ones
-   Write code that is easy to read and understand
-   Avoid premature optimization
-   Refactor complexity only when necessary

### DRY (Don't Repeat Yourself)

-   No code duplication (Rule of Three: extract after third occurrence)
-   Use abstractions for shared logic
-   But don't over-abstract prematurely

### YAGNI (You Aren't Gonna Need It)

-   Don't add functionality until it's actually needed
-   Avoid speculative generality
-   Build what is required now, not what might be needed later
-   Delete unused code aggressively

### .editorconfig Compliance

**CRITICAL**: Always adhere to `.editorconfig` rules:

-   Line Endings: CRLF (Windows)
-   Indentation: Tabs (width: 4 spaces) for C#, TypeScript, SCSS
-   Character Encoding: UTF-8
-   Trailing Whitespace: Remove (except Markdown)
-   C# Braces: Allman style (opening brace on new line)

---

## Critical Rules

### 🚨 Test Execution (NEVER Skip)

-   ❌ **NEVER** proceed with implementation if tests are failing
-   ❌ **NEVER** skip failing tests "to fix later"
-   ✅ **ALWAYS** fix failing tests immediately when discovered
-   ✅ **ALWAYS** run tests after each code change

| Platform | Command            | Tool         | Notes                         |
| -------- | ------------------ | ------------ | ----------------------------- |
| Angular  | `npm test`         | Terminal     | Headless, no-watch            |
| .NET     | `dotnet test`      | runTests/CLI | Docker Desktop required       |
| E2E      | `npm run test:e2e` | Terminal     | Manual only (not in test:all) |

> ⚠️ **E2E Tests**: E2E tests cover admin-dashboard and home-page only. Not included in `test:all` or checkpoints - other views incomplete.

### 🚨 No Hardcoded Values

| ❌ Never Hardcode  | ✅ Use Instead                        |
| ------------------ | ------------------------------------- |
| API URLs           | `environment.ts` / `appsettings.json` |
| Refresh intervals  | Configuration files                   |
| Timeout values     | Options pattern                       |
| Connection strings | Environment variables                 |
| Feature flags      | Configuration                         |
| Rate limits        | `appsettings.json`                    |

### 🚨 No Documentation Files

-   **NEVER** create new .md files unless explicitly asked
-   **ALWAYS** use inline JSDoc/XML comments instead
-   Keep code self-documenting with clear names

---

## Angular Guidelines

### Zoneless Architecture (CRITICAL)

The entire application is **Zone.js-free**:

```typescript
// ✅ CORRECT - Zoneless patterns
import { interval, timer } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interval(1000).pipe(takeUntilDestroyed()).subscribe();

// ❌ FORBIDDEN - Zone.js APIs
import { NgZone } from "@angular/core";
fakeAsync(() => {});
tick();
flush();
```

### Type Declarations (CRITICAL)

```typescript
// ✅ CORRECT - Explicit types ALWAYS
const name: string = "test";
let count: number = 0;
const users: User[] = [];
const isActive: boolean = true;

// ❌ WRONG - Never rely on type inference
const name = "test";
let count = 0;
```

### Dependency Injection (CRITICAL)

```typescript
// ✅ CORRECT - inject() function with explicit types
export class UserService {
	private readonly http: HttpClient = inject(HttpClient);
	private readonly userRepo: UserRepository = inject(UserRepository);

	constructor() {
		// Optional initialization only - NO parameter injection
	}
}

// ❌ WRONG - Constructor injection (legacy)
export class UserService {
	constructor(private http: HttpClient) {} // FORBIDDEN
}
```

### Component Architecture

```typescript
@Component({
	selector: "app-user-card",
	changeDetection: ChangeDetectionStrategy.OnPush, // REQUIRED
	template: `
		@if (user()) {
		<div>{{ user()!.name }}</div>
		} @for (item of items(); track item.id) {
		<app-item [item]="item" />
		} @empty {
		<div>No items</div>
		}
	`,
	// ✅ Use host object, NOT @HostBinding/@HostListener
	host: {
		"(click)": "onClick()",
		"[class.active]": "isActive()",
		"[attr.aria-label]": "ariaLabel()",
	},
})
export class UserCardComponent {
	// ✅ Modern input/output functions
	user = input.required<User>();
	items = input<Item[]>([]);
	selected = output<User>();

	// ✅ Derived state with computed()
	isActive = computed(() => this.user()?.isActive ?? false);
	ariaLabel = computed(() => `User: ${this.user()?.name}`);

	onClick(): void {
		this.selected.emit(this.user());
	}
}
```

**Component Rules:**

| ✅ Do                            | ❌ Don't                       |
| -------------------------------- | ------------------------------ |
| `input.required<T>()`            | `@Input() prop!: T`            |
| `output<T>()`                    | `@Output() EventEmitter<T>`    |
| `host: { '(click)': 'fn()' }`    | `@HostListener('click')`       |
| `[class.active]="isActive()"`    | `[ngClass]="{ active: x }"`    |
| `[style.color]="color()"`        | `[ngStyle]="{ color: x }"`     |
| `@if`, `@for`, `@switch`         | `*ngIf`, `*ngFor`, `*ngSwitch` |
| `ChangeDetectionStrategy.OnPush` | Default change detection       |

### Signals & State Management

```typescript
export class CounterComponent {
	// Local state
	count = signal<number>(0);

	// Derived state
	doubled = computed(() => this.count() * 2);

	increment(): void {
		this.count.update((c: number) => c + 1);
	}

	reset(): void {
		this.count.set(0);
	}
}

// ❌ WRONG - Don't use mutate()
this.items.mutate((arr) => arr.push(item)); // FORBIDDEN
```

### Subscription Cleanup

```typescript
// ✅ CORRECT - takeUntilDestroyed() for automatic cleanup
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

### Forms (Reactive Only)

```typescript
export class UserFormComponent {
	private readonly fb: FormBuilder = inject(FormBuilder);

	form: FormGroup<UserForm> = this.fb.group({
		username: ["", [Validators.required, Validators.minLength(3)]],
		email: ["", [Validators.required, Validators.email]],
	});

	onSubmit(): void {
		if (this.form.valid) {
			const value: UserFormValue = this.form.getRawValue();
			// Process form...
		}
	}
}
```

### Path Aliases

| Alias               | Path                       |
| ------------------- | -------------------------- |
| `@infrastructure/*` | `src/app/infrastructure/*` |
| `@shared/*`         | `src/app/shared/*`         |
| `@admin/*`          | `src/app/features/admin/*` |
| `@game/*`           | `src/app/features/game/*`  |
| `@home/*`           | `src/app/features/home/*`  |

```typescript
// ✅ CORRECT - Use path aliases
import { LoggerService } from "@infrastructure/services/logger.service";
import { UserService } from "@admin/users/services/user.service";

// ❌ WRONG - Relative paths across boundaries
import { UserService } from "../../../features/admin/users/services/user.service";

// ❌ WRONG - Cross-feature imports (FORBIDDEN)
import { GameService } from "@game/services/game.service"; // From admin feature
```

### File Naming

| Type        | Pattern                  | Example                  |
| ----------- | ------------------------ | ------------------------ |
| Component   | `feature.component.ts`   | `user-list.component.ts` |
| Service     | `feature.service.ts`     | `user.service.ts`        |
| Repository  | `feature.repository.ts`  | `user.repository.ts`     |
| Guard       | `feature.guard.ts`       | `auth.guard.ts`          |
| Interceptor | `feature.interceptor.ts` | `error.interceptor.ts`   |
| Pipe        | `feature.pipe.ts`        | `date-format.pipe.ts`    |
| Model       | `feature.model.ts`       | `user.model.ts`          |
| Validator   | `feature.validators.ts`  | `user.validators.ts`     |
| Routes      | `feature.routes.ts`      | `admin.routes.ts`        |

---

## .NET Guidelines

### Type Declarations (CRITICAL)

```csharp
// ✅ CORRECT - Explicit types ALWAYS
string name = "test";
int count = 0;
List<User> users = [];
Dictionary<string, int> map = [];

// ❌ WRONG - Never use var
var name = "test";
var users = new List<User>();
```

### Primary Constructors (C# 12+) (CRITICAL)

```csharp
// ✅ CORRECT - Primary constructor, parameters ARE fields
public class UserService(IUserRepository repo, ILogger<UserService> logger)
{
    public async Task<User?> GetByIdAsync(int id) =>
        await repo.GetByIdAsync(id);  // Use parameter directly

    public async Task CreateAsync(User user)
    {
        logger.LogInformation("Creating user {Username}", user.Username);
        await repo.AddAsync(user);
    }
}

// ❌ WRONG - Separate field assignments (legacy)
public class UserService
{
    private readonly IUserRepository _repo;
    public UserService(IUserRepository repo) => _repo = repo;
}
```

### Collection Expressions (C# 12+) (CRITICAL)

```csharp
// ✅ CORRECT - Modern collection syntax
int[] numbers = [1, 2, 3];
List<string> names = ["Alice", "Bob"];
HashSet<int> ids = [1, 2, 3];
List<User> users = [];

// ❌ WRONG - Legacy syntax
var numbers = new int[] { 1, 2, 3 };
var names = new List<string> { "Alice", "Bob" };
```

### Async Methods (CRITICAL)

```csharp
// ✅ CORRECT - Async suffix on ALL async methods
public async Task<User?> GetUserByIdAsync(int id)
public async Task CreateUserAsync(CreateUserRequest request)

// Test methods too!
[Fact]
public async Task GetByIdAsync_ReturnsUser_WhenExistsAsync()

// ❌ WRONG - Missing Async suffix
public async Task<User?> GetUserById(int id)
```

### Null Handling (CRITICAL)

```csharp
// ✅ CORRECT - Let it fail if null (fail fast)
public class UserService(IUserRepository repo)
{
    public async Task DoWorkAsync() => await repo.SaveAsync();
}

// ❌ WRONG - Excessive null checks
public UserService(IUserRepository repo) =>
    _repo = repo ?? throw new ArgumentNullException(nameof(repo)); // FORBIDDEN
```

### Records for DTOs (CRITICAL)

```csharp
// ✅ CORRECT - Records for immutable DTOs
public record UserDto(int Id, string Username, string Email, bool IsActive);
public record CreateUserRequest(string Username, string Email, string Password);
public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

// ❌ WRONG - Classes for DTOs
public class UserDto { public int Id { get; set; } }
```

### Entity Framework Core

```csharp
// ✅ CORRECT - Fluent API configuration (NOT attributes)
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users", "identity");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Username).HasMaxLength(100).IsRequired();
        builder.HasIndex(u => u.Username).IsUnique();
        builder.HasQueryFilter(u => !u.IsDeleted);
    }
}

// ✅ CORRECT - AsNoTracking for read-only queries
public async Task<User?> GetByIdAsync(int id) =>
    await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);

// ❌ WRONG - Data annotations on entities
[Table("Users")]
[Index(nameof(Username))]
public class User { }
```

### Repository Pattern (No Generic)

```csharp
// ✅ CORRECT - Domain-specific repository
public class UserRepository(IdentityDbContext db)
{
    public async Task<User?> GetByIdAsync(int id) =>
        await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User?> GetByUsernameAsync(string username) =>
        await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == username);

    public async Task AddAsync(User user)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync();
    }
}

// ❌ WRONG - Generic repository (antipattern)
public interface IRepository<T> where T : class
{
    IQueryable<T> Query();  // Defeats the purpose!
}
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
        Result<UserDto> result = await userService.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound();
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateAsync(CreateUserRequest request)
    {
        Result<UserDto> result = await userService.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetByIdAsync), new { id = result.Value!.Id }, result.Value)
            : BadRequest(result.Error);
    }
}
```

### Pattern Matching

```csharp
// ✅ CORRECT - Switch expressions
string GetStatusMessage(OrderStatus status) => status switch
{
    OrderStatus.Pending => "Waiting",
    OrderStatus.Processing => "In progress",
    OrderStatus.Shipped => "On the way",
    _ => "Unknown"
};

// ✅ CORRECT - Pattern matching with conditions
string GetUserCategory(User user) => user switch
{
    { IsAdmin: true } => "Administrator",
    { IsActive: false } => "Inactive",
    _ => "Regular"
};
```

---

## Testing Guidelines

### Angular Tests

```bash
# Standard test run (headless, no-watch) - USE THIS
npm test

# Interactive watch mode (development only)
npm run test:watch

# E2E (Playwright)
npm run test:e2e
```

**Test Configuration (Zoneless - REQUIRED):**

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

// ❌ FORBIDDEN in tests
fakeAsync(() => {});
tick();
flush();
```

### .NET Tests

```bash
# Run all tests (Docker Desktop MUST be running)
dotnet test

# Run with output
dotnet test --logger "console;verbosity=normal"
```

**Test Structure:**

```csharp
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepo = new();
    private readonly UserService _sut;

    public UserServiceTests() =>
        _sut = new UserService(_mockRepo.Object);

    [Fact]
    public async Task GetByIdAsync_ReturnsUser_WhenExistsAsync()
    {
        // Arrange
        User user = new() { Id = 1, Username = "Test" };
        _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);

        // Act
        User? result = await _sut.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test", result.Username);
    }
}
```

**Naming Convention:**

```csharp
// Pattern: MethodName_ExpectedBehavior_WhenConditionAsync
[Fact]
public async Task GetByIdAsync_ReturnsUser_WhenExistsAsync()

[Fact]
public async Task CreateAsync_ThrowsValidationException_WhenInvalidAsync()
```

---

## Architecture

### System Overview

```
SeventySix/
├── SeventySix.Client/          # Angular 20+ frontend (Zoneless)
│   ├── src/app/
│   │   ├── infrastructure/     # TRUE cross-cutting only
│   │   │   ├── api/            # HTTP client configuration
│   │   │   ├── repositories/   # Base repository classes
│   │   │   ├── services/       # Infrastructure services
│   │   │   └── models/         # Shared base types
│   │   ├── shared/             # Reusable UI components
│   │   └── features/           # Self-contained feature boundaries
│   │       ├── admin/          # Admin bounded context
│   │       │   ├── users/      # Maps to Identity
│   │       │   ├── logs/       # Maps to Logging
│   │       │   └── api-tracking/
│   │       ├── game/           # Game bounded context
│   │       └── home/           # Home feature
│   └── e2e/                    # Playwright tests
│
├── SeventySix.Server/
│   ├── SeventySix.Api/         # HTTP entry point
│   ├── SeventySix/             # Domain library (bounded contexts)
│   │   ├── Identity/           # User management
│   │   ├── Logging/            # System logging
│   │   ├── ApiTracking/        # API tracking
│   │   ├── Infrastructure/     # Shared infrastructure
│   │   ├── Shared/             # Minimal shared types
│   │   └── Extensions/         # DI registration
│   └── Tests/                  # Test projects
│
└── observability/              # Prometheus, Grafana
```

### Server-Client Alignment

| Server Context    | Client Feature        | Path Alias            |
| ----------------- | --------------------- | --------------------- |
| `Identity/`       | `admin/users/`        | `@admin/users`        |
| `Logging/`        | `admin/logs/`         | `@admin/logs`         |
| `ApiTracking/`    | `admin/api-tracking/` | `@admin/api-tracking` |
| `Infrastructure/` | `infrastructure/`     | `@infrastructure`     |

### Bounded Context Structure (Server)

```
Context/
├── Configurations/     # EF configs (Fluent API)
├── DTOs/              # Request/Response records
├── Entities/          # Domain models
├── Exceptions/        # Domain errors
├── Extensions/        # Mapping (ToDto)
├── Infrastructure/    # DbContext
├── Interfaces/        # Contracts
├── Migrations/        # EF migrations
├── Repositories/      # Data access (no generic)
├── Services/          # Business logic
└── Validators/        # FluentValidation
```

### Feature Structure (Client)

```
feature/
├── components/              # UI components
├── composables/             # Reusable logic (optional)
├── models/                  # TypeScript interfaces
│   ├── feature.model.ts
│   └── index.ts
├── repositories/            # HTTP data access
│   └── feature.repository.ts
├── services/                # Business logic
│   └── feature.service.ts
├── validators/              # Form validators
├── feature.routes.ts        # Feature routing (REQUIRED)
├── feature.component.ts     # Main component
└── feature.component.spec.ts
```

### Feature Route Modularization (REQUIRED)

Every feature MUST have its own `feature.routes.ts` file. This enables bounded context modularity - features can be added/removed from `app.routes.ts` as complete units.

```typescript
// features/game/game.routes.ts
import { Routes } from "@angular/router";

export const GAME_ROUTES: Routes = [
	{
		path: "",
		loadComponent: () => import("./world-map/world-map").then((m) => m.WorldMap),
		title: "Game - World Map",
	},
];
```

Then in `app.routes.ts`, use `loadChildren`:

```typescript
{
	path: "game",
	loadChildren: () => import("./features/game/game.routes").then((m) => m.GAME_ROUTES),
	data: { breadcrumb: "Game" }
}
```

**Benefits:**

-   Features are self-contained bounded contexts
-   Features can be easily enabled/disabled by commenting out in `app.routes.ts`
-   Features own their routing configuration
-   Enables lazy loading per feature

### Feature Boundary Rules

-   Features ONLY import from `@infrastructure/` and `@shared/`
-   Features NEVER import from other features
-   Each feature is fully self-contained (models, repos, services inside)

### Architecture Decisions

| Decision      | Choice               | Rationale                 |
| ------------- | -------------------- | ------------------------- |
| Repository    | Domain-specific      | EF Core IS the pattern    |
| CQRS          | Not yet              | KISS until scale demands  |
| MediatR       | Not yet              | Avoid until cross-context |
| Microservices | Not yet              | Extract when pain happens |
| Database      | PostgreSQL           | All contexts              |
| DbContext     | Separate per context | Clear boundaries          |

---

## Configuration Management

### Angular

```typescript
// environments/environment.ts
export const environment = {
    production: false,
    apiUrl: "https://localhost:7001/api",
    refreshInterval: 30000,
    maxRetries: 3,
};

// Usage
private readonly apiUrl: string = environment.apiUrl;
```

### .NET

```csharp
// appsettings.json
{
    "ConnectionStrings": {
        "Identity": "Host=localhost;Database=seventysix;..."
    },
    "RateLimiting": {
        "PermitLimit": 100,
        "Window": "00:01:00"
    }
}

// Options pattern
public class ApiSettings
{
    public string BaseUrl { get; init; } = "";
    public int TimeoutSeconds { get; init; } = 30;
}

// Registration
builder.Services.Configure<ApiSettings>(
    builder.Configuration.GetSection("ApiSettings"));

// Usage
public class ExternalApiService(IOptions<ApiSettings> options)
{
    private readonly ApiSettings settings = options.Value;
}
```

---

## Documentation

### Inline Documentation (Always Required)

```typescript
/**
 * Retrieves a user by their unique identifier.
 * @param id - The user's unique identifier
 * @returns The user if found, null otherwise
 * @throws {HttpErrorResponse} When the API request fails
 */
getUserById(id: number): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
}
```

```csharp
/// <summary>
/// Retrieves a user by their unique identifier.
/// </summary>
/// <param name="id">The user's unique identifier.</param>
/// <returns>The user if found; otherwise, null.</returns>
public async Task<User?> GetByIdAsync(int id) =>
    await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
```

---

## Design Patterns

Apply patterns judiciously when complexity justifies them.

### When to Apply Patterns

| Apply When                    | Avoid When                      |
| ----------------------------- | ------------------------------- |
| Repeated code (DRY violation) | Code is simple and clear        |
| Multiple responsibilities     | Adds unnecessary complexity     |
| Need to swap implementations  | Pattern doesn't fit the problem |
| Complex object creation       | Speculating future needs        |

### Commonly Used Patterns

| Pattern    | Use Case                    | Example                      |
| ---------- | --------------------------- | ---------------------------- |
| Singleton  | App-wide services           | `providedIn: 'root'`         |
| Factory    | Dynamic creation            | Component factories          |
| Repository | Data access abstraction     | Domain-specific repos        |
| Observer   | Event handling              | RxJS Observables, C# events  |
| Strategy   | Interchangeable algorithms  | Validation strategies        |
| Decorator  | Add behavior dynamically    | Angular decorators, C# attrs |
| Facade     | Simplify complex subsystems | Service layers               |

---

## Quick Reference

### Commands

| Task         | Angular                | .NET           |
| ------------ | ---------------------- | -------------- |
| Run tests    | `npm test`             | `dotnet test`  |
| Build        | `npm run build`        | `dotnet build` |
| Start        | `npm start`            | `dotnet run`   |
| Lint         | `npm run lint`         | N/A            |
| E2E          | `npm run test:e2e`     | N/A (manual)   |
| Start Docker | `npm run start:docker` | N/A            |

> ⚠️ E2E tests (admin-dashboard, home-page) are manual only - not part of checkpoints or `test:all`.

### Error Checklist

| Issue                   | Solution                               |
| ----------------------- | -------------------------------------- |
| Zone.js errors          | Add `provideZonelessChangeDetection()` |
| Testcontainers fail     | Start Docker Desktop                   |
| Async test hangs        | Use `await fixture.whenStable()`       |
| Missing Async suffix    | Add `Async` to method name             |
| Type inference warnings | Add explicit types                     |
| Tests failing           | **Fix immediately - never skip**       |

---

## References

| Purpose              | Location                                       |
| -------------------- | ---------------------------------------------- |
| Quick rules          | `.github/copilot-instructions.md`              |
| Angular details      | `.github/instructions/angular.md`              |
| C# details           | `.github/instructions/csharp.md`               |
| Testing details      | `.github/instructions/testing.md`              |
| Client architecture  | `.github/instructions/architecture-client.md`  |
| Server architecture  | `.github/instructions/architecture-server.md`  |
| Overall architecture | `.github/instructions/architecture-overall.md` |

---

_Remember: Clean, simple, and practical code beats clever code. Optimize for readability and maintainability first, performance second._
