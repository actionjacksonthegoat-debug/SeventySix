# Audit Property Standardization Implementation Plan

## ✅ STATUS: PHASE 3 COMPLETE - NON-NULLABLE IMPLEMENTATION DONE

**Date**: November 26, 2025
**Completed**: Phases 1-3 (Interfaces, Interceptor, Entity Updates, Production Build ✅)
**Next**: Fix compiler warnings, then proceed with Phase 4 (Register Interceptor)

**CRITICAL BLOCKER DISCOVERED**: Transaction Manager architecture flaw - see `implementation-Transaction-Manager.md`
**Decision Pending**: Fix transactions first OR continue with audit implementation?

---

## 🎯 Objective

Standardize audit properties (CreateDate, CreatedBy, ModifyDate, ModifiedBy) across all entities using interface segregation and EF Core interceptors for automatic timestamp management.

**ENHANCEMENT**: All audit properties changed to **REQUIRED (non-nullable)** per user directive.

---

## 🧠 ULTRATHINK Analysis

**Current State**:

-   User: Has `CreatedAt`, `CreatedBy`, `ModifiedAt`, `ModifiedBy` (inconsistent naming)
-   ThirdPartyApiRequest: Has `CreatedAt`, `ModifiedAt` (no "By" tracking)
-   Log: Has `Timestamp` (domain-specific naming for metrics)

**Target State**:

-   **IAuditableEntity** (User only): Inherits `IModifiableEntity` + adds `CreatedBy`, `ModifiedBy` (string?)
-   **IModifiableEntity** (ThirdPartyApiRequest): `CreateDate`, `ModifyDate` (DateTime?, no user tracking)
-   **ICreatableEntity** (Log): `CreateDate` (DateTime, non-nullable, always NOW() if not set)
-   **IEntity** (Future entities): Only `Id` property (no audit fields)

**Pattern Benefits**:

1. **Interface Segregation**: Entities declare exact audit needs (IAuditable > IModifiable > ICreatable > IEntity)
2. **Automatic Timestamps**: EF Core SaveChangesInterceptor handles NOW() insertion
3. **User Tracking Only Where Needed**: CreatedBy/ModifiedBy only on User entity (not leaked to other entities)
4. **Repository Simplification**: Generic handling via interface constraints
5. **Service Layer Cleanup**: No manual timestamp/user management

---

## 📋 Implementation Phases

### ✅ Phase 1: Create Audit Interfaces (15 LOC) - COMPLETE

**Status**: All interfaces created with NON-NULLABLE properties

**ACTUAL IMPLEMENTATION (Non-Nullable):**

**File**: `SeventySix/Shared/Interfaces/IModifiableEntity.cs` ✅

```csharp
public interface IModifiableEntity : IEntity
{
    DateTime CreateDate { get; set; }      // NON-NULLABLE (required)
    DateTime? ModifyDate { get; set; }     // Nullable (only set on modify)
}
```

**File**: `SeventySix/Shared/Interfaces/IAuditableEntity.cs` ✅

```csharp
public interface IAuditableEntity : IModifiableEntity
{
    string CreatedBy { get; set; }   // NON-NULLABLE (required)
    string ModifiedBy { get; set; }  // NON-NULLABLE (required)
}
```

**File**: `SeventySix/Shared/Interfaces/ICreatableEntity.cs` ✅

```csharp
public interface ICreatableEntity : IEntity
{
    DateTime CreateDate { get; set; }  // NON-NULLABLE (required)
}
```

**CLAUDE.md Compliance**:

-   ✅ Explicit types (DateTime?, string?)
-   ✅ No `var` keyword
-   ✅ Collection Expressions N/A
-   ✅ Primary Constructors N/A

---

### ✅ Phase 2: Create AuditInterceptor (40 LOC) - COMPLETE

**Status**: Interceptor created with enhanced logic for NON-NULLABLE properties

**Files Created**:

-   ✅ `SeventySix/Shared/Infrastructure/AuditInterceptor.cs`
-   ✅ `SeventySix/Shared/Interfaces/IUserContextAccessor.cs`
-   ✅ `SeventySix/Shared/Infrastructure/UserContextAccessor.cs`

**Enhanced Logic for Non-Nullable Properties**:

```csharp
public class AuditInterceptor(IUserContextAccessor userContextAccessor) : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        IEnumerable<EntityEntry> entries = eventData.Context.ChangeTracker.Entries();
        string currentUser = userContextAccessor.GetCurrentUser();

        foreach (EntityEntry entry in entries)
        {
            // IAuditableEntity: Set CreateDate, ModifyDate, CreatedBy, ModifiedBy
            if (entry.Entity is IAuditableEntity auditable)
            {
                if (entry.State == EntityState.Added)
                {
                    if (auditable.CreateDate == default)  // Check default for non-nullable
                    {
                        auditable.CreateDate = DateTime.UtcNow;
                    }
                    if (string.IsNullOrWhiteSpace(auditable.CreatedBy))  // Check for empty string
                    {
                        auditable.CreatedBy = currentUser;
                    }
                    if (string.IsNullOrWhiteSpace(auditable.ModifiedBy))
                    {
                        auditable.ModifiedBy = currentUser;
                    }
                }
                if (entry.State == EntityState.Modified)
                {
                    auditable.ModifyDate = DateTime.UtcNow;
                    if (string.IsNullOrWhiteSpace(auditable.ModifiedBy))
                    {
                        auditable.ModifiedBy = currentUser;
                    }
                }
            }
            // IModifiableEntity: Set CreateDate + ModifyDate (no user tracking)
            else if (entry.Entity is IModifiableEntity modifiable)
            {
                if (entry.State == EntityState.Added)
                {
                    if (modifiable.CreateDate == default)
                    {
                        modifiable.CreateDate = DateTime.UtcNow;
                    }
                }
                if (entry.State == EntityState.Modified)
                {
                    modifiable.ModifyDate = DateTime.UtcNow;
                }
            }
            // ICreatableEntity: Set CreateDate only (no modify, no user tracking)
            else if (entry.Entity is ICreatableEntity creatable)
            {
                if (entry.State == EntityState.Added && creatable.CreateDate == default)
                {
                    creatable.CreateDate = DateTime.UtcNow;
                }
            }
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
```

**File**: `SeventySix/Shared/Interfaces/IUserContextAccessor.cs`

```csharp
namespace SeventySix.Shared;

/// <summary>
/// Provides access to the current user context for audit tracking.
/// </summary>
public interface IUserContextAccessor
{
    /// <summary>
    /// Gets the current user identifier for audit purposes.
    /// </summary>
    /// <returns>User identifier (username, email, or "System").</returns>
    string GetCurrentUser();
}
```

**File**: `SeventySix/Shared/Infrastructure/UserContextAccessor.cs`

```csharp
namespace SeventySix.Shared.Infrastructure;

/// <summary>
/// Stub implementation of user context accessor.
/// </summary>
/// <remarks>
/// TODO: Implement authentication integration to retrieve actual user from HttpContext.
/// Requires JWT/OAuth middleware configuration and claims parsing.
/// </remarks>
public class UserContextAccessor : IUserContextAccessor
{
    /// <summary>
    /// Gets the current user identifier.
    /// </summary>
    /// <returns>Always returns "System" until authentication is implemented.</returns>
    public string GetCurrentUser()
    {
        // TODO: Replace with actual user retrieval from HttpContext or authentication context
        // Example: httpContextAccessor.HttpContext?.User?.Identity?.Name ?? "System"
        return "System";
    }
}
```

**CLAUDE.md Compliance**:

-   ✅ No `var` keyword - explicit types: `IEnumerable<EntityEntry>`, `EntityEntry`, `DateTime`, `string`
-   ✅ Async suffix: `SavingChangesAsync` (not `SavingChanges`)
-   ✅ Primary Constructor: `AuditInterceptor(IUserContextAccessor userContextAccessor)`
-   ✅ Explicit type declarations throughout
-   ✅ Null checking for `eventData.Context`
-   ✅ Dependency injection for `IUserContextAccessor`

**Testing**:

-   Unit test with InMemory DbContext verifying timestamps set correctly
-   Unit test verifying `UserContextAccessor.GetCurrentUser()` returns "System"
-   Integration test confirming CreatedBy/ModifiedBy use stub value

---

### ✅ Phase 3: Update Entity Implementations (45 LOC changes) - COMPLETE

**Status**: All entities updated, DTOs marked with `required`, database configurations updated, production code builds successfully ✅

**User** → Implements `IAuditableEntity`: ✅

-   Properties: `DateTime CreateDate`, `string CreatedBy = string.Empty`, `DateTime? ModifyDate`, `string ModifiedBy = string.Empty`
-   Database: `.IsRequired()` with `.HasDefaultValue("System")` for CreatedBy/ModifiedBy
-   DTO: `required string CreatedBy`, `required string ModifiedBy`

**ThirdPartyApiRequest** → Implements `IModifiableEntity`: ✅

-   Properties: `DateTime CreateDate`, `DateTime? ModifyDate`
-   Database: `.IsRequired()` for CreateDate
-   Removed: Manual timestamp setting from UpdateAsync

**Log** → Implements `ICreatableEntity`: ✅

-   Property: `DateTime CreateDate` (already non-nullable)
-   Database: CreateDate configuration updated

**Files Modified** (24 total):

-   ✅ Entity classes (User, ThirdPartyApiRequest, Log)
-   ✅ DTOs (UserDto with `required` modifier)
-   ✅ EF Core configurations (UserConfiguration, ThirdPartyApiRequestConfiguration, LogConfiguration)
-   ✅ Extension classes (UserExtensions, LogExtensions)
-   ✅ Repository classes (UserRepository, LogRepository, ThirdPartyApiRequestRepository)
-   ✅ Service classes (UserService, LogService)
-   ✅ Test builders (UserBuilder, LogBuilder, ThirdPartyApiRequestBuilder)
-   ✅ Test files (UserTests, UserServiceTests, UserExtensionsTests, LogRepositoryTests, etc.)
-   ✅ DatabaseLogSink

**Build Status**: ✅ Production code compiles successfully, all tests compile

**CLAUDE.md Compliance**:

-   ✅ Explicit types (DateTime?, string?)
-   ✅ Required modifier for non-nullable reference types
-   ✅ XML documentation updated with new property names

---

### ⏸️ Phase 4: Register Interceptor in DbContexts (12 LOC) - BLOCKED

**BLOCKER**: Need to fix compiler warnings first:

1. `UserService.cs(38,23)`: Parameter 'logger' is unread
2. `ThirdPartyApiRequestRepository.cs` (4 locations): Primary constructor parameter 'logger' shadowed by base
3. `MetricsService.cs(39,21)`: Field 'ActiveDbConnections' never assigned

**CRITICAL DECISION NEEDED**: Transaction Manager architecture issue discovered - see `implementation-Transaction-Manager.md`

### Phase 4: Register Interceptor in DbContexts (12 LOC) - PENDING

**Recommended Approach**: Register interceptor globally in `Program.cs`:

```csharp
// Register UserContextAccessor as scoped (TODO: Update when authentication added)
builder.Services.AddScoped<IUserContextAccessor, UserContextAccessor>();

// Register AuditInterceptor as scoped (requires IUserContextAccessor)
builder.Services.AddScoped<AuditInterceptor>();

// Add to all DbContexts
builder.Services.AddDbContext<IdentityDbContext>((serviceProvider, options) =>
{
    string connectionString = builder.Configuration.GetConnectionString("IdentityDb")!;
    AuditInterceptor auditInterceptor = serviceProvider.GetRequiredService<AuditInterceptor>();
    options.UseNpgsql(connectionString);
    options.AddInterceptors(auditInterceptor);
});
```

**CLAUDE.md Compliance**:

-   ✅ No `var` keyword: explicit `string`, `AuditInterceptor` types
-   ✅ Interceptor registered as scoped (proper DI lifetime for per-request context)
-   ✅ No inline `new AuditInterceptor()` (use DI container)
-   ✅ UserContextAccessor registered with interface

**Decision**: Use DI registration for testability and proper lifetime management

---

### Phase 5: Update Repositories (30 LOC reduction)

**UserRepository** changes:

-   Remove: Manual `entity.ModifiedAt = DateTime.UtcNow` in UpdateAsync
-   Remove: Manual `entity.ModifiedBy = "System"` logic
-   Interceptor handles automatically

**ThirdPartyApiRequestRepository** changes:

-   Remove: `entity.ModifiedAt = DateTime.UtcNow` from UpdateAsync override
-   Keep: Domain logic in `IncrementCallCount()` but remove timestamp setting

**LogRepository** (if exists):

-   No changes needed: `CreateDate` auto-set by interceptor
-   Update metrics queries: Use `CreateDate` instead of `Timestamp`

**CLAUDE.md Compliance**:

-   ✅ Async suffix retained
-   ✅ Explicit types in method signatures

---

### Phase 6: Update Service Layer (25 LOC reduction)

**UserService** changes:

-   Remove: `newUser.CreatedAt = DateTime.UtcNow` in CreateAsync
-   Remove: `newUser.CreatedBy = "System"` logic
-   Interceptor handles automatically

**ThirdPartyApiRequestService** changes:

-   Remove: Timestamp management from tracking logic
-   Keep: Business logic (CallCount, LastCalledAt)

**CLAUDE.md Compliance**:

-   ✅ No manual timestamp code
-   ✅ Cleaner service methods focused on business logic

---

### Phase 7: Remove RowVersion from DTOs (10 LOC reduction)

**Purpose**: Prevent RowVersion exposure to client - internal optimistic concurrency only

**UserDto** changes:

-   Remove: `RowVersion` property (optimistic concurrency is server-side only)
-   Keep: All other properties (Id, Username, Email, audit fields)
-   Benefit: Cleaner API contract, no leaking EF Core implementation details

**Mapping Extensions** changes:

-   Update: `ToDto()` methods to exclude RowVersion mapping
-   Entity → DTO: Do NOT map `entity.RowVersion` to DTO
-   DTO → Entity: RowVersion managed by EF Core/PostgreSQL (xmin column)

**API Contract Impact**:

-   Client never receives RowVersion in responses
-   Client never sends RowVersion in requests
-   Concurrency conflicts handled server-side with proper error responses

**CLAUDE.md Compliance**:

-   ✅ No client-side RowVersion references
-   ✅ Cleaner separation of concerns (concurrency = infrastructure concern)
-   ✅ DTOs remain pure data contracts without EF Core coupling

**Testing**:

-   Verify UserDto JSON serialization excludes RowVersion
-   Verify API responses do not contain RowVersion field
-   Verify concurrency tests still work with server-side RowVersion handling

---

### Phase 8: Migration & Database Updates (EF Core)

**Migration**: Add new columns, rename existing:

```bash
dotnet ef migrations add StandardizeAuditProperties --project SeventySix
```

**Expected Changes**:

-   User: Rename columns `created_at` → `create_date`, `modified_at` → `modify_date`
-   ThirdPartyApiRequest: Rename columns `created_at` → `create_date`, `modified_at` → `modify_date`
-   Log: Rename column `timestamp` → `create_date` (single source of truth)

**Data Migration**: Data preserved during column rename, no backfill needed

---

### Phase 9: Update Tests (20 LOC)

**BaseRepositoryTests**:

-   Verify interceptor sets CreateDate on insert
-   Verify interceptor sets ModifyDate on update
-   Verify CreatedBy defaults to "System"

**UserServiceTests**:

-   Remove assertions checking manual timestamp setting
-   Add assertions verifying interceptor-set values
-   Verify CreatedBy/ModifiedBy use "System" from UserContextAccessor stub
-   **Remove**: RowVersion assertions from test data builders and service tests

**Integration Tests**:

-   Verify database columns updated correctly
-   Verify existing data migrated

**Client-Side Tests (Angular)**:

-   Update User DTOs to use `createDate`, `modifyDate` property names (PascalCase from backend)
-   **Remove**: Any RowVersion references from TypeScript interfaces/models
-   Update test mocks to include audit properties with "System" values
-   Run via terminal: `npm test` (headless, no-watch per CLAUDE.md)
-   Verify API integration tests handle renamed properties
-   Verify no client code expects or uses RowVersion

---

## 📊 Impact Summary

| Metric                    | Before  | After | Delta       |
| ------------------------- | ------- | ----- | ----------- |
| **Audit Interfaces**      | 0       | 4     | +4          |
| **Interceptor LOC**       | 0       | 40    | +40         |
| **Manual Timestamp Code** | ~75 LOC | 0     | **-75 LOC** |
| **Repository Complexity** | High    | Low   | **-30 LOC** |
| **Service Complexity**    | Medium  | Low   | **-25 LOC** |
| **DTO Complexity**        | Medium  | Low   | **-10 LOC** |
| **Total LOC Change**      | —       | —     | **-60 LOC** |

**Pattern Benefits**:

-   ✅ **DRY**: Single interceptor vs. scattered timestamp logic
-   ✅ **KISS**: Entities declare audit level via interface, interceptor handles rest
-   ✅ **YAGNI**: Entities without audit needs implement `IEntity` only
-   ✅ **SRP**: Repositories/Services no longer responsible for audit timestamps
-   ✅ **Information Hiding**: RowVersion never exposed to client (EF Core concurrency = internal concern)

---

## ✅ Acceptance Criteria

### Functional Requirements:

1. **User entities**: Auto-populate CreateDate, CreatedBy ("System"), ModifyDate, ModifiedBy ("System")
2. **ThirdPartyApiRequest entities**: Auto-populate CreateDate, ModifyDate (no user tracking)
3. **Log entities**: Auto-populate CreateDate with NOW() if not set (non-nullable, always has value)
4. **Only Users** have CreatedBy/ModifiedBy - other entities do NOT have these properties
5. All timestamps use UTC (DateTime.UtcNow)

### Non-Functional Requirements:

1. All existing tests pass after migration
2. No manual timestamp management in repositories/services
3. Database migration renames columns (data preserved)
4. CLAUDE.md compliance: no `var`, explicit types, async suffix, primary constructors

### Future Extensibility:

1. New entities choose audit level via interface (IAuditable/IModifiable/ICreatable/IEntity)
2. Custom interceptor logic can add IP tracking, user context, etc.
3. Metrics queries use `CreateDate` directly (KISS - no separate Timestamp property)

---

## 🧪 Testing Strategy

**Unit Tests**:

-   AuditInterceptor: Verify timestamp/user setting for each interface
-   Entities: Verify interface implementation compiles
-   Repositories: Verify no manual timestamp logic remains

**Integration Tests**:

-   DbContext: SaveChanges triggers interceptor correctly
-   Database: Columns renamed and data preserved
-   API: End-to-end entity creation/update preserves audit data

**Test Execution (CLAUDE.md)**:

-   **Server tests (.NET)**: Use `runTests` tool or `dotnet test --no-build`
-   **Client tests (Angular)**: Run via terminal with `npm test` (headless, no-watch)
-   **CRITICAL**: Ensure Docker Desktop running before server tests (Testcontainers dependency)

**Manual Testing**:

-   Create User → Verify CreateDate, CreatedBy auto-set
-   Update User → Verify ModifyDate, ModifiedBy auto-set
-   Create Log → Verify CreateDate auto-set
-   Metrics Dashboard → Verify queries using CreateDate work correctly

---

## 🚀 Rollout Plan

**Sequence**:

1. Create interfaces (no breaking changes)
2. Create interceptor with UserContextAccessor stub (no breaking changes)
3. Update entities (breaking: property renames)
4. **Remove RowVersion from DTOs** (breaking: API contract change)
5. Generate migration (breaking: schema changes)
6. Update repositories/services (breaking: remove manual code)
7. Run tests → Fix failures
8. Apply migration → Data preserved
9. Deploy

**Rollback**: Revert migration, restore old property names if needed

---

## 📝 Notes

-   **Log.CreateDate for Metrics**: Metrics queries simply use `CreateDate` directly. No need for separate `Timestamp` property - simpler is better (KISS principle).
-   **Observability Impact**: No changes needed for Prometheus, Grafana, or Jaeger. MetricsService uses OpenTelemetry instrumentation (histograms, counters, gauges) which track API/DB operations, not entity timestamps. Log queries in LogRepository use `Timestamp` property which will be renamed to `CreateDate` - tests will need corresponding updates.
-   **User Context (Current Implementation)**: `UserContextAccessor` returns "System" stub for all operations. TODO comment added for future authentication integration (JWT claims, HttpContext.User). When authentication is implemented, update `UserContextAccessor` to parse user identity from authenticated requests.
-   **RowVersion Usage**: RowVersion (PostgreSQL xmin) is used exclusively for optimistic concurrency control in EF Core. It's an infrastructure concern handled server-side via `DbUpdateConcurrencyException`. Never expose to client - DTOs should not include RowVersion property. Client receives proper HTTP 409 Conflict responses when concurrent updates detected.
-   **Client-Side Updates**: Angular DTOs and tests will need updates for renamed properties (`createDate`, `modifyDate`, `createdBy`, `modifiedBy`). Remove any RowVersion references from TypeScript interfaces. Client tests run via `npm test` per CLAUDE.md guidelines.
-   **Performance**: Interceptor runs on every SaveChanges, negligible overhead for typical workloads
-   **Alternative**: Could use EF Core Value Converters, but interceptors are more explicit and testable

