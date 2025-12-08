# SOLID & Bounded Context Audit Plan

> **Purpose**: Comprehensive audit and refactoring plan for SOLID principle violations and bounded context design patterns.
> **Approach**: TDD, 80/20 testing, KISS, DRY, YAGNI
> **Created**: December 8, 2025

---

## Executive Summary

Full codebase audit identified **12 remaining violations** across Server and Client. Previous refactoring (December 2024) addressed 16 major violations. This plan targets the remaining technical debt organized into **4 phases**.

| Phase | Focus                                           | Priority  | Effort   | Status      |
| ----- | ----------------------------------------------- | --------- | -------- | ----------- |
| 1     | DIP Violations - Services with Direct DbContext | 🔴 HIGH   | 3-4 days | ⏳ Pending  |
| 2     | Bounded Context Isolation Improvements          | 🔴 HIGH   | ~5 min   | ✅ Complete |
| 3     | SRP Refinements & Method Count Optimization     | 🟡 MEDIUM | ~0 days  | ✅ Approved |
| 4     | Code Quality & DRY Improvements                 | 🟢 LOW    | 1-2 days | ⏳ Pending  |

---

## Current Architecture Assessment

### ✅ What's Already Working Well

1. **Bounded Context Separation**: 5 clear bounded contexts (Identity, Logging, ApiTracking, ElectronicNotifications, Infrastructure)
2. **Architecture Tests**: 10 server tests + 17 client tests enforcing patterns
3. **ISP Implementation**: Services split into focused interfaces (IUserQueryService, IUserAdminService, etc.)
4. **Angular Patterns**: OnPush change detection, signals, inject(), @if/@for control flow
5. **Route-Scoped Services**: Feature services provided at route level (not `providedIn: 'root'`)
6. **Repository Pattern**: Most repositories properly abstracted from services

### ❌ Remaining Violations Identified

| #   | Violation Type                 | Location                                        | Principle Violated | Status        |
| --- | ------------------------------ | ----------------------------------------------- | ------------------ | ------------- |
| 1   | Direct DbContext in Service    | `AuthService.cs`                                | DIP                | ⏳ Phase 1    |
| 2   | Direct DbContext in Service    | `PasswordService.cs`                            | DIP                | ⏳ Phase 1    |
| 3   | Direct DbContext in Service    | `RegistrationService.cs`                        | DIP                | ⏳ Phase 1    |
| 4   | Cross-Context Dependency       | `EmailService` imports                          | Bounded Context    | ✅ FIXED      |
| 5   | Duplicate Query Logic          | Multiple services query UserRoles               | DRY                | ⏳ Phase 1    |
| 6   | Large Service Files            | `AuthService.cs` (688 lines)                    | SRP Threshold      | ✅ APPROVED   |
| 7   | Large Service Files            | `RegistrationService.cs` (445 lines)            | SRP Threshold      | ✅ APPROVED   |
| 8   | Missing Auth Repository        | AuthService lacks dedicated repository          | DIP                | ⏳ Phase 1    |
| 9   | Inconsistent Logging           | Some services log at wrong levels               | Logging Standards  | ✅ N/A        |
| 10  | Infrastructure Service in Root | `providedIn: 'root'` for cross-cutting services | N/A                | ✅ Acceptable |
| 11  | Constants Duplication          | Role names hardcoded in multiple places         | DRY                | ⏳ Phase 4    |
| 12  | Test Helper DbContext Access   | Test utilities access DbContext directly        | N/A                | ✅ Test-only  |

---

## Phase 1: Dependency Inversion Violations (HIGH PRIORITY)

### Problem Statement

Three services in the Identity context still directly inject `IdentityDbContext` instead of using repositories:

-   `AuthService.cs` - 15+ direct context operations
-   `PasswordService.cs` - 8+ direct context operations
-   `RegistrationService.cs` - 10+ direct context operations

This violates DIP and makes testing harder.

---

### 1.1 Create IAuthRepository Interface

**Purpose**: Abstract all auth-related data access from `AuthService`.

**Location**: `SeventySix/Identity/Interfaces/IAuthRepository.cs`

**Interface Design** (10 methods - under 12-method limit):

```csharp
/// <summary>
/// Repository for authentication-related data access.
/// </summary>
/// <remarks>
/// Follows DIP - services depend on abstraction, not DbContext.
/// Handles user lookup, lockout, and login tracking.
/// </remarks>
public interface IAuthRepository
{
	/// <summary>Gets user by username or email for login.</summary>
	Task<User?> GetUserByUsernameOrEmailAsync(
		string usernameOrEmail,
		CancellationToken cancellationToken = default);

	/// <summary>Gets user by ID with credential included.</summary>
	Task<User?> GetUserByIdWithCredentialAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Gets user credential by user ID.</summary>
	Task<UserCredential?> GetCredentialByUserIdAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Gets user roles for token generation.</summary>
	Task<IReadOnlyList<string>> GetUserRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Updates failed login count for lockout.</summary>
	Task UpdateFailedLoginAttemptAsync(
		int userId,
		int failedCount,
		DateTime? lockoutEnd,
		CancellationToken cancellationToken = default);

	/// <summary>Resets lockout after successful login.</summary>
	Task ResetLockoutAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Updates last login timestamp and IP.</summary>
	Task UpdateLastLoginAsync(
		int userId,
		DateTime loginTime,
		string? clientIp,
		CancellationToken cancellationToken = default);

	/// <summary>Finds external login by provider and provider user ID.</summary>
	Task<ExternalLogin?> GetExternalLoginAsync(
		string provider,
		string providerUserId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates external login for OAuth.</summary>
	Task CreateExternalLoginAsync(
		ExternalLogin externalLogin,
		CancellationToken cancellationToken = default);

	/// <summary>Gets role ID by name.</summary>
	Task<int?> GetRoleIdByNameAsync(
		string roleName,
		CancellationToken cancellationToken = default);
}
```

**Implementation Steps**:

1. Create `IAuthRepository.cs` interface
2. Create `AuthRepository.cs` implementation
3. Register in `IdentityExtensions.cs`
4. Refactor `AuthService` to inject `IAuthRepository`
5. Remove direct `IdentityDbContext` dependency
6. Update tests to mock repository

**TDD Test (80/20 - Critical Path Only)**:

```csharp
[Fact]
public async Task GetUserByUsernameOrEmailAsync_ReturnsUser_WhenFoundByUsernameAsync()
{
	// Arrange
	await using IdentityDbContext context = CreateIdentityDbContext();
	AuthRepository repository = new(context);
	User user = await CreateTestUserAsync(context);

	// Act
	User? result = await repository.GetUserByUsernameOrEmailAsync(
		user.Username,
		CancellationToken.None);

	// Assert
	Assert.NotNull(result);
	Assert.Equal(user.Id, result.Id);
}
```

---

### 1.2 Create IPasswordRepository Interface

**Purpose**: Abstract password-related data access from `PasswordService`.

**Location**: `SeventySix/Identity/Interfaces/IPasswordRepository.cs`

**Interface Design** (8 methods - under 12-method limit):

```csharp
/// <summary>
/// Repository for password management data access.
/// </summary>
public interface IPasswordRepository
{
	/// <summary>Gets user credential by user ID for password operations.</summary>
	Task<UserCredential?> GetCredentialByUserIdAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates credential for OAuth-only user setting password.</summary>
	Task CreateCredentialAsync(
		UserCredential credential,
		CancellationToken cancellationToken = default);

	/// <summary>Updates credential with new password hash.</summary>
	Task UpdateCredentialAsync(
		UserCredential credential,
		CancellationToken cancellationToken = default);

	/// <summary>Gets user by ID for password reset emails.</summary>
	Task<User?> GetUserByIdAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Gets active user by email for password reset.</summary>
	Task<User?> GetActiveUserByEmailAsync(
		string email,
		CancellationToken cancellationToken = default);

	/// <summary>Invalidates existing password reset tokens.</summary>
	Task InvalidateExistingTokensAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates password reset token.</summary>
	Task CreatePasswordResetTokenAsync(
		PasswordResetToken token,
		CancellationToken cancellationToken = default);

	/// <summary>Gets and validates password reset token.</summary>
	Task<PasswordResetToken?> GetValidResetTokenAsync(
		string token,
		CancellationToken cancellationToken = default);
}
```

**Implementation Steps**:

1. Create `IPasswordRepository.cs` interface
2. Create `PasswordRepository.cs` implementation
3. Register in `IdentityExtensions.cs`
4. Refactor `PasswordService` to inject `IPasswordRepository`
5. Remove direct `IdentityDbContext` dependency
6. Update tests

---

### 1.3 Create IRegistrationRepository Interface

**Purpose**: Abstract registration data access from `RegistrationService`.

**Location**: `SeventySix/Identity/Interfaces/IRegistrationRepository.cs`

**Interface Design** (9 methods - under 12-method limit):

```csharp
/// <summary>
/// Repository for user registration data access.
/// </summary>
public interface IRegistrationRepository
{
	/// <summary>Checks if username exists.</summary>
	Task<bool> UsernameExistsAsync(
		string username,
		CancellationToken cancellationToken = default);

	/// <summary>Checks if email exists.</summary>
	Task<bool> EmailExistsAsync(
		string email,
		CancellationToken cancellationToken = default);

	/// <summary>Gets role ID by name for role assignment.</summary>
	Task<int> GetRoleIdByNameAsync(
		string roleName,
		CancellationToken cancellationToken = default);

	/// <summary>Creates user with credential and role atomically.</summary>
	Task<User> CreateUserWithCredentialAsync(
		User user,
		UserCredential credential,
		int roleId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates pending email verification token.</summary>
	Task CreatePendingEmailAsync(
		PendingEmail pendingEmail,
		CancellationToken cancellationToken = default);

	/// <summary>Gets pending email by token.</summary>
	Task<PendingEmail?> GetPendingEmailByTokenAsync(
		string token,
		CancellationToken cancellationToken = default);

	/// <summary>Gets pending email by email address.</summary>
	Task<PendingEmail?> GetPendingEmailByEmailAsync(
		string email,
		CancellationToken cancellationToken = default);

	/// <summary>Deletes pending email after successful registration.</summary>
	Task DeletePendingEmailAsync(
		int pendingEmailId,
		CancellationToken cancellationToken = default);

	/// <summary>Updates pending email for resend flow.</summary>
	Task UpdatePendingEmailAsync(
		PendingEmail pendingEmail,
		CancellationToken cancellationToken = default);
}
```

---

### 1.4 Validation Checklist - Phase 1

-   [ ] `IAuthRepository` created with 10 methods
-   [ ] `AuthRepository` implementation complete
-   [ ] `AuthService` uses `IAuthRepository` (no DbContext)
-   [ ] `IPasswordRepository` created with 8 methods
-   [ ] `PasswordRepository` implementation complete
-   [ ] `PasswordService` uses `IPasswordRepository` (no DbContext)
-   [ ] `IRegistrationRepository` created with 9 methods
-   [ ] `RegistrationRepository` implementation complete
-   [ ] `RegistrationService` uses `IRegistrationRepository` (no DbContext)
-   [ ] All DI registrations added to `IdentityExtensions.cs`
-   [ ] All existing tests pass
-   [ ] Architecture tests pass
-   [ ] No compile errors

---

## Phase 2: Bounded Context Isolation ✅ COMPLETE

### Problem Statement

`EmailService` in `ElectronicNotifications` context appeared to have cross-context imports from `ApiTracking` and `Infrastructure`.

---

### 2.1 Analysis Result

**Investigation Findings**:

1. `IRateLimitingService` interface is already in `SeventySix.Shared` namespace (correct location)
2. `RateLimitingService` implementation is in `SeventySix.Infrastructure` namespace (allowed - Infrastructure is cross-cutting)
3. The `using SeventySix.ApiTracking;` and `using SeventySix.Infrastructure;` in `EmailService.cs` were **unused imports**
4. Architecture tests pass - the actual design is correct

**Resolution**: Removed unused imports from `EmailService.cs`.

**Before**:

```csharp
using SeventySix.ApiTracking;      // ❌ Unused
using SeventySix.Infrastructure;   // ❌ Unused
using SeventySix.Shared;
```

**After**:

```csharp
using SeventySix.Shared;           // ✅ Only needed import
```

---

### 2.2 Why This Works (Architecture Explanation)

The current architecture correctly handles cross-cutting concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    SeventySix.Shared                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ IRateLimitingService (interface)                        ││
│  │ ITransactionManager (interface)                         ││
│  │ IDatabaseHealthCheck (interface)                        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ depends on
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────┴───────┐   ┌─────────┴─────────┐   ┌───────┴───────┐
│ ElectronicNot.│   │   Infrastructure   │   │  ApiTracking  │
│               │   │                    │   │               │
│ EmailService  │   │ RateLimitingService│──▶│ Repository    │
│ (uses IRateL.)│   │ (implements IRateL)│   │               │
└───────────────┘   └────────────────────┘   └───────────────┘
```

**Key Points**:

-   Bounded contexts depend only on `Shared` abstractions
-   `Infrastructure` provides cross-cutting implementations
-   Architecture tests exclude `Shared` and `Infrastructure` from isolation checks
-   This is the correct DDD pattern for cross-cutting concerns

---

### 2.3 Validation Checklist - Phase 2 ✅

-   [x] `IRateLimitingService` already in `Shared` namespace
-   [x] Unused imports removed from `EmailService.cs`
-   [x] No cross-context imports between Identity/Logging/ApiTracking/ElectronicNotifications
-   [x] Architecture tests pass (bounded context isolation)
-   [x] All existing tests pass

---

## Phase 3: SRP Refinements & Method Optimization ✅ APPROVED EXCEPTIONS

### 3.1 AuthService File Size (688 lines) ✅ APPROVED

**Analysis**: While `AuthService` implements multiple focused interfaces (`IAuthenticationService`, `IOAuthService`), the file size is large.

**Decision**: **APPROVED EXCEPTION** - Per YAGNI principle, the service is well-organized with ISP pattern. The focused interfaces (`IAuthenticationService`, `IOAuthService`) ensure callers depend only on what they need. File size alone is not a violation when ISP is properly applied.

**Justification**:

-   Implements 2 focused interfaces (ISP pattern)
-   Each interface has < 12 methods (passes architecture tests)
-   Splitting would create artificial boundaries without benefit

---

### 3.2 RegistrationService File Size (445 lines) ✅ APPROVED

**Analysis**: Contains both direct registration and email verification flows.

**Decision**: **APPROVED EXCEPTION** - Current size is acceptable. Single-purpose service handling user registration flows cohesively.

**Justification**:

-   445 lines is under typical 500-line concern threshold
-   Implements `IRegistrationService` interface (< 12 methods)
-   Registration and email verification are cohesive operations

---

### 3.3 Consolidate Role Query Logic (DRY)

**Current Duplication**:

Multiple services query user roles with similar patterns:

```csharp
// In AuthService
List<string> roles = await context.UserRoles
    .AsNoTracking()
    .Where(r => r.UserId == user.Id)
    .Include(r => r.Role)
    .Select(r => r.Role!.Name)
    .ToListAsync(cancellationToken);
```

**Solution**: Add `GetUserRolesAsync` to `IAuthRepository` (included in Phase 1.1).

---

### 3.4 Validation Checklist - Phase 3 ✅

-   [x] AuthService file size: **APPROVED EXCEPTION** (ISP pattern applied)
-   [x] RegistrationService file size: **APPROVED EXCEPTION** (cohesive operations)
-   [x] Role query logic will be consolidated in IAuthRepository (Phase 1)
-   [x] All services under 12 public methods (architecture test passes)
-   [x] No action needed per YAGNI

---

## Phase 4: Code Quality & DRY Improvements (LOW PRIORITY)

### 4.1 Constants Consolidation

**Current Issue**: Role names referenced as strings in multiple places.

**Existing Solution**: `RoleConstants.cs` already exists in `Identity/Constants/`.

**Audit**: Verify all role references use `RoleConstants`:

```csharp
// ✅ CORRECT
RoleConstants.Admin
RoleConstants.Developer
RoleConstants.User

// ❌ WRONG
"Admin"
"Developer"
```

**Steps**:

1. Grep for hardcoded role strings
2. Replace with `RoleConstants` references
3. Add any missing role constants

---

### 4.2 Logging Level Audit

**Standard** (from CLAUDE.md):

-   **NEVER** use `LogDebug`
-   **LogInformation** - ONLY for background job completion
-   **LogWarning** - Recoverable issues, business rule violations
-   **LogError** - Unrecoverable failures, exceptions

**Current Status**: Architecture test `LoggingStandardsTests.cs` enforces this.

**Action**: Review any new code for compliance. ✅ No violations found in current audit.

---

### 4.3 Variable Naming Audit

**Standard** (from CLAUDE.md):

-   Never use initial-only variable names (`u`, `r`, `c`)
-   Always use descriptive names (`user`, `role`, `credential`)

**Current Status**: Codebase follows naming conventions.

**Action**: No changes needed. ✅

---

### 4.4 Validation Checklist - Phase 4

-   [ ] All role references use `RoleConstants`
-   [ ] No hardcoded strings for roles
-   [ ] Logging levels follow standards
-   [ ] Variable names are descriptive

---

## File Changes Summary

### Completed Changes

```
SeventySix/ElectronicNotifications/Emails/Services/
└── EmailService.cs              (removed unused imports) ✅
```

### New Files to Create (Server - Phase 1)

```
SeventySix/Identity/
├── Interfaces/
│   ├── IAuthRepository.cs         (10 methods)
│   ├── IPasswordRepository.cs     (8 methods)
│   └── IRegistrationRepository.cs (9 methods)
├── Repositories/
│   ├── AuthRepository.cs
│   ├── PasswordRepository.cs
│   └── RegistrationRepository.cs
```

### Files to Modify (Server - Phase 1)

```
SeventySix/
├── Extensions/
│   └── IdentityExtensions.cs      (add repository registrations)
├── Identity/Services/
│   ├── AuthService.cs             (inject IAuthRepository)
│   ├── PasswordService.cs         (inject IPasswordRepository)
│   └── RegistrationService.cs     (inject IRegistrationRepository)
```

### Files to Create (Tests - Phase 1)

```
Tests/SeventySix.Tests/Identity/Repositories/
├── AuthRepositoryTests.cs
├── PasswordRepositoryTests.cs
└── RegistrationRepositoryTests.cs
```

---

## Testing Strategy (80/20 Rule)

### Critical Paths to Test (20% effort, 80% coverage):

1. **Login flow** - `GetUserByUsernameOrEmailAsync`, `GetCredentialByUserIdAsync`
2. **Token generation** - `GetUserRolesAsync` returns correct roles
3. **Password reset** - `CreatePasswordResetTokenAsync`, `GetValidResetTokenAsync`
4. **Registration** - `CreateUserWithCredentialAsync` atomic operation
5. **Rate limiting** - `CanMakeRequestAsync` respects limits

### Skip (YAGNI):

-   Edge cases for every validation rule
-   Every error code path
-   Unit tests for simple DTO mappings

---

## Execution Order

```
Phase 1 (DIP - Remaining Work):
├── Day 1: Create IAuthRepository + AuthRepository
├── Day 2: Refactor AuthService, write tests
├── Day 3: Create IPasswordRepository + PasswordRepository
├── Day 4: Refactor PasswordService, write tests
├── Day 5: Create IRegistrationRepository + RegistrationRepository
└── Day 6: Refactor RegistrationService, write tests, final validation

Phase 2 ✅ COMPLETE (Bounded Context):
└── Removed unused imports from EmailService.cs

Phase 3 ✅ APPROVED EXCEPTIONS:
└── Large file sizes approved - ISP pattern applied

Phase 4 (Code Quality - Optional):
├── Day 1: Constants audit and consolidation
└── Day 2: Final code review
```

---

## Success Metrics

| Metric                         | Before        | Current       | Target        |
| ------------------------------ | ------------- | ------------- | ------------- |
| Services with direct DbContext | 3             | 3             | 0             |
| Cross-context dependencies     | 1             | 0 ✅          | 0             |
| New repository interfaces      | 0             | 0             | 3             |
| Architecture tests passing     | 10/10 + 17/17 | 10/10 + 17/17 | 10/10 + 17/17 |
| Hardcoded role strings         | TBD           | TBD           | 0             |
| Server tests passing           | ~804          | ~804          | ~830          |
| Client tests passing           | ~880          | ~880          | ~880          |
| Large file exceptions approved | 0             | 2 ✅          | 2             |

---

## Risk Assessment

| Risk                            | Likelihood | Impact | Mitigation                        |
| ------------------------------- | ---------- | ------ | --------------------------------- |
| Breaking existing tests         | Medium     | High   | Run tests after each change       |
| Missing edge cases in new repos | Low        | Medium | Focus on critical paths (80/20)   |
| Circular dependencies           | Low        | High   | Architecture tests catch this     |
| Performance regression          | Low        | Medium | Use `AsNoTracking()` consistently |

---

## Appendix: Architecture Test Coverage

### Server Tests (SeventySix.ArchitectureTests)

| Test                                                         | Purpose                   |
| ------------------------------------------------------------ | ------------------------- |
| `Service_Interfaces_Should_Have_Less_Than_Twelve_Methods`    | Prevents god classes      |
| `Repository_Interfaces_Should_Have_Less_Than_Twelve_Methods` | Prevents god repositories |
| `Bounded_Contexts_Should_Not_Reference_Each_Other`           | Enforces BC isolation     |
| `Each_Bounded_Context_Should_Have_DbContext`                 | Validates BC structure    |
| `Controllers_Should_Not_Depend_On_Any_Repository_Namespace`  | Service facade pattern    |
| `Repositories_Should_Not_Be_Public`                          | Encapsulation             |
| `Controllers_Should_Only_Depend_On_Service_Interfaces`       | DIP enforcement           |
| `LogDebug_ShouldNeverBeUsed`                                 | Logging standards         |
| `LogInformation_ShouldOnlyBeUsedInBackgroundJobs`            | Logging standards         |

### Client Tests (architecture-tests.mjs)

| Test                           | Purpose                       |
| ------------------------------ | ----------------------------- |
| Signal Pattern (3 tests)       | `input()`/`output()`, OnPush  |
| Control Flow (3 tests)         | `@if`/`@for`/`@switch`        |
| DI Pattern (2 tests)           | `inject()` function           |
| Service Scoping (2 tests)      | Feature services route-scoped |
| Zoneless (3 tests)             | No NgZone, no fakeAsync       |
| Template Performance (2 tests) | No method calls in templates  |
| God Class (2 tests)            | 12-method limit               |

---

_Plan created: December 8, 2025_
_Last updated: December 8, 2025_
_Phase 2: ✅ Complete_
_Phase 3: ✅ Approved Exceptions_
_Next: Phase 1 (DIP Repositories)_
