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
6. [Logging Standards](#logging-standards)
7. [Database Transactions](#database-transactions)
8. [Architecture](#architecture)
9. [Quick Reference](#quick-reference)

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

	public async Task CreateAsync(User user) =>
		await repo.AddAsync(user);
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

### Database Normalization Standards

#### Foreign Key Naming

```csharp
// ✅ CORRECT - FK properties end with Id
public int UserId { get; set; }
public int RoleId { get; set; }
public int ParentCommentId { get; set; }

// ✅ CORRECT - Audit fields store username, NOT FK
public string CreatedBy { get; set; }
public string ModifiedBy { get; set; }
public string DeletedBy { get; set; }

// ❌ WRONG - Missing Id suffix for FK
public int User { get; set; }  // Ambiguous

// ❌ WRONG - Adding Id to audit field
public int CreatedById { get; set; }  // Audit fields are NOT FKs
```

#### Cascade Delete Policy

```csharp
// Dependent children - CASCADE (delete when parent deleted)
builder
	.HasOne<User>()
	.WithMany()
	.HasForeignKey(token => token.UserId)
	.OnDelete(DeleteBehavior.Cascade);  // Tokens, credentials

// Lookup tables - RESTRICT (prevent delete if referenced)
builder
	.HasOne(ur => ur.Role)
	.WithMany()
	.HasForeignKey(ur => ur.RoleId)
	.OnDelete(DeleteBehavior.Restrict);  // Roles, categories
```

#### Naming Conventions

| Element        | Convention                  | Example                      |
| -------------- | --------------------------- | ---------------------------- |
| Table names    | PascalCase                  | `UserRoles`, `SecurityRoles` |
| Column names   | PascalCase                  | `UserId`, `CreateDate`       |
| FK columns     | Suffix with `Id`            | `UserId`, `RoleId`           |
| Audit columns  | String, no `Id` suffix      | `CreatedBy`, `ModifiedBy`    |
| Index names    | `IX_{Table}_{Column(s)}`    | `IX_Users_Email`             |
| FK constraints | `FK_{Child}_{Parent}_{Col}` | `FK_UserRoles_Users_UserId`  |

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

### Core Principles

| Principle | Application                                                |
| --------- | ---------------------------------------------------------- |
| **TDD**   | Write failing test first, then implement fix               |
| **80/20** | Test critical paths only - no exhaustive edge case testing |
| **Fix**   | Never skip failing tests - fix immediately                 |
| **Async** | Always suffix async test methods with `Async`              |

### Commands

| Platform | Command            | Notes                   |
| -------- | ------------------ | ----------------------- |
| Angular  | `npm test`         | Headless, no-watch      |
| .NET     | `dotnet test`      | Docker Desktop required |
| E2E      | `npm run test:e2e` | Manual only             |

### 80/20 Rule Examples

```csharp
// ✅ CORRECT - Test the critical happy path
[Fact]
public async Task RegisterAsync_SavesAllEntitiesAtomically_WhenSuccessfulAsync()
{
	// Test atomicity of multi-entity save
}

// ❌ WRONG - Exhaustive edge case testing (YAGNI)
[Fact]
public async Task RegisterAsync_ThrowsWhenUsernameNull() { }
[Fact]
public async Task RegisterAsync_ThrowsWhenUsernameTooLong() { }
[Fact]
public async Task RegisterAsync_ThrowsWhenUsernameContainsSpaces() { }
// ... 20 more edge cases
```

**Rule**: The consolidation/fix itself guarantees correctness. Test the happy path; don't over-test.

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

## Logging Standards

> **CRITICAL**: Only log **Warning** and **Error** levels. No Debug or Information logging.

| Level               | When to Use                                       | Example                    |
| ------------------- | ------------------------------------------------- | -------------------------- |
| ❌ `LogDebug`       | **NEVER**                                         | -                          |
| ❌ `LogInformation` | **NEVER**                                         | -                          |
| ⚠️ `LogWarning`     | Recoverable issues, unexpected but handled states | Duplicate username attempt |
| 🔴 `LogError`       | Unrecoverable failures, exceptions                | Database save failure      |

```csharp
// ✅ CORRECT - Warning for recoverable issue
logger.LogWarning(
	"Duplicate username attempt: {Username}",
	username);

// ✅ CORRECT - Error for unrecoverable failure
logger.LogError(
	exception,
	"Failed to save user {UserId}",
	userId);

// ❌ WRONG - Debug/Information logging
logger.LogDebug("Entering method");
logger.LogInformation("User created successfully");
```

---

## Database Transactions

### Key Insight

EF Core's `SaveChangesAsync()` is already transactional. All pending changes are committed atomically. The problem isn't missing transactions - it's **unnecessary multiple SaveChanges calls**.

### Pattern Decision Matrix

| Scenario                              | Pattern                             | Example                          |
| ------------------------------------- | ----------------------------------- | -------------------------------- |
| Create single entity                  | Direct `SaveChangesAsync`           | `BaseRepository.CreateAsync`     |
| Create multiple related entities      | **Consolidated `SaveChangesAsync`** | `AuthService.RegisterAsync`      |
| Read-then-write with uniqueness check | `TransactionManager`                | `UserService.CreateUserAsync`    |
| Bulk update with `ExecuteUpdateAsync` | None needed (already atomic)        | `TokenService.RevokeFamilyAsync` |
| Log writes                            | No transactions (prevent deadlock)  | `LogRepository.CreateAsync`      |

### When to Use TransactionManager

Use `TransactionManager` ONLY when you need:

1. **Read-then-write atomicity** (e.g., check duplicate → create)
2. **Multiple SaveChanges that CANNOT be combined** (rare)
3. **Retry on concurrency conflicts** (optimistic locking scenarios)

### Code Patterns

```csharp
// ❌ WRONG - Multiple SaveChanges = NOT atomic
context.Users.Add(user);
await context.SaveChangesAsync(cancellationToken);  // Save 1

context.UserCredentials.Add(credential);
context.UserRoles.Add(userRole);
await context.SaveChangesAsync(cancellationToken);  // Save 2 - if fails, orphaned user!

// ✅ CORRECT - Single SaveChanges = fully atomic
context.Users.Add(user);
context.UserCredentials.Add(credential);
context.UserRoles.Add(userRole);
await context.SaveChangesAsync(cancellationToken);  // All or nothing
```

```csharp
// ✅ CORRECT - TransactionManager for read-then-write
return await transactionManager.ExecuteInTransactionAsync(async ct =>
{
	if (await repository.UsernameExistsAsync(request.Username, null, ct))
	{
		throw new DuplicateUserException(...);
	}
	// Create user after uniqueness check
	return await CreateUserInternalAsync(request, ct);
}, cancellationToken: cancellationToken);
```

### What NOT to Do (YAGNI)

| Rejected Approach                                | Why Rejected                                |
| ------------------------------------------------ | ------------------------------------------- |
| Wrapping single-write operations in transactions | Adds overhead with no benefit               |
| Context-specific transaction manager interfaces  | Over-engineering - not needed               |
| Unit of Work pattern                             | EF Core DbContext IS already a unit of work |

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

### Type Organization (YAGNI)

**Core Principle**: Types stay in their feature/context unless cross-context usage is required.

| Scenario                  | Location                    | Example                      |
| ------------------------- | --------------------------- | ---------------------------- |
| Feature-specific type     | `feature/models/`           | `LogDto`, `UserQueryRequest` |
| Cross-feature shared      | `@shared/models/`           | `ConfirmDialogData`          |
| Same-folder internal type | Inline in service/component | `interface QuickAction {}`   |
| Test-only type            | Keep in test file           | `interface MockUser {}`      |
| C# cross-context          | `Shared/Models/`            | `PagedResult<T>`             |

**When to Extract**:

```
Is the type imported by a DIFFERENT feature/context?
├── YES → Move to @shared/models/ (TS) or Shared/Models/ (C#)
└── NO → Keep in feature/models/ or inline (YAGNI)
```

**Never move feature types to `@infrastructure/`** - infrastructure is for cross-cutting concerns only.

### Constants Organization (DRY)

> **CRITICAL**: Never hardcode strings, enums, or primitive values that appear more than once.

#### Folder Structure

| Scope             | C# Location                | TypeScript Location          |
| ----------------- | -------------------------- | ---------------------------- |
| Feature constants | `Context/Constants/`       | `feature/constants/`         |
| Cross-feature     | `Shared/Constants/`        | `@shared/constants/`         |
| Test constants    | `TestUtilities/Constants/` | `src/app/testing/constants/` |

#### Pattern Decision Matrix

| Constant Type         | Location                               | Example                         |
| --------------------- | -------------------------------------- | ------------------------------- |
| Role names            | `Identity/Constants/RoleConstants`     | `Developer`, `Admin`, `User`    |
| API endpoints (tests) | `TestUtilities/Constants/ApiEndpoints` | `/api/v1/users`, `/api/v1/logs` |
| JWT claim types       | `@infrastructure/models/auth/`         | `DOTNET_ROLE_CLAIM`             |
| Table names (tests)   | `TestUtilities/Constants/TestTables`   | `Identity[]`, `Logging[]`       |

#### C# Constants Pattern

```csharp
// ✅ CORRECT - Static class with const fields
// Location: Identity/Constants/RoleConstants.cs
public static class RoleConstants
{
	public const string Developer = "Developer";
	public const string Admin = "Admin";
	public const string User = "User";

	public static readonly HashSet<string> ValidRoleNames =
		[Developer, Admin, User];
}

// Usage
if (RoleConstants.ValidRoleNames.Contains(roleName))

// ❌ WRONG - Hardcoded strings scattered everywhere
if (role == "Developer" || role == "Admin")
```

#### TypeScript Constants Pattern

```typescript
// ✅ CORRECT - SCREAMING_SNAKE_CASE exports
// Location: @infrastructure/models/auth/role.constants.ts
export const ROLE_DEVELOPER: string = "Developer";
export const ROLE_ADMIN: string = "Admin";
export const ROLE_USER: string = "User";

export const VALID_ROLES: string[] =
	[ROLE_DEVELOPER, ROLE_ADMIN, ROLE_USER];

// Usage
if (VALID_ROLES.includes(role))

// ❌ WRONG - Hardcoded strings
if (role === "Developer" || role === "Admin")
```

#### Test Constants Pattern

```csharp
// ✅ CORRECT - Centralized API endpoints
// Location: TestUtilities/Constants/ApiEndpoints.cs
public static class ApiEndpoints
{
	public static class Users
	{
		public const string Base = "/api/v1/users";
		public const string Me = "/api/v1/users/me";
		public const string ById = "/api/v1/users/{0}";
	}

	public static class Logs
	{
		public const string Base = "/api/v1/logs";
	}
}

// Usage in tests
HttpResponseMessage response =
	await client.GetAsync(ApiEndpoints.Users.Base);

// ❌ WRONG - Hardcoded endpoints
private const string Endpoint = "/api/v1/users";
```

#### When to Extract Constants

```
Is the value used more than once across files?
├── YES → Extract to constants file in appropriate folder
└── NO → Is it likely to be reused?
    ├── YES → Extract proactively (DRY principle)
    └── NO → Keep inline (YAGNI)
```

#### Naming Conventions

| Language   | Convention          | Example                         |
| ---------- | ------------------- | ------------------------------- |
| C#         | PascalCase          | `RoleConstants.Developer`       |
| TypeScript | SCREAMING_SNAKE     | `ROLE_DEVELOPER`                |
| File names | `.constants.cs/ts`  | `role.constants.ts`             |
| Class      | `*Constants` suffix | `RoleConstants`, `ApiEndpoints` |

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
