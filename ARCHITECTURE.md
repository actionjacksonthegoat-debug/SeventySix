# SeventySix Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Backend Architecture (.NET Core 8+)](#backend-architecture-net-core-8)
3. [Frontend Architecture (Angular)](#frontend-architecture-angular)
4. [UI/UX Architecture (Material Design 3)](#uiux-architecture-material-design-3)
5. [SOLID Principles Implementation](#solid-principles-implementation)
6. [Design Patterns](#design-patterns)
7. [Scalability Strategy](#scalability-strategy)
8. [User Feature Workflow](#user-feature-workflow)
9. [Security Architecture](#security-architecture)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Architecture](#deployment-architecture)

---

## Overview

SeventySix is a full-stack application built with **Clean Architecture** principles, emphasizing separation of concerns, testability, and maintainability. The system consists of:

-   **Backend**: .NET Core 8+ API following Clean Architecture
-   **Frontend**: Angular 19+ with modern signals and standalone components
-   **Infrastructure**: Containerized with Docker, production-ready with PostgreSQL support

### Core Architectural Principles

All architecture decisions align with **CLAUDE.md** guidelines:

-   **SOLID Principles**: Foundation of all design decisions
-   **KISS**: Simple solutions over complex abstractions
-   **YAGNI**: Build what's needed now, not what might be needed
-   **TDD**: Test-first development with >80% coverage
-   **Clean Code**: Readable, maintainable, self-documenting

---

## Backend Architecture (.NET Core 8+)

### Clean Architecture Layers

The backend follows **Clean Architecture** (aka Onion Architecture) with clear dependency rules:

```
┌─────────────────────────────────────────────────┐
│          SeventySix.Api (Presentation)          │
│  - Controllers, Middleware, Program.cs          │
│  - HTTP concerns, routing, authentication       │
└────────────────┬────────────────────────────────┘
                 │ depends on ↓
┌────────────────────────────────────────────────┐
│      SeventySix.BusinessLogic (Business Logic)   │
│  - Services, DTOs, Validators, Interfaces      │
│  - Use cases, orchestration, mapping           │
└────────────────┬───────────────────────────────┘
                 │ depends on ↓
┌────────────────────────────────────────────────┐
│        SeventySix.Core (Core Domain)         │
│  - Entities, Value Objects, Domain Logic       │
│  - Business rules, domain events               │
│  - ZERO dependencies on other layers           │
└────────────────────────────────────────────────┘
                 ↑ depends on
┌────────────────────────────────────────────────┐
│     SeventySix.DataAccess (Data Access)    │
│  - Repositories, Database Context              │
│  - External service integrations               │
└────────────────────────────────────────────────┘
```

**Dependency Rule**: Inner layers have no knowledge of outer layers. Dependencies point inward.

### Layer Responsibilities

#### 1. **SeventySix.Core** (Core Domain)

**Purpose**: Pure business logic with zero external dependencies

**Contents**:

-   **Entities**: Rich domain models (e.g., `User.cs`)
-   **Value Objects**: Immutable business concepts
-   **Domain Exceptions**: Business rule violations
-   **Repository Interfaces**: Abstractions for data access (DIP)

**Example - User Entity**:

```csharp
public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string? FullName { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}
```

**Design Principles**:

-   ✅ SRP: Each entity has one responsibility
-   ✅ OCP: Closed for modification, open for extension
-   ✅ Framework-independent (no EF, no ASP.NET)

#### 2. **SeventySix.BusinessLogic** (Business Logic)

**Purpose**: Use cases and application-specific business rules

**Contents**:

-   **Services**: Business logic orchestration (e.g., `UserService.cs`)
-   **Service Interfaces**: Abstractions (e.g., `IUserService.cs`)
-   **DTOs**: Data transfer objects for API contracts
-   **Request/Response Models**: Command/query objects
-   **Validators**: FluentValidation rules
-   **Extensions**: Mapping logic (Entity ↔ DTO)

**Example - UserService**:

```csharp
public class UserService : IUserService
{
    private readonly IUserRepository _repository;
    private readonly IValidator<CreateUserRequest> _validator;

    public async Task<UserDto> CreateUserAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        // 1. Validate
        await _validator.ValidateAndThrowAsync(request, cancellationToken);

        // 2. Map to entity
        var user = request.ToEntity();

        // 3. Persist
        var created = await _repository.CreateAsync(user, cancellationToken);

        // 4. Map to DTO
        return created.ToDto();
    }
}
```

**Design Principles**:

-   ✅ SRP: Each service handles one domain concept
-   ✅ DIP: Depends on abstractions (`IUserRepository`, `IValidator`)
-   ✅ ISP: Interfaces are focused and minimal
-   ✅ Separation of concerns: Validation → Mapping → Persistence → Response

#### 3. **SeventySix.DataAccess** (Data Access)

**Purpose**: External dependencies and data persistence

**Contents**:

-   **Repositories**: Concrete implementations of domain interfaces
-   **Database Context**: EF Core DbContext (future)
-   **External Services**: Third-party integrations

**Current Implementation**: In-memory repository (development)
**Production Plan**: EF Core with PostgreSQL

**Example - UserRepository (In-Memory)**:

```csharp
public class UserRepository : IUserRepository
{
    private readonly List<User> _users = new();

    public Task<IEnumerable<User>> GetAllAsync(CancellationToken ct)
    {
        return Task.FromResult<IEnumerable<User>>(_users.ToList());
    }

    public Task<User> CreateAsync(User entity, CancellationToken ct)
    {
        entity.Id = _nextId++;
        entity.CreatedAt = DateTime.UtcNow;
        _users.Add(entity);
        return Task.FromResult(entity);
    }
}
```

**Design Principles**:

-   ✅ Repository Pattern: Abstract data access
-   ✅ DIP: Implements domain interface
-   ✅ Easy to swap: In-memory → EF Core → Dapper → MongoDB

#### 4. **SeventySix.Api** (Presentation)

**Purpose**: HTTP API, routing, and cross-cutting concerns

**Contents**:

-   **Controllers**: API endpoints (e.g., `UserController.cs`)
-   **Middleware**: Global concerns (exception handling, rate limiting)
-   **Program.cs**: Dependency injection configuration
-   **Filters**: Cross-cutting concerns

**Example - UserController**:

```csharp
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UserController> _logger;

    [HttpGet]
    [ResponseCache(Duration = 60)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting all users");
        var users = await _userService.GetAllUsersAsync(cancellationToken);
        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateAsync(
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _userService.CreateUserAsync(request, cancellationToken);
        return CreatedAtRoute("GetUserById", new { id = user.Id }, user);
    }
}
```

**Design Principles**:

-   ✅ Thin controllers: Delegate to services
-   ✅ RESTful API design
-   ✅ Proper HTTP status codes (200, 201, 400, 404, 422, 500)
-   ✅ ProblemDetails for errors (RFC 7807)
-   ✅ Caching headers for performance

### Middleware Pipeline

**Execution Order** (configured in `Program.cs`):

1. **Security Headers** → Defense in depth (HSTS, X-Frame-Options, CSP)
2. **Global Exception Handler** → Catch all unhandled exceptions
3. **Rate Limiting** → Prevent API abuse (100 req/min per IP)
4. **Response Compression** → Brotli/Gzip for bandwidth optimization
5. **Response Caching** → HTTP caching headers
6. **CORS** → Cross-origin resource sharing
7. **HTTPS Redirection** → Force HTTPS in production
8. **Authorization** → (Future: JWT/OAuth)
9. **Controller Routing** → Map requests to controllers

**Example - Global Exception Middleware**:

```csharp
public class GlobalExceptionMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var problemDetails = exception switch
        {
            ValidationException => CreateValidationProblem(...),
            EntityNotFoundException => CreateProblem(404, ...),
            BusinessRuleViolationException => CreateProblem(422, ...),
            _ => CreateProblem(500, ...)
        };

        await context.Response.WriteAsJsonAsync(problemDetails);
    }
}
```

### Dependency Injection Configuration

**Service Registration** (`Program.cs`):

```csharp
// Repositories (Scoped - per request)
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Services (Scoped - per request)
builder.Services.AddScoped<IUserService, UserService>();

// Validators (Scoped - auto-registered from assembly)
builder.Services.AddValidatorsFromAssemblyContaining<CreateUserValidator>();
```

**Lifetimes**:

-   **Scoped**: Repositories, Services, DbContext
-   **Singleton**: Logging, Configuration, Caching
-   **Transient**: Stateless utilities

---

## Frontend Architecture (Angular)

### Project Structure

```
src/app/
├── core/                      # Singleton services, global concerns
│   ├── api-services/          # HTTP communication layer
│   │   ├── api.service.ts     # Generic HTTP client wrapper
│   │   └── i-api.service.ts   # API service interface
│   ├── constants/             # Application-wide constants
│   ├── enums/                 # TypeScript enumerations
│   ├── guards/                # Route guards (auth, unsaved changes)
│   ├── helpers/               # Utility functions
│   ├── interceptors/          # HTTP interceptors
│   │   ├── auth.interceptor.ts
│   │   ├── cache.interceptor.ts
│   │   ├── error.interceptor.ts
│   │   └── logging.interceptor.ts
│   ├── models/interfaces/     # TypeScript interfaces
│   │   └── user.ts            # User interface
│   ├── repositories/          # Data access layer (Repository Pattern)
│   │   ├── base.repository.ts # Generic repository interface
│   │   └── user.repository.ts # User data access
│   └── services/              # Business logic services
│       ├── user.service.ts    # User business logic
│       ├── logger.service.ts  # Logging facade
│       └── cache.service.ts   # Client-side caching
├── features/                  # Feature modules (lazy loaded)
│   └── game/                  # Game feature
│       └── world-map/         # World map component
├── shared/                    # Shared components, directives, pipes
│   ├── components/            # Reusable UI components
│   │   └── user-list/         # User list component
│   ├── directives/            # Custom directives
│   ├── pipes/                 # Custom pipes
│   └── validators/            # Form validators
└── app.config.ts              # Application configuration
```

### Angular Architecture Layers

The frontend mirrors backend clean architecture:

```
┌─────────────────────────────────────────────┐
│          Components (Presentation)          │
│  - Smart/Container components               │
│  - Presentational/Dumb components           │
│  - Templates, styles, component logic       │
└────────────────┬────────────────────────────┘
                 │ depends on ↓
┌─────────────────────────────────────────────┐
│           Services (Business Logic)         │
│  - UserService, LoggerService, etc.         │
│  - Business rules, orchestration            │
└────────────────┬────────────────────────────┘
                 │ depends on ↓
┌─────────────────────────────────────────────┐
│          Repositories (Data Access)         │
│  - UserRepository, etc.                     │
│  - HTTP calls, caching, data transformation │
└────────────────┬────────────────────────────┘
                 │ depends on ↓
┌─────────────────────────────────────────────┐
│              API Service (HTTP)             │
│  - Generic HTTP client wrapper              │
│  - Error handling, interceptors             │
└─────────────────────────────────────────────┘
```

### Modern Angular Patterns (CLAUDE.md Compliant)

#### 1. **Standalone Components** (Default)

```typescript
@Component({
	selector: "app-user-list",
	imports: [DatePipe], // Direct imports, no NgModule
	templateUrl: "./user-list.html",
	styleUrls: ["./user-list.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList {}
```

**Why**: Simplified, tree-shakeable, better for lazy loading

#### 2. **Signals for State Management**

```typescript
export class UserList {
	// State signals
	readonly users = signal<User[]>([]);
	readonly isLoading = signal<boolean>(true);
	readonly error = signal<string | null>(null);

	// Computed signals for derived state
	readonly userCount = computed(() => this.users().length);
	readonly activeUserCount = computed(() => this.users().filter((u) => u.isActive).length);
}
```

**Why**:

-   Reactive without RxJS complexity
-   Fine-grained change detection
-   Better performance than zones
-   Type-safe

#### 3. **Dependency Injection with `inject()`**

```typescript
export class UserList {
	private readonly userService = inject(UserService);
	private readonly logger = inject(LoggerService);
}
```

**Why**:

-   Cleaner than constructor injection
-   Enables composition patterns
-   Better for testing

#### 4. **OnPush Change Detection** (Performance)

```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush
})
```

**Why**: Only check when inputs change or events fire (10-100x faster)

#### 5. **Modern Template Syntax**

```html
<!-- Control flow -->
@if (isLoading()) {
<div class="spinner"></div>
} @if (error()) {
<div class="error">{{ error() }}</div>
}

<!-- Iteration with trackBy -->
@for (user of users(); track trackById($index, user)) {
<tr>
	<td>{{ user.username }}</td>
	<td>{{ user.email }}</td>
</tr>
}
```

**Why**:

-   Better performance than `*ngIf`/`*ngFor`
-   Type-safe
-   Built into Angular (no directives needed)

#### 6. **Repository Pattern**

```typescript
@Injectable({ providedIn: "root" })
export class UserRepository implements IRepository<User> {
	private readonly apiService = inject(ApiService);
	private readonly endpoint = "User";

	getAll(): Observable<User[]> {
		return this.apiService.get<User[]>(this.endpoint);
	}

	create(user: Partial<User>): Observable<User> {
		return this.apiService.post<User>(this.endpoint, user);
	}
}
```

**Why**:

-   Separation of concerns (data access isolated)
-   Easy to mock for testing
-   Can add caching layer without changing services

#### 7. **Service Layer**

```typescript
@Injectable({ providedIn: "root" })
export class UserService {
	private readonly userRepository = inject(UserRepository);

	getAllUsers(): Observable<User[]> {
		return this.userRepository.getAll();
	}

	createUser(user: Partial<User>): Observable<User> {
		return this.userRepository.create(user);
	}
}
```

**Why**:

-   Business logic separated from data access
-   Can add cross-cutting concerns (logging, validation)
-   Testable

### HTTP Interceptor Chain

**Order of Execution** (configured in `app.config.ts`):

1. **Cache Interceptor** → Check cache before making request
2. **Auth Interceptor** → Add JWT token to headers
3. **Logging Interceptor** → Log requests/responses
4. **Error Interceptor** → Handle HTTP errors globally

---

## SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

**"A class should have one, and only one, reason to change."**

#### Backend Examples:

-   **UserController**: Only handles HTTP concerns (routing, status codes)
-   **UserService**: Only business logic (validation, orchestration)
-   **UserRepository**: Only data access (CRUD operations)
-   **GlobalExceptionMiddleware**: Only exception handling

#### Frontend Examples:

-   **UserRepository**: Only HTTP calls for user data
-   **UserService**: Only user business logic
-   **UserList Component**: Only UI presentation

**Benefit**: Easy to modify, test, and understand

### 2. Open/Closed Principle (OCP)

**"Open for extension, closed for modification."**

#### Examples:

-   **Middleware Pipeline**: Add new middleware without modifying existing ones
-   **Repository Pattern**: Swap implementations (in-memory → EF Core) without changing services
-   **Interceptors**: Add new HTTP interceptors without modifying existing ones
-   **Validators**: Add new FluentValidation rules without modifying service logic

**Implementation**:

```csharp
// Extension point - can add new implementations
public interface IUserRepository
{
    Task<User> CreateAsync(User entity);
}

// Closed for modification - services use interface
public class UserService
{
    private readonly IUserRepository _repository;
    // Service doesn't change when repository implementation changes
}
```

### 3. Liskov Substitution Principle (LSP)

**"Subtypes must be substitutable for their base types."**

#### Examples:

-   All `IRepository<T>` implementations can be swapped:
    -   `InMemoryUserRepository` → `EfCoreUserRepository` → `DapperUserRepository`
-   All validators implement `IValidator<T>` and are interchangeable

**Implementation**:

```csharp
// Can substitute any IUserRepository implementation
public UserService(IUserRepository repository)
{
    _repository = repository; // Works with ANY implementation
}
```

### 4. Interface Segregation Principle (ISP)

**"No client should depend on methods it doesn't use."**

#### Examples:

-   **IUserService**: Only user-specific methods (not generic CRUD)
-   **IUserRepository**: Focused interface (no unnecessary methods)
-   **IApiService** (Frontend): Generic HTTP methods (get, post, put, delete)

**Anti-pattern Avoided**:

```csharp
// ❌ BAD: Bloated interface
public interface IRepository<T>
{
    Task<T> GetById(int id);
    Task<T> Create(T entity);
    Task BulkInsert(IEnumerable<T> entities);  // Not all repos need this
    Task<T> GetWithIncludes(int id, params string[] includes); // Too specific
}

// ✅ GOOD: Focused interface
public interface IUserRepository
{
    Task<User> GetByIdAsync(int id);
    Task<User> CreateAsync(User entity);
}
```

### 5. Dependency Inversion Principle (DIP)

**"Depend on abstractions, not concretions."**

#### Backend Examples:

```csharp
// High-level module (UserService) depends on abstraction (IUserRepository)
public class UserService : IUserService
{
    private readonly IUserRepository _repository; // ← Abstraction
    private readonly IValidator<CreateUserRequest> _validator; // ← Abstraction
}

// Low-level module (UserRepository) implements abstraction
public class UserRepository : IUserRepository { }
```

#### Frontend Examples:

```typescript
// Service depends on repository abstraction
export class UserService {
	private readonly userRepository = inject(UserRepository); // ← Abstraction
}

// Component depends on service abstraction
export class UserList {
	private readonly userService = inject(UserService); // ← Abstraction
}
```

**Benefit**:

-   Easy to swap implementations
-   Easy to mock for testing
-   Loose coupling between layers

---

## Design Patterns

### Creational Patterns

#### 1. **Singleton** (Dependency Injection)

**Backend**: Services registered with `AddScoped` or `AddSingleton`
**Frontend**: Services with `providedIn: 'root'`

```typescript
@Injectable({ providedIn: "root" })
export class UserService {} // Single instance across app
```

#### 2. **Dependency Injection**

**Universal pattern** across both backend and frontend

**Backend**:

```csharp
builder.Services.AddScoped<IUserService, UserService>();
```

**Frontend**:

```typescript
private readonly userService = inject(UserService);
```

### Structural Patterns

#### 3. **Repository Pattern** (Data Access Abstraction)

**Purpose**: Separate data access logic from business logic

**Backend**:

```csharp
public interface IUserRepository
{
    Task<IEnumerable<User>> GetAllAsync();
    Task<User> CreateAsync(User entity);
}
```

**Frontend**:

```typescript
export class UserRepository implements IRepository<User> {
	getAll(): Observable<User[]> {}
	create(entity: Partial<User>): Observable<User> {}
}
```

#### 4. **Facade** (Simplified Interface)

**Purpose**: Provide simple interface to complex subsystem

**Example**: `UserService` is a facade over repository + validation + mapping

```csharp
public class UserService // Facade
{
    public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
    {
        await _validator.ValidateAndThrowAsync(request); // Validation subsystem
        var user = request.ToEntity(); // Mapping subsystem
        var created = await _repository.CreateAsync(user); // Data access subsystem
        return created.ToDto(); // Mapping subsystem
    }
}
```

#### 5. **Proxy** (HTTP Interceptors)

**Purpose**: Add behavior without changing original object

**Frontend**:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const token = getToken();
	const authReq = req.clone({
		headers: req.headers.set("Authorization", `Bearer ${token}`),
	});
	return next(authReq); // Transparently add auth header
};
```

### Behavioral Patterns

#### 6. **Strategy** (Validation)

**Purpose**: Define family of algorithms, make them interchangeable

**Example**: FluentValidation rules

```csharp
public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Username).NotEmpty().Length(3, 50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}
```

#### 7. **Observer** (RxJS Observables)

**Purpose**: One-to-many dependency for state changes

**Frontend**:

```typescript
this.userService.getAllUsers().subscribe({
	next: (data) => this.users.set(data),
	error: (err) => this.error.set(err.message),
});
```

**Why**: One-to-many dependency for state changes

**Frontend**:

```typescript
this.userService.getAllUsers().subscribe({
	next: (data) => this.users.set(data),
	error: (err) => this.error.set(err.message),
});
```

---

## UI/UX Architecture (Material Design 3)

### Design Philosophy

SeventySix's frontend strictly adheres to **Material Design 3 (M3)** guidelines as the **PRIMARY and ONLY** UI framework. All UI components must use Angular Material - never custom implementations.

**Core Principles**:

-   ✅ **Material-First**: Use Angular Material components exclusively
-   ✅ **Accessibility**: WCAG 2.1 AA compliance throughout
-   ✅ **Responsive**: Mobile-first design with breakpoint-driven layouts
-   ✅ **Performance**: OnPush change detection, lazy loading, optimized rendering
-   ✅ **Consistency**: Unified design language across all features

**Documentation**: See `DESIGN_PATTERNS.md` for comprehensive implementation guidelines.

### Material Design 3 Theming

#### Theme Structure

The application implements a **dynamic theming system** with 4 pre-configured variants:

**Theme Axes**:

-   **Brightness**: Light | Dark
-   **Color Scheme**: Blue | Cyan-Orange

**Available Themes**:

1. `light-blue` - Professional blue theme (default)
2. `dark-blue` - Dark mode with blue accents
3. `light-cyan-orange` - Vibrant cyan/orange palette
4. `dark-cyan-orange` - Dark mode with warm accents

#### Theme Configuration

**Location**: `src/styles.scss`

```scss
@use "@angular/material" as mat;

// Define palettes
$blue-palette: mat.define-palette(mat.$blue-palette);
$cyan-palette: mat.define-palette(mat.$cyan-palette);
$orange-palette: mat.define-palette(mat.$orange-palette);
$red-palette: mat.define-palette(mat.$red-palette);

// Light themes
$light-blue-theme: mat.define-theme(
	(
		color: (
			theme-type: light,
			primary: $blue-palette,
			tertiary: $blue-palette,
		),
	)
);

$light-cyan-orange-theme: mat.define-theme(
	(
		color: (
			theme-type: light,
			primary: $cyan-palette,
			tertiary: $orange-palette,
		),
	)
);

// Dark themes (similar structure with theme-type: dark)
```

#### Theme Service

**Location**: `src/app/core/services/theme.service.ts`

**Purpose**: Manage theme switching and persistence

**Key Features**:

-   Signal-based reactive state (`brightness`, `colorScheme`)
-   Computed theme name (`themeName`)
-   LocalStorage persistence
-   Server-side rendering compatible

**API**:

```typescript
export class ThemeService {
	brightness = signal<ThemeBrightness>("light"); // 'light' | 'dark'
	colorScheme = signal<ColorScheme>("blue"); // 'blue' | 'cyan-orange'
	themeName = computed(() => `${this.brightness()}-${this.colorScheme()}`);

	toggleBrightness(): void; // Switch light/dark
	toggleColorScheme(): void; // Switch color schemes
	setBrightness(brightness: ThemeBrightness): void;
	setColorScheme(scheme: ColorScheme): void;

	isDark(): boolean;
	isLight(): boolean;
	isBlue(): boolean;
	isCyanOrange(): boolean;
}
```

**Usage in Components**:

```typescript
export class StyleGuideComponent {
	protected readonly themeService = inject(ThemeService);

	// In template:
	// {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
	// (click)="themeService.toggleBrightness()"
}
```

#### Material Design Tokens

**Color System**:

-   `--mat-sys-primary` - Main brand color
-   `--mat-sys-secondary` - Supporting actions
-   `--mat-sys-tertiary` - Accent/highlight color
-   `--mat-sys-error` - Error states
-   `--mat-sys-surface` - Background surfaces
-   `--mat-sys-on-primary` - Text on primary color
-   `--mat-sys-on-surface` - Text on surfaces

**Typography Scale** (Material Type Scale):

-   `mat-headline-large` - 32px (Page titles)
-   `mat-headline-medium` - 28px (Section headings)
-   `mat-headline-small` - 24px (Card titles)
-   `mat-title-large` - 22px
-   `mat-title-medium` - 16px (Toolbar, dialogs)
-   `mat-title-small` - 14px
-   `mat-body-large` - 16px (Body text)
-   `mat-body-medium` - 14px (Default)
-   `mat-body-small` - 12px (Captions)
-   `mat-label-large` - 14px (Form labels)
-   `mat-label-medium` - 12px
-   `mat-label-small` - 11px

**Elevation System**:

-   Level 0: Flat surfaces
-   Level 1: Raised surfaces (4px shadow)
-   Level 2: Cards, menus (8px shadow)
-   Level 3: Dialogs, modals (16px shadow)
-   Level 4: Navigation drawer (24px shadow)

**Spacing Scale** (8px grid):

-   4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

### Component Architecture

#### Material Component Usage

**Button Hierarchy**:

```html
<!-- High emphasis - Primary actions -->
<button mat-raised-button color="primary">Save</button>

<!-- Medium emphasis - Secondary actions -->
<button mat-flat-button color="accent">Edit</button>
<button mat-stroked-button>Cancel</button>

<!-- Low emphasis - Tertiary actions -->
<button mat-button>Learn More</button>

<!-- Icon buttons for compact actions -->
<button mat-icon-button aria-label="Delete">
	<mat-icon>delete</mat-icon>
</button>

<!-- Floating Action Button (FAB) for primary screen action -->
<button mat-fab color="primary" aria-label="Add">
	<mat-icon>add</mat-icon>
</button>
```

**Form Controls**:

```html
<!-- Text inputs - Always outline appearance -->
<mat-form-field appearance="outline">
	<mat-label>Email</mat-label>
	<input matInput type="email" [formControl]="emailControl" />
	<mat-icon matPrefix>email</mat-icon>
	<mat-hint>We'll never share your email</mat-hint>
	<mat-error *ngIf="emailControl.hasError('email')"> Enter a valid email </mat-error>
</mat-form-field>

<!-- Selects -->
<mat-form-field appearance="outline">
	<mat-label>Country</mat-label>
	<mat-select [formControl]="countryControl">
		<mat-option *ngFor="let country of countries" [value]="country.code"> {{ country.name }} </mat-option>
	</mat-select>
</mat-form-field>

<!-- Checkboxes and Radio Buttons -->
<mat-checkbox [formControl]="agreeControl">I agree to terms</mat-checkbox>

<mat-radio-group [formControl]="roleControl">
	<mat-radio-button value="admin">Admin</mat-radio-button>
	<mat-radio-button value="user">User</mat-radio-button>
</mat-radio-group>
```

**Data Presentation**:

```html
<!-- Tables with sorting, filtering, pagination -->
<table mat-table [dataSource]="dataSource" matSort>
	<ng-container matColumnDef="name">
		<th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
		<td mat-cell *matCellDef="let row">{{ row.name }}</td>
	</ng-container>
	<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
	<tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
</table>

<mat-paginator [length]="totalItems" [pageSize]="10" [pageSizeOptions]="[5, 10, 25, 100]"></mat-paginator>

<!-- Cards for content grouping -->
<mat-card>
	<mat-card-header>
		<mat-card-title>User Statistics</mat-card-title>
		<mat-card-subtitle>Last 6 months</mat-card-subtitle>
	</mat-card-header>
	<mat-card-content>
		<!-- Chart or content -->
	</mat-card-content>
	<mat-card-actions>
		<button mat-button>VIEW DETAILS</button>
	</mat-card-actions>
</mat-card>
```

**Feedback Components**:

```typescript
// Snackbar for brief messages
this.snackBar.open("User created successfully", "DISMISS", {
	duration: 3000,
	horizontalPosition: "end",
	verticalPosition: "bottom",
});

// Dialog for critical decisions
const dialogRef = this.dialog.open(ConfirmDialogComponent, {
	data: {
		title: "Delete User?",
		message: "This action cannot be undone.",
		confirmText: "DELETE",
		cancelText: "CANCEL",
		confirmColor: "warn",
		icon: "warning",
	},
});

dialogRef.afterClosed().subscribe((result) => {
	if (result) {
		// User confirmed
	}
});

// Progress indicators
<mat-progress-bar mode="indeterminate"></mat-progress-bar>
<mat-spinner diameter="40"></mat-spinner>
```

#### Layout Components

**Application Shell** (`app.html`):

```html
<mat-sidenav-container>
	<!-- Sidebar navigation -->
	<mat-sidenav [mode]="layoutService.sidebarMode()" [opened]="layoutService.sidebarExpanded()">
		<app-sidebar></app-sidebar>
	</mat-sidenav>

	<!-- Main content -->
	<mat-sidenav-content>
		<app-header></app-header>
		<main class="page-content">
			<router-outlet />
		</main>
		<app-footer></app-footer>
	</mat-sidenav-content>
</mat-sidenav-container>
```

**Responsive Breakpoints**:

```typescript
export class ViewportService {
	// Breakpoint signals
	isXSmall = computed(() => this.breakpoints()["(max-width: 599.98px)"]); // Phone
	isSmall = computed(() => this.breakpoints()["(min-width: 600px) and (max-width: 959.98px)"]); // Tablet
	isMedium = computed(() => this.breakpoints()["(min-width: 960px) and (max-width: 1279.98px)"]); // Laptop
	isLarge = computed(() => this.breakpoints()["(min-width: 1280px) and (max-width: 1919.98px)"]); // Desktop
	isXLarge = computed(() => this.breakpoints()["(min-width: 1920px)"]); // Large Desktop

	// Device types
	isMobile = computed(() => this.isXSmall() || this.isSmall());
	isTablet = computed(() => this.isSmall() || this.isMedium());
	isDesktop = computed(() => this.isLarge() || this.isXLarge());
}
```

**Usage**:

```typescript
export class UserList {
	protected readonly viewport = inject(ViewportService);

	// Adjust columns based on screen size
	displayedColumns = computed(() => {
		if (this.viewport.isMobile()) {
			return ["name", "email", "actions"];
		}
		return ["id", "username", "name", "email", "role", "status", "actions"];
	});
}
```

### Accessibility (WCAG 2.1 AA)

**Keyboard Navigation**:

-   All interactive elements accessible via keyboard
-   Logical tab order (tabindex management)
-   Keyboard shortcuts documented
-   Skip-to-content link for screen readers

**ARIA Labels**:

```html
<!-- Buttons with icon-only content -->
<button mat-icon-button aria-label="Delete user">
	<mat-icon aria-hidden="true">delete</mat-icon>
</button>

<!-- Loading states -->
<div role="status" aria-live="polite" *ngIf="isLoading()">Loading users...</div>

<!-- Error messages -->
<div role="alert" aria-live="assertive" *ngIf="error()">{{ error() }}</div>

<!-- Data tables -->
<table mat-table role="table" aria-label="User list">
	<!-- ... -->
</table>
```

**Focus Management**:

```scss
// Global focus indicators (styles.scss)
*:focus-visible {
	outline: 2px solid var(--mat-sys-primary);
	outline-offset: 2px;
	border-radius: 4px;
}

*:focus:not(:focus-visible) {
	outline: none; // Hide for mouse users
}

// Material button focus
.mat-mdc-button:focus-visible {
	box-shadow: 0 0 0 2px var(--mat-sys-primary);
}
```

**Screen Reader Support**:

-   Semantic HTML (`<nav>`, `<main>`, `<header>`, `<footer>`)
-   ARIA landmarks (`role="navigation"`, `role="main"`)
-   Live regions for dynamic content
-   Descriptive link text (no "click here")

### Animation & Motion

**Material Design 3 Motion Principles**:

-   **Duration**: 200-300ms for most transitions
-   **Easing**: Cubic-bezier curves for natural motion
-   **Choreography**: Stagger animations for lists

**Example Animations** (`animations.ts`):

```typescript
export const fadeInOut = trigger("fadeInOut", [transition(":enter", [style({ opacity: 0 }), animate("200ms ease-in", style({ opacity: 1 }))]), transition(":leave", [animate("150ms ease-out", style({ opacity: 0 }))])]);

export const slideIn = trigger("slideIn", [transition(":enter", [style({ transform: "translateX(-100%)", opacity: 0 }), animate("250ms ease-out", style({ transform: "translateX(0)", opacity: 1 }))])]);
```

**Usage**:

```typescript
@Component({
	animations: [fadeInOut, slideIn],
})
export class UserList {}
```

```html
<div @fadeInOut *ngIf="showContent">Content</div>
<div @slideIn *ngFor="let user of users()">{{ user.name }}</div>
```

### Style Guide Component

**Purpose**: Interactive documentation of all Material components used in the application

**Location**: `/style-guide` (Developer tools section)

**Features**:

-   Live theme switcher
-   All Material components showcase
-   Color palette display
-   Typography scale examples
-   Button variants
-   Form controls
-   Tables and data presentation
-   Feedback components (dialogs, snackbars)
-   Icons reference

**Access**: Development only (should be removed or protected in production)

### Development Guidelines

**DO**:

-   ✅ Use Angular Material components exclusively
-   ✅ Follow Material Design 3 spacing (8px grid)
-   ✅ Use Material color tokens (never hardcoded colors)
-   ✅ Apply proper ARIA labels to all interactive elements
-   ✅ Test keyboard navigation
-   ✅ Use OnPush change detection
-   ✅ Implement responsive layouts with ViewportService
-   ✅ Add focus indicators for accessibility

**DON'T**:

-   ❌ Create custom components when Material equivalent exists
-   ❌ Hardcode colors (use CSS variables)
-   ❌ Skip ARIA labels
-   ❌ Use inline styles
-   ❌ Ignore responsive design
-   ❌ Forget hover/focus/active states
-   ❌ Use `*ngIf`/`*ngFor` (use `@if`/`@for` instead)

**References**:

-   [Material Design 3](https://m3.material.io/)
-   [Angular Material](https://material.angular.io/)
-   [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
-   `DESIGN_PATTERNS.md` - Comprehensive implementation patterns

---

## SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

public record CreateUserRequest
{
public required string Username { get; init; }
public required string Email { get; init; }
}

````

### Architectural Patterns

#### 10. **Service Layer** (Business Logic Boundary)

**Purpose**: Define application's boundary with available operations

**Backend**: `UserService.cs`
**Frontend**: `UserService.ts`

Both encapsulate business logic and coordinate between layers.

#### 11. **DTO (Data Transfer Object)**

**Purpose**: Transfer data between layers without exposing domain models

```csharp
public record UserDto // Never expose User entity directly
{
    public int Id { get; init; }
    public string Username { get; init; }
    public string Email { get; init; }
}
````

---

## Scalability Strategy

### Horizontal Scalability (Scale Out)

**Definition**: Add more instances of the application

#### Backend Scalability Features:

1. **Stateless API Design**

    - No session state stored in API
    - All state in database or cache
    - Any instance can handle any request

2. **Docker Containerization**

    - Easy to spin up multiple instances
    - Container orchestration (Kubernetes/Docker Swarm)
    - Health checks for auto-recovery

3. **Load Balancer Ready**

    ```yaml
    nginx:
        image: nginx:alpine
        depends_on:
            - api
        ports:
            - "80:80"
    ```

4. **Database Connection Pooling**

    - EF Core connection pooling (future)
    - Configurable pool size
    - Connection reuse

5. **Response Caching**
    - HTTP caching headers
    - Reduces database load
    - Cache invalidation strategies

#### Frontend Scalability:

1. **Static Asset Hosting**

    - Angular builds to static files
    - Serve from CDN (CloudFront, Azure CDN)
    - Geographic distribution

2. **Service Worker (PWA)**

    - Offline support
    - Background sync
    - Push notifications

3. **Code Splitting**
    - Lazy-loaded routes
    - On-demand module loading
    - Smaller initial bundle

### Vertical Scalability (Scale Up)

**Definition**: Add more resources to existing instances

#### Backend:

1. **Async/Await Throughout**

    - Non-blocking I/O
    - Thread pool efficiency
    - `CancellationToken` support

2. **Resource Limits** (Docker Compose):

    ```yaml
    deploy:
        resources:
            limits:
                cpus: "1.0"
                memory: 512M
            reservations:
                cpus: "0.5"
                memory: 256M
    ```

3. **Response Compression**

    - Brotli (preferred) and Gzip
    - Reduces bandwidth by 70-80%
    - Faster response times

4. **Efficient Queries** (Future with EF Core):
    - `AsNoTracking()` for read-only
    - Compiled queries
    - Indexes on frequently queried columns

#### Frontend:

1. **OnPush Change Detection**

    - 10-100x performance improvement
    - Reduces unnecessary checks

2. **TrackBy Functions**

    - Efficient list rendering
    - Minimize DOM manipulation

3. **Virtual Scrolling** (Future)
    - Render only visible items
    - Handle large datasets

### Database Scalability (Future)

1. **PostgreSQL Setup**

    - Read replicas for scaling reads
    - Connection pooling
    - Query optimization

2. **Caching Layer** (Redis)

    - Frequently accessed data
    - Session storage
    - Rate limiting counters

3. **Database Sharding** (If needed)
    - Partition by tenant
    - Partition by user ID range

### Monitoring & Observability

1. **Structured Logging** (Serilog)

    - Correlation IDs for request tracing
    - Log aggregation (ELK, Seq)
    - Performance metrics

2. **Health Checks**

    ```csharp
    app.MapHealthChecks("/health");
    ```

3. **Application Insights** (Future)
    - Performance monitoring
    - Dependency tracking
    - Exception tracking

---

## User Feature Workflow

### End-to-End Request Flow (Create User)

This example demonstrates how all architectural layers work together:

```
┌─────────────────────────────────────────────────────────────────┐
│                      1. CLIENT REQUEST                          │
│  Angular Component (user-list.ts)                               │
│  - User clicks "Create User" button                             │
│  - Component calls UserService.createUser(...)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  2. ANGULAR SERVICE LAYER                       │
│  UserService.ts                                                 │
│  - Receives create request                                      │
│  - Delegates to UserRepository                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                 3. ANGULAR REPOSITORY LAYER                     │
│  UserRepository.ts                                              │
│  - Calls ApiService.post("/User", userData)                     │
│  - Returns Observable<User>                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    4. HTTP INTERCEPTORS                         │
│  Cache → Auth → Logging → Error                                │
│  - Cache: Skip (POST not cacheable)                             │
│  - Auth: Add "Authorization: Bearer <token>"                    │
│  - Logging: Log request details                                 │
│  - Error: Wrap for error handling                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                        HTTP POST /api/user
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   5. .NET MIDDLEWARE PIPELINE                   │
│  Request flows through:                                         │
│  - Security Headers: Add X-Frame-Options, CSP, etc.             │
│  - Global Exception Handler: Wrap in try/catch                  │
│  - Rate Limiter: Check if under 100 req/min                     │
│  - Response Compression: Setup compression                      │
│  - Response Caching: Setup caching headers                      │
│  - CORS: Validate origin                                        │
│  - HTTPS Redirection: Ensure HTTPS                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      6. CONTROLLER LAYER                        │
│  UserController.cs                                              │
│  - [HttpPost] CreateAsync(CreateUserRequest request)            │
│  - Validates request binding                                    │
│  - Calls UserService.CreateUserAsync(request)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      7. SERVICE LAYER                           │
│  UserService.cs                                                 │
│  - Validate: CreateUserValidator.ValidateAndThrowAsync()        │
│    * Username: 3-50 chars, alphanumeric + underscores           │
│    * Email: Valid format, max 255 chars                         │
│    * FullName: Optional, max 100 chars                          │
│  - Map: CreateUserRequest → User entity                         │
│  - Call: UserRepository.CreateAsync(user)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     8. REPOSITORY LAYER                         │
│  UserRepository.cs (In-Memory)                                  │
│  - Generate ID: entity.Id = _nextId++                           │
│  - Set CreatedAt: entity.CreatedAt = DateTime.UtcNow            │
│  - Persist: _users.Add(entity)                                  │
│  - Return: Created user entity                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   9. BACK TO SERVICE LAYER                      │
│  UserService.cs                                                 │
│  - Map: User entity → UserDto                                   │
│  - Return: UserDto to controller                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  10. BACK TO CONTROLLER                         │
│  UserController.cs                                              │
│  - Return: CreatedAtRoute("GetUserById", { id }, userDto)       │
│  - Status: 201 Created                                          │
│  - Headers: Location: /api/user/{id}                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                 11. MIDDLEWARE (RESPONSE)                       │
│  - Global Exception: (No exception, pass through)               │
│  - Response Compression: Compress response (Brotli/Gzip)        │
│  - Response Caching: Add Cache-Control headers                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                     HTTP 201 Created + UserDto
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                 12. HTTP INTERCEPTORS (RESPONSE)                │
│  - Error: (No error, pass through)                              │
│  - Logging: Log response (201, duration)                        │
│  - Auth: (No action on response)                                │
│  - Cache: (No caching for POST)                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                13. ANGULAR REPOSITORY (RESPONSE)                │
│  UserRepository.ts                                              │
│  - Receive: Observable<User> emits UserDto                      │
│  - Return: Observable to service                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                14. ANGULAR SERVICE (RESPONSE)                   │
│  UserService.ts                                                 │
│  - Receive: Observable<User>                                    │
│  - Return: Observable to component                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                15. ANGULAR COMPONENT (RESPONSE)                 │
│  UserList.ts                                                    │
│  - subscribe() callback fires                                   │
│  - Update signals: users.set([...users(), newUser])            │
│  - OnPush change detection triggers                             │
│  - UI updates with new user in table                            │
└─────────────────────────────────────────────────────────────────┘
```

### Error Handling Example

**Scenario**: User tries to create user with invalid email

```
Component → Service → Repository → HTTP POST
                                     ↓
                               Controller receives request
                                     ↓
                               UserService.CreateUserAsync()
                                     ↓
                               Validator.ValidateAndThrowAsync()
                                     ↓
                               ValidationException thrown
                                     ↓
                               GlobalExceptionMiddleware catches
                                     ↓
                               Convert to ValidationProblemDetails:
                               {
                                   "status": 400,
                                   "title": "Validation Error",
                                   "errors": {
                                       "Email": ["Email must be valid"]
                                   }
                               }
                                     ↓
                               HTTP 400 Bad Request
                                     ↓
                               Error Interceptor catches
                                     ↓
                               Logging Interceptor logs error
                                     ↓
Repository → Service → Component.subscribe(error: ...)
                                     ↓
                               error.set("Email must be valid")
                                     ↓
                               UI displays error message
```

---

## Security Architecture

### Backend Security

1. **Security Headers** (Middleware)

    - `X-Content-Type-Options: nosniff` → Prevent MIME sniffing
    - `X-Frame-Options: DENY` → Prevent clickjacking
    - `X-XSS-Protection: 1; mode=block` → XSS protection
    - `Strict-Transport-Security` → Force HTTPS (production)
    - `Referrer-Policy` → Control referrer information
    - `Permissions-Policy` → Restrict browser features

2. **CORS Configuration**

    - Whitelist allowed origins (from appsettings.json)
    - Allow credentials for cookies/auth
    - Restrict headers and methods

3. **Rate Limiting**

    - 100 requests per minute per IP
    - Prevents DDoS and brute force
    - Returns 429 Too Many Requests

4. **Input Validation**

    - FluentValidation for all requests
    - Fail-fast approach
    - Detailed validation errors

5. **Error Handling**

    - Never expose stack traces in production
    - ProblemDetails for consistent errors
    - Correlation IDs for tracking

6. **Future**: Authentication & Authorization
    - JWT tokens
    - Role-based access control (RBAC)
    - OAuth 2.0 / OpenID Connect

### Frontend Security

1. **XSRF Protection**

    ```typescript
    withXsrfConfiguration({
    	cookieName: "XSRF-TOKEN",
    	headerName: "X-XSRF-TOKEN",
    });
    ```

2. **HTTP-Only Cookies** (Future)

    - Store tokens in HTTP-only cookies
    - Not accessible to JavaScript

3. **Content Security Policy** (Future)

    - Restrict script sources
    - Prevent XSS attacks

4. **Input Sanitization**
    - Angular sanitizes bindings by default
    - DomSanitizer for trusted content

---

## Testing Strategy

### Backend Testing

#### 1. **Unit Tests** (>80% coverage)

**Domain Layer**:

```csharp
public class UserTests
{
    [Fact]
    public void User_WhenCreated_ShouldHaveDefaultValues()
    {
        var user = new User();
        Assert.True(user.IsActive);
        Assert.NotEqual(default, user.CreatedAt);
    }
}
```

**Service Layer**:

```csharp
public class UserServiceTests
{
    [Fact]
    public async Task CreateUserAsync_ValidRequest_ReturnsUserDto()
    {
        // Arrange
        var mockRepo = new Mock<IUserRepository>();
        var mockValidator = new Mock<IValidator<CreateUserRequest>>();
        var service = new UserService(mockRepo.Object, mockValidator.Object);

        // Act
        var result = await service.CreateUserAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("john_doe", result.Username);
    }
}
```

**Repository Layer**:

```csharp
public class UserRepositoryTests
{
    [Fact]
    public async Task CreateAsync_AddsUserToCollection()
    {
        var repo = new UserRepository();
        var user = new User { Username = "test" };

        var result = await repo.CreateAsync(user);

        Assert.NotEqual(0, result.Id);
        var all = await repo.GetAllAsync();
        Assert.Contains(all, u => u.Username == "test");
    }
}
```

#### 2. **Integration Tests**

```csharp
public class UserIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task POST_User_ReturnsCreated()
    {
        var client = _factory.CreateClient();
        var request = new CreateUserRequest { ... };

        var response = await client.PostAsJsonAsync("/api/user", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
```

### Frontend Testing

#### 1. **Unit Tests** (Jasmine/Karma)

```typescript
describe("UserList", () => {
	it("should load users on initialization", () => {
		mockUserService.getAllUsers.and.returnValue(of(mockUsers));

		fixture.detectChanges();

		expect(component.users()).toEqual(mockUsers);
		expect(component.isLoading()).toBe(false);
	});

	it("should handle error when loading fails", () => {
		mockUserService.getAllUsers.and.returnValue(throwError(() => new Error("Network error")));

		fixture.detectChanges();

		expect(component.error()).toBe("Failed to load users");
	});
});
```

#### 2. **E2E Tests** (Playwright)

```typescript
test("should display user list", async ({ page }) => {
	await page.goto("/users");
	await expect(page.locator("h2")).toContainText("User Management");
	await expect(page.locator("table tbody tr")).toHaveCount(3);
});
```

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────────────┐
│  Developer Machine                              │
│  ├─ Angular (ng serve): http://localhost:4200   │
│  ├─ .NET API (dotnet run): https://localhost:7074
│  └─ In-Memory Database                          │
└─────────────────────────────────────────────────┘
```

### Production Environment (Docker Compose)

```
┌───────────────────────────────────────────────────────────┐
│                         Nginx                             │
│                  (Reverse Proxy / Load Balancer)          │
│                  Port 80 (HTTP) / 443 (HTTPS)             │
└────────────────┬──────────────────┬───────────────────────┘
                 │                  │
         ┌───────▼────────┐  ┌─────▼────────┐
         │  Angular SPA   │  │  .NET API    │
         │  (Static Files)│  │  (Container) │
         │  Port 8080     │  │  Port 5085   │
         └────────────────┘  └──────┬───────┘
                                    │
                             ┌──────▼───────┐
                             │  PostgreSQL  │
                             │  Port 5432   │
                             │  (Persisted) │
                             └──────────────┘
```

**Docker Compose Services**:

-   **database**: PostgreSQL 16
-   **api**: .NET API (multi-stage build)
-   **client**: Angular SPA (Nginx)
-   **nginx**: Reverse proxy (optional)

**Benefits**:

-   ✅ Isolated environments
-   ✅ Easy scaling (docker compose up --scale api=3)
-   ✅ Health checks for auto-recovery
-   ✅ Resource limits
-   ✅ Network isolation
-   ✅ Volume persistence

### CI/CD Pipeline (Future)

```
Git Push → GitHub Actions
    ↓
Run Tests (Backend + Frontend)
    ↓
Build Docker Images
    ↓
Push to Container Registry
    ↓
Deploy to Cloud (Azure/AWS)
    ↓
Health Check
    ↓
Switch Traffic (Blue/Green Deployment)
```

---

## Conclusion

SeventySix demonstrates a **production-ready**, **scalable**, and **maintainable** architecture that:

✅ **Follows SOLID Principles** religiously
✅ **Implements Clean Architecture** with clear layer separation
✅ **Uses proven Design Patterns** appropriately
✅ **Scales horizontally** (stateless API, containers)
✅ **Scales vertically** (async/await, efficient queries, caching)
✅ **Prioritizes testability** (>80% coverage, integration tests)
✅ **Maintains security** (headers, CORS, rate limiting, validation)
✅ **Optimizes performance** (compression, caching, OnPush, lazy loading)
✅ **Embraces modern patterns** (signals, standalone components, repository pattern)

The User feature serves as a **template** for all future features, demonstrating:

-   End-to-end request flow
-   Proper error handling
-   Validation strategies
-   Clean separation of concerns
-   Testable code structure

**Next Steps**:

1. Migrate from in-memory to EF Core + PostgreSQL
2. Implement authentication (JWT)
3. Add caching layer (Redis)
4. Set up CI/CD pipeline
5. Add monitoring and observability
6. Implement additional features following the User pattern

This architecture is designed to evolve with the application while maintaining the principles outlined in **CLAUDE.md**.
