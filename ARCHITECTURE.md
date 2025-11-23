# SeventySix Architecture Guide

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Feature Module Pattern](#feature-module-pattern)
6. [Data Flow Architecture](#data-flow-architecture)
7. [Dependency Management](#dependency-management)
8. [Security Architecture](#security-architecture)
9. [Performance & Scalability](#performance--scalability)
10. [Testing Strategy](#testing-strategy)

---

## Overview

SeventySix is a full-stack application built with **Clean Architecture** principles, emphasizing separation of concerns, testability, and maintainability.

**Technology Stack:**

-   **Backend**: .NET 10+ with Three-Layer Architecture
-   **Frontend**: Angular 19+ with Signals and Standalone Components
-   **Database**: PostgreSQL with Entity Framework Core
-   **UI Framework**: Angular Material (Material Design 3)
-   **Deployment**: Docker containerization

**Key Characteristics:**

-   Three-layer architecture with clear boundaries
-   Feature-based module organization
-   Repository and Service patterns
-   SOLID principles throughout
-   Test-driven development (>80% coverage)
-   API-first design with OpenAPI documentation

---

## Core Principles

### SOLID Principles

**1. Single Responsibility (SRP)**

-   Each class has one reason to change
-   Controllers handle HTTP concerns only
-   Services contain business logic only
-   Repositories handle data access only

**2. Open/Closed (OCP)**

-   Open for extension via interfaces
-   Closed for modification via dependency injection
-   New features don't modify existing code

**3. Liskov Substitution (LSP)**

-   All implementations are interchangeable via interfaces
-   Repositories, services, and validators follow contracts

**4. Interface Segregation (ISP)**

-   Focused, minimal interfaces
-   No client depends on unused methods
-   Feature-specific service interfaces

**5. Dependency Inversion (DIP)**

-   High-level modules depend on abstractions
-   Low-level modules implement abstractions
-   All dependencies injected via constructors/inject()

### Additional Principles

-   **KISS**: Simple solutions over complex abstractions
-   **YAGNI**: Build what's needed now
-   **DRY**: Don't repeat yourself
-   **Separation of Concerns**: Clear boundaries between layers
-   **Fail-Fast**: Validate early, throw exceptions immediately

---

## Backend Architecture

### Layer Structure

```
SeventySix.Api (Presentation)
    ├─ Controllers: HTTP endpoints, routing
    ├─ Middleware: Global concerns
    └─ Program.cs: DI composition root
         │ depends on ↓
SeventySix.BusinessLogic (Application/Domain)
    ├─ Services: Business logic orchestration
    ├─ Entities: Domain models
    ├─ DTOs: Data transfer objects
    ├─ Validators: FluentValidation rules
    ├─ Interfaces: Service & repository contracts
    ├─ Exceptions: Business rule violations
    ├─ ValueObjects: Immutable domain concepts
    ├─ Extensions: Mapping and helper methods
    ├─ Configuration: Application settings
    └─ Infrastructure: HTTP clients, external services
         ↑ implements
SeventySix.Data (Persistence)
    ├─ DbContext: Entity Framework Core context
    ├─ Configurations: Entity configurations
    ├─ Migrations: Database migrations
    ├─ Repositories: Repository implementations
    └─ Infrastructure: TransactionManager
```

### Layer Responsibilities

**SeventySix.BusinessLogic (Application + Domain)**

-   Business entities with domain logic
-   Service implementations
-   Service & repository interfaces (abstractions)
-   DTOs for API contracts
-   FluentValidation validators
-   Domain exceptions
-   Value objects
-   Mapping extensions (Entity ↔ DTO)
-   Configuration classes
-   Infrastructure adapters (HTTP clients, external API wrappers)
-   Minimal framework dependencies (EF abstractions, FluentValidation, MediatR, Polly)

**SeventySix.Data (Persistence)**

-   ApplicationDbContext
-   Entity configurations (Fluent API)
-   EF Core migrations
-   Database-specific implementations (PostgreSQL)
-   Repository implementations using LINQ
-   TransactionManager implementation (ITransactionManager interface in BusinessLogic)
-   Database-agnostic query logic

**SeventySix.Api (Presentation)**

-   Controllers (thin, delegate to services)
-   Middleware pipeline
-   DI configuration
-   API documentation (OpenAPI)
-   HTTP-specific concerns

### Dependency Rules

-   **BusinessLogic** has minimal dependencies (EF Core abstractions, FluentValidation, MediatR, Polly for HTTP resilience)
-   **Data** depends on BusinessLogic (for entity definitions and interfaces)
-   **Api** depends on BusinessLogic + Data (composition root)

### Key Design Decisions

**Simplified Three-Layer Architecture**

-   Combines Core (Domain) and BusinessLogic (Application) into single BusinessLogic layer
-   Consolidates DataAccess and Data into single Data layer
-   Reduces over-engineering (5 projects → 3 projects) while maintaining separation of concerns
-   Easier navigation and faster development
-   Still maintains testability and clean boundaries
-   Follows Dependency Inversion Principle: interfaces in BusinessLogic, implementations in Data

**Repository Pattern**

-   Abstracts data access from business logic
-   Interface in BusinessLogic, implementation in Data
-   Returns domain entities, not DTOs
-   Uses LINQ for database-agnostic queries

**Service Layer Pattern**

-   Encapsulates business logic
-   Coordinates repositories, validation, mapping
-   Returns DTOs, never domain entities
-   Interface-based for testability

**DTO Pattern**

-   Never expose domain entities via API
-   Request DTOs for incoming data
-   Response DTOs for outgoing data
-   Mapping via extension methods

**Validation Strategy**

-   FluentValidation for all requests
-   ValidateAndThrowAsync for fail-fast
-   Separate validators per request type
-   Registered in DI container

**Transaction Management**

-   TransactionManager handles transactions
-   Retry logic for transient failures
-   Scoped lifetime (per-request)

---

## Frontend Architecture

### Directory Structure

```
src/app/
├── core/                       # Singleton services (app-wide)
│   ├── api-services/           # Generic HTTP client
│   ├── guards/                 # Route guards
│   ├── interceptors/           # HTTP interceptors
│   ├── models/                 # Shared interfaces
│   ├── repositories/           # Shared data access
│   └── services/               # Global services
├── features/                   # Feature modules (lazy loaded)
│   ├── admin/                  # Admin feature area
│   │   ├── users/              # Users feature (self-contained)
│   │   │   ├── components/     # Feature-specific components
│   │   │   ├── models/         # Feature-specific models
│   │   │   ├── repositories/   # Feature-specific data access
│   │   │   ├── services/       # Feature-specific business logic
│   │   │   └── subpages/       # Feature sub-routes
│   │   └── admin.routes.ts     # Admin area routing
│   ├── home/                   # Home feature area
│   │   └── weather/            # Weather feature (self-contained)
│   │       ├── components/     # Weather components
│   │       ├── models/         # Weather models
│   │       ├── repositories/   # Weather data access
│   │       └── services/       # Weather business logic
│   └── game/                   # Game feature area
├── shared/                     # Reusable components
│   ├── components/             # Shared UI components
│   ├── directives/             # Custom directives
│   └── pipes/                  # Custom pipes
├── testing/                    # Test utilities
│   └── mocks/                  # Mock objects
├── app.config.ts               # App configuration
└── app.routes.ts               # Main routing
```

### Modern Angular Patterns

**Standalone Components (Default)**

-   All components are standalone
-   Direct imports, no NgModule
-   Tree-shakeable by default

**Signal-Based State**

-   Reactive state with signals
-   Computed for derived values
-   Better performance than RxJS for local state

**OnPush Change Detection**

-   All components use OnPush
-   10-100x performance improvement
-   Signal changes trigger updates automatically

**Dependency Injection with inject()**

-   Cleaner than constructor injection
-   Enables composition patterns
-   Better for testing

**Modern Template Syntax**

-   `@if`, `@for`, `@switch` instead of directives
-   Built into Angular, no imports needed
-   Better performance and type safety

**TrackBy Functions**

-   All `@for` loops use track expressions
-   Minimizes DOM manipulation
-   Identity tracking for performance

### Layer Pattern (Frontend)

```
Component (Presentation)
    └─ inject service ↓
Service (Business Logic)
    └─ inject repository ↓
Repository (Data Access)
    └─ inject ApiService ↓
ApiService (HTTP Client)
    └─ HTTP interceptors
```

---

## Feature Module Pattern

### Self-Contained Feature Structure

Each feature is **fully self-contained** with its own:

-   **Components**: UI components for the feature
-   **Models**: TypeScript interfaces/classes
-   **Repositories**: Data access specific to feature
-   **Services**: Business logic specific to feature
-   **Subpages**: Child routes/pages

### Benefits

-   **Encapsulation**: Feature internals are isolated
-   **Reusability**: Features can be moved/shared
-   **Lazy Loading**: Features load on-demand
-   **Team Scalability**: Teams own features end-to-end
-   **Testability**: Features test independently

### Feature Organization Rules

**When to create a feature-local service/repository:**

-   Service/repository is used ONLY by this feature
-   Logic is specific to feature domain
-   No other features need this functionality

**When to use core services/repositories:**

-   Shared across multiple features
-   Global app concerns (auth, logging, theme)
-   Reusable infrastructure (HTTP client, cache)

**Example: Users Feature**

```
features/admin/users/
├── components/          # User-specific UI components
├── models/
│   ├── user.model.ts    # User interface
│   └── index.ts         # Barrel export
├── repositories/
│   ├── user.repository.ts      # User data access
│   └── index.ts                # Barrel export
├── services/
│   ├── user.service.ts         # User business logic
│   └── index.ts                # Barrel export
├── subpages/
│   ├── users-page.ts           # List page
│   ├── user-create-page.ts     # Create page
│   └── user-edit-page.ts       # Edit page
└── users.component.ts          # Feature root component
```

### Feature Barrel Exports

Each subdirectory has an `index.ts` for clean imports:

```typescript
// features/admin/users/models/index.ts
export * from "./user.model";

// features/admin/users/services/index.ts
export * from "./user.service";

// features/admin/users/repositories/index.ts
export * from "./user.repository";
```

**Usage in components:**

```typescript
import { User } from "@admin/users/models";
import { UserService } from "@admin/users/services";
import { UserRepository } from "@admin/users/repositories";
```

### Path Aliases

Configure TypeScript path mappings for clean imports:

```json
{
	"paths": {
		"@core/*": ["src/app/core/*"],
		"@shared/*": ["src/app/shared/*"],
		"@admin/*": ["src/app/features/admin/*"],
		"@home/*": ["src/app/features/home/*"],
		"@environments/*": ["src/environments/*"]
	}
}
```

### Routing Strategy

**Lazy load all features:**

```typescript
export const routes: Routes = [
	{
		path: "users",
		loadComponent: () => import("./features/admin/users/users-page").then((m) => m.UsersPage),
		children: [
			{
				path: "new",
				loadComponent: () => import("./features/admin/users/user-create-page").then((m) => m.UserCreatePage),
			},
			{
				path: ":id",
				loadComponent: () => import("./features/admin/users/user-edit-page").then((m) => m.UserEditPage),
			},
		],
	},
];
```

---

## Data Flow Architecture

### Request Flow (Create Entity)

```
1. User interacts with component
       ↓
2. Component calls feature service
       ↓
3. Service calls feature repository
       ↓
4. Repository calls ApiService.post()
       ↓
5. HTTP Interceptors (cache → auth → logging → error)
       ↓
6. HTTP POST to backend API
       ↓
7. Middleware pipeline (security → exception → rate limit → compression → CORS)
       ↓
8. Controller receives request
       ↓
9. Controller calls service
       ↓
10. Service validates (FluentValidation)
       ↓
11. Service maps DTO → Entity
       ↓
12. Service calls repository
       ↓
13. Repository persists to database
       ↓
14. Repository returns entity
       ↓
15. Service maps Entity → DTO
       ↓
16. Controller returns 201 Created + DTO
       ↓
17. Response through middleware (compression)
       ↓
18. Response through interceptors (error → logging)
       ↓
19. Repository receives Observable<Entity>
       ↓
20. Service receives Observable<Entity>
       ↓
21. Component subscribes, updates signals
       ↓
22. OnPush change detection triggers
       ↓
23. UI updates
```

### Error Handling Flow

```
Exception thrown in service
       ↓
GlobalExceptionMiddleware catches
       ↓
Convert to ProblemDetails (RFC 7807)
       ↓
HTTP 4xx/5xx response
       ↓
Error interceptor catches
       ↓
Logging interceptor logs error
       ↓
Component error callback fires
       ↓
Error signal updated
       ↓
UI displays error message
```

---

## Dependency Management

### Backend DI Configuration

**Service Lifetimes:**

-   **Scoped**: Repositories, Services, DbContext (per-request)
-   **Singleton**: Configuration, Logging, Caching
-   **Transient**: Stateless utilities

**Registration Pattern:**

```csharp
// Repositories (interface → implementation)
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Services
builder.Services.AddScoped<IUserService, UserService>();

// Validators (auto-register from assembly)
builder.Services.AddValidatorsFromAssemblyContaining<CreateUserValidator>();

// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));
```

### Frontend DI Configuration

**Service Registration:**

-   All services use `providedIn: 'root'` (singleton)
-   Feature services still singleton but isolated to feature

**Injection Pattern:**

```typescript
export class UserService {
	private readonly userRepository = inject(UserRepository);
	private readonly logger = inject(LoggerService);
}
```

### Interceptor Chain

**Order of execution:**

1. Cache Interceptor (check cache first)
2. Auth Interceptor (add auth headers)
3. Logging Interceptor (log requests)
4. Error Interceptor (handle errors globally)

**Configuration:**

```typescript
provideHttpClient(
	withInterceptors([cacheInterceptor, authInterceptor, loggingInterceptor, errorInterceptor]),
	withXsrfConfiguration({
		cookieName: "XSRF-TOKEN",
		headerName: "X-XSRF-TOKEN",
	})
);
```

### Middleware Pipeline (Backend)

**Order of execution:**

1. Security Headers
2. Global Exception Handler
3. Rate Limiting
4. Response Compression
5. Response Caching
6. CORS
7. HTTPS Redirection
8. Authentication (future)
9. Authorization (future)
10. Controller Routing

---

## Security Architecture

### Backend Security

**Security Headers (Middleware)**

-   `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
-   `X-Frame-Options: DENY` (clickjacking protection)
-   `X-XSS-Protection: 1; mode=block` (XSS protection)
-   `Strict-Transport-Security` (HTTPS enforcement)
-   `Referrer-Policy: strict-origin-when-cross-origin`
-   `Content-Security-Policy` (future)

**CORS Configuration**

-   Whitelist allowed origins from configuration
-   Allow credentials for cookies/auth
-   Restrict headers and methods

**Rate Limiting**

-   Database-backed rate limiting per API endpoint
-   Configurable limits per endpoint
-   Returns 429 Too Many Requests
-   Prevents DDoS and brute force attacks

**Input Validation**

-   FluentValidation for all requests
-   Fail-fast with ValidationException
-   Detailed validation error responses

**Error Handling**

-   Never expose stack traces in production
-   ProblemDetails (RFC 7807) for consistent errors
-   Correlation IDs for tracking
-   Structured logging with Serilog

### Frontend Security

**XSRF Protection**

-   Automatic XSRF token handling
-   Cookie-to-header token strategy

**Content Sanitization**

-   Angular sanitizes all bindings by default
-   DomSanitizer for trusted content only

**HTTP-Only Cookies (Future)**

-   Store auth tokens in HTTP-only cookies
-   Not accessible to JavaScript

---

## Performance & Scalability

### Backend Performance

**Async/Await Throughout**

-   All controllers and services use async/await
-   Non-blocking I/O
-   CancellationToken support for request cancellation

**Response Compression**

-   Brotli (preferred) and Gzip fallback
-   Reduces bandwidth by 70-80%
-   Configured at fastest compression level

**Response Caching**

-   HTTP caching headers
-   Client-side caching via Cache-Control
-   Configurable cache duration per endpoint

**Database Optimization**

-   Connection pooling (EF Core)
-   Retry logic for transient failures
-   AsNoTracking() for read-only queries
-   Indexes on frequently queried columns
-   MVCC (PostgreSQL) for concurrency

**Horizontal Scalability**

-   Stateless API design (no session state)
-   Docker containerization
-   Load balancer ready
-   Database connection pooling

### Frontend Performance

**OnPush Change Detection**

-   All components use OnPush
-   10-100x improvement over default
-   Signal-based reactivity

**Lazy Loading**

-   All features lazy loaded
-   Code splitting per route
-   Smaller initial bundle

**Browser Targeting & Polyfills**

-   Target: Last 2 versions of evergreen browsers only (14 versions total)
-   Chrome 141+, Firefox 143+, Safari 26+, Edge 141+
-   No polyfills needed (Angular 20 zoneless + ES2022)
-   Bundle size reduced by eliminating legacy browser support
-   Configuration: `.browserslistrc` in client root
-   Benefits: ~20-30% smaller bundles, faster loading

**TrackBy Functions**

-   Efficient list rendering
-   Minimize DOM manipulation
-   Identity tracking

**Service Worker (PWA)**

-   Offline support
-   Background sync
-   Asset caching
-   Network-first strategy

**Response Caching**

-   HTTP cache via interceptor
-   Configurable cache duration
-   Cache invalidation strategies

---

## Testing Strategy

### Backend Testing

**Unit Tests (>80% coverage)**

-   Test domain entities
-   Test service logic with mocked repositories
-   Test validators
-   Test mapping extensions
-   Use xUnit + Moq

**Integration Tests**

-   Test controllers with TestServer
-   Test database repositories with test database
-   Test middleware pipeline
-   Use WebApplicationFactory

### Test Organization

**Test Project Structure:**

All test projects are organized in a dedicated `Tests/` subfolder within the server solution, providing clear separation between production code and test infrastructure:

-   `Tests/SeventySix.Api.Tests` - Integration tests for API controllers using WebApplicationFactory
-   `Tests/SeventySix.BusinessLogic.Tests` - Unit tests for services, validators, and extensions
-   `Tests/SeventySix.Data.Tests` - Integration tests for repositories using Testcontainers PostgreSQL
-   `Tests/SeventySix.TestUtilities` - **Shared test infrastructure (NO duplication allowed)**

#### Shared Test Utilities

The `SeventySix.TestUtilities` project eliminates code duplication across test projects by providing:

**Test Bases**:

-   `BasePostgreSqlTestBase` - Abstract base for PostgreSQL tests with common operations
-   `ApiPostgreSqlTestBase<TProgram>` - Base for API tests (uses localhost PostgreSQL)
-   `DataPostgreSqlTestBase` - Base for Data layer tests (uses Testcontainers PostgreSQL)

**Test Fixtures**:

-   `BasePostgreSqlFixture` - Abstract fixture for PostgreSQL initialization
-   `LocalPostgreSqlFixture` - Localhost PostgreSQL for API tests (faster, matches production)
-   `TestcontainersPostgreSqlFixture` - Docker-based PostgreSQL for Data tests (isolated, reproducible)

**Test Builders**:

-   `LogBuilder` - Fluent builder for Log entities
-   `UserBuilder` - Fluent builder for User entities
-   `ThirdPartyApiRequestBuilder` - Fluent builder for API request entities

**Test Helpers**:

-   `RepositoryTestHelper` - Factory methods for creating repository instances
-   `ValidationMockHelper` - Helpers for mocking FluentValidation
-   `OpenWeatherMockHelper` - Helpers for mocking OpenWeather API

**Custom Attributes**:

-   `[IntegrationTest]` - Conditionally runs integration tests (requires configuration)
-   `[IntegrationTheory]` - Conditionally runs integration theory tests

#### Test Infrastructure Rules

**CRITICAL: DO NOT duplicate test infrastructure**

✅ **DO**:

-   Use `SeventySix.TestUtilities` for ALL shared test infrastructure
-   Inherit from provided base classes (`ApiPostgreSqlTestBase`, `DataPostgreSqlTestBase`)
-   Use test builders for complex entity creation
-   Use test helpers for common operations
-   Add new shared infrastructure to TestUtilities (not individual test projects)

❌ **DON'T**:

-   Create local TestBases/ folders in test projects
-   Create local Attributes/ folders in test projects
-   Duplicate test helpers across projects
-   Create manual entity instances when builders exist
-   Copy test infrastructure code between projects

**When to Add to TestUtilities**:

1. Test infrastructure needed by 2+ test projects → Add to TestUtilities
2. Test base classes for common scenarios → Add to TestBases/
3. Reusable test data builders → Add to Builders/
4. Shared test utilities/helpers → Add to TestHelpers/
5. Custom xUnit attributes → Add to Attributes/

**When to Keep in Test Project**:

1. Tests specific to one layer (controllers, services, repositories)
2. Test data specific to one feature
3. Mocks specific to one scenario

### Frontend Testing

**Unit Tests (Jasmine/Karma)**

-   Test components with mocked services
-   Test services with mocked repositories
-   Test repositories with mocked HTTP
-   Test guards and interceptors
-   Signal-based state testing

**E2E Tests (Playwright)**

-   Test critical user workflows
-   Test navigation
-   Test form submissions
-   Accessibility testing

**Test Organization**

-   `*.spec.ts` alongside source files
-   Shared mocks in `testing/mocks/`
-   E2E tests in `e2e/` directory

### Testing Best Practices

**Arrange-Act-Assert Pattern**

-   Clear test structure
-   One assertion per test
-   Descriptive test names

**Dependency Injection for Testing**

-   Mock all dependencies
-   Use interfaces for substitution
-   Test in isolation

**Test Naming Convention**

-   `MethodName_Scenario_ExpectedResult`
-   Example: `CreateUser_ValidRequest_ReturnsUserDto`

---

## Summary

### When Adding a New Feature

**Backend:**

1. Create entity in `BusinessLogic/Entities`
2. Create repository interface in `BusinessLogic/Interfaces`
3. Create DTOs in `BusinessLogic/DTOs`
4. Create service interface in `BusinessLogic/Interfaces`
5. Create validators in `BusinessLogic/Validators`
6. Create service implementation in `BusinessLogic/Services`
7. Create repository implementation in `Data/Repositories`
8. Create entity configuration in `Data/Configurations`
9. Create controller in `Api/Controllers`
10. Register in DI container in `Api/Extensions/ServiceCollectionExtensions.cs`
11. Write unit and integration tests

**Frontend:**

1. Create feature folder in `features/`
2. Create `models/` subdirectory with interfaces
3. Create `repositories/` subdirectory with data access
4. Create `services/` subdirectory with business logic
5. Create `components/` subdirectory with UI components
6. Create barrel exports (`index.ts`) for each subdirectory
7. Add routes in `app.routes.ts` with lazy loading
8. Write unit tests alongside source files
9. Add E2E tests in `e2e/` directory

### Key Architectural Decisions

-   **Clean Architecture**: Dependency rules enforced via layers
-   **Feature Modules**: Self-contained features with own models/services/repositories
-   **Repository Pattern**: Abstract data access from business logic
-   **Service Layer**: Encapsulate business logic and orchestration
-   **DTO Pattern**: Never expose domain entities via API
-   **Signals**: Reactive state management in Angular
-   **OnPush**: Performance optimization via change detection strategy
-   **Lazy Loading**: On-demand feature loading for smaller bundles
-   **Dependency Injection**: Loose coupling and testability
-   **SOLID Principles**: Foundation of all design decisions

### Reference Documentation

-   `STYLE_GUIDE.md`: Component patterns, UI/UX guidelines
-   `CLAUDE.md`: Development guidelines, best practices
