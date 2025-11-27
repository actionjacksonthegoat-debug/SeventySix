# Code Consolidation & Pattern Implementation Plan

## 🎯 Objective

Identify and eliminate code duplication across SeventySix.Server boundary contexts (Identity, Logging, ApiTracking) by extracting common patterns into shared abstractions. Focus on KISS, DRY, and YAGNI principles.

---

## 🔍 Analysis Summary

After analyzing the codebase, I've identified **3 areas of inconsistent implementation** and **3 opportunities for code reduction** across boundary contexts.

---

## 📋 Part 1: Inconsistent Code Setups (One-Off Work)

### 1. **DbContext Configuration Pattern** ❌ INCONSISTENT

**Problem**: Each boundary context has nearly identical `OnModelCreating` logic with only schema name differing.

**Current State**:

-   `IdentityDbContext`: Uses `HasDefaultSchema("Identity")` + namespace filtering
-   `LoggingDbContext`: Uses `HasDefaultSchema("Logging")` + namespace filtering
-   `ApiTrackingDbContext`: Uses `HasDefaultSchema("ApiTracking")` + namespace filtering
-   **97 lines of duplicated code** across 3 DbContexts

**Solution**: Create `BaseDbContext<T>` with Template Method pattern.

**Files to Create**:

```
SeventySix.Server/SeventySix/Shared/Infrastructure/BaseDbContext.cs
```

**Files to Modify**:

```
SeventySix.Server/SeventySix/Identity/Infrastructure/IdentityDbContext.cs
SeventySix.Server/SeventySix/Logging/Infrastructure/LoggingDbContext.cs
SeventySix.Server/SeventySix/ApiTracking/Infrastructure/ApiTrackingDbContext.cs
```

**Benefits**:

-   **-60 lines** of duplicated configuration
-   Single source of truth for schema configuration
-   Consistent bounded context isolation

---

### 2. **Service Registration Extensions** ❌ INCONSISTENT

**Problem**: Each bounded context has nearly identical dependency injection setup with only types differing.

**Current State**:

-   `IdentityExtensions.AddIdentityDomain()`: 15 lines
-   `LoggingExtensions.AddLoggingDomain()`: 12 lines
-   `ApiTrackingExtensions.AddApiTrackingDomain()`: 10 lines
-   **Identical patterns**: `AddDbContext`, `AddScoped<Repository>`, `AddScoped<Service>`, `AddSingleton<Validator>`

**Solution**: Extract common registration logic into `BoundedContextExtensions` with convention-based discovery.

**Files to Create**:

```
SeventySix.Server/SeventySix/Shared/Extensions/BoundedContextExtensions.cs
```

**Files to Modify**:

```
SeventySix.Server/SeventySix/Extensions/IdentityExtensions.cs
SeventySix.Server/SeventySix/Extensions/LoggingExtensions.cs
SeventySix.Server/SeventySix/Extensions/ApiTrackingExtensions.cs
```

**Benefits**:

-   **-25 lines** of registration boilerplate
-   Convention over configuration for DI
-   Easier to add new bounded contexts

---

### 3. **Repository Update Pattern** ❌ INCONSISTENT

**Problem**: Update logic varies across repositories despite identical concurrency/tracking concerns.

**Current State**:

-   `UserRepository.UpdateAsync()`: Manual tracking check + `SetValues` (18 lines)
-   `ThirdPartyApiRequestRepository.UpdateAsync()`: Manual tracking check + custom timestamp (15 lines)
-   `LogRepository`: No update method (relies on base `CreateAsync`)
-   **Inconsistent approaches** to entity tracking and timestamp management

**Solution**: Standardize update logic in `BaseRepository<T>` with Template Method.

**Files to Create**:

```
None (extend existing BaseRepository)
```

**Files to Modify**:

```
SeventySix.Server/SeventySix/Shared/Infrastructure/BaseRepository.cs
SeventySix.Server/SeventySix/Identity/Repositories/UserRepository.cs
SeventySix.Server/SeventySix/ApiTracking/Repositories/ThirdPartyApiRequestRepository.cs
```

**Benefits**:

-   **-30 lines** of duplicated tracking logic
-   Consistent concurrency handling
-   Automatic timestamp management

---

## 📋 Part 2: Code Reduction Opportunities

### 4. **Validator Base Class Consolidation** 🔧 REDUCE

**Problem**: Common validation rules (pagination, search term, date range) duplicated across validators.

**Current State**:

-   `BaseQueryValidator<TRequest, TEntity>`: 140 lines defining common rules
-   Used by `LogFilterRequestValidator` (adds 10 lines for LogLevel)
-   **NOT used by `UserQueryValidator`** - reinvents 25 lines of pagination/sorting validation

**Solution**: Make `UserQueryValidator` inherit from `BaseQueryValidator<UserQueryRequest, User>`.

**Files to Modify**:

```
SeventySix.Server/SeventySix/Identity/Validators/UserQueryValidator.cs
```

**Benefits**:

-   **-20 lines** of duplicated validation
-   Consistent validation behavior
-   Automatic reflection-based SortBy validation

---

### 5. **Entity Configuration Pattern** 🔧 REDUCE

**Problem**: Entity configurations have similar structure (indexes, constraints, required fields) but implemented manually.

**Current State**:

-   `UserConfiguration`: 60 lines (indexes on Username, Email, IsDeleted, CreatedAt)
-   `LogConfiguration`: 55 lines (indexes on Timestamp, LogLevel, SourceContext)
-   `ThirdPartyApiRequestConfiguration`: 50 lines (composite index, required fields)
-   **Common patterns**: Required string fields, CreatedAt/ModifiedAt timestamps, indexes

**Solution**: Create `BaseEntityConfiguration<T>` with fluent builder for common patterns.

**Files to Create**:

```
SeventySix.Server/SeventySix/Shared/Infrastructure/BaseEntityConfiguration.cs
```

**Files to Modify**:

```
SeventySix.Server/SeventySix/Identity/Configurations/UserConfiguration.cs
SeventySix.Server/SeventySix/Logging/Configurations/LogConfiguration.cs
SeventySix.Server/SeventySix/ApiTracking/Configurations/ThirdPartyApiRequestConfiguration.cs
```

**Benefits**:

-   **-40 lines** of configuration boilerplate
-   Consistent field constraints (MaxLength, Required)
-   Convention-based index creation

---

### 6. **DTO Response Mapping** 🔧 REDUCE

**Problem**: Manual entity-to-DTO mapping scattered across services with Select statements.

**Current State**:

-   Each service method manually maps entities to DTOs using LINQ `Select`
-   No shared mapping logic for common fields (Id, CreatedAt, ModifiedAt)
-   **75+ lines** of repetitive Select projection code

**Solution**: Extract mapping extensions to `Shared/Extensions/MappingExtensions.cs` (already exists but underutilized).

**Files to Create**:

```
None (extend existing MappingExtensions.cs)
```

**Files to Modify**:

```
SeventySix.Server/SeventySix/Shared/Extensions/MappingExtensions.cs
SeventySix.Server/SeventySix/Identity/Services/UserService.cs
SeventySix.Server/SeventySix/Logging/Services/LogService.cs
SeventySix.Server/SeventySix/ApiTracking/Services/ThirdPartyApiRequestService.cs
```

**Benefits**:

-   **-50 lines** of mapping code
-   Consistent DTO projection
-   Centralized mapping logic

---

## 🎨 Design Patterns Applied

### **Template Method Pattern** 🏗️

-   **Where**: `BaseDbContext`, `BaseRepository`, `BaseEntityConfiguration`
-   **What Changes**: Schema name, entity type, specific validations
-   **What Stays Same**: Configuration flow, error handling, registration pattern

### **Strategy Pattern** 🎯

-   **Where**: Validator inheritance, bulk operation actions
-   **What Changes**: Validation rules per domain, update actions
-   **What Stays Same**: Validation framework, bulk execution logic

### **Builder Pattern** 🔨

-   **Where**: `QueryBuilder`, `BaseEntityConfiguration` (new)
-   **What Changes**: Filter conditions, field configurations
-   **What Stays Same**: Fluent API structure, chaining behavior

### **Convention Over Configuration** 📜

-   **Where**: Service registration, SortBy validation, entity mapping
-   **What Changes**: Entity/service types
-   **What Stays Same**: Naming conventions, registration flow

---

## 📊 Impact Summary

| Area                    | Lines Reduced | Files Modified | Pattern Applied    |
| ----------------------- | ------------- | -------------- | ------------------ |
| DbContext Configuration | -60           | 4              | Template Method    |
| Service Registration    | -25           | 4              | Convention-based   |
| Repository Updates      | -30           | 3              | Template Method    |
| Validator Inheritance   | -20           | 1              | Strategy           |
| Entity Configuration    | -40           | 4              | Builder + Template |
| DTO Mapping             | -50           | 4              | Extension Methods  |
| **TOTAL**               | **-225**      | **20**         | **6 patterns**     |

---

## 🚀 Implementation Order

### **Phase 1: Foundation** (Low Risk)

1. ✅ Create `BaseDbContext<T>` (new abstraction, no breaking changes)
2. ✅ Extend `MappingExtensions.cs` (pure addition)
3. ✅ Update `BaseRepository<T>` with `UpdateAsync` (template method)

### **Phase 2: Boundary Contexts** (Medium Risk)

4. ✅ Migrate DbContexts to inherit from `BaseDbContext<T>`
5. ✅ Update repositories to use `BaseRepository.UpdateAsync`
6. ✅ Update services to use mapping extensions

### **Phase 3: Configuration** (Low Risk)

7. ✅ Create `BaseEntityConfiguration<T>`
8. ✅ Refactor entity configurations to use base
9. ✅ Fix `UserQueryValidator` to inherit from `BaseQueryValidator`

### **Phase 4: Registration** (Low Risk)

10. ✅ Create `BoundedContextExtensions` helper
11. ✅ Simplify domain extension methods

---

## ✅ Acceptance Criteria

### **For Each Change**:

-   [ ] All existing tests pass (use `dotnet test --no-build`)
-   [ ] No breaking changes to public APIs
-   [ ] XML documentation updated
-   [ ] Follows `.editorconfig` rules (no `var`, explicit types, PascalCase fields)
-   [ ] Uses Primary Constructors where applicable
-   [ ] Adheres to SOLID principles (SRP, DIP, OCP)

### **Code Quality**:

-   [ ] No hardcoded values (use configuration)
-   [ ] Async methods end with `Async` suffix (including test methods)
-   [ ] No excessive null checking (`?? throw`)
-   [ ] Uses Collection Expressions `[1, 2, 3]` instead of `new[]`
-   [ ] All server dependencies use Primary Constructors (parameters ARE fields)
-   [ ] **NEVER use `var` keyword** - explicit types only (`string x = ""` not `var x = ""`)
-   [ ] PascalCase for public members, fields in C# (per `.editorconfig`)
-   [ ] All code follows `.editorconfig` formatting (tabs, CRLF, braces on new lines for C#)

### **Testing**:

-   [ ] Client tests run headless: `npm test` (automatic no-watch, ChromeHeadless)
-   [ ] Server tests: Docker Desktop running before `dotnet test --no-build`
-   [ ] **CRITICAL**: No test skipping - fix failures immediately, never defer
-   [ ] All tests pass before moving to next implementation phase

---

## 📝 Implementation Notes

### **CRITICAL C# Coding Standards** (from CLAUDE.md):

1. **NEVER use `var` keyword** - ALWAYS use explicit type declarations

    - ✅ Correct: `string connectionString = "...";`
    - ❌ Wrong: `var connectionString = "...";`

2. **ALWAYS use Primary Constructors** (C# 12+) - parameters ARE the fields

    - ✅ Correct: `public class UserService(IUserRepository repository, ILogger<UserService> logger)`
    - ❌ Wrong: Creating separate `private readonly` field assignments
    - Constructor parameters are directly accessible in code - they ARE the fields

3. **NEVER use excessive null checking** - avoid `?? throw new ArgumentNullException`

    - Let null references fail naturally
    - Only use `ArgumentNullException.ThrowIfNull()` when explicitly validating input

4. **ALWAYS suffix async methods with 'Async'** - including test methods

    - ✅ Correct: `public async Task UpdateUserAsync()`
    - ✅ Correct: `public async Task GetUser_ReturnsUser_WhenValidAsync()`
    - ❌ Wrong: `public async Task UpdateUser()`

5. **ALWAYS use Collection Expressions** (C# 12+)

    - ✅ Correct: `int[] numbers = [1, 2, 3];`
    - ✅ Correct: `List<string> names = ["Alice", "Bob"];`
    - ❌ Wrong: `new int[] { 1, 2, 3 }` or `new List<string> { "Alice", "Bob" }`

6. **ALWAYS use explicit type annotations** on all variables, properties, parameters

    - ✅ Correct: `const int maxRetries: number = 3;` (TypeScript)
    - ✅ Correct: `int maxRetries = 3;` (C#)
    - ❌ Wrong: Relying on type inference

7. **NEVER hardcode configurable values** - use appsettings.json or environment.ts
    - ✅ Use configuration for: timeouts, intervals, limits, URLs, feature flags
    - ❌ No magic numbers for refresh intervals, page sizes, retry counts

### **Variable Naming Standards** (from `.editorconfig`):

**C# Naming Conventions**:

-   **Public members**: PascalCase (`UserRepository`, `GetByIdAsync`)
-   **Private fields**: PascalCase with NO underscore prefix (`Repository`, `Logger`)
    -   Note: Primary constructors eliminate most field declarations
-   **Parameters**: camelCase (`connectionString`, `userId`)
-   **Local variables**: camelCase (`userList`, `totalCount`)
-   **Interfaces**: PascalCase with `I` prefix (`IUserRepository`, `ILogService`)
-   **Async methods**: PascalCase ending with `Async` (`CreateUserAsync`, `UpdateAsync`)

**TypeScript Naming Conventions**:

-   **Classes/Interfaces**: PascalCase (`UserService`, `LogEntry`)
-   **Variables/Parameters**: camelCase (`userName`, `logLevel`)
-   **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_PAGE_SIZE`)
-   **Private members**: camelCase (no underscore prefix in Angular)
-   **Signals**: camelCase (`isLoading`, `userCount`)

**Examples**:

```csharp
// ✅ CORRECT - C# with Primary Constructor
public class UserService(IUserRepository repository, ILogger<UserService> logger)
{
    // No field declarations needed - 'repository' and 'logger' ARE the fields

    public async Task<User> GetUserAsync(int userId)
    {
        string logMessage = $"Fetching user {userId}";
        logger.LogInformation(logMessage);
        return await repository.GetByIdAsync(userId);
    }
}

// ❌ WRONG - var keyword, separate fields, no Async suffix
public class UserService
{
    private readonly IUserRepository _repository;

    public UserService(IUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<User> GetUser(int id)  // Missing Async suffix
    {
        var message = "Fetching";  // var keyword
        return await _repository.GetByIdAsync(id);
    }
}
```

### **Testing Standards** (from CLAUDE.md):

-   **Client-side tests (Angular)**:

    -   ✅ **ALWAYS** run headless with no-watch: `npm test`
    -   ✅ Uses `--no-watch --browsers=ChromeHeadless` flags automatically
    -   ❌ **NEVER** use watch mode in automated test runs
    -   ❌ **NEVER** use headed browsers in CI/CD

-   **Server-side tests (.NET)**:

    -   ✅ **ALWAYS** ensure Docker Desktop is running first (Testcontainers dependency)
    -   ✅ Use `dotnet test --no-build --logger "console;verbosity=normal"`
    -   ✅ Run `npm run start:docker` before tests to auto-start Docker if needed

-   **Critical Test Execution Rule**:
    -   ❌ **NEVER** skip failing tests "to fix later"
    -   ❌ **NEVER** proceed with implementation if tests are failing
    -   ✅ **ALWAYS** fix failing tests immediately when discovered
    -   ✅ **ALWAYS** run tests after each code change to verify success

### **Patterns Focus**:

-   **What Changes**: Entity types, schema names, validation rules, field mappings
-   **What Stays Same**: Configuration flow, error handling, registration patterns, CRUD structure

### **KISS Principle**:

-   Start with simplest solution
-   Add patterns only when duplication confirmed (Rule of Three)
-   Refactor when complexity justifies abstraction

### **DRY Principle**:

-   Eliminate duplication in DbContext setup, service registration, update logic
-   Centralize mapping, validation, configuration patterns

### **YAGNI Principle**:

-   Build only what's needed now
-   Don't create abstractions for future "what-ifs"
-   Delete unused code aggressively

---

## 🧠 Core Principles Checklist

Before implementing each change, verify:

### **KISS (Keep It Simple, Stupid)**:

-   [ ] Is this the **simplest** solution that solves the problem?
-   [ ] Can I explain this code to a junior developer in 2 minutes?
-   [ ] Am I avoiding premature optimization?
-   [ ] Is the abstraction justified by **actual duplication** (Rule of Three)?

### **DRY (Don't Repeat Yourself)**:

-   [ ] Have I seen this **exact pattern** at least 3 times?
-   [ ] Is the duplication **accidental** (similar) or **essential** (identical)?
-   [ ] Will extracting this make the code **easier** to maintain?
-   [ ] Am I consolidating **behavior**, not just **structure**?

### **YAGNI (You Aren't Gonna Need It)**:

-   [ ] Is this solving a **current** problem or a **hypothetical** one?
-   [ ] Do I have **concrete evidence** this abstraction is needed?
-   [ ] Am I building for **today's requirements**, not imagined future ones?
-   [ ] Can I implement this incrementally and refactor later if needed?

### **SOLID Principles**:

-   [ ] **SRP**: Does this class/method have exactly **one reason to change**?
-   [ ] **OCP**: Can I **extend** without **modifying** existing code?
-   [ ] **LSP**: Can I **substitute** derived types for base types safely?
-   [ ] **ISP**: Do interfaces contain **only methods clients actually use**?
-   [ ] **DIP**: Am I depending on **abstractions**, not **concrete implementations**?

---

## 🎯 Success Metrics

-   **Code Reduction**: ~225 lines removed across 20 files
-   **Test Coverage**: All existing tests pass (>80% coverage maintained)
-   **Consistency**: 100% of boundary contexts use shared patterns
-   **Maintainability**: New boundary contexts require <30 lines of custom code

---

**Generated with UltraThink Analysis**
**Principles**: KISS, DRY, YAGNI
**Standards**: SOLID, Clean Architecture, Domain-Driven Design
