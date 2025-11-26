# Actionable Implementation Plan: Boundary-Described Architecture Migration

**Project**: SeventySix Server Architecture Refactoring
**Date**: November 24, 2025
**Objective**: Migrate from current three-layer architecture to Boundary-Described structure while maintaining ALL existing functionality
**Database**: PostgreSQL ONLY (no Redis/Dapper/Cassandra)
**Principles**: KISS, DRY, YAGNI

---

## 🚨 CRITICAL: Line-for-Line Code Migration Policy 🚨

**THIS IS A CODE MOVE, NOT A CODE REWRITE**

### Non-Negotiable Rules:

1. **EXACT CODE COPY**: Every line of code moved to the new bounded context structure MUST be identical to the source
2. **NO BEHAVIOR CHANGES**: Zero modifications to business logic, validation rules, or data access patterns
3. **NO SCHEMA CHANGES**: Database schemas, column names, data types, constraints, and indexes remain unchanged
4. **BACKWARDS COMPATIBILITY IS PRIORITY ONE**: The new structure must produce identical API responses and database operations
5. **NAMESPACE CHANGES ONLY**: The ONLY acceptable changes are namespace updates to match new folder structure

### What This Means:

-   ✅ **DO**: Copy entities, DTOs, services, repositories, validators, extensions exactly as-is
-   ✅ **DO**: Update `using` statements to reflect new namespaces
-   ✅ **DO**: Update DbContext references to use bounded context-specific contexts
-   ❌ **DON'T**: Refactor method signatures or implementations
-   ❌ **DON'T**: "Improve" validation logic or business rules
-   ❌ **DON'T**: Rename properties, methods, or variables
-   ❌ **DON'T**: Change data types, nullable annotations, or entity configurations
-   ❌ **DON'T**: Optimize queries or add new features

### Verification Requirements:

-   **Every phase** must include side-by-side comparison of old vs. new code
-   **All tests** must pass without modification (except namespace updates)
-   **API responses** must be byte-for-byte identical for identical requests
-   **Database schemas** must match exactly (same tables, columns, types, constraints)
-   **Existing clients** must work without any changes whatsoever

### Why This Matters:

The goal is to **restructure**, not **rewrite**. Any behavioral changes introduce risk:

-   Risk of breaking existing integrations
-   Risk of data corruption or loss
-   Risk of introducing new bugs
-   Risk of inconsistent behavior across environments

**We refactor the structure, not the code. Improvements come AFTER migration is complete and verified.**

---

## Executive Summary

This plan outlines the step-by-step migration from the current three-layer architecture (Api, BusinessLogic, Data) to a Boundary-Described structure organized by domain/feature with clear boundaries. The goal is to improve maintainability, scalability, and developer productivity while preserving all existing functionality.

**Key Constraints:**

-   ✅ Keep ALL existing API endpoints working identically
-   ✅ Maintain ALL existing tests (update structure only)
-   ✅ PostgreSQL ONLY - no additional databases
-   ✅ No breaking changes to client applications
-   ✅ Zero downtime migration path
-   ✅ **LINE-FOR-LINE CODE COPY - NO BEHAVIOR CHANGES**

---

## 🏗️ Bounded Context Folder Structure Standard

Each bounded context (Identity, Logging, ApiTracking) MUST follow this structure:

### Standard Folder Organization

```
BoundedContext/
├── Configurations/          # EF Core entity configurations
│   └── EntityConfiguration.cs
├── DTOs/                    # Data Transfer Objects
│   ├── EntityDto.cs
│   ├── CreateEntityRequest.cs
│   └── UpdateEntityRequest.cs
├── Entities/                # Domain entities
│   └── Entity.cs
├── Exceptions/              # Domain-specific exceptions (e.g., EntityNotFoundException)
│   └── EntityNotFoundException.cs
├── Extensions/              # Mapping extensions (ToDto, ToEntity)
│   └── EntityExtensions.cs
├── Infrastructure/          # DbContext and infrastructure
│   └── BoundedContextDbContext.cs
├── Interfaces/              # Service and repository contracts
│   ├── IEntityRepository.cs
│   └── IEntityService.cs
├── Migrations/              # EF Core database migrations
│   └── YYYYMMDDHHMMSS_InitialCreate.cs
├── Repositories/            # Data access implementations
│   └── EntityRepository.cs
├── Services/                # Business logic implementations
│   └── EntityService.cs
└── Validators/              # FluentValidation validators
    ├── CreateEntityValidator.cs
    └── UpdateEntityValidator.cs
```

### Shared Project Organization

```
Shared/
├── BaseQueryRequest.cs      # Base class for paginated queries
├── ConcurrencyException.cs  # Optimistic concurrency failures
├── DomainException.cs       # Base exception for domain errors
├── EntityNotFoundException.cs # Base entity not found exception
├── IEntity.cs               # Base entity interface
├── PagedResult.cs           # Generic paged result type
└── Result.cs                # Result<T> pattern for service operations
```

### Key Principles

1. **Shared Types**: BaseQueryRequest, PagedResult, ConcurrencyException, EntityNotFoundException, DomainException belong in Shared (NOT in individual bounded contexts)
2. **Domain-Specific Exceptions**: Entity-specific exceptions (e.g., UserNotFoundException) belong in the bounded context's Exceptions/ folder and inherit from Shared base exceptions
3. **Namespace Convention**: All files in a bounded context use `namespace BoundedContextName;` regardless of subfolder
4. **Using Statements**: Files reference types from subfolders via `using BoundedContextName.SubfolderName;` or `using SeventySix.Shared;`
5. **Migrations Required**: Each DbContext MUST have migrations generated after creation

---

## Current State Analysis

### Existing Entities

1. **User** - User management domain
2. **Log** - System logging domain
3. **ThirdPartyApiRequest** - API tracking domain

### Current Services

1. **UserService** - User business logic
2. **LogService** - Log business logic
3. **ThirdPartyApiRequestService** - API tracking logic
4. **HealthCheckService** - Health monitoring
5. **MetricsService** - Metrics aggregation
6. **RateLimitingService** - Rate limiting infrastructure

### Current Repositories (Interfaces in BusinessLogic, Implementations in Data)

1. **IUserRepository** / **UserRepository**
2. **ILogRepository** / **LogRepository**
3. **IThirdPartyApiRequestRepository** / **ThirdPartyApiRequestRepository**

### Current Tests

1. **SeventySix.Api.Tests** - Controller integration tests
2. **SeventySix.BusinessLogic.Tests** - Service unit tests
3. **SeventySix.Data.Tests** - Repository integration tests
4. **SeventySix.TestUtilities** - Shared test infrastructure

---

## Target Architecture: Boundary-Described Structure

### Project Structure

```
SeventySix.Server/
├── SeventySix.Api/                          # HTTP Entry Point (unchanged)
│   ├── Program.cs
│   ├── Middleware/
│   ├── Attributes/
│   └── Controllers/                         # Thin controllers (unchanged)
│
├── SeventySix/                              # NEW: Single Domain Project
│   │
│   ├── Identity/                            # Bounded Context 1
│   │   ├── User.cs                          # Entity
│   │   ├── UserDto.cs                       # DTOs
│   │   ├── UserService.cs                   # Business logic
│   │   ├── UserRepository.cs                # Data access
│   │   ├── UserValidator.cs                 # Validation
│   │   ├── UserExtensions.cs                # Mapping
│   │   └── IdentityDbContext.cs             # Separate DbContext!
│   │
│   ├── Logging/                             # Bounded Context 2
│   │   ├── Log.cs                           # Entity
│   │   ├── LogDto.cs                        # DTOs
│   │   ├── LogService.cs                    # Business logic
│   │   ├── LogRepository.cs                 # Data access
│   │   ├── LogValidator.cs                  # Validation
│   │   ├── LogExtensions.cs                 # Mapping
│   │   └── LoggingDbContext.cs              # Separate DbContext!
│   │
│   ├── ApiTracking/                         # Bounded Context 3
│   │   ├── ThirdPartyApiRequest.cs          # Entity
│   │   ├── ThirdPartyApiRequestDto.cs       # DTOs
│   │   ├── ThirdPartyApiRequestService.cs   # Business logic
│   │   ├── ThirdPartyApiRequestRepository.cs # Data access
│   │   ├── ThirdPartyApiRequestValidator.cs # Validation
│   │   ├── ThirdPartyApiRequestExtensions.cs # Mapping
│   │   └── ApiTrackingDbContext.cs          # Separate DbContext!
│   │
│   ├── Infrastructure/                      # Shared Infrastructure
│   │   ├── RateLimitingService.cs           # Rate limiting
│   │   ├── MetricsService.cs                # Metrics
│   │   └── HealthCheckService.cs            # Health checks
│   │
│   ├── Shared/                              # Minimal shared code
│   │   ├── Result.cs                        # Result<T> pattern
│   │   ├── PagedResult.cs                   # Pagination
│   │   ├── DomainException.cs               # Base exception
│   │   └── IEntity.cs                       # Base entity interface
│   │
│   └── Extensions/                          # DI registration
│       ├── IdentityExtensions.cs            # services.AddIdentity()
│       ├── LoggingExtensions.cs             # services.AddLogging()
│       └── ApiTrackingExtensions.cs         # services.AddApiTracking()
│
└── Tests/
    ├── SeventySix.Tests/                    # Unit tests by domain
    │   ├── Identity/
    │   ├── Logging/
    │   └── ApiTracking/
    └── SeventySix.IntegrationTests/         # Integration tests
```

---

## Phase 1: Project Setup and Shared Infrastructure

**Goal**: Create new SeventySix project with minimal shared code

### Step 1.1: Create New Project

```bash
cd SeventySix.Server
dotnet new classlib -n SeventySix -f net9.0
dotnet sln add SeventySix/SeventySix.csproj
```

### Step 1.2: Add Dependencies

```xml
<!-- SeventySix/SeventySix.csproj -->
<ItemGroup>
  <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.Relational" Version="9.0.0" />
  <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.0" />
  <PackageReference Include="FluentValidation" Version="11.11.0" />
  <PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" Version="9.0.0" />
  <PackageReference Include="Microsoft.Extensions.Logging.Abstractions" Version="9.0.0" />
</ItemGroup>
```

### Step 1.3: Create Shared Primitives

**File**: `Shared/IEntity.cs`

```csharp
namespace SeventySix.Shared;

/// <summary>
/// Base interface for all entities.
/// </summary>
public interface IEntity
{
	int Id { get; set; }
	DateTime CreatedAt { get; set; }
	DateTime? ModifiedAt { get; set; }
}
```

**File**: `Shared/Result.cs`

```csharp
namespace SeventySix.Shared;

/// <summary>
/// Result pattern for service operations.
/// </summary>
public class Result<T>
{
	public bool IsSuccess { get; }
	public T? Value { get; }
	public string? Error { get; }

	private Result(bool isSuccess, T? value, string? error)
	{
		IsSuccess = isSuccess;
		Value = value;
		Error = error;
	}

	public static Result<T> Success(T value) => new(true, value, null);
	public static Result<T> Failure(string error) => new(false, default, error);
}
```

**File**: `Shared/PagedResult.cs`

```csharp
namespace SeventySix.Shared;

/// <summary>
/// Paged result for queries.
/// </summary>
public class PagedResult<T>
{
	public required IReadOnlyList<T> Items { get; init; }
	public int TotalCount { get; init; }
	public int Page { get; init; }
	public int PageSize { get; init; }
	public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
```

**File**: `Shared/DomainException.cs`

```csharp
namespace SeventySix.Shared;

/// <summary>
/// Base exception for domain errors.
/// </summary>
public class DomainException : Exception
{
	public DomainException(string message) : base(message) { }
	public DomainException(string message, Exception innerException)
		: base(message, innerException) { }
}
```

**Deliverable**: SeventySix project with shared primitives only

---

## Phase 2: Identity Bounded Context Migration

**Goal**: Migrate User entity and related code to Identity bounded context

### Step 2.1: Create Identity Folder Structure

**Create standard folder structure**:

```bash
New-Item -ItemType Directory -Path "SeventySix/Identity/Configurations"
New-Item -ItemType Directory -Path "SeventySix/Identity/DTOs"
New-Item -ItemType Directory -Path "SeventySix/Identity/Entities"
New-Item -ItemType Directory -Path "SeventySix/Identity/Exceptions"
New-Item -ItemType Directory -Path "SeventySix/Identity/Extensions"
New-Item -ItemType Directory -Path "SeventySix/Identity/Infrastructure"
New-Item -ItemType Directory -Path "SeventySix/Identity/Interfaces"
New-Item -ItemType Directory -Path "SeventySix/Identity/Migrations"
New-Item -ItemType Directory -Path "SeventySix/Identity/Repositories"
New-Item -ItemType Directory -Path "SeventySix/Identity/Services"
New-Item -ItemType Directory -Path "SeventySix/Identity/Validators"
```

### Step 2.1a: Copy User Entity (LINE-FOR-LINE)

-   Copy `User.cs` from BusinessLogic/Entities to `SeventySix/Identity/Entities/User.cs`
-   **ONLY** change namespace from original to `SeventySix.Identity`
-   **CRITICAL**: Keep ALL properties, methods, attributes, comments EXACTLY as-is
-   **VERIFY**: Compare old and new files line-by-line (excluding namespace change only)

### Step 2.2: Create Identity DbContext

**File**: `Identity/IdentityDbContext.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

public class IdentityDbContext : DbContext
{
	public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
		: base(options) { }

	public DbSet<User> Users => Set<User>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		// Apply configuration from existing UserConfiguration
		modelBuilder.ApplyConfigurationsFromAssembly(typeof(IdentityDbContext).Assembly);

		// Global query filter for soft delete
		modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
	}
}
```

### Step 2.3: Copy Entity Configuration (LINE-FOR-LINE)

-   Copy `UserConfiguration.cs` from Data/Configurations to `SeventySix/Identity/`
-   Update to use `IdentityDbContext` (ONLY change required)
-   **CRITICAL**: Keep ALL column mappings, indexes, constraints, property configurations EXACTLY as-is
-   **VERIFY**: No changes to column names, data types, max lengths, nullable settings, indexes, foreign keys, or any EF Core configuration

### Step 2.4: Copy DTOs (LINE-FOR-LINE)

-   Copy all User DTOs from BusinessLogic/DTOs to `SeventySix/Identity/UserDto.cs`
-   **ONLY** update namespace to `SeventySix.Identity`
-   **CRITICAL**: Keep ALL property names, types, nullable annotations, attributes, validation attributes EXACTLY as-is
-   **VERIFY**: API response schemas must remain identical

### Step 2.5: Copy Repository (LINE-FOR-LINE)

-   Copy `IUserRepository` interface to `SeventySix/Identity/IUserRepository.cs`
-   Copy `UserRepository` implementation to `SeventySix/Identity/UserRepository.cs`
-   **ONLY** update DbContext reference from `ApplicationDbContext` to `IdentityDbContext`
-   **CRITICAL**: Keep ALL method signatures, return types, parameters, LINQ queries, SQL logic EXACTLY as-is
-   **VERIFY**: All repository methods produce identical database queries and results

### Step 2.6: Copy Service (LINE-FOR-LINE)

-   Copy `IUserService` interface to `SeventySix/Identity/IUserService.cs`
-   Copy `UserService` implementation to `SeventySix/Identity/UserService.cs`
-   **ONLY** update namespace and using statements
-   **CRITICAL**: Keep ALL business logic, validation rules, error handling, method implementations EXACTLY as-is
-   **VERIFY**: All service methods produce identical results for identical inputs

### Step 2.7: Copy Validators (LINE-FOR-LINE)

-   Copy all User validators to `SeventySix/Identity/`
-   **ONLY** update namespace to `SeventySix.Identity`
-   **CRITICAL**: Keep ALL validation rules, error messages, conditional logic EXACTLY as-is
-   **VERIFY**: Validation behavior remains identical for all input scenarios

### Step 2.8: Copy Mapping Extensions (LINE-FOR-LINE)

-   Copy `UserExtensions.cs` to `SeventySix/Identity/`
-   **ONLY** update namespace to `SeventySix.Identity`
-   **CRITICAL**: Keep ALL mapping logic, property assignments, transformations EXACTLY as-is
-   **VERIFY**: Entity-to-DTO and DTO-to-Entity mappings produce identical results

### Step 2.9: Create DI Extension

**File**: `Extensions/IdentityExtensions.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using SeventySix.Identity;

namespace SeventySix.Extensions;

public static class IdentityExtensions
{
	public static IServiceCollection AddIdentityDomain(
		this IServiceCollection services,
		string connectionString)
	{
		// Register DbContext
		services.AddDbContext<IdentityDbContext>(opt =>
			opt.UseNpgsql(connectionString));

		// Register Repository
		services.AddScoped<IUserRepository, UserRepository>();

		// Register Service
		services.AddScoped<IUserService, UserService>();

		// Register Validators
		services.AddValidatorsFromAssemblyContaining<UserValidator>();

		return services;
	}
}
```

### Step 2.10: Generate Database Migration

**Generate initial migration**:

```bash
cd SeventySix.Server/SeventySix
dotnet ef migrations add InitialCreate \
  --context IdentityDbContext \
  --output-dir Identity/Migrations \
  --namespace SeventySix.Identity.Migrations
```

**Verify migration**:

-   ✅ Users table created (with schema if configured in DbContext)
-   ✅ All columns match User entity configuration
-   ✅ Primary key, unique indexes, and filtered indexes created
-   ✅ Concurrency token configured
-   ✅ Soft delete query filter applied

**Deliverable**: Complete Identity bounded context with all User functionality and migrations

---

## Phase 3: Logging Bounded Context Migration

**Goal**: Migrate Log entity and related code to Logging bounded context

### Step 3.1: Create Logging Folder Structure

**Follow standard bounded context structure**:

```bash
New-Item -ItemType Directory -Path "SeventySix/Logging/Configurations"
New-Item -ItemType Directory -Path "SeventySix/Logging/DTOs"
New-Item -ItemType Directory -Path "SeventySix/Logging/Entities"
New-Item -ItemType Directory -Path "SeventySix/Logging/Exceptions"
New-Item -ItemType Directory -Path "SeventySix/Logging/Extensions"
New-Item -ItemType Directory -Path "SeventySix/Logging/Infrastructure"
New-Item -ItemType Directory -Path "SeventySix/Logging/Interfaces"
New-Item -ItemType Directory -Path "SeventySix/Logging/Migrations"
New-Item -ItemType Directory -Path "SeventySix/Logging/Repositories"
New-Item -ItemType Directory -Path "SeventySix/Logging/Services"
New-Item -ItemType Directory -Path "SeventySix/Logging/Validators"
```

**All files use namespace SeventySix.Logging**
**All files reference Shared types via using SeventySix.Shared**

### Step 3.1a: Copy Log Entity (LINE-FOR-LINE)

-   Copy `Log.cs` from BusinessLogic/Entities to `SeventySix/Logging/Entities/Log.cs`
-   **ONLY** change namespace from original to `SeventySix.Logging`
-   **CRITICAL**: Keep ALL properties, methods, attributes, comments EXACTLY as-is
-   **VERIFY**: Compare old and new files line-by-line (excluding namespace change only)

### Step 3.2: Create Logging DbContext

**File**: `Logging/LoggingDbContext.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Logging;

public class LoggingDbContext : DbContext
{
	public LoggingDbContext(DbContextOptions<LoggingDbContext> options)
		: base(options) { }

	public DbSet<Log> Logs => Set<Log>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.ApplyConfigurationsFromAssembly(typeof(LoggingDbContext).Assembly);
	}
}
```

### Step 3.3: Copy Entity Configuration (LINE-FOR-LINE)

-   Copy `LogConfiguration.cs` to `SeventySix/Logging/`
-   **ONLY** update to use `LoggingDbContext`
-   **CRITICAL**: Keep ALL column mappings, indexes, constraints, property configurations EXACTLY as-is
-   **VERIFY**: Database schema for logs table remains identical

### Step 3.4: Copy DTOs (LINE-FOR-LINE)

-   Copy all Log DTOs to `SeventySix/Logging/LogDto.cs`
-   **ONLY** update namespace to `SeventySix.Logging`
-   **CRITICAL**: Keep ALL property names, types, nullable annotations, attributes EXACTLY as-is
-   **VERIFY**: API response schemas remain identical

### Step 3.5: Copy Repository (LINE-FOR-LINE)

-   Copy `ILogRepository` and `LogRepository` to `SeventySix/Logging/`
-   **ONLY** update DbContext reference to `LoggingDbContext`
-   **CRITICAL**: Keep ALL method signatures, LINQ queries, SQL logic EXACTLY as-is
-   **VERIFY**: All database queries produce identical results

### Step 3.6: Copy Service (LINE-FOR-LINE)

-   Copy `ILogService` and `LogService` to `SeventySix/Logging/`
-   **ONLY** update namespace and using statements
-   **CRITICAL**: Keep ALL business logic, error handling, method implementations EXACTLY as-is
-   **VERIFY**: All service methods produce identical results

### Step 3.7: Copy Validators (LINE-FOR-LINE)

-   Copy all Log validators to `SeventySix/Logging/`
-   **ONLY** update namespace to `SeventySix.Logging`
-   **CRITICAL**: Keep ALL validation rules, error messages EXACTLY as-is
-   **VERIFY**: Validation behavior remains identical

### Step 3.8: Copy Mapping Extensions

-   Copy `LogExtensions.cs` to `SeventySix/Logging/`

### Step 3.9: Create DI Extension

**File**: `Extensions/LoggingExtensions.cs`

```csharp
public static class LoggingExtensions
{
	public static IServiceCollection AddLoggingDomain(
		this IServiceCollection services,
		string connectionString)
	{
		services.AddDbContext<LoggingDbContext>(opt =>
			opt.UseNpgsql(connectionString));

		services.AddScoped<ILogRepository, LogRepository>();
		services.AddScoped<ILogService, LogService>();
		services.AddValidatorsFromAssemblyContaining<LogValidator>();

		return services;
	}
}
```

**Deliverable**: Complete Logging bounded context

---

## Phase 4: API Tracking Bounded Context Migration

**Goal**: Migrate ThirdPartyApiRequest entity to ApiTracking bounded context

### Step 4.1: Create ApiTracking Folder Structure

**Follow standard bounded context structure**:

```bash
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Configurations"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/DTOs"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Entities"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Exceptions"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Extensions"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Infrastructure"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Interfaces"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Migrations"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Repositories"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Services"
New-Item -ItemType Directory -Path "SeventySix/ApiTracking/Validators"
```

**All files use namespace SeventySix.ApiTracking**
**All files reference Shared types via using SeventySix.Shared**

### Step 4.1a: Copy Entity (LINE-FOR-LINE)

-   Copy `ThirdPartyApiRequest.cs` to `SeventySix/ApiTracking/Entities/ThirdPartyApiRequest.cs`
-   **ONLY** change namespace to `SeventySix.ApiTracking`
-   **CRITICAL**: Keep ALL properties, methods, attributes EXACTLY as-is
-   **VERIFY**: Compare old and new files line-by-line

### Step 4.2: Create DbContext

**File**: `ApiTracking/ApiTrackingDbContext.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace SeventySix.ApiTracking;

public class ApiTrackingDbContext : DbContext
{
	public ApiTrackingDbContext(DbContextOptions<ApiTrackingDbContext> options)
		: base(options) { }

	public DbSet<ThirdPartyApiRequest> ApiRequests => Set<ThirdPartyApiRequest>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApiTrackingDbContext).Assembly);
	}
}
```

### Step 4.3: Follow same pattern as Identity/Logging (LINE-FOR-LINE)

-   Copy configuration (DbContext reference only change)
-   Copy DTOs (namespace only change)
-   Copy repository (DbContext reference only change)
-   Copy service (namespace/using only change)
-   Copy validators (namespace only change)
-   Copy extensions (namespace only change)
-   Create DI extension (new code following existing patterns)
-   **CRITICAL**: Apply same LINE-FOR-LINE verification at each step
-   **VERIFY**: All ApiTracking functionality produces identical results

**Deliverable**: Complete ApiTracking bounded context with zero behavioral changes

---

## Phase 5: Infrastructure Services Migration

**Goal**: Move cross-cutting infrastructure services to Infrastructure folder

### Step 5.1: Copy Infrastructure Services (LINE-FOR-LINE)

-   Copy `RateLimitingService.cs` to `SeventySix/Infrastructure/`
-   Copy `MetricsService.cs` to `SeventySix/Infrastructure/`
-   Copy `HealthCheckService.cs` to `SeventySix/Infrastructure/`
-   **ONLY** update namespace to `SeventySix.Infrastructure`
-   **CRITICAL**: Keep ALL service logic, interfaces, method implementations EXACTLY as-is

### Step 5.2: Update Dependencies (MINIMAL CHANGES)

-   Update `HealthCheckService` to reference new bounded context service interfaces
-   **ONLY** change: using statements and dependency injection references
-   **CRITICAL**: Keep health check logic, thresholds, return types EXACTLY as-is
-   **VERIFY**: Health check responses remain identical in format and content

### Step 5.3: Create DI Extension

**File**: `Extensions/InfrastructureExtensions.cs`

```csharp
public static class InfrastructureExtensions
{
	public static IServiceCollection AddInfrastructureServices(
		this IServiceCollection services)
	{
		services.AddScoped<IRateLimitingService, RateLimitingService>();
		services.AddScoped<IMetricsService, MetricsService>();
		services.AddScoped<IHealthCheckService, HealthCheckService>();

		return services;
	}
}
```

**Deliverable**: Infrastructure services in new structure

---

## Phase 6: Database Migration Strategy

**Goal**: Create separate schemas for each bounded context while using single PostgreSQL database

### Step 6.1: Schema Design

```sql
-- Identity schema
CREATE SCHEMA IF NOT EXISTS identity;

-- Logging schema
CREATE SCHEMA IF NOT EXISTS logging;

-- API Tracking schema
CREATE SCHEMA IF NOT EXISTS api_tracking;

-- Infrastructure schema
CREATE SCHEMA IF NOT EXISTS infrastructure;
```

### Step 6.2: Update DbContext Configurations

```csharp
// Identity/IdentityDbContext.cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
	modelBuilder.HasDefaultSchema("identity");
	// ... rest of configuration
}

// Logging/LoggingDbContext.cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
	modelBuilder.HasDefaultSchema("logging");
	// ... rest of configuration
}

// ApiTracking/ApiTrackingDbContext.cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
	modelBuilder.HasDefaultSchema("api_tracking");
	// ... rest of configuration
}
```

### Step 6.3: Migration Strategy

**Option A: Fresh Migration (Recommended for Development)**

1. Generate new migrations for each DbContext
2. Create schema migration script
3. Migrate data from public schema to new schemas
4. Test thoroughly
5. Drop old tables

**Option B: In-Place Migration (Production)**

1. Create new schemas
2. Generate migrations to create tables in new schemas
3. Copy data from old tables to new schema tables
4. Switch connection strings to use new contexts
5. Verify all functionality
6. Drop old tables after verification period

### Step 6.4: Connection String Strategy

**Single Database, Separate Schemas**

```json
{
	"ConnectionStrings": {
		"Identity": "Host=localhost;Database=seventysix;Schema=identity;Username=postgres;Password=***",
		"Logging": "Host=localhost;Database=seventysix;Schema=logging;Username=postgres;Password=***",
		"ApiTracking": "Host=localhost;Database=seventysix;Schema=api_tracking;Username=postgres;Password=***"
	}
}
```

**Deliverable**: Database schema separation with migration path

---

## Phase 7: Update API Project

**Goal**: Wire new bounded contexts into API project

### Step 7.1: Add Project Reference

```xml
<!-- SeventySix.Api/SeventySix.Api.csproj -->
<ItemGroup>
  <ProjectReference Include="..\SeventySix\SeventySix.csproj" />
</ItemGroup>
```

### Step 7.2: Update Program.cs

```csharp
using SeventySix.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register bounded contexts
builder.Services.AddIdentityDomain(
	builder.Configuration.GetConnectionString("Identity")!);

builder.Services.AddLoggingDomain(
	builder.Configuration.GetConnectionString("Logging")!);

builder.Services.AddApiTrackingDomain(
	builder.Configuration.GetConnectionString("ApiTracking")!);

builder.Services.AddInfrastructureServices();

// Rest of existing configuration...
```

### Step 7.3: Update Controllers (NAMESPACE CHANGES ONLY)

-   **ONLY** update using statements to reference new namespaces:
    -   `SeventySix.Identity` for User-related code
    -   `SeventySix.Logging` for Log-related code
    -   `SeventySix.ApiTracking` for API tracking code
    -   `SeventySix.Infrastructure` for infrastructure services
-   **CRITICAL**: Do NOT change controller logic, endpoints, route patterns, parameters, return types
-   **VERIFY**: All API endpoints return identical responses for identical requests

### Step 7.4: Remove Old Project References

```xml
<!-- Remove these references -->
<!-- <ProjectReference Include="..\SeventySix.BusinessLogic\SeventySix.BusinessLogic.csproj" /> -->
<!-- <ProjectReference Include="..\SeventySix.Data\SeventySix.Data.csproj" /> -->
```

**Deliverable**: API project using new bounded contexts

---

## Phase 8: Test Migration

**Goal**: Update all tests to work with new structure

### Step 8.1: Update TestUtilities

**Update Base Classes**

```csharp
// TestUtilities/TestBases/IdentityTestBase.cs
public abstract class IdentityTestBase
{
	protected IdentityDbContext CreateDbContext()
	{
		var options = new DbContextOptionsBuilder<IdentityDbContext>()
			.UseNpgsql(ConnectionString)
			.Options;
		return new IdentityDbContext(options);
	}
}

// Similar for LoggingTestBase, ApiTrackingTestBase
```

### Step 8.2: Update Repository Tests (LINE-FOR-LINE)

-   Move to `SeventySix.Tests/Identity/UserRepositoryTests.cs`
-   **ONLY** update DbContext reference to `IdentityDbContext`
-   **ONLY** update namespace and using statements
-   **CRITICAL**: Keep ALL test logic, assertions, test data, setup/teardown EXACTLY as-is
-   **VERIFY**: All tests pass without modification

### Step 8.3: Update Service Tests (LINE-FOR-LINE)

-   Move to `SeventySix.Tests/Identity/UserServiceTests.cs`
-   **ONLY** update namespaces and using statements
-   **CRITICAL**: Keep ALL test scenarios, mocks, assertions EXACTLY as-is
-   **VERIFY**: All tests pass without modification

### Step 8.4: Update Integration Tests (LINE-FOR-LINE)

-   Update controller tests to use new DI registration extensions
-   **ONLY** change: service registration calls in test setup
-   **CRITICAL**: Keep ALL API contract tests, assertions, test data EXACTLY as-is
-   **VERIFY**: All integration tests pass without modification

### Step 8.5: Run All Tests

```bash
# Run all tests to verify migration
dotnet test --no-build --logger "console;verbosity=normal"
```

**Critical**: ALL tests must pass before proceeding

**Deliverable**: All tests passing with new structure

---

## Phase 9: Cleanup and Finalization

**Goal**: Remove old projects and finalize migration

### Step 9.1: Verify Functionality Checklist

-   ✅ All API endpoints responding correctly
-   ✅ All CRUD operations working
-   ✅ All validations working
-   ✅ All tests passing
-   ✅ Migrations working
-   ✅ Soft delete working
-   ✅ Audit fields working
-   ✅ Rate limiting working
-   ✅ Health checks working

### Step 9.2: Remove Old Projects

```bash
# After verification, remove old projects
rm -rf SeventySix.BusinessLogic
rm -rf SeventySix.Data
dotnet sln remove SeventySix.BusinessLogic/SeventySix.BusinessLogic.csproj
dotnet sln remove SeventySix.Data/SeventySix.Data.csproj
```

### Step 9.3: Update Documentation

-   Update ARCHITECTURE.md to reflect new structure
-   Update README.md with new project organization
-   Document bounded context boundaries

### Step 9.4: Final Testing

-   Run full test suite
-   Test all API endpoints manually
-   Verify client application still works
-   Performance testing

**Deliverable**: Clean codebase with new architecture

---

## Phase 10: Future Extensibility

**Goal**: Document how to add new bounded contexts

### Adding New Bounded Context Template

**Step 1**: Create folder structure

```
SeventySix/NewDomain/
├── Entity.cs
├── EntityDto.cs
├── EntityRepository.cs
├── EntityService.cs
├── EntityValidator.cs
├── EntityExtensions.cs
├── EntityConfiguration.cs
└── NewDomainDbContext.cs
```

**Step 2**: Create DbContext

```csharp
public class NewDomainDbContext : DbContext
{
	public NewDomainDbContext(DbContextOptions<NewDomainDbContext> options)
		: base(options) { }

	public DbSet<Entity> Entities => Set<Entity>();

	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		modelBuilder.HasDefaultSchema("new_domain");
		modelBuilder.ApplyConfigurationsFromAssembly(typeof(NewDomainDbContext).Assembly);
	}
}
```

**Step 3**: Create DI Extension

```csharp
public static class NewDomainExtensions
{
	public static IServiceCollection AddNewDomain(
		this IServiceCollection services,
		string connectionString)
	{
		services.AddDbContext<NewDomainDbContext>(opt =>
			opt.UseNpgsql(connectionString));

		services.AddScoped<IEntityRepository, EntityRepository>();
		services.AddScoped<IEntityService, EntityService>();
		services.AddValidatorsFromAssemblyContaining<EntityValidator>();

		return services;
	}
}
```

**Step 4**: Register in Program.cs

```csharp
builder.Services.AddNewDomain(
	builder.Configuration.GetConnectionString("NewDomain")!);
```

**Step 5**: Add tests

```
SeventySix.Tests/NewDomain/
├── EntityRepositoryTests.cs
├── EntityServiceTests.cs
└── EntityValidatorTests.cs
```

**Deliverable**: Template for future domains

---

## Success Criteria

### Critical Requirements (MUST PASS)

-   ✅ **BACKWARDS COMPATIBILITY**: All existing API endpoints return identical responses
-   ✅ **SCHEMA INTEGRITY**: Database schemas remain unchanged (tables, columns, types, constraints)
-   ✅ **CODE FIDELITY**: All moved code is line-for-line identical (excluding namespace changes)
-   ✅ **TEST INTEGRITY**: All existing tests pass without logic modifications
-   ✅ **CLIENT COMPATIBILITY**: No breaking changes to client applications
-   ✅ **DATA INTEGRITY**: All CRUD operations produce identical database effects

### Functional Requirements

-   ✅ All existing API endpoints work identically
-   ✅ All existing tests pass
-   ✅ No breaking changes to client
-   ✅ All data persisted correctly
-   ✅ All validations working
-   ✅ All business logic preserved

### Non-Functional Requirements

-   ✅ Code organized by domain/feature
-   ✅ Clear bounded context boundaries
-   ✅ Each context has own DbContext
-   ✅ Separate database schemas
-   ✅ DI registration per context
-   ✅ Tests organized by domain

### Quality Metrics

-   ✅ Test coverage maintained (>80%)
-   ✅ No performance regression
-   ✅ Build succeeds
-   ✅ No compiler warnings
-   ✅ EditorConfig rules followed
-   ✅ SOLID principles maintained

### Verification Checklist (AFTER EACH PHASE)

-   ✅ Side-by-side code comparison completed (old vs. new)
-   ✅ Only namespace/using statements changed
-   ✅ All tests pass without modification
-   ✅ API responses identical for sample requests
-   ✅ Database queries produce identical results
-   ✅ No new warnings or errors introduced

---

## Risk Mitigation

### Risk 1: Breaking Existing Functionality

**Mitigation**:

-   Run full test suite after each phase
-   Manual testing of all endpoints
-   Keep old projects until full verification

### Risk 2: Data Loss During Migration

**Mitigation**:

-   Database backups before migration
-   Test migration on development database first
-   Use transactions for data migration
-   Verify data after migration

### Risk 3: Test Failures

**Mitigation**:

-   Fix tests immediately when discovered
-   Don't proceed to next phase with failing tests
-   Keep test structure as close to original as possible

### Risk 4: Performance Degradation

**Mitigation**:

-   Benchmark before and after
-   Use same EF Core patterns
-   Keep database indexes
-   Monitor query performance

---

## Timeline Estimation

### Conservative Estimate

-   **Phase 1**: Project Setup - 2 hours
-   **Phase 2**: Identity Migration - 4 hours
-   **Phase 3**: Logging Migration - 3 hours
-   **Phase 4**: ApiTracking Migration - 3 hours
-   **Phase 5**: Infrastructure Migration - 2 hours
-   **Phase 6**: Database Migration - 4 hours
-   **Phase 7**: API Update - 2 hours
-   **Phase 8**: Test Migration - 6 hours
-   **Phase 9**: Cleanup - 2 hours
-   **Phase 10**: Documentation - 2 hours

**Total**: ~30 hours (4-5 working days)

### Aggressive Estimate

-   With automation and parallel work: ~15-20 hours (2-3 days)

---

## Dependencies and Prerequisites

### Required Before Starting

-   ✅ Docker Desktop running (for Testcontainers)
-   ✅ PostgreSQL instance available
-   ✅ All current tests passing
-   ✅ Code committed to version control
-   ✅ Database backup created

### Required Tools

-   .NET 9.0 SDK
-   PostgreSQL 16+
-   Visual Studio 2022 or VS Code
-   Git

---

## Rollback Plan

### If Migration Fails

1. Revert to previous commit
2. Restore database from backup
3. Keep old projects in place
4. Document issues encountered
5. Revise plan and retry

### Staged Rollback

1. Can run both old and new projects simultaneously
2. Switch DI registration back to old projects
3. Gradual cutover per bounded context

---

## Conclusion

This plan provides a safe, incremental path to migrate from the current three-layer architecture to a Boundary-Described structure. The key principles are:

1. **Line-for-Line Migration**: This is a code MOVE, not a code REWRITE
2. **Backwards Compatibility First**: No behavioral changes whatsoever
3. **Incremental Migration**: One bounded context at a time
4. **Preserve Functionality**: No breaking changes to APIs or schemas
5. **Test-Driven**: Tests must pass at every phase without modification
6. **Reversible**: Can rollback at any point
7. **PostgreSQL Only**: Single database, separate schemas
8. **KISS/DRY/YAGNI**: Simple, maintainable solution
9. **Verification at Every Step**: Side-by-side comparison before proceeding

### What Success Looks Like:

-   ✅ New folder structure with code organized by bounded context
-   ✅ Every line of business logic identical to original
-   ✅ Every database schema element unchanged
-   ✅ Every API response identical for identical requests
-   ✅ Every test passing without logic changes
-   ✅ Zero client-side changes required
-   ✅ No behavioral differences in any scenario

### What We're NOT Doing:

-   ❌ Refactoring business logic
-   ❌ Improving validation rules
-   ❌ Optimizing database queries
-   ❌ Changing API contracts
-   ❌ Modifying entity properties
-   ❌ Adding new features

**The result will be a more maintainable, scalable codebase organized by domain with clear boundaries, while preserving 100% backwards compatibility with existing functionality and tests.**

**Improvements and optimizations come AFTER this migration is complete and thoroughly verified.**

---

**Next Steps**: Review this plan, validate approach, and begin Phase 1 when ready.
