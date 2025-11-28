# Server-Side Rules Audit & Violations

> **Generated**: 2025-11-27
> **Scope**: SeventySix.Server - .NET 10+ Backend

---

## Executive Summary

The .NET server codebase is **largely compliant** with the established rules. Key areas:

-   ✅ **No `var` keyword**: Explicit types used throughout
-   ✅ **Primary Constructors**: Most services/repositories use C# 12+ syntax
-   ✅ **Async Suffix**: All async methods properly suffixed with `Async`
-   ✅ **Records for DTOs**: Proper use of records for request/response types
-   ✅ **Fluent API for EF Core**: No data annotations on entities
-   ✅ **AsNoTracking**: Used for read-only queries
-   ✅ **Domain-specific Repositories**: No generic `IRepository<T>` pattern
-   ⚠️ **Collection Expressions**: Some legacy `new Dictionary<>` patterns remain
-   ⚠️ **Null Checks**: Some `ArgumentNullException.ThrowIfNull` usage (debatable)

---

## Phase 1: Critical Violations (High Priority)

### 1.1 Legacy Collection Initialization

**Rule Violated**: "ALWAYS use collection expressions: `List<string> names = ["Alice", "Bob"];`"

**Files with `new Dictionary<>` or `new List<>` patterns**:

| File                                                                              | Line       | Current                                   | Should Be              |
| --------------------------------------------------------------------------------- | ---------- | ----------------------------------------- | ---------------------- |
| `Tests/SeventySix.Tests/Infrastructure/DTOs/HealthStatusResponseTests.cs`         | 100        | `new Dictionary<string, ApiHealthStatus>` | Collection expression  |
| `Tests/SeventySix.Tests/Logging/DTOs/ClientLogRequestTests.cs`                    | 143, 236   | `new Dictionary<string, object>`          | Collection expression  |
| `Tests/SeventySix.Tests/ApiTracking/Services/ThirdPartyApiRequestServiceTests.cs` | 71, 131    | `.ReturnsAsync(new List<...>())`          | `.ReturnsAsync([])`    |
| `SeventySix.Api/Program.cs`                                                       | 125        | `new Dictionary<string, object>`          | Collection expression  |
| `SeventySix.Api/HealthChecks/JaegerHealthCheck.cs`                                | 54, 66, 77 | `new Dictionary<string, object>`          | Collection expression  |
| `Tests/SeventySix.Api.Tests/Controllers/ThirdPartyApiRequestControllerTests.cs`   | 70, 89, 94 | `new List<>`, `new Dictionary<>`          | Collection expressions |
| `Tests/SeventySix.Api.Tests/Controllers/HealthControllerTests.cs`                 | 43         | `new Dictionary<string, ApiHealthStatus>` | Collection expression  |

**Fix Pattern**:

```csharp
// ❌ Current
Apis = new Dictionary<string, ApiHealthStatus>
{
    { "ExternalAPI", new ApiHealthStatus { ... } }
}

// ✅ Fixed (C# 12+ collection expressions don't work directly for Dictionary initialization with values)
// For empty collections:
List<ThirdPartyApiRequestResponse> empty = [];

// For Dictionary with values, current syntax is acceptable
// as collection expressions for Dictionary<K,V> with initializers
// aren't supported in C# 12
```

**Note**: Collection expressions (`[]`) work for arrays, lists, and empty collections. For `Dictionary<K,V>` with inline values, the current syntax is correct. Focus on:

-   `new List<T>()` → `[]`
-   `new List<T> { items }` → `[items]`
-   Empty `new Dictionary<K,V>()` → Consider if needed

---

### 1.2 ArgumentNullException.ThrowIfNull Usage

**Rule**: "NEVER excessive null checks - no `?? throw new ArgumentNullException`"

**Analysis**: The rule prohibits `?? throw new ArgumentNullException(nameof(x))` inline pattern. However, `ArgumentNullException.ThrowIfNull()` is different - it's a guard clause pattern.

**Current Usage** (22+ occurrences found):

-   `SeventySix.Api/Logging/DatabaseLogSink.cs:73`
-   `SeventySix/Shared/Infrastructure/BaseRepository.cs:138, 172`
-   `SeventySix/Shared/Services/BaseService.cs:34, 71, 88`
-   `SeventySix/Logging/Repositories/LogRepository.cs:51, 74, 189`
-   `SeventySix/Identity/Repositories/UserRepository.cs:65, 76`
-   Multiple other locations

**Verdict**: This is a **gray area**. The rule specifically says:

> "NEVER `?? throw new ArgumentNullException`"

`ArgumentNullException.ThrowIfNull()` is arguably different - it's a modern .NET guard clause.

**Recommendation**:

-   **Keep** for public API boundaries (controllers, public service methods)
-   **Remove** from internal methods where DI guarantees non-null

---

## Phase 2: Code Quality Improvements (Medium Priority)

### 2.1 `var` Usage in Comments/Documentation

**Note**: The grep found `var` only in XML documentation comments (examples), NOT in actual code:

```csharp
// These are in XML doc comments - NOT violations:
/// var user = await _repository.GetByIdAsync(id, cancellationToken);
```

**Verdict**: ✅ No actual `var` violations in production code.

---

### 2.2 Verify Primary Constructor Usage

**Classes using Primary Constructors** ✅:

-   `UserService(IUserRepository repo, ...)`
-   `UserRepository(IdentityDbContext context, ...)`
-   `LogRepository(LoggingDbContext context, ...)`
-   `HealthCheckService(IMetricsService metricsService, ...)`
-   `JaegerHealthCheck(IConfiguration configuration, ...)`
-   `ThirdPartyApiRequestService(IThirdPartyApiRequestRepository repository)`
-   `AuditInterceptor(IUserContextAccessor userContextAccessor)`

**Verdict**: ✅ Primary constructors properly used.

---

### 2.3 Test Method Naming Convention

**Rule**: "Pattern: `MethodName_ExpectedBehavior_WhenConditionAsync`"

**Verified Compliant** ✅:

-   `GetByIdAsync_ReturnsUser_WhenExistsAsync()`
-   `CreateAsync_ThrowsValidationException_WhenInvalidAsync()`
-   `ExecuteInTransactionAsync_WithSuccessfulOperation_CommitsTransactionAsync()`

All test methods follow the convention.

---

## Phase 3: Documentation & Consistency (Low Priority)

### 3.1 Files Following All Rules ✅

Excellent compliance demonstrated in:

-   `SeventySix/Identity/Services/UserService.cs` - Perfect primary constructor usage
-   `SeventySix/Identity/Repositories/UserRepository.cs` - Domain-specific repository
-   `SeventySix/Logging/Configurations/LogConfiguration.cs` - Fluent API, no annotations
-   `SeventySix/Identity/Configurations/UserConfiguration.cs` - Fluent API, no annotations
-   All controllers use primary constructors
-   All DTOs are records

### 3.2 EF Core Configuration Verified ✅

-   No `[Table]`, `[Column]`, `[Index]` attributes on entities
-   All configuration via `IEntityTypeConfiguration<T>` + Fluent API
-   `AsNoTracking()` used in read operations

---

## Violations Summary

| Category                                   | Count | Priority | Effort |
| ------------------------------------------ | ----- | -------- | ------ |
| Legacy `new List<>()` patterns             | ~5-8  | High     | Low    |
| `new Dictionary<>` (acceptable for init)   | ~10   | N/A      | N/A    |
| ArgumentNullException.ThrowIfNull (review) | ~22   | Low      | Medium |

---

## Recommended Fix Order

1. **Batch 1** (30 min): Convert `new List<T>()` to `[]` in test files
2. **Batch 2** (30 min): Convert `new List<T>()` to `[]` in production code
3. **Batch 3** (Optional): Review ArgumentNullException.ThrowIfNull usage

---

## Files Requiring No Changes ✅

The following areas are fully compliant:

-   No `var` keyword usage in actual code
-   All async methods have `Async` suffix
-   All DTOs are records
-   All EF configurations use Fluent API
-   All repositories are domain-specific (no generic pattern)
-   Primary constructors used for DI
-   Options pattern for configuration
-   Test naming conventions followed

---

## Architecture Compliance ✅

| Aspect                         | Status | Notes                                                     |
| ------------------------------ | ------ | --------------------------------------------------------- |
| Bounded Contexts               | ✅     | Identity, Logging, ApiTracking separated                  |
| Separate DbContext per context | ✅     | IdentityDbContext, LoggingDbContext, ApiTrackingDbContext |
| Domain-specific repositories   | ✅     | UserRepository, LogRepository, etc.                       |
| No generic repository          | ✅     | No `IRepository<T>` found                                 |
| Fluent API only                | ✅     | No data annotations on entities                           |
| PostgreSQL                     | ✅     | All contexts use PostgreSQL                               |
| Options pattern                | ✅     | Used for configuration                                    |
