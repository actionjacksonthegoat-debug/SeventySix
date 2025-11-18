# Implementation Plan: Three-Layer Simplified Architecture

## Executive Summary

**Goal**: Simplify the backend architecture from 5 projects to 3 projects by consolidating related concerns.

**Current State**: 5 projects with confusing boundaries

-   SeventySix.Api (Presentation)
-   SeventySix.BusinessLogic (Application)
-   SeventySix.Core (Domain)
-   SeventySix.DataAccess (Data Access)
-   SeventySix.Data (Persistence)

**Target State**: 3 projects with clear responsibilities

-   SeventySix.Api (Presentation Layer)
-   SeventySix.Application (Business Logic Layer)
-   SeventySix.Data (Persistence Layer)

**Benefits**:

-   ✅ Eliminates DTO placement confusion
-   ✅ Reduces project complexity (5 → 3)
-   ✅ Faster build times
-   ✅ Clearer separation of concerns
-   ✅ Easier to navigate and maintain
-   ✅ Follows standard 3-tier architecture pattern

---

## ULTRATHINK Analysis

### Current Architecture Problems

**Problem 1: DTO Confusion**

-   DTOs split between Core and BusinessLogic
-   Core layer has application-specific DTOs (violates Clean Architecture)
-   Core's IOpenWeatherApiClient interface references DTOs → circular dependency issue
-   Developers confused about where to put new DTOs

**Problem 2: DataAccess vs Data Split**

-   DataAccess has repositories and external API clients
-   Data has DbContext, configurations, migrations
-   Unclear why these are separate projects
-   Both deal with persistence concerns

**Problem 3: Core vs BusinessLogic Overlap**

-   Core has domain entities, value objects, exceptions
-   BusinessLogic has services that use these entities
-   No real benefit to separating these for this application size
-   Core can't depend on BusinessLogic, but interfaces need DTOs

**Problem 4: Over-Engineering**

-   5 projects for a single application backend
-   Clean Architecture taken to extreme
-   More complexity than value provided
-   Slows down development and builds

### Architecture Principles Review

**From ARCHITECTURE.md:**

-   ✅ SOLID principles
-   ✅ Separation of concerns
-   ✅ Dependency inversion
-   ✅ Testability
-   ⚠️ KISS (Keep It Simple) - VIOLATED by 5 projects
-   ⚠️ YAGNI (You Aren't Gonna Need It) - VIOLATED by premature abstraction

**From CLAUDE.md:**

-   ✅ Start simple, refactor when needed
-   ✅ Avoid premature optimization
-   ✅ Build what is required now

### Decision: Three-Layer Architecture

**Layer 1: Api** (Presentation)

-   HTTP concerns only
-   Controllers
-   Middleware
-   Program.cs (composition root)
-   Attributes

**Layer 2: Application** (Business Logic + Domain)

-   **Entities** (domain models)
-   **DTOs** (ALL - requests, responses, third-party)
-   **Services** (business logic)
-   **Interfaces** (services, repositories)
-   **Validators** (FluentValidation)
-   **Exceptions** (business exceptions)
-   **ValueObjects** (domain value objects)
-   **Extensions** (mapping helpers)
-   **Configuration** (options classes)

**Layer 3: Data** (Persistence + Infrastructure)

-   **DbContext** (EF Core)
-   **Configurations** (entity configurations)
-   **Migrations** (database migrations)
-   **Repositories** (data access implementations)
-   **ExternalApiClients** (OpenWeather, etc.)
-   **Infrastructure** (TransactionManager, caching)

### Dependency Flow

```
Api → Application → Data
```

-   Api depends on Application + Data
-   Application depends on nothing (self-contained)
-   Data depends on Application (for interfaces)

---

## Implementation Plan

### Phase 1: Preparation & Backup

**Goal**: Ensure we can rollback if needed

**Tasks:**

1. ✅ Commit all current changes to git
2. ✅ Create feature branch: `feature/three-layer-architecture`
3. ✅ Document current project structure
4. ✅ Run all tests to establish baseline
5. ✅ Create backup of SeventySix.Server folder

**Verification:**

-   Git status shows clean working directory
-   All tests pass (baseline)
-   Branch created successfully

**Rollback Strategy:**

-   `git checkout master` to revert

---

### Phase 2: Create New Application Project

**Goal**: Create the consolidated Application layer

**Tasks:**

1. ✅ Create new project: `SeventySix.Application`

    ```powershell
    dotnet new classlib -n SeventySix.Application -f net10.0
    ```

2. ✅ Configure project file with dependencies:

    ```xml
    <ItemGroup>
      <PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="12.1.0" />
      <PackageReference Include="MediatR" Version="13.1.0" />
      <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
    </ItemGroup>
    ```

3. ✅ Create folder structure:

    ```
    SeventySix.Application/
    ├── DTOs/
    ├── Entities/
    ├── Exceptions/
    ├── Extensions/
    ├── Interfaces/
    ├── Services/
    ├── Validators/
    ├── ValueObjects/
    └── Configuration/
    ```

4. ✅ Add to solution
    ```powershell
    dotnet sln add SeventySix.Application/SeventySix.Application.csproj
    ```

**Verification:**

-   Project builds successfully
-   Solution includes new project
-   Folder structure created

---

### Phase 3: Migrate Core → Application

**Goal**: Move all Core layer contents to Application

**Files to Move:**

-   `Entities/` folder (3 files: User, ThirdPartyApiRequest, Log)
-   `ValueObjects/` folder (1 file: UserPreferences)
-   `Exceptions/` folder (2 files: BusinessRuleViolationException, ValidationException)
-   `Interfaces/` folder (ALL repository and service interfaces)
-   `DTOs/` folder (OpenWeather models - keep these)

**Tasks:**

**3.1: Move Entities**

1. ✅ Copy `Core/Entities/*` → `Application/Entities/`
2. ✅ Update namespace: `SeventySix.Core.Entities` → `SeventySix.Application.Entities`
3. ✅ Find all usages and update imports
4. ✅ Verify entity tests still work

**Files Affected:**

-   User.cs
-   ThirdPartyApiRequest.cs
-   Log.cs
-   ~15 files with using statements

**3.2: Move ValueObjects**

1. ✅ Copy `Core/ValueObjects/*` → `Application/ValueObjects/`
2. ✅ Update namespace: `SeventySix.Core.ValueObjects` → `SeventySix.Application.ValueObjects`
3. ✅ Update all usages

**Files Affected:**

-   UserPreferences.cs
-   User.cs (references UserPreferences)

**3.3: Move Exceptions**

1. ✅ Copy `Core/Exceptions/*` → `Application/Exceptions/`
2. ✅ Update namespace: `SeventySix.Core.Exceptions` → `SeventySix.Application.Exceptions`
3. ✅ Update all usages in services, validators, middleware

**Files Affected:**

-   BusinessRuleViolationException.cs
-   ValidationException.cs (if exists)
-   ~20 files with using statements

**3.4: Move Interfaces**

1. ✅ Copy `Core/Interfaces/*` → `Application/Interfaces/`
2. ✅ Update namespace: `SeventySix.Core.Interfaces` → `SeventySix.Application.Interfaces`
3. ✅ Update all usages across solution

**Files Affected:**

-   IUserRepository.cs
-   IThirdPartyApiRequestRepository.cs
-   ILogRepository.cs
-   IOpenWeatherApiClient.cs
-   IPollyIntegrationClient.cs
-   IRateLimitingService.cs
-   IHealthCheckService.cs
-   ILogChartService.cs
-   IMetricsService.cs
-   ~40 files with using statements

**3.5: Move Core DTOs to Application**

1. ✅ Copy `Core/DTOs/*` → `Application/DTOs/`
2. ✅ Update namespace: `SeventySix.Core.DTOs.*` → `SeventySix.Application.DTOs.*`
3. ✅ Keep folder structure: OpenWeather, Requests, Logs, Health, etc.
4. ✅ Update all usages

**Verification:**

-   All namespaces updated
-   Solution builds
-   No references to `SeventySix.Core.*` remain (except in tests)

---

### Phase 4: Migrate BusinessLogic → Application

**Goal**: Move BusinessLogic contents to Application

**Files to Move:**

-   `DTOs/` folder (merge with existing DTOs from Core)
-   `Services/` folder
-   `Interfaces/` folder (merge with existing from Core)
-   `Validators/` folder
-   `Extensions/` folder
-   `Configuration/` folder

**Tasks:**

**4.1: Merge DTOs**

1. ✅ Copy `BusinessLogic/DTOs/*` → `Application/DTOs/`
2. ✅ Update namespace: `SeventySix.BusinessLogic.DTOs.*` → `SeventySix.Application.DTOs.*`
3. ✅ Consolidate folder structure
4. ✅ Update all usages

**Files:**

-   UserDto.cs
-   PagedResult.cs
-   CreateUserRequest.cs
-   UpdateUserRequest.cs
-   UserQueryRequest.cs

**4.2: Move Services**

1. ✅ Copy `BusinessLogic/Services/*` → `Application/Services/`
2. ✅ Update namespace: `SeventySix.BusinessLogic.Services` → `SeventySix.Application.Services`
3. ✅ Update using statements for new DTO locations
4. ✅ Update all usages

**Files:**

-   UserService.cs
-   OpenWeatherService.cs
-   ThirdPartyApiRequestService.cs
-   LogChartService.cs
-   HealthCheckService.cs
-   MetricsService.cs

**4.3: Move Interfaces**

1. ✅ Copy `BusinessLogic/Interfaces/*` → `Application/Interfaces/`
2. ✅ Update namespace: `SeventySix.BusinessLogic.Interfaces` → `SeventySix.Application.Interfaces`
3. ✅ Update all usages

**Files:**

-   IUserService.cs
-   IOpenWeatherService.cs

**4.4: Move Validators**

1. ✅ Copy `BusinessLogic/Validators/*` → `Application/Validators/`
2. ✅ Update namespace: `SeventySix.BusinessLogic.Validators` → `SeventySix.Application.Validators`
3. ✅ Update all usages

**Files:**

-   CreateUserValidator.cs
-   UpdateUserValidator.cs
-   UserQueryValidator.cs
-   WeatherRequestValidator.cs
-   HistoricalWeatherRequestValidator.cs

**4.5: Move Extensions**

1. ✅ Copy `BusinessLogic/Extensions/*` → `Application/Extensions/`
2. ✅ Update namespace: `SeventySix.BusinessLogic.Extensions` → `SeventySix.Application.Extensions`
3. ✅ Update all usages

**Files:**

-   UserExtensions.cs

**4.6: Move Configuration**

1. ✅ Copy `BusinessLogic/Configuration/*` → `Application/Configuration/`
2. ✅ Update namespace: `SeventySix.BusinessLogic.Configuration` → `SeventySix.Application.Configuration`
3. ✅ Update all usages

**Files:**

-   OpenWeatherOptions.cs
-   OutputCacheOptions.cs
-   PollyOptions.cs
-   SecuritySettings.cs

**Verification:**

-   All files moved
-   No references to `SeventySix.BusinessLogic.*` remain
-   Solution builds

---

### Phase 5: Consolidate Data Layer

**Goal**: Merge DataAccess into Data

**Files to Move:**

-   `DataAccess/Repositories/*` → `Data/Repositories/`
-   `DataAccess/Services/*` → `Data/Services/`

**Tasks:**

**5.1: Move Repositories**

1. ✅ Copy `DataAccess/Repositories/*` → `Data/Repositories/`
2. ✅ Update namespace: `SeventySix.DataAccess.Repositories` → `SeventySix.Data.Repositories`
3. ✅ Update using statements (Core → Application)
4. ✅ Update all usages

**Files:**

-   UserRepository.cs
-   ThirdPartyApiRequestRepository.cs
-   LogRepository.cs

**5.2: Move Services (External API Clients)**

1. ✅ Copy `DataAccess/Services/*` → `Data/Services/`
2. ✅ Update namespace: `SeventySix.DataAccess.Services` → `SeventySix.Data.Services`
3. ✅ Update using statements (Core → Application)
4. ✅ Update all usages

**Files:**

-   OpenWeatherApiClient.cs
-   PollyIntegrationClient.cs
-   RateLimitingService.cs

**5.3: Update Data Project References**

1. ✅ Update `Data.csproj` to reference Application
2. ✅ Add necessary NuGet packages from DataAccess
3. ✅ Remove old DataAccess reference

**Before:**

```xml
<ProjectReference Include="..\SeventySix.Core\SeventySix.Core.csproj" />
```

**After:**

```xml
<ProjectReference Include="..\SeventySix.Application\SeventySix.Application.csproj" />

<PackageReference Include="Microsoft.Extensions.Caching.Memory" Version="9.0.0" />
<PackageReference Include="Microsoft.Extensions.Http.Polly" Version="8.0.0" />
<PackageReference Include="Polly" Version="8.2.0" />
<PackageReference Include="Polly.Extensions.Http" Version="3.0.0" />
```

**5.4: Update Infrastructure**

1. ✅ Verify TransactionManager still in Data/Infrastructure
2. ✅ Update namespaces if needed
3. ✅ Update using statements (Core → Application)

**Verification:**

-   All DataAccess files moved to Data
-   Solution builds
-   No references to `SeventySix.DataAccess.*` remain

---

### Phase 6: Update Api Layer

**Goal**: Update Api project to reference new structure

**Tasks:**

**6.1: Update Project References**

1. ✅ Update `Api.csproj`:

    ```xml
    <!-- BEFORE -->
    <ProjectReference Include="..\SeventySix.BusinessLogic\SeventySix.BusinessLogic.csproj" />
    <ProjectReference Include="..\SeventySix.DataAccess\SeventySix.DataAccess.csproj" />
    <ProjectReference Include="..\SeventySix.Data\SeventySix.Data.csproj" />

    <!-- AFTER -->
    <ProjectReference Include="..\SeventySix.Application\SeventySix.Application.csproj" />
    <ProjectReference Include="..\SeventySix.Data\SeventySix.Data.csproj" />
    ```

**6.2: Update Using Statements in Controllers**

1. ✅ Replace `SeventySix.BusinessLogic.*` → `SeventySix.Application.*`
2. ✅ Replace `SeventySix.Core.*` → `SeventySix.Application.*`

**Files Affected:**

-   WeatherForecastController.cs
-   UsersController.cs
-   LogsController.cs
-   HealthController.cs
-   ThirdPartyApiRequestsController.cs

**6.3: Update Using Statements in Middleware**

1. ✅ Update namespace references

**Files:**

-   GlobalExceptionMiddleware.cs
-   RateLimitingMiddleware.cs
-   AttributeBasedRateLimitingMiddleware.cs
-   AttributeBasedSecurityHeadersMiddleware.cs

**6.4: Update Using Statements in Extensions**

1. ✅ Update ServiceCollectionExtensions.cs
2. ✅ Update CacheInvalidationExtensions.cs

**6.5: Update Using Statements in Attributes**

1. ✅ Update RateLimitAttribute.cs
2. ✅ Update SecurityHeadersAttribute.cs

**6.6: Update Logging**

1. ✅ Update DatabaseLogSink.cs
2. ✅ Update DatabaseLogSinkExtensions.cs

**6.7: Update Program.cs**

1. ✅ Update service registrations
2. ✅ Update using statements
3. ✅ Verify DI container configuration

**Verification:**

-   Api builds successfully
-   No references to old namespaces
-   Swagger/OpenAPI still works

---

### Phase 7: Update Test Projects

**Goal**: Update all test projects to reference new structure

**Test Projects:**

-   SeventySix.Api.Tests
-   SeventySix.Application.Tests (renamed from BusinessLogic.Tests)
-   SeventySix.Data.Tests

**Tasks:**

**7.1: Rename Test Projects**

1. ✅ Rename `BusinessLogic.Tests` → `Application.Tests`
2. ✅ Rename `Core.Tests` → merge into `Application.Tests`
3. ✅ Delete `DataAccess.Tests` (merged into Data.Tests)

**7.2: Update Application.Tests**

1. ✅ Update project reference to SeventySix.Application
2. ✅ Update namespaces in all test files
3. ✅ Update using statements
4. ✅ Merge Core.Tests files into Application.Tests

**7.3: Update Data.Tests**

1. ✅ Update project reference to SeventySix.Application
2. ✅ Merge DataAccess.Tests files
3. ✅ Update namespaces and using statements

**7.4: Update Api.Tests**

1. ✅ Update using statements
2. ✅ Update namespace references
3. ✅ Verify integration tests work

**Verification:**

-   All test projects build
-   All tests pass
-   Test coverage maintained

---

### Phase 8: Remove Old Projects

**Goal**: Delete obsolete projects

**Tasks:**

1. ✅ Remove `SeventySix.Core` project from solution
2. ✅ Remove `SeventySix.BusinessLogic` project from solution
3. ✅ Remove `SeventySix.DataAccess` project from solution
4. ✅ Remove `SeventySix.Core.Tests` project from solution
5. ✅ Remove `SeventySix.BusinessLogic.Tests` project from solution
6. ✅ Remove `SeventySix.DataAccess.Tests` project from solution
7. ✅ Delete physical folders (backup first!)

**Commands:**

```powershell
# Remove from solution
dotnet sln remove SeventySix.Core/SeventySix.Core.csproj
dotnet sln remove SeventySix.BusinessLogic/SeventySix.BusinessLogic.csproj
dotnet sln remove SeventySix.DataAccess/SeventySix.DataAccess.csproj
dotnet sln remove SeventySix.Core.Tests/SeventySix.Core.Tests.csproj
dotnet sln remove SeventySix.BusinessLogic.Tests/SeventySix.BusinessLogic.Tests.csproj
dotnet sln remove SeventySix.DataAccess.Tests/SeventySix.DataAccess.Tests.csproj

# Delete folders (after backup!)
Remove-Item -Recurse -Force SeventySix.Core
Remove-Item -Recurse -Force SeventySix.BusinessLogic
Remove-Item -Recurse -Force SeventySix.DataAccess
Remove-Item -Recurse -Force SeventySix.Core.Tests
Remove-Item -Recurse -Force SeventySix.BusinessLogic.Tests
Remove-Item -Recurse -Force SeventySix.DataAccess.Tests
```

**Verification:**

-   Solution has only 6 projects (Api, Application, Data + 3 test projects)
-   Solution builds successfully
-   All tests pass

---

### Phase 9: Update Documentation

**Goal**: Update architecture documentation

**Tasks:**

**9.1: Update ARCHITECTURE.md**

1. ✅ Update layer structure diagram
2. ✅ Update project descriptions
3. ✅ Update dependency rules
4. ✅ Update "When Adding a New Feature" section
5. ✅ Add migration notes

**9.2: Update CLAUDE.md (if needed)**

1. ✅ Verify best practices still align
2. ✅ Update any project-specific examples

**9.3: Create Migration Guide**

1. ✅ Document namespace changes
2. ✅ Create migration table (old → new namespaces)
3. ✅ Add to README or separate MIGRATION.md

**Verification:**

-   Documentation accurate
-   Examples updated
-   Migration guide helpful

---

### Phase 10: Final Validation

**Goal**: Comprehensive testing and validation

**Tasks:**

**10.1: Build & Test**

1. ✅ Clean build: `dotnet clean`
2. ✅ Rebuild: `dotnet build --no-incremental`
3. ✅ Run all tests: `dotnet test`
4. ✅ Verify test coverage

**10.2: Manual Testing**

1. ✅ Start application
2. ✅ Test all API endpoints:
    - GET /api/v1/weather/\*
    - GET /api/v1/users/\*
    - POST /api/v1/users
    - PUT /api/v1/users/{id}
    - DELETE /api/v1/users/{id}
    - GET /api/v1/logs/\*
    - GET /api/v1/health
    - GET /api/v1/third-party-api-requests/\*
3. ✅ Verify Swagger UI works
4. ✅ Check database operations
5. ✅ Verify logging works
6. ✅ Test rate limiting
7. ✅ Test caching

**10.3: Performance Check**

1. ✅ Measure build time (should be faster)
2. ✅ Measure startup time
3. ✅ Verify no performance regression

**10.4: Code Quality**

1. ✅ Run static analysis
2. ✅ Check for unused usings
3. ✅ Verify .editorconfig compliance
4. ✅ Check XML documentation coverage

**Acceptance Criteria:**

-   ✅ All tests pass (100%)
-   ✅ All API endpoints functional
-   ✅ No compilation errors or warnings
-   ✅ Build time improved
-   ✅ Code follows style guide
-   ✅ Documentation updated

---

## Final Project Structure

```
SeventySix.Server/
├── SeventySix.Api/
│   ├── Controllers/
│   ├── Middleware/
│   ├── Attributes/
│   ├── Extensions/
│   ├── Logging/
│   ├── Configuration/
│   └── Program.cs
│
├── SeventySix.Application/
│   ├── DTOs/
│   │   ├── Requests/         # WeatherRequest, CreateUserRequest, etc.
│   │   ├── OpenWeather/      # Third-party API models
│   │   ├── Logs/             # Log DTOs
│   │   ├── Health/           # Health DTOs
│   │   ├── ThirdPartyApi/    # API tracking DTOs
│   │   ├── UserDto.cs
│   │   └── PagedResult.cs
│   ├── Entities/             # User, Log, ThirdPartyApiRequest
│   ├── Services/             # Business logic
│   ├── Interfaces/           # Service & Repository contracts
│   ├── Validators/           # FluentValidation
│   ├── Exceptions/           # Business exceptions
│   ├── ValueObjects/         # UserPreferences, etc.
│   ├── Extensions/           # Mapping helpers
│   └── Configuration/        # Options classes
│
├── SeventySix.Data/
│   ├── ApplicationDbContext.cs
│   ├── Configurations/       # Entity configurations
│   ├── Migrations/           # EF migrations
│   ├── Repositories/         # Data access implementations
│   ├── Services/             # External API clients
│   └── Infrastructure/       # TransactionManager
│
├── SeventySix.Api.Tests/
├── SeventySix.Application.Tests/
└── SeventySix.Data.Tests/
```

---

## Namespace Migration Table

| Old Namespace                            | New Namespace                          |
| ---------------------------------------- | -------------------------------------- |
| `SeventySix.Core.Entities`               | `SeventySix.Application.Entities`      |
| `SeventySix.Core.ValueObjects`           | `SeventySix.Application.ValueObjects`  |
| `SeventySix.Core.Exceptions`             | `SeventySix.Application.Exceptions`    |
| `SeventySix.Core.Interfaces`             | `SeventySix.Application.Interfaces`    |
| `SeventySix.Core.DTOs.*`                 | `SeventySix.Application.DTOs.*`        |
| `SeventySix.BusinessLogic.DTOs.*`        | `SeventySix.Application.DTOs.*`        |
| `SeventySix.BusinessLogic.Services`      | `SeventySix.Application.Services`      |
| `SeventySix.BusinessLogic.Interfaces`    | `SeventySix.Application.Interfaces`    |
| `SeventySix.BusinessLogic.Validators`    | `SeventySix.Application.Validators`    |
| `SeventySix.BusinessLogic.Extensions`    | `SeventySix.Application.Extensions`    |
| `SeventySix.BusinessLogic.Configuration` | `SeventySix.Application.Configuration` |
| `SeventySix.DataAccess.Repositories`     | `SeventySix.Data.Repositories`         |
| `SeventySix.DataAccess.Services`         | `SeventySix.Data.Services`             |

---

## Dependency Graph

### Before (5 Projects)

```
        Api
       / | \
      /  |  \
     /   |   \
Business  |   DataAccess
   |      |    /    \
   |      |   /      \
  Core ---+--+       Data
           |         /
           +---------
```

### After (3 Projects)

```
    Api
    / \
   /   \
  /     \
Application → Data
```

**Cleaner, simpler, easier to understand!**

---

## Risk Mitigation

**Risks:**

1. Breaking changes across entire solution
2. Namespace updates miss some files
3. Test failures during migration
4. DI container registration issues
5. Build errors from circular dependencies

**Mitigation:**

1. ✅ Work on feature branch
2. ✅ Comprehensive find-replace with verification
3. ✅ Run tests after each phase
4. ✅ Keep backup of old structure
5. ✅ Use static analysis to find issues
6. ✅ Incremental migration (phase by phase)
7. ✅ Can rollback at any phase

---

## Code Style Compliance

**Per .editorconfig and CLAUDE.md:**

-   ✅ Use explicit types (no `var`)
-   ✅ Use primary constructors where applicable
-   ✅ Use collection expressions `[]` instead of `new()`
-   ✅ Maintain XML documentation on public APIs
-   ✅ Follow PascalCase naming conventions
-   ✅ Use Allman brace style for C#
-   ✅ Suffix async methods with `Async`
-   ✅ Use tabs for indentation (4 spaces width)
-   ✅ CRLF line endings for C# files

---

## Success Metrics

1. **Project Count**: 5 → 3 (40% reduction)
2. **Build Time**: Should improve by 20-30%
3. **Test Pass Rate**: 100% maintained
4. **Zero Errors**: No compilation errors or warnings
5. **Code Coverage**: Maintained at >80%
6. **Documentation**: Fully updated
7. **Developer Feedback**: Easier to navigate and understand

---

## Estimated Effort

-   **Phase 1 (Preparation)**: 30 minutes
-   **Phase 2 (Create Application)**: 15 minutes
-   **Phase 3 (Migrate Core)**: 90 minutes
-   **Phase 4 (Migrate BusinessLogic)**: 90 minutes
-   **Phase 5 (Consolidate Data)**: 60 minutes
-   **Phase 6 (Update Api)**: 45 minutes
-   **Phase 7 (Update Tests)**: 90 minutes
-   **Phase 8 (Remove Old Projects)**: 30 minutes
-   **Phase 9 (Update Documentation)**: 45 minutes
-   **Phase 10 (Final Validation)**: 60 minutes

**Total Estimated Time**: ~8.5 hours

**Recommended Approach**: Complete over 2-3 work sessions with testing between phases.

---

## Migration Checklist

### Preparation

-   [ ] Commit current changes
-   [ ] Create feature branch
-   [ ] Run baseline tests
-   [ ] Create backup

### Migration

-   [ ] Phase 2: Create Application project
-   [ ] Phase 3: Migrate Core → Application
-   [ ] Phase 4: Migrate BusinessLogic → Application
-   [ ] Phase 5: Consolidate Data layer
-   [ ] Phase 6: Update Api layer
-   [ ] Phase 7: Update test projects
-   [ ] Phase 8: Remove old projects

### Finalization

-   [ ] Phase 9: Update documentation
-   [ ] Phase 10: Final validation
-   [ ] All tests pass
-   [ ] All endpoints functional
-   [ ] Documentation complete
-   [ ] Ready for PR/merge

---

## Post-Migration Benefits

### Immediate Benefits

1. ✅ **Simpler mental model**: 3 layers instead of 5
2. ✅ **Faster builds**: Fewer projects to compile
3. ✅ **No DTO confusion**: All in Application layer
4. ✅ **Easier navigation**: Related code together
5. ✅ **Clearer dependencies**: Straightforward dependency graph

### Long-term Benefits

1. ✅ **Easier onboarding**: New developers grasp structure quickly
2. ✅ **Faster development**: Less time deciding where code goes
3. ✅ **Better maintainability**: Less cognitive overhead
4. ✅ **Flexible evolution**: Can still extract services later if needed
5. ✅ **Industry standard**: 3-tier architecture widely understood

---

_Implementation Plan Created: November 18, 2025_
_Using ULTRATHINK Analysis Framework_
_Target: Three-Layer Simplified Architecture_
