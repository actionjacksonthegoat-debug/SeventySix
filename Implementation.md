# SeventySix Refactoring Implementation Plan

**Project**: SeventySix Full-Stack Application
**Goal**: Refactor Angular Client and .NET Core Server to follow SOLID, KISS, YAGNI, TDD principles and design patterns
**Approach**: Phased implementation with testing at each stage
**Date**: November 9, 2025

---

## Executive Summary

This plan outlines a systematic refactoring of the SeventySix application to align with modern best practices, clean architecture, and the guidelines defined in `CLAUDE.md`. The implementation is divided into 6 phases, each building upon the previous, with testing and validation at every step.

**Current State Assessment**:

-   ✅ Angular: Already using standalone components, signals, and modern patterns
-   ✅ .NET: Using .NET 10 with nullable reference types enabled
-   ⚠️ Missing: Clean architecture layers, proper separation of concerns, comprehensive testing
-   ⚠️ Needs: Repository pattern, service layer, DTOs, error handling, logging, validation

---

## Phase 1: Foundation & Infrastructure Setup ✅ COMPLETED

**Duration**: 1-2 days
**Goal**: Establish testing infrastructure, project structure, and development standards
**Risk**: Low
**Status**: ✅ **COMPLETED** - All deliverables achieved

### 1.1 Client (Angular) Tasks

-   [x] **Setup Testing Infrastructure** ✅

    -   ✅ Created test utilities and mocks in `testing/` folder
    -   ✅ Added coverage reporting configuration to angular.json
    -   ✅ Created `MockApiService` for testing
    -   ✅ Created test helper functions

-   [x] **Update TypeScript Configuration** ✅

    -   ✅ Verified strict mode is enabled
    -   ✅ Path aliases configured including `@testing/*`

-   [x] **Project Structure Enhancement** ✅
    ```
    src/app/
    ├── core/
    │   ├── interceptors/       # HTTP interceptors
    │   ├── guards/             # Route guards
    │   ├── services/           # Core singleton services
    │   ├── models/             # Domain models & interfaces
    │   └── repositories/       # Data access abstractions
    ├── shared/
    │   ├── components/         # Reusable components
    │   ├── directives/         # Shared directives
    │   ├── pipes/              # Shared pipes
    │   └── utils/              # Utility functions
    ├── features/               # Feature modules (rename from 'modules')
    │   ├── game/
    │   └── sandbox/
    └── testing/                # Test utilities
    ```

### 1.2 Server (.NET) Tasks

-   [x] **Setup Clean Architecture Structure** ✅

    -   ✅ Created `SeventySix.Domain` project with folders: Entities, Interfaces, ValueObjects, Exceptions
    -   ✅ Created `SeventySix.Application` project with folders: Commands, Queries, DTOs, Interfaces, Services, Validators, Mappings
    -   ✅ Created `SeventySix.Infrastructure` project with folders: Repositories, Data, Services
    -   ✅ Configured project references correctly
    -   ✅ `SeventySix.Api` remains as presentation layer with Middleware folder

-   [x] **Setup Testing Projects** ✅

    -   ✅ Created `SeventySix.Api.Tests` with WebApplicationFactory support
    -   ✅ Created `SeventySix.Application.Tests`
    -   ✅ Created `SeventySix.Domain.Tests`
    -   ✅ Installed xUnit, Moq, FluentAssertions on all test projects

-   [x] **Add Essential NuGet Packages** ✅
    -   ✅ FluentValidation.DependencyInjectionExtensions 12.1.0
    -   ✅ Serilog.AspNetCore 9.0.0 + Serilog.Sinks.File 7.0.0
    -   ✅ MediatR 13.1.0
    -   ✅ AutoMapper 15.1.0

### 1.3 Deliverables ✅

-   ✅ Test infrastructure configured (Angular: Karma + Jasmine, .NET: xUnit)
-   ✅ Project structure matches clean architecture
-   ✅ Development tools and packages installed
-   ✅ Initial test files exist in all test projects
-   ✅ **Both client and server build successfully**
-   ✅ All project references properly configured

---

## Phase 2: Core Services & Repository Pattern

**Duration**: 2-3 days
**Goal**: Implement repository pattern, service layer, and proper abstractions
**Risk**: Low-Medium
**Dependencies**: Phase 1

### 2.1 Client (Angular) Tasks

-   [ ] **Create Repository Abstractions**

    -   Create `core/repositories/base.repository.ts` (generic repository interface)
    -   Create `core/repositories/weather-forecast.repository.ts`
    -   Implement repository using `inject(ApiService)`

-   [ ] **Refactor ApiService**

    -   Create interface `IApiService` for abstraction (DIP)
    -   Add proper error handling with custom error types
    -   Add logging interceptor
    -   Add authentication interceptor (placeholder)
    -   Write unit tests for ApiService

-   [ ] **Create Domain Services**

    -   Create `core/services/weather.service.ts` (business logic)
    -   Use repository pattern instead of direct API calls
    -   Write unit tests for WeatherService

-   [ ] **Add HTTP Interceptors**
    -   Create `core/interceptors/error.interceptor.ts` (global error handling)
    -   Create `core/interceptors/logging.interceptor.ts` (request/response logging)
    -   Create `core/interceptors/auth.interceptor.ts` (authentication token)
    -   Register interceptors in `app.config.ts`

### 2.2 Server (.NET) Tasks

-   [ ] **Create Domain Layer**

    ```csharp
    SeventySix.Domain/
    ├── Entities/
    │   └── WeatherForecast.cs       # Domain entity
    ├── Interfaces/
    │   └── IWeatherRepository.cs     # Repository interface
    ├── ValueObjects/                 # Value objects (if needed)
    └── Exceptions/                   # Domain exceptions
    ```

-   [ ] **Create Application Layer**

    ```csharp
    SeventySix.Application/
    ├── DTOs/
    │   ├── WeatherForecastDto.cs
    │   └── Requests/
    ├── Interfaces/
    │   └── IWeatherService.cs
    ├── Services/
    │   └── WeatherService.cs
    ├── Mappings/
    │   └── MappingProfile.cs         # AutoMapper profiles
    └── Validators/
        └── WeatherForecastValidator.cs
    ```

-   [ ] **Create Infrastructure Layer**

    ```csharp
    SeventySix.Infrastructure/
    ├── Repositories/
    │   ├── BaseRepository.cs
    │   └── WeatherRepository.cs
    ├── Data/
    │   └── AppDbContext.cs           # If using EF Core
    └── Services/
        └── ExternalApiService.cs     # External integrations
    ```

-   [ ] **Setup Dependency Injection**

    -   Register repositories in `Program.cs`
    -   Register services with appropriate lifetimes
    -   Use options pattern for configuration

-   [ ] **Write Unit Tests**
    -   Test WeatherService (mock repository)
    -   Test WeatherRepository (in-memory DB)
    -   Test validators

### 2.3 Deliverables

-   ✅ Repository pattern implemented (Client & Server)
-   ✅ Service layer with business logic separation
-   ✅ Dependency injection properly configured
-   ✅ Unit tests for services and repositories (>70% coverage)

---

## Phase 3: Error Handling, Validation & Logging

**Duration**: 2-3 days
**Goal**: Implement comprehensive error handling, input validation, and structured logging
**Risk**: Medium
**Dependencies**: Phase 2

### 3.1 Client (Angular) Tasks

-   [ ] **Create Error Handling System**

    -   Create `core/models/errors/app-error.ts` (custom error types)
    -   Create `core/services/error-handler.service.ts` (global error handler)
    -   Create `core/services/notification.service.ts` (user notifications)
    -   Update error interceptor to use notification service

-   [ ] **Add Form Validation**

    -   Create `shared/validators/` directory
    -   Implement custom validators as pure functions
    -   Create reusable validated form components
    -   Add validation error messages component

-   [ ] **Implement Logging**

    -   Create `core/services/logger.service.ts`
    -   Add console logging in development
    -   Add remote logging endpoint for production
    -   Log errors, warnings, and important user actions

-   [ ] **Write Tests**
    -   Test error handler service
    -   Test custom validators
    -   Test notification service

### 3.2 Server (.NET) Tasks

-   [ ] **Setup Global Exception Handling**

    -   Create `Api/Middleware/GlobalExceptionMiddleware.cs`
    -   Create custom exception types in Domain layer
    -   Return ProblemDetails for all errors
    -   Map domain exceptions to appropriate HTTP status codes

-   [ ] **Implement FluentValidation**

    -   Create validators for all DTOs
    -   Register validators in DI container
    -   Add validation pipeline behavior for MediatR
    -   Return validation errors as ProblemDetails

-   [ ] **Setup Structured Logging**

    -   Configure Serilog in `Program.cs`
    -   Add file logging for production
    -   Add correlation IDs for request tracing
    -   Log in repositories, services, and controllers
    -   Create `LoggingBehavior` for MediatR pipeline

-   [ ] **Create Result Pattern** (Optional but recommended)

    -   Create `Result<T>` class for operation outcomes
    -   Use instead of throwing exceptions for expected failures
    -   Return success/failure with error details

-   [ ] **Write Tests**
    -   Test global exception middleware
    -   Test validators
    -   Test logging behavior
    -   Integration tests for error responses

### 3.3 Deliverables

-   ✅ Global error handling implemented
-   ✅ Input validation on all endpoints/forms
-   ✅ Structured logging throughout application
-   ✅ Consistent error responses (ProblemDetails)
-   ✅ Tests for error scenarios (>80% coverage)

---

## Phase 4: Component Refactoring & State Management

**Duration**: 2-3 days
**Goal**: Refactor components to follow best practices, implement proper state management
**Risk**: Low-Medium
**Dependencies**: Phase 2, 3

### 4.1 Client (Angular) Tasks

-   [ ] **Refactor Existing Components**

    -   Add `changeDetection: ChangeDetectionStrategy.OnPush` to all components
    -   Replace decorator-based inputs/outputs with `input()` and `output()` functions
    -   Move logic from components to services (SRP)
    -   Use `computed()` for derived state
    -   Ensure all components are standalone

-   [ ] **Update WeatherDisplay Component**

    -   Inject `WeatherService` instead of `ApiService`
    -   Add loading and error states (signals)
    -   Add retry logic
    -   Improve template with native control flow (`@if`, `@for`)
    -   Add `trackBy` function for list rendering

-   [ ] **Create Smart/Presentational Components**

    -   Smart components (containers): Handle state and logic
    -   Presentational components: Pure display with inputs/outputs
    -   Example: Split `WorldMap` into container and presentation

-   [ ] **Add Route Guards**

    -   Create `core/guards/auth.guard.ts` (authorization)
    -   Create `core/guards/unsaved-changes.guard.ts` (navigation)
    -   Apply guards to routes

-   [ ] **Implement Lazy Loading**

    -   Convert routes to lazy-loaded
    -   Create route configuration for each feature
    -   Add preloading strategy for critical routes

-   [ ] **Write Component Tests**
    -   Test component behavior (not implementation)
    -   Test user interactions
    -   Test error states
    -   Test loading states

### 4.2 Server (.NET) Tasks

-   [ ] **Implement CQRS Pattern with MediatR**

    -   Create `Application/Commands/` directory
    -   Create `Application/Queries/` directory
    -   Separate read/write operations
    -   Example: `GetWeatherForecastQuery` and `CreateWeatherForecastCommand`

-   [ ] **Update Controllers**

    -   Inject `IMediator` instead of services
    -   Controllers should only route to MediatR handlers
    -   Keep controllers thin (< 20 lines per action)
    -   Use minimal API for simple endpoints (consider converting)

-   [ ] **Add API Versioning**

    -   Install `Asp.Versioning.Mvc` package
    -   Configure API versioning in `Program.cs`
    -   Version controllers (v1, v2, etc.)

-   [ ] **Create Health Checks**

    -   Add health check endpoint
    -   Check database connection
    -   Check external service availability

-   [ ] **Write Integration Tests**
    -   Use `WebApplicationFactory` for testing
    -   Test complete request/response cycle
    -   Test validation errors
    -   Test authentication/authorization

### 4.3 Deliverables

-   ✅ All components follow Angular best practices
-   ✅ Smart/presentational component pattern implemented
-   ✅ Lazy loading configured for all features
-   ✅ CQRS pattern implemented on server
-   ✅ Thin controllers using MediatR
-   ✅ Comprehensive component and integration tests

---

## Phase 5: Security, Performance & Advanced Features ✅ COMPLETED

**Duration**: 2-3 days
**Goal**: Implement security, optimize performance, add advanced features
**Risk**: Medium-High
**Dependencies**: Phase 4
**Status**: ✅ **COMPLETED** - All deliverables achieved

### 5.1 Client (Angular) Tasks

-   [x] **Security Enhancements** ✅

    -   ✅ Created `TokenStorageService` for JWT token management
    -   ✅ Updated `auth.interceptor` to inject Bearer tokens
    -   ✅ Updated `auth.guard` to use token validation
    -   ✅ Enabled XSRF protection with `withXsrfConfiguration`
    -   ✅ Created `SanitizationService` for input sanitization (HTML/URL)

-   [x] **Performance Optimization** ✅

    -   ✅ OnPush change detection verified on all components (Phase 4)
    -   ✅ Lazy loading implemented with `loadComponent()` (Phase 4)
    -   ✅ Created HTTP cache interceptor with 5-minute TTL
    -   ✅ Cache utilities: `clearHttpCache()`, `clearHttpCachePattern()`
    -   ⏳ TODO: Virtual scrolling for large lists (as needed)
    -   ⏳ TODO: Service worker for PWA (optional)

-   [x] **Add Caching** ✅

    -   ✅ Implemented `cache.interceptor` with in-memory cache
    -   ✅ Caches GET requests except auth/user endpoints
    -   ✅ 5-minute TTL with automatic expiration
    -   ✅ Cache invalidation utilities provided

-   [x] **Performance Tests** ✅
    -   ✅ Measured bundle size: 245.11 kB initial (68.00 kB gzipped)
    -   ✅ Lazy chunk: 4.42 kB (1.28 kB gzipped)
    -   ⏳ TODO: Measure FCP and TTI with Lighthouse
    -   ⏳ TODO: Set performance budgets in angular.json

### 5.2 Server (.NET) Tasks

-   [x] **Security Hardening** ✅

    -   ✅ Added security headers middleware:
        -   X-Content-Type-Options: nosniff
        -   X-Frame-Options: DENY
        -   X-XSS-Protection: 1; mode=block
        -   Referrer-Policy: strict-origin-when-cross-origin
        -   Permissions-Policy: geolocation=(), microphone=(), camera=()
        -   HSTS for production (max-age=31536000)
    -   ✅ Configured CORS from appsettings.json
    -   ✅ Created `RateLimitingMiddleware` (100 requests/minute per IP)
    -   ⏳ TODO: Implement JWT authentication (when needed)

-   [x] **Performance Optimization** ✅

    -   ✅ Enabled response compression (Brotli + Gzip)
    -   ✅ Configured `CompressionLevel.Fastest`
    -   ✅ Added response caching middleware
    -   ✅ Added `[ResponseCache]` attributes to GET endpoints (60s duration)
    -   ⏳ TODO: Database optimization when database is added

-   [x] **Add Rate Limiting** ✅

    -   ✅ Created custom `RateLimitingMiddleware`
    -   ✅ 100 requests per minute per IP address
    -   ✅ Returns HTTP 429 with Retry-After header
    -   ✅ Automatic cleanup of old entries
    -   ✅ Registered in middleware pipeline

-   [x] **Configuration** ✅
    -   ✅ CORS origins configured in appsettings.json
    -   ✅ Response compression providers configured
    -   ✅ Response caching enabled
    -   ✅ Security headers applied

### 5.3 Deliverables

-   ✅ Security enhancements implemented (JWT storage, XSRF, input sanitization)
-   ✅ Caching strategy in place (HTTP cache interceptor with TTL)
-   ✅ Performance optimizations applied (compression, caching, lazy loading)
-   ✅ Security hardening completed (headers, rate limiting, CORS from config)
-   ✅ Rate limiting configured (100 req/min per IP)
-   ✅ Performance benchmarks established (bundle: 245.11 kB → 68.00 kB gzipped)

---

## Phase 6: Documentation, Testing & Deployment

**Duration**: 2-3 days
**Goal**: Complete testing, documentation, and prepare for deployment
**Risk**: Low
**Dependencies**: Phase 5

### 6.1 Client (Angular) Tasks

-   [ ] **Complete Test Coverage**

    -   Achieve >80% coverage for business logic
    -   Write E2E tests with Playwright or Cypress
    -   Test all user workflows
    -   Test error scenarios
    -   Test responsive design

-   [ ] **Documentation**

    -   Update README.md with setup instructions
    -   Document component APIs (inputs/outputs)
    -   Create architecture decision records (ADRs)
    -   Document state management patterns
    -   Create developer onboarding guide

-   [ ] **Code Quality**

    -   Run ESLint and fix all warnings
    -   Run Prettier on all files
    -   Review code for SOLID violations
    -   Remove dead code
    -   Remove console.logs from production build

-   [ ] **Build & Deployment**
    -   Configure production build optimizations
    -   Setup environment configurations
    -   Create Docker image
    -   Setup CI/CD pipeline (GitHub Actions)
    -   Configure deployment to hosting (Netlify/Vercel/Azure)

### 6.2 Server (.NET) Tasks

-   [ ] **Complete Test Coverage**

    -   Achieve >80% coverage for Application layer
    -   Write integration tests for all endpoints
    -   Test authentication/authorization flows
    -   Test error handling
    -   Test validation scenarios

-   [ ] **API Documentation**

    -   Ensure OpenAPI/Swagger is properly configured
    -   Add XML documentation comments
    -   Test Scalar API reference UI
    -   Create Postman collection
    -   Document authentication flow

-   [ ] **Code Quality**

    -   Run code analysis and fix warnings
    -   Apply .editorconfig rules
    -   Review code for SOLID violations
    -   Remove TODO comments or create issues
    -   Add XML documentation to public APIs

-   [ ] **Build & Deployment**

    -   Configure production appsettings
    -   Create Docker image
    -   Setup database migrations
    -   Configure health checks
    -   Setup CI/CD pipeline (GitHub Actions)
    -   Deploy to Azure/AWS

-   [ ] **Monitoring & Observability**
    -   Setup Application Insights or similar
    -   Configure alerts for errors
    -   Setup performance monitoring
    -   Create dashboards for key metrics

### 6.3 Deliverables

-   ✅ >80% test coverage on both client and server
-   ✅ Complete documentation (README, ADRs, API docs)
-   ✅ Production-ready builds
-   ✅ CI/CD pipelines configured
-   ✅ Monitoring and logging in place
-   ✅ Deployment to production environment

---

## Testing Strategy

### Test Pyramid

```
        E2E Tests (10%)
    ━━━━━━━━━━━━━━━━━━━━
   Integration Tests (30%)
  ━━━━━━━━━━━━━━━━━━━━━━━━━
      Unit Tests (60%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Client Testing

-   **Unit Tests**: Components, services, pipes, validators (60%)
-   **Integration Tests**: Component + service interactions (30%)
-   **E2E Tests**: Complete user workflows (10%)

### Server Testing

-   **Unit Tests**: Services, validators, domain logic (60%)
-   **Integration Tests**: API endpoints, database operations (30%)
-   **E2E Tests**: Complete API workflows (10%)

### Coverage Goals

-   Critical business logic: >90%
-   Services and repositories: >80%
-   Components and controllers: >70%
-   Overall: >80%

---

## Risk Mitigation

| Risk                             | Impact | Mitigation Strategy                            |
| -------------------------------- | ------ | ---------------------------------------------- |
| Breaking existing functionality  | High   | Comprehensive test suite before refactoring    |
| Over-engineering simple features | Medium | Follow YAGNI - only add patterns when needed   |
| Performance degradation          | Medium | Performance testing in Phase 5                 |
| Scope creep                      | Medium | Strict phase boundaries, prioritize MVP        |
| Team unfamiliarity with patterns | Low    | Code reviews, pair programming                 |
| Database schema changes          | Medium | Use migrations, test with production-like data |

---

## Success Metrics

### Code Quality

-   [ ] All files follow CLAUDE.md guidelines
-   [ ] ESLint/Code analysis passes with no warnings
-   [ ] SOLID principles applied throughout
-   [ ] No code duplication (DRY)

### Testing

-   [ ] > 80% code coverage
-   [ ] All critical paths have tests
-   [ ] All tests passing in CI/CD
-   [ ] E2E tests for main workflows

### Performance

-   [ ] Client bundle size < 500KB (initial)
-   [ ] API response time < 200ms (p95)
-   [ ] Time to Interactive < 3s
-   [ ] Lighthouse score > 90

### Documentation

-   [ ] Complete README with setup instructions
-   [ ] API documentation (OpenAPI)
-   [ ] Architecture diagrams
-   [ ] ADRs for major decisions

---

## Implementation Notes

### Phase Execution Strategy

1. **One Phase at a Time**: Complete each phase fully before moving to the next
2. **Test-Driven**: Write tests first (or immediately after) implementation
3. **Incremental Commits**: Commit frequently with descriptive messages
4. **Code Review**: Review all changes before merging
5. **Continuous Integration**: Run tests on every commit

### Design Pattern Application

**Use Patterns When**:

-   Repository: Abstracting data access ✅ (Phase 2)
-   Service Layer: Business logic separation ✅ (Phase 2)
-   Dependency Injection: Throughout ✅ (All phases)
-   CQRS: Separating reads/writes ✅ (Phase 4)
-   Observer: RxJS for async operations ✅ (Already in use)
-   Strategy: When you have interchangeable algorithms (As needed)
-   Factory: Dynamic component/object creation (As needed)

**Avoid Patterns When**:

-   The problem is simple and doesn't need abstraction
-   It adds complexity without clear benefit
-   You're speculating about future requirements (YAGNI)

### Simplicity Checklist

Before adding any pattern or abstraction, ask:

1. ✅ Does this solve an existing problem?
2. ✅ Does this make the code easier to understand?
3. ✅ Does this make the code easier to test?
4. ✅ Is this pattern appropriate for this use case?
5. ❌ Am I adding this "just in case"? (YAGNI violation)

---

## Quick Reference: File Organization

### Client Structure

```
src/app/
├── core/                    # Singleton services, app-wide
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   ├── repositories/
│   └── services/
├── features/                # Feature modules (lazy loaded)
│   ├── game/
│   │   ├── components/
│   │   ├── services/
│   │   └── game.routes.ts
│   └── sandbox/
├── shared/                  # Reusable across features
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── utils/
└── testing/                 # Test utilities
```

### Server Structure

```
SeventySix.Domain/          # Business entities, interfaces
├── Entities/
├── ValueObjects/
├── Interfaces/
└── Exceptions/

SeventySix.Application/     # Use cases, DTOs, business logic
├── Commands/
├── Queries/
├── DTOs/
├── Interfaces/
├── Services/
├── Validators/
└── Mappings/

SeventySix.Infrastructure/  # External concerns
├── Data/
├── Repositories/
└── Services/

SeventySix.Api/            # Presentation layer
├── Controllers/
├── Middleware/
├── Filters/
└── Program.cs
```

---

## Conclusion

This implementation plan provides a structured, phased approach to refactoring the SeventySix application. Each phase builds on the previous one, ensuring stability and testability throughout the process.

**Key Principles**:

-   Start simple, add complexity only when justified
-   Test at every step
-   Follow SOLID, KISS, YAGNI
-   Document decisions
-   Commit frequently

**Timeline**: Approximately 2-3 weeks for complete implementation

**Next Steps**: Begin Phase 1 - Foundation & Infrastructure Setup
