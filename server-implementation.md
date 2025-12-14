# SeventySix Server Architecture v2.0

## The Problem Statement

### Current Pain Points

| Issue                              | Impact                                             |
| ---------------------------------- | -------------------------------------------------- |
| `SeventySix` project does too much | Contains domains + shared + infrastructure         |
| `Infrastructure/` is not a domain  | Cross-cutting concerns masquerading as a context   |
| `Shared/` is folder, not project   | Can't enforce dependency direction                 |
| Namespace confusion                | `SeventySix.Shared` vs `SeventySix.Infrastructure` |
| Future extraction is hard          | Bounded contexts can't become separate projects    |
| Package bloat                      | All domains inherit all NuGet packages             |

### What We Want

1. **True bounded contexts**: Each domain owns its code, tests, migrations
2. **Clear dependency direction**: Shared ← Domains ← API (never reverse)
3. **Extractable domains**: Any domain can become `SeventySix.{Domain}` project
4. **Parallel client structure**: Server mirrors client's `domains/` pattern
5. **Enforceable boundaries**: Architecture tests that catch violations at build time
6. **Domain-specific packages**: Each domain declares only its own dependencies

---

## Part 1: Current vs Proposed Structure

### Current Structure (Problems Identified)

```
SeventySix.Server/
├── SeventySix/                      # ❌ MONOLITH - everything mixed
│   ├── ApiTracking/                 # Domain ✓
│   ├── ElectronicNotifications/     # Domain ✓
│   ├── Identity/                    # Domain ✓
│   ├── Logging/                     # Domain ✓
│   │
│   ├── Infrastructure/              # ❌ NOT a domain - cross-cutting
│   │   ├── DTOs/                    # Health DTOs - belongs in API layer
│   │   ├── Interfaces/              # IMetricsService, IHealthCheckService
│   │   └── Services/                # HealthCheck, Metrics, RateLimiting
│   │
│   ├── Shared/                      # ❌ FOLDER, not project - can't enforce
│   │   ├── Constants/
│   │   ├── DTOs/                    # Result<T>, PagedResult<T>
│   │   ├── Entities/                # Base interfaces (IEntity, IAuditableEntity)
│   │   ├── Exceptions/
│   │   ├── Extensions/
│   │   ├── Infrastructure/          # BaseDbContext, BaseRepository - confusing name
│   │   ├── Interfaces/
│   │   ├── Settings/
│   │   └── Validators/
│   │
│   └── DependencyExtensions/        # ❌ Belongs in API layer
│
├── SeventySix.Api/                  # HTTP layer ✓
└── Tests/
```

### Issues Analysis

| Folder                       | Issue                                                         | Solution                       |
| ---------------------------- | ------------------------------------------------------------- | ------------------------------ |
| `Infrastructure/`            | Not a bounded context - metrics/health are API-layer concerns | Move to `SeventySix.Api`       |
| `Shared/`                    | Folder can't enforce dependency direction                     | Extract to `SeventySix.Shared` |
| `Shared/Infrastructure/`     | Confusing name - contains DB abstractions                     | Rename to `Persistence/`       |
| `DependencyExtensions/`      | Extension methods for API registration                        | Move to `SeventySix.Api`       |
| `Infrastructure.HealthCheck` | HealthCheck DTO is API response contract                      | Move to `SeventySix.Api`       |
| Main `SeventySix` project    | Contains too much - hard to extract domains                   | Rename to `SeventySix.Domains` |

---

## Part 2: The Proposed Architecture

### Project Structure

```
SeventySix.Server/
│
├── SeventySix.Shared/               # NEW PROJECT - True shared library
│   ├── SeventySix.Shared.csproj     # Referenced by all domain projects
│   │
│   ├── Constants/
│   │   ├── HealthStatusConstants.cs
│   │   ├── MediaTypeConstants.cs
│   │   ├── PaginationConstants.cs
│   │   └── SchemaConstants.cs
│   │
│   ├── DTOs/
│   │   ├── BaseQueryRequest.cs
│   │   ├── PagedResult.cs
│   │   └── Result.cs
│   │
│   ├── Entities/                    # Base entity interfaces
│   │   ├── IEntity.cs
│   │   ├── ICreatableEntity.cs
│   │   ├── IModifiableEntity.cs
│   │   └── IAuditableEntity.cs
│   │
│   ├── Exceptions/
│   │   ├── DomainException.cs
│   │   ├── EntityNotFoundException.cs
│   │   ├── BusinessRuleViolationException.cs
│   │   ├── ConcurrencyException.cs
│   │   └── ExternalServiceException.cs
│   │
│   ├── Extensions/
│   │   ├── CryptoExtensions.cs
│   │   ├── DbExceptionExtensions.cs
│   │   └── MappingExtensions.cs
│   │
│   ├── Interfaces/
│   │   ├── IDatabaseHealthCheck.cs
│   │   ├── ITransactionManager.cs
│   │   └── IUserContextAccessor.cs
│   │
│   ├── Persistence/                 # RENAMED from Infrastructure/
│   │   ├── AuditInterceptor.cs
│   │   ├── BaseDbContext.cs
│   │   ├── BaseRepository.cs
│   │   ├── BulkOperationExecutor.cs
│   │   ├── QueryBuilder.cs
│   │   └── TransactionManager.cs
│   │
│   ├── Settings/
│   │   └── PollyOptions.cs
│   │
│   └── Validators/
│       ├── BaseQueryValidator.cs
│       └── CommandValidatorFactory.cs
│
├── SeventySix.Domains/              # RENAMED from SeventySix (plural, matches client)
│   ├── SeventySix.Domains.csproj    # References: SeventySix.Shared
│   │
│   ├── ApiTracking/                 # Bounded Context
│   │   ├── Configurations/
│   │   ├── Constants/
│   │   ├── DTOs/
│   │   ├── Entities/
│   │   ├── Infrastructure/          # Domain-specific (DbContext, Repos)
│   │   ├── Interfaces/
│   │   ├── Migrations/
│   │   ├── Queries/
│   │   ├── Repositories/
│   │   ├── Services/
│   │   └── Settings/
│   │
│   ├── ElectronicNotifications/     # Bounded Context (Service-only)
│   │   └── Emails/
│   │
│   ├── Identity/                    # Bounded Context (EXTRACTION CANDIDATE)
│   │   ├── Commands/
│   │   ├── Configurations/
│   │   ├── Constants/
│   │   ├── DTOs/
│   │   ├── Entities/
│   │   ├── Exceptions/
│   │   ├── Extensions/
│   │   ├── Infrastructure/          # IdentityDbContext, UserContextAccessor
│   │   ├── Interfaces/
│   │   ├── Migrations/
│   │   ├── Models/
│   │   ├── Queries/
│   │   ├── Repositories/
│   │   ├── Services/
│   │   ├── Settings/
│   │   └── Utilities/
│   │
│   └── Logging/                     # Bounded Context
│       ├── Commands/
│       ├── Configurations/
│       ├── Constants/
│       ├── DTOs/
│       ├── Entities/
│       ├── Extensions/
│       ├── Infrastructure/
│       ├── Interfaces/
│       ├── Migrations/
│       ├── Queries/
│       ├── Repositories/
│       ├── Services/
│       └── Settings/
│
├── SeventySix.Api/                  # HTTP Layer (unchanged name)
│   ├── SeventySix.Api.csproj        # References: SeventySix.Domains
│   │
│   ├── Attributes/
│   ├── Configuration/
│   │   ├── ApiVersionConfig.cs
│   │   ├── CachePolicyConstants.cs
│   │   ├── ForwardedHeadersSettings.cs
│   │   ├── OutputCacheOptions.cs
│   │   ├── RateLimitingSettings.cs
│   │   └── SecuritySettings.cs
│   │
│   ├── Controllers/
│   │   └── V1/
│   │
│   ├── Registration/                # RENAMED from DependencyExtensions (clearer purpose)
│   │   ├── ApiTrackingRegistration.cs
│   │   ├── BackgroundJobRegistration.cs
│   │   ├── ElectronicNotificationsRegistration.cs
│   │   ├── IdentityRegistration.cs
│   │   ├── LoggingRegistration.cs
│   │   └── SharedRegistration.cs    # Registers Shared services
│   │
│   ├── Extensions/                  # PURE utility extensions (non-DI)
│   │   ├── ClaimsPrincipalExtensions.cs
│   │   └── WebApplicationExtensions.cs
│   │
│   ├── Setup/                       # App configuration (separated from DI)
│   │   ├── AuthenticationSetup.cs
│   │   ├── CacheSetup.cs
│   │   ├── CompressionSetup.cs
│   │   ├── DataProtectionSetup.cs
│   │   ├── HealthCheckSetup.cs
│   │   ├── OpenTelemetrySetup.cs
│   │   ├── RateLimitingSetup.cs
│   │   └── SerilogSetup.cs
│   │
│   ├── HealthChecks/                # API-layer health check implementations
│   │
│   ├── Infrastructure/              # MOVED from SeventySix/Infrastructure
│   │   ├── DTOs/
│   │   │   └── HealthStatusResponse.cs  # API response contract
│   │   ├── Interfaces/
│   │   │   ├── IHealthCheckService.cs
│   │   │   ├── IMetricsService.cs
│   │   │   ├── IPollyIntegrationClient.cs
│   │   │   └── IRateLimitingService.cs
│   │   └── Services/
│   │       ├── HealthCheckService.cs
│   │       ├── MetricsService.cs
│   │       ├── PollyIntegrationClient.cs
│   │       └── RateLimitingService.cs
│   │
│   ├── Logging/
│   ├── Middleware/
│   └── Properties/
│
└── Tests/
    ├── SeventySix.Shared.Tests/     # NEW: Tests for shared library
    │
    ├── SeventySix.Domains.Tests/    # RENAMED from SeventySix.Tests
    │   ├── ApiTracking/
    │   ├── ElectronicNotifications/
    │   ├── Identity/
    │   └── Logging/
    │
    ├── SeventySix.Api.Tests/        # API integration tests (unchanged)
    │
    ├── SeventySix.ArchitectureTests/
    │
    └── SeventySix.TestUtilities/
```

### Dependency Graph

```
                    ┌─────────────────────┐
                    │   SeventySix.Api    │
                    │   (HTTP Layer)      │
                    └──────────┬──────────┘
                               │ references
                               ▼
                    ┌─────────────────────┐
                    │ SeventySix.Domains  │
                    │ (Bounded Contexts)  │
                    └──────────┬──────────┘
                               │ references
                               ▼
                    ┌─────────────────────┐
                    │ SeventySix.Shared   │
                    │ (Base abstractions) │
                    └─────────────────────┘
```

**Key Rules**:

1. `Shared` references NO other project (pure library)
2. `Domains` references ONLY `Shared`
3. `Api` references ONLY `Domains` (and transitively `Shared`)
4. Tests reference their target + `TestUtilities`

### API Folder Clarification

The API layer now has clear separation:

| Folder            | Purpose                              | Example                        |
| ----------------- | ------------------------------------ | ------------------------------ |
| `Registration/`   | DI service registration per domain   | `IdentityRegistration.cs`      |
| `Setup/`          | App builder configuration (non-DI)   | `AuthenticationSetup.cs`       |
| `Extensions/`     | Pure utility methods (no DI)         | `ClaimsPrincipalExtensions.cs` |
| `Infrastructure/` | API-layer services (metrics, health) | `HealthCheckService.cs`        |
| `Configuration/`  | Settings classes & constants         | `SecuritySettings.cs`          |

---

## Part 3: The Boundary Decision Framework

### Where Does Code Belong?

| Question                                      | Answer | Location                   |
| --------------------------------------------- | ------ | -------------------------- |
| Is it HTTP/controller-related?                | Yes    | `SeventySix.Api`           |
| Is it used by 2+ bounded contexts?            | Yes    | `SeventySix.Shared`        |
| Is it specific to one bounded context?        | Yes    | That domain in `.Domains`  |
| Is it API configuration/middleware?           | Yes    | `SeventySix.Api`           |
| Is it persistence infrastructure (DbContext)? | Yes    | Domain's `Infrastructure/` |

### Specific Decisions

| Code                    | Current Location           | New Location                       | Why                                       |
| ----------------------- | -------------------------- | ---------------------------------- | ----------------------------------------- |
| `BaseDbContext`         | `Shared/Infrastructure/`   | `Shared/Persistence/`              | Naming clarity                            |
| `AuditInterceptor`      | `Shared/Infrastructure/`   | `Shared/Persistence/`              | DB-related, not generic infrastructure    |
| `HealthCheckService`    | `Infrastructure/Services/` | `Api/Infrastructure/Services/`     | API-layer concern (HTTP endpoint support) |
| `MetricsService`        | `Infrastructure/Services/` | `Api/Infrastructure/Services/`     | API-layer concern (Prometheus export)     |
| `RateLimitingService`   | `Infrastructure/Services/` | `Api/Infrastructure/Services/`     | API-layer concern (request limiting)      |
| `HealthStatusResponse`  | `Infrastructure/DTOs/`     | `Api/Infrastructure/DTOs/`         | API response contract                     |
| `IdentityExtensions.cs` | `DependencyExtensions/`    | `Api/Registration/`                | DI registration is API-layer startup      |
| `Result<T>`             | `Shared/DTOs/`             | `Shared/DTOs/`                     | Used across all domains ✓                 |
| `IUserContextAccessor`  | `Shared/Interfaces/`       | `Shared/Interfaces/`               | Used across all domains ✓                 |
| `IdentityDbContext`     | `Identity/Infrastructure/` | `Domains/Identity/Infrastructure/` | Domain-specific ✓                         |

---

## Part 4: Project Files

### SeventySix.Shared.csproj

```xml
<Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <TargetFramework>net10.0</TargetFramework>
        <ImplicitUsings>enable</ImplicitUsings>
        <Nullable>enable</Nullable>
        <RootNamespace>SeventySix.Shared</RootNamespace>
    </PropertyGroup>

    <ItemGroup>
        <InternalsVisibleTo Include="SeventySix.Shared.Tests" />
        <InternalsVisibleTo Include="SeventySix.Domains.Tests" />
        <InternalsVisibleTo Include="DynamicProxyGenAssembly2, PublicKey=..." />
    </ItemGroup>

    <!-- MINIMAL dependencies - only what ALL domains need -->
    <ItemGroup>
        <PackageReference Include="Microsoft.EntityFrameworkCore" Version="10.0.0" />
        <PackageReference Include="FluentValidation" Version="12.1.0" />
    </ItemGroup>

</Project>
```

### SeventySix.Domains.csproj

```xml
<Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <TargetFramework>net10.0</TargetFramework>
        <ImplicitUsings>enable</ImplicitUsings>
        <Nullable>enable</Nullable>
        <!-- CRITICAL: Keep root namespace as SeventySix for extraction compatibility -->
        <RootNamespace>SeventySix</RootNamespace>
    </PropertyGroup>

    <ItemGroup>
        <ProjectReference Include="..\SeventySix.Shared\SeventySix.Shared.csproj" />
    </ItemGroup>

    <ItemGroup>
        <InternalsVisibleTo Include="SeventySix.Domains.Tests" />
        <InternalsVisibleTo Include="SeventySix.Api.Tests" />
        <InternalsVisibleTo Include="DynamicProxyGenAssembly2, PublicKey=..." />
    </ItemGroup>

    <!--
        DOMAIN-SPECIFIC PACKAGES
        When extracting a domain (e.g., SeventySix.Identity), move its packages there.
        This list will shrink as domains are extracted.
    -->
    <ItemGroup>
        <FrameworkReference Include="Microsoft.AspNetCore.App" />

        <!-- Shared across all domains in this project -->
        <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.0">
            <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
            <PrivateAssets>all</PrivateAssets>
        </PackageReference>
        <PackageReference Include="Microsoft.EntityFrameworkCore.Relational" Version="10.0.0" />
        <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
        <PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="12.1.0" />
        <PackageReference Include="WolverineFx" Version="5.2.*" />
        <PackageReference Include="WolverineFx.FluentValidation" Version="5.2.*" />
        <PackageReference Include="Polly.Extensions" Version="8.6.5" />

        <!-- IDENTITY-SPECIFIC: Move to SeventySix.Identity when extracted -->
        <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.11.0" />
        <PackageReference Include="Microsoft.IdentityModel.Tokens" Version="8.11.0" />
        <PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />

        <!-- ELECTRONIC-NOTIFICATIONS-SPECIFIC: Move when extracted -->
        <PackageReference Include="MailKit" Version="4.10.0" />
    </ItemGroup>

</Project>
```

### SeventySix.Api.csproj (Updated)

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

    <PropertyGroup>
        <TargetFramework>net10.0</TargetFramework>
        <ImplicitUsings>enable</ImplicitUsings>
        <Nullable>enable</Nullable>
    </PropertyGroup>

    <ItemGroup>
        <ProjectReference Include="..\SeventySix.Domains\SeventySix.Domains.csproj" />
        <!-- Shared is transitively available through Domains -->
    </ItemGroup>

    <!-- API-specific dependencies -->
    <ItemGroup>
        <PackageReference Include="Scalar.AspNetCore" Version="..." />
        <PackageReference Include="Serilog.AspNetCore" Version="..." />
        <PackageReference Include="OpenTelemetry.Exporter.Prometheus.AspNetCore" Version="..." />
        <!-- etc. -->
    </ItemGroup>

</Project>
```

---

## Part 5: Namespace Strategy

### The Decision: Keep Domain Namespaces (Extraction-Ready)

Namespaces are **independent of project names**. This is the key to painless extraction:

```csharp
// Shared library
namespace SeventySix.Shared;              // Constants, DTOs, Exceptions
namespace SeventySix.Shared.Persistence;  // BaseDbContext, BaseRepository
namespace SeventySix.Shared.Validators;   // Base validators

// Domain library (SeventySix.Domains project, but SeventySix.* namespaces)
namespace SeventySix.Identity;            // Identity bounded context
namespace SeventySix.Identity.Commands;   // CQRS commands
namespace SeventySix.Identity.Queries;    // CQRS queries
namespace SeventySix.Logging;             // Logging bounded context
namespace SeventySix.ApiTracking;         // API tracking bounded context
namespace SeventySix.ElectronicNotifications.Emails;  // Email service

// API layer
namespace SeventySix.Api;                 // Controllers, middleware
namespace SeventySix.Api.Infrastructure;  // HealthCheck, Metrics (MOVED)
namespace SeventySix.Api.Registration;    // DI registration (RENAMED)
namespace SeventySix.Api.Setup;           // App configuration (NEW)
```

### Why This Enables Extraction

When Identity grows and needs its own project:

```csharp
// BEFORE: In SeventySix.Domains project
// File: SeventySix.Domains/Identity/Services/TokenService.cs
namespace SeventySix.Identity;
public class TokenService { }

// AFTER: In SeventySix.Identity project (NEW)
// File: SeventySix.Identity/Services/TokenService.cs
namespace SeventySix.Identity;  // SAME NAMESPACE - zero code changes!
public class TokenService { }
```

**No using statements change. No refactoring needed. Just move the folder.**

### Migration Path for DependencyExtensions → Registration

```csharp
// BEFORE (in SeventySix project)
namespace SeventySix.DependencyExtensions;
public static class IdentityExtensions { }

// AFTER (in SeventySix.Api project)
namespace SeventySix.Api.Registration;
public static class IdentityRegistration { }  // Also renamed for clarity
```

---

## Part 6: Import Rules & Architecture Tests

### Allowed Dependencies Matrix

| From → To                       | Shared | Domains (any) | Api |
| ------------------------------- | ------ | ------------- | --- |
| **SeventySix.Shared**           | ✅     | ❌            | ❌  |
| **SeventySix.Domains.Identity** | ✅     | ✅ (self)     | ❌  |
| **SeventySix.Domains.Logging**  | ✅     | ✅ (self)     | ❌  |
| **SeventySix.Api**              | ✅     | ✅            | ✅  |

### Domain Cross-Reference Rules

| From → To       | Identity | Logging | ApiTracking | ElectronicNotifications |
| --------------- | -------- | ------- | ----------- | ----------------------- |
| **Identity**    | ✅       | ❌      | ❌          | ✅ (allowed exception)  |
| **Logging**     | ❌       | ✅      | ❌          | ❌                      |
| **ApiTracking** | ❌       | ❌      | ✅          | ❌                      |

### Updated Architecture Tests

```csharp
// Tests/SeventySix.ArchitectureTests/ProjectDependencyTests.cs

[Fact]
public void Shared_Should_Not_Reference_Domains_Or_Api()
{
    Assembly sharedAssembly = typeof(SeventySix.Shared.Result<>).Assembly;

    TestResult result = Types
        .InAssembly(sharedAssembly)
        .ShouldNot()
        .HaveDependencyOnAny(
            "SeventySix.Identity",
            "SeventySix.Logging",
            "SeventySix.ApiTracking",
            "SeventySix.ElectronicNotifications",
            "SeventySix.Api")
        .GetResult();

    Assert.True(
        result.IsSuccessful,
        $"Shared should not reference Domains or Api: {string.Join(", ", result.FailingTypeNames ?? [])}");
}

[Fact]
public void Domains_Should_Not_Reference_Api()
{
    Assembly domainsAssembly = typeof(SeventySix.Identity.User).Assembly;

    TestResult result = Types
        .InAssembly(domainsAssembly)
        .ShouldNot()
        .HaveDependencyOn("SeventySix.Api")
        .GetResult();

    Assert.True(
        result.IsSuccessful,
        $"Domains should not reference Api: {string.Join(", ", result.FailingTypeNames ?? [])}");
}
```

---

## Part 7: Testing Strategy

### Test Project Structure

```
Tests/
├── SeventySix.Shared.Tests/          # NEW
│   ├── Persistence/
│   │   ├── BaseDbContextTests.cs
│   │   ├── BaseRepositoryTests.cs
│   │   └── TransactionManagerTests.cs
│   ├── Extensions/
│   └── Validators/
│
├── SeventySix.Domains.Tests/         # RENAMED from SeventySix.Tests
│   ├── ApiTracking/
│   │   └── (existing tests)
│   ├── ElectronicNotifications/
│   │   └── (existing tests)
│   ├── Identity/                     # Moves with Identity when extracted
│   │   ├── Commands/
│   │   ├── Configurations/
│   │   ├── DTOs/
│   │   ├── Entities/
│   │   ├── Extensions/
│   │   ├── Repositories/
│   │   ├── Services/
│   │   ├── Settings/
│   │   └── Validators/
│   └── Logging/
│       └── (existing tests)
│
├── SeventySix.Api.Tests/             # Unchanged name
│   ├── Controllers/
│   ├── Integration/
│   ├── Infrastructure/               # NEW: Tests for moved services
│   │   ├── HealthCheckServiceTests.cs
│   │   ├── MetricsServiceTests.cs
│   │   └── RateLimitingServiceTests.cs
│   ├── Logging/
│   └── Resilience/
│
├── SeventySix.ArchitectureTests/     # Unchanged
│
└── SeventySix.TestUtilities/         # Unchanged structure
    ├── Attributes/
    ├── Builders/
    ├── Constants/
    ├── Fixtures/
    ├── TestBases/
    └── TestHelpers/
```

### Test Project References

```xml
<!-- SeventySix.Shared.Tests.csproj -->
<ItemGroup>
    <ProjectReference Include="..\..\SeventySix.Shared\SeventySix.Shared.csproj" />
    <ProjectReference Include="..\SeventySix.TestUtilities\SeventySix.TestUtilities.csproj" />
</ItemGroup>

<!-- SeventySix.Domains.Tests.csproj -->
<ItemGroup>
    <ProjectReference Include="..\..\SeventySix.Domains\SeventySix.Domains.csproj" />
    <ProjectReference Include="..\SeventySix.TestUtilities\SeventySix.TestUtilities.csproj" />
</ItemGroup>

<!-- SeventySix.Api.Tests.csproj -->
<ItemGroup>
    <ProjectReference Include="..\..\SeventySix.Api\SeventySix.Api.csproj" />
    <ProjectReference Include="..\SeventySix.TestUtilities\SeventySix.TestUtilities.csproj" />
</ItemGroup>
```

### Test Extraction Strategy

When Identity moves to its own project, its tests move too:

```
# BEFORE
Tests/SeventySix.Domains.Tests/Identity/  → Tests domain in Domains project

# AFTER (when extracted)
Tests/SeventySix.Identity.Tests/          → NEW test project for SeventySix.Identity
Tests/SeventySix.Domains.Tests/           → No longer has Identity/ folder
```

---

## Part 8: Client ↔ Server Alignment

### Parallel Structure Comparison

| Client              | Server                                  | Purpose                    |
| ------------------- | --------------------------------------- | -------------------------- |
| `shared/`           | `SeventySix.Shared`                     | Cross-cutting utilities    |
| `domains/`          | `SeventySix.Domains`                    | Bounded contexts container |
| `domains/admin/`    | `SeventySix.Domains/Identity/`          | User/permission management |
| `domains/game/`     | `SeventySix.Domains/Game/` (future)     | Game logic                 |
| `domains/commerce/` | `SeventySix.Domains/Commerce/` (future) | Commerce/transactions      |
| `shared/api/`       | DTOs in each domain                     | API contracts              |
| `shared/services/`  | `Shared/` services                      | App-wide services          |
| `domain/api/`       | Domain `DTOs/`                          | Domain-specific contracts  |
| `domain/services/`  | Domain `Services/`                      | Domain business logic      |
| `domain/testing/`   | Domain test folders                     | Domain-specific tests      |
| Architecture tests  | Architecture tests                      | Boundary enforcement       |

### Naming Conventions Aligned

| Concept      | Client               | Server                   |
| ------------ | -------------------- | ------------------------ |
| DTOs         | `UserDto`            | `UserDto` (record)       |
| Models       | `UserViewModel`      | `User` (entity)          |
| Services     | `UserService`        | `IUserService` + impl    |
| Repositories | (via TanStack Query) | `IUserRepository` + impl |
| Validators   | (via reactive forms) | FluentValidation         |
| Commands     | (via services)       | Wolverine handlers       |
| Queries      | `useQuery()` hooks   | Wolverine handlers       |

### Extraction Parallel

| Client                              | Server                                            |
| ----------------------------------- | ------------------------------------------------- |
| Domain in `domains/` folder         | Domain in `SeventySix.Domains` project            |
| Domain extracted to `@domain` alias | Domain extracted to `SeventySix.{Domain}` project |
| Tests in `domain/testing/`          | Tests in `SeventySix.{Domain}.Tests` project      |

---

## Part 9: Migration Plan

### Phase 1: Create Shared Project (Low Risk)

1. Create `SeventySix.Shared/` project
2. Move files from `SeventySix/Shared/` to new project
3. Rename `Infrastructure/` → `Persistence/` in Shared
4. Update namespaces: `SeventySix.Shared`, `SeventySix.Shared.Persistence`
5. Add project reference from `SeventySix` → `SeventySix.Shared`
6. Fix compilation errors (namespace updates)
7. Run all tests

### Phase 2: Move Infrastructure to API (Medium Risk)

1. Move `SeventySix/Infrastructure/` → `SeventySix.Api/Infrastructure/`
2. Update namespace: `SeventySix.Infrastructure` → `SeventySix.Api.Infrastructure`
3. Move `SeventySix/DependencyExtensions/` → `SeventySix.Api/Registration/`
4. Rename files: `*Extensions.cs` → `*Registration.cs`
5. Update namespace: `SeventySix.DependencyExtensions` → `SeventySix.Api.Registration`
6. Reorganize existing `Extensions/` → `Setup/` for config extensions
7. Update `Program.cs` to use new namespaces
8. Run all tests

### Phase 3: Rename Domains Project (Medium Risk)

1. Rename project: `SeventySix` → `SeventySix.Domains`
2. Update solution file
3. Update all project references
4. **Keep namespace as `SeventySix.*`** (critical for extraction compatibility)
5. Update `InternalsVisibleTo` attributes
6. Run all tests

### Phase 4: Update Tests (Low Risk)

1. Create `SeventySix.Shared.Tests/` project
2. Move shared-specific tests from `SeventySix.Tests`
3. Rename `SeventySix.Tests` → `SeventySix.Domains.Tests`
4. Add Infrastructure tests to `SeventySix.Api.Tests`
5. Update architecture tests for new project structure
6. Run all tests

### Phase 5: Update CI/CD (Low Risk)

1. Update build scripts for new project names
2. Update Docker files if needed
3. Update solution file references
4. Verify all pipelines pass

---

## Part 10: Domain Extraction Guide (Future: SeventySix.Game)

### When to Extract

Extract a domain when:

-   It has 20+ files and is still growing
-   It has domain-specific NuGet packages
-   Multiple developers work on it simultaneously
-   You want independent build/deploy (for future microservices)

### Extraction Steps (Example: Game Domain)

#### Step 1: Create New Project

```
SeventySix.Server/
├── SeventySix.Shared/
├── SeventySix.Domains/
│   ├── Identity/
│   ├── Logging/
│   └── (Game folder removed)
│
├── SeventySix.Game/              # NEW PROJECT
│   ├── SeventySix.Game.csproj
│   ├── Commands/
│   ├── DTOs/
│   ├── Entities/
│   ├── Infrastructure/
│   │   └── GameDbContext.cs
│   ├── Interfaces/
│   ├── Migrations/
│   ├── Queries/
│   ├── Repositories/
│   ├── Services/
│   └── Settings/
│
└── Tests/
    └── SeventySix.Game.Tests/    # NEW TEST PROJECT
```

#### Step 2: Update Project References

```xml
<!-- SeventySix.Game.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
        <RootNamespace>SeventySix.Game</RootNamespace>  <!-- Matches folder structure -->
    </PropertyGroup>

    <ItemGroup>
        <ProjectReference Include="..\SeventySix.Shared\SeventySix.Shared.csproj" />
        <!-- Does NOT reference SeventySix.Domains -->
    </ItemGroup>

    <!-- Game-specific packages only -->
    <ItemGroup>
        <PackageReference Include="Microsoft.EntityFrameworkCore.Relational" Version="10.0.0" />
        <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.0.0" />
        <!-- Game-specific packages here -->
    </ItemGroup>
</Project>

<!-- SeventySix.Api.csproj - Updated -->
<ItemGroup>
    <ProjectReference Include="..\SeventySix.Domains\SeventySix.Domains.csproj" />
    <ProjectReference Include="..\SeventySix.Game\SeventySix.Game.csproj" />  <!-- NEW -->
</ItemGroup>
```

#### Step 3: Move Files (Namespace Stays Same!)

```csharp
// BEFORE: SeventySix.Domains/Game/Services/GameService.cs
namespace SeventySix.Game;
public class GameService { }

// AFTER: SeventySix.Game/Services/GameService.cs
namespace SeventySix.Game;  // UNCHANGED!
public class GameService { }
```

**No code changes needed - just file moves.**

#### Step 4: Update Registration

```csharp
// SeventySix.Api/Registration/GameRegistration.cs
namespace SeventySix.Api.Registration;

public static class GameRegistration
{
    public static IServiceCollection AddGameDomain(
        this IServiceCollection services,
        string connectionString)
    {
        // Now references SeventySix.Game project directly
        services.AddDbContext<GameDbContext>(options =>
            options.UseNpgsql(connectionString));

        // ... register services
        return services;
    }
}
```

#### Step 5: Update InternalsVisibleTo

```xml
<!-- SeventySix.Game.csproj -->
<ItemGroup>
    <InternalsVisibleTo Include="SeventySix.Game.Tests" />
    <InternalsVisibleTo Include="SeventySix.Api.Tests" />
    <InternalsVisibleTo Include="DynamicProxyGenAssembly2, PublicKey=..." />
</ItemGroup>
```

### Dependency Graph After Extraction

```
                    ┌─────────────────────┐
                    │   SeventySix.Api    │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │SeventySix.Domains│ │ SeventySix.Game │ │(future domains) │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
              │                  │                   │
              └──────────────────┼───────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────┐
                    │ SeventySix.Shared   │
                    └─────────────────────┘
```

### Cross-Domain Communication (Post-Extraction)

If Game needs Identity data:

```csharp
// Option 1: Shared interfaces in SeventySix.Shared
// SeventySix.Shared/Interfaces/ICurrentUserAccessor.cs
namespace SeventySix.Shared;
public interface ICurrentUserAccessor
{
    int? UserId { get; }
    string? Username { get; }
}

// Implemented in Identity, consumed by Game
// No direct dependency between Game and Identity

// Option 2: Events/Messages (for async communication)
// Game publishes events, Identity subscribes (via Wolverine)
```

---

## Part 11: Critical Analysis & Trade-offs

### What This Architecture Solves

| Problem                              | Solution                                               |
| ------------------------------------ | ------------------------------------------------------ |
| Can't enforce dependency direction   | Project references enforce Shared ← Domains ← Api      |
| Infrastructure masquerades as domain | Moved to API where it belongs                          |
| Shared folder can't be versioned     | Separate project can become NuGet package              |
| Domain extraction is painful         | Clear project boundaries + stable namespaces           |
| Namespace confusion                  | Clear naming: Shared.Persistence vs Api.Infrastructure |
| API folder chaos                     | Separated: Registration/, Setup/, Extensions/          |
| Package bloat across domains         | Domain-specific packages documented, ready to split    |

### What This Architecture Doesn't Solve

| Issue                               | Reality                                           |
| ----------------------------------- | ------------------------------------------------- |
| **Migration effort**                | ~4-8 hours of careful refactoring                 |
| **More projects = more complexity** | 3 projects vs 2 (acceptable trade-off)            |
| **Learning curve**                  | Team needs to understand new structure            |
| **Transitive reference overhead**   | API gets Shared transitively (minor build impact) |

### Risks & Mitigations

| Risk                                    | Mitigation                               |
| --------------------------------------- | ---------------------------------------- |
| Breaking changes during migration       | Phase-by-phase with tests at each step   |
| Namespace churn causing merge conflicts | Do during low-activity period            |
| Architecture tests false positives      | Update tests as part of migration phases |
| Docker/CI breaks                        | Test each phase in CI before merging     |

---

## Part 12: Adding New Bounded Contexts

### Adding Game Domain (Initially in Domains)

```
# Step 1: Add folder in Domains project
SeventySix.Domains/
└── Game/
    ├── Commands/
    ├── DTOs/
    ├── Entities/
    ├── Infrastructure/
    │   └── GameDbContext.cs
    ├── Interfaces/
    ├── Migrations/
    ├── Queries/
    ├── Repositories/
    ├── Services/
    └── Settings/

# Step 2: Add Registration in API
SeventySix.Api/Registration/GameRegistration.cs

# Step 3: Register in Program.cs
builder.Services.AddGameDomain(connectionString);

# Step 4: Add tests
Tests/SeventySix.Domains.Tests/Game/

# Step 5: Architecture tests auto-discover via namespace
```

### Game-Specific Packages (While in Domains)

Add to `SeventySix.Domains.csproj`:

```xml
<!-- GAME-SPECIFIC: Move to SeventySix.Game when extracted -->
<PackageReference Include="SomeGamePackage" Version="1.0.0" />
```

When Game grows large enough, follow Part 10 extraction guide.

---

## Summary

| Aspect                   | Before                         | After                                 |
| ------------------------ | ------------------------------ | ------------------------------------- |
| **Projects**             | 2 (SeventySix, SeventySix.Api) | 3 (Shared, Domains, Api)              |
| **Dependency Direction** | Folder convention only         | Project references enforce            |
| **Infrastructure**       | Fake domain in SeventySix      | API layer where it belongs            |
| **Shared Code**          | Folder (can't enforce)         | Separate project (enforceable)        |
| **Domain Extraction**    | Painful (mixed concerns)       | Clear (namespace stays, folder moves) |
| **Client Alignment**     | Different patterns             | Parallel structure (domains/)         |
| **Test Structure**       | Mixed in SeventySix.Tests      | Organized per project                 |
| **API Organization**     | Confusing Extensions/          | Clear: Registration/, Setup/          |
