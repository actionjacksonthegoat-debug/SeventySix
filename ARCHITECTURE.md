# SeventySix Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Backend Architecture (.NET Core 8+)](#backend-architecture-net-core-8)
3. [Frontend Architecture (Angular)](#frontend-architecture-angular)
4. [SOLID Principles Implementation](#solid-principles-implementation)
5. [Design Patterns](#design-patterns)
6. [Scalability Strategy](#scalability-strategy)
7. [User Feature Workflow](#user-feature-workflow)
8. [Security Architecture](#security-architecture)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Architecture](#deployment-architecture)

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
│      SeventySix.Application (Business Logic)   │
│  - Services, DTOs, Validators, Interfaces      │
│  - Use cases, orchestration, mapping           │
└────────────────┬───────────────────────────────┘
                 │ depends on ↓
┌────────────────────────────────────────────────┐
│        SeventySix.Domain (Core Domain)         │
│  - Entities, Value Objects, Domain Logic       │
│  - Business rules, domain events               │
│  - ZERO dependencies on other layers           │
└────────────────────────────────────────────────┘
                 ↑ depends on
┌────────────────────────────────────────────────┐
│     SeventySix.Infrastructure (Data Access)    │
│  - Repositories, Database Context              │
│  - External service integrations               │
└────────────────────────────────────────────────┘
```

**Dependency Rule**: Inner layers have no knowledge of outer layers. Dependencies point inward.

### Layer Responsibilities

#### 1. **SeventySix.Domain** (Core Domain)

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

#### 2. **SeventySix.Application** (Business Logic)

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

#### 3. **SeventySix.Infrastructure** (Data Access)

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

#### 8. **Chain of Responsibility** (Middleware Pipeline)

**Purpose**: Pass request along chain of handlers

**Backend**:

```
Request → Security Headers → Exception Handler → Rate Limiter →
          Compression → Caching → CORS → Controller
```

**Frontend**:

```
HTTP Request → Cache → Auth → Logging → Error → Server
```

#### 9. **Command** (Request/Response Objects)

**Purpose**: Encapsulate request as object

**Example**: `CreateUserRequest`, `UserDto`

```csharp
public record CreateUserRequest
{
    public required string Username { get; init; }
    public required string Email { get; init; }
}
```

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
```

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
