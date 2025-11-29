# Implementation Plan: Bounded Context Cleanup & DTO/Entity/Model Clarification

> **Created**: November 29, 2025
> **Status**: ✅ IMPLEMENTATION COMPLETE
> **Principles**: SOLID, KISS, DRY, YAGNI
> **Approach**: TDD - Write/update tests first, then implementation

---

## Overview

This plan addresses four related architectural improvements:

1. **Move Identity-specific settings to Identity bounded context** - AuthSettings, JwtSettings, JwtSettingsValidator
2. **Clarify DTO vs Entity vs Model naming conventions** - Update architecture docs
3. **Audit existing types** - Verify conventions are followed
4. **Move misplaced Model types** - AuthResult from DTOs/ to Models/

---

## Architectural Decision: Three-Way Type Split

| Type         | Purpose                          | Persisted? | API Exposed? | Location            |
| ------------ | -------------------------------- | ---------- | ------------ | ------------------- |
| **DTOs**     | API contracts (request/response) | No         | **Yes**      | `Context/DTOs/`     |
| **Entities** | Database-persisted domain models | **Yes**    | No           | `Context/Entities/` |
| **Models**   | Internal non-persisted types     | No         | No           | `Context/Models/`   |

### Examples

| Type   | Server Example              | Client Example            |
| ------ | --------------------------- | ------------------------- |
| DTO    | `UserDto`, `LoginRequest`   | `User`, `LoginRequest`    |
| Entity | `User`, `RefreshToken` (EF) | N/A (server only)         |
| Model  | `AuthResult`, `TokenPair`   | `LogFilter`, `TableState` |

---

## Pre-Flight Checks

```powershell
# Baseline test counts (record before starting)
cd c:\SeventySix\SeventySix.Server
dotnet test --no-build --verbosity quiet | Select-String "total:"

cd c:\SeventySix\SeventySix.Client
npm test 2>&1 | Select-String "executed"
```

---

## Phase 1: Architecture Documentation Updates

### 1.1 Update `.github/copilot-instructions.md`

**Location**: `#file:.github/copilot-instructions.md`

**Changes**:

-   Add clarification under Architecture section for DTO vs Entity distinction
-   Add Settings folder to bounded context pattern

**Add after "Features are self-contained" bullet**:

```markdown
-   **DTOs** = API contracts (request/response), **Entities** = DB-persisted models, **Models** = internal non-persisted types
-   **Settings** = Configuration binding classes (bound from `appsettings.json`)
```

---

### 1.2 Update `.github/instructions/architecture.md`

**Location**: `#file:.github/instructions/architecture.md`

**Changes**:

-   Add new section explaining DTO vs Entity distinction
-   Clarify Settings folder purpose

**Add after "Server Structure" section**:

```markdown
## DTO vs Entity vs Model vs Settings

| Type         | Purpose                          | Persisted? | API Exposed? | Location            | Naming                          |
| ------------ | -------------------------------- | ---------- | ------------ | ------------------- | ------------------------------- |
| **DTOs**     | API contracts (request/response) | No         | **Yes**      | `Context/DTOs/`     | `*Dto`, `*Request`, `*Response` |
| **Entities** | Database-persisted models        | **Yes**    | No           | `Context/Entities/` | Plain names (User, Log)         |
| **Models**   | Internal non-persisted types     | No         | No           | `Context/Models/`   | `*Result`, `*Options`, etc.     |
| **Settings** | Configuration binding            | No         | No           | `Context/Settings/` | `*Settings`                     |

**Rules**:

-   DTOs cross API boundary - serialized to/from JSON
-   Entities are EF-tracked and saved to database - never returned directly from controllers
-   Models are internal service/business logic types - not persisted, not exposed
-   Settings bind to `appsettings.json` sections - context-specific config belongs in context
```

---

### 1.3 Update `.claude/CLAUDE.md`

**Location**: `#file:.claude/CLAUDE.md`

**Changes**:

-   Update "Bounded Context Structure (Server)" to include Models and Settings folders
-   Add DTO vs Entity vs Model clarification section

**Update structure diagram** (~line 607):

```markdown
### Bounded Context Structure (Server)

Context/
├── Configurations/ # EF Fluent API
├── DTOs/ # API contracts (records) - Request/Response/Dto types
├── Entities/ # DB-persisted models - EF tracked, saved to database
├── Extensions/ # ToDto mapping
├── Infrastructure/ # DbContext
├── Models/ # Internal non-persisted types (optional - create when needed)
├── Repositories/ # Domain-specific
├── Services/
├── Settings/ # appsettings.json binding classes (context-specific config)
└── Validators/ # FluentValidation
```

**Add new section after structure diagram**:

```markdown
### DTO vs Entity vs Model vs Settings

| Category     | Purpose                        | Persisted? | API? | Examples                                       |
| ------------ | ------------------------------ | ---------- | ---- | ---------------------------------------------- |
| **DTOs**     | API request/response contracts | No         | Yes  | `UserDto`, `LoginRequest`, `PagedResult<T>`    |
| **Entities** | Database-persisted models      | Yes        | No   | `User`, `RefreshToken`, `Log`                  |
| **Models**   | Internal non-persisted types   | No         | No   | `AuthResult`, `TokenPair`, `ValidationContext` |
| **Settings** | Configuration binding          | No         | No   | `JwtSettings`, `AuthSettings`                  |

**Key Rules**:

1. DTOs are **records** - immutable API contracts
2. Entities are **classes** - EF-tracked, persisted to database
3. Models are **records/classes** - internal business logic, not persisted
4. Settings are **records** - bound from `appsettings.json`
5. Controllers return DTOs, never Entities or Models
6. Repositories work with Entities internally
7. Services may use Models for internal operations
8. Context-specific settings live in their bounded context (e.g., `Identity/Settings/`)
```

---

## Phase 2: Move Identity Settings to Identity Context

> **TDD Approach**: Update test file locations and namespaces FIRST, verify tests fail to find types, then move implementation files.

### 2.1 Files to Move

| Current Location                            | New Location                                  |
| ------------------------------------------- | --------------------------------------------- |
| `Shared/DTOs/JwtSettings.cs`                | `Identity/Settings/JwtSettings.cs`            |
| `Shared/DTOs/AuthSettings.cs`               | `Identity/Settings/AuthSettings.cs`           |
| `Shared/Validators/JwtSettingsValidator.cs` | `Identity/Validators/JwtSettingsValidator.cs` |

### 2.2 Create `JwtSettings.cs` in Identity

**Target**: `#file:SeventySix.Server/SeventySix/Identity/Settings/JwtSettings.cs`

**Namespace**: `SeventySix.Identity` (matches `AdminSeederSettings.cs` pattern)

**Code** (following `#file:.editorconfig` formatting):

```csharp
// <copyright file="JwtSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// JWT configuration settings.
/// Used by Identity context for token generation and validation.
/// </summary>
public record JwtSettings
{
	/// <summary>
	/// Gets the secret key for signing tokens.
	/// </summary>
	public string SecretKey { get; init; } = string.Empty;

	/// <summary>
	/// Gets the token issuer.
	/// </summary>
	public string Issuer { get; init; } = string.Empty;

	/// <summary>
	/// Gets the token audience.
	/// </summary>
	public string Audience { get; init; } = string.Empty;

	/// <summary>
	/// Gets access token expiration in minutes. Default: 15.
	/// </summary>
	public int AccessTokenExpirationMinutes { get; init; } = 15;

	/// <summary>
	/// Gets refresh token expiration in days. Default: 7.
	/// </summary>
	public int RefreshTokenExpirationDays { get; init; } = 7;
}
```

### 2.3 Create `AuthSettings.cs` in Identity

**Target**: `#file:SeventySix.Server/SeventySix/Identity/Settings/AuthSettings.cs`

**Namespace**: `SeventySix.Identity`

**Note**: File is large (~249 lines) with nested records. Keep all nested types in same file.

### 2.4 Move `JwtSettingsValidator.cs`

**Target**: `#file:SeventySix.Server/SeventySix/Identity/Validators/JwtSettingsValidator.cs`

**Namespace**: `SeventySix.Identity`

**Note**: Already in `Identity/Validators/` folder. Just update namespace from `SeventySix.Shared` to `SeventySix.Identity`.

### 2.5 Update Consuming Files

**Files requiring `using SeventySix.Identity;` addition**:

| File                                                       | Current Using       | Action                             |
| ---------------------------------------------------------- | ------------------- | ---------------------------------- |
| `SeventySix.Api/Extensions/AuthenticationExtensions.cs`    | `SeventySix.Shared` | Replace with `SeventySix.Identity` |
| `SeventySix.Api/Extensions/ServiceCollectionExtensions.cs` | `SeventySix.Shared` | Replace with `SeventySix.Identity` |
| `Identity/Services/TokenService.cs`                        | Already in Identity | Remove `using SeventySix.Shared;`  |
| `Identity/Services/AuthService.cs`                         | Already in Identity | Remove `using SeventySix.Shared;`  |
| `Identity/Services/TokenCleanupService.cs`                 | Already in Identity | Remove `using SeventySix.Shared;`  |

### 2.6 Update Test Files

**Move and update namespace**:

| Current Location                                                        | New Location                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Tests/SeventySix.Tests/Shared/Validators/JwtSettingsValidatorTests.cs` | `Tests/SeventySix.Tests/Identity/Validators/JwtSettingsValidatorTests.cs` |

**Additional test files to update** (using statements only):

-   `Tests/SeventySix.Tests/Identity/Services/AuthServiceTests.cs`
-   `Tests/SeventySix.Tests/Identity/Services/TokenServiceTests.cs`

### 2.7 Delete Old Files

After all references updated and tests pass:

```powershell
# Delete old files (after verification)
Remove-Item "SeventySix/Shared/DTOs/JwtSettings.cs"
Remove-Item "SeventySix/Shared/DTOs/AuthSettings.cs"
Remove-Item "SeventySix/Shared/Validators/JwtSettingsValidator.cs"
```

---

## Phase 3: Server DTO/Entity Audit (Verification Only)

> **YAGNI**: No renames required. This phase verifies current naming is correct.

### 3.1 Current State Analysis

**Shared/DTOs/** - Files that should STAY (true cross-context DTOs):

| File                  | Status  | Reason                              |
| --------------------- | ------- | ----------------------------------- |
| `BaseQueryRequest.cs` | ✅ KEEP | Used by all contexts for pagination |
| `PagedResult.cs`      | ✅ KEEP | Generic response wrapper            |
| `Result.cs`           | ✅ KEEP | Generic result pattern              |
| `JwtSettings.cs`      | ❌ MOVE | Identity-specific (Phase 2)         |
| `AuthSettings.cs`     | ❌ MOVE | Identity-specific (Phase 2)         |

**Identity/DTOs/** - Already follows convention:

| File                       | Suffix     | Classification            | Correct Location?  |
| -------------------------- | ---------- | ------------------------- | ------------------ |
| `AuthResponse.cs`          | `Response` | DTO - API response        | ✅ DTOs/           |
| `AuthResult.cs`            | `Result`   | **Model** - internal type | ⚠️ Move to Models/ |
| `ChangePasswordRequest.cs` | `Request`  | DTO - API request         | ✅ DTOs/           |
| `CreateUserRequest.cs`     | `Request`  | DTO - API request         | ✅ DTOs/           |
| `LoginRequest.cs`          | `Request`  | DTO - API request         | ✅ DTOs/           |
| `UpdateUserRequest.cs`     | `Request`  | DTO - API request         | ✅ DTOs/           |
| `UserDto.cs`               | `Dto`      | DTO - API response        | ✅ DTOs/           |
| `UserProfileDto.cs`        | `Dto`      | DTO - API response        | ✅ DTOs/           |
| `UserQueryRequest.cs`      | `Request`  | DTO - API request         | ✅ DTOs/           |

**Note**: `AuthResult.cs` is an internal result type, not an API contract. This will be moved to `Identity/Models/` as part of Phase 5 below.

**Identity/Entities/** - Already follows convention:

| File              | Type   | Notes         |
| ----------------- | ------ | ------------- |
| `User.cs`         | Entity | ✅ EF tracked |
| `RefreshToken.cs` | Entity | ✅ EF tracked |
| `Role.cs`         | Entity | ✅ EF tracked |
| `UserRole.cs`     | Entity | ✅ EF tracked |

### 3.2 Conclusion

**Minimal changes required** - Current naming is mostly consistent:

-   `*Request` = DTO - API input
-   `*Dto` = DTO - API output
-   `*Response` = DTO - API output (variant)
-   `*Result` = **Model** - internal operation result (move to `Models/` in Phase 5)
-   Plain names in `Entities/` = Entity - EF-tracked, DB-persisted

---

## Phase 4: Client Model Audit (Documentation Only)

> **YAGNI**: No renames. Add JSDoc clarification only.

### 4.1 Current Client Model Locations

| Location                                    | Files                                                                                   | Status                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------- |
| `infrastructure/models/`                    | `base-query-request.model.ts`, `paged-response.model.ts`, `create-log-request.model.ts` | ✅ Cross-cutting DTOs       |
| `features/admin/users/models/user.model.ts` | `User`, `CreateUserRequest`, `UpdateUserRequest`, `UserQueryRequest`                    | ✅ Feature-scoped (correct) |
| `features/admin/logs/models/log.model.ts`   | `LogDto`, `LogLevel`, utilities                                                         | ✅ Already has `Dto` suffix |

### 4.2 Client Naming Convention (Established)

| Suffix      | Type  | Purpose                  | Example                  |
| ----------- | ----- | ------------------------ | ------------------------ |
| `*Request`  | DTO   | API input                | `CreateUserRequest`      |
| `*Dto`      | DTO   | API output               | `LogDto`                 |
| `*Response` | DTO   | API output               | `PagedResponse`          |
| Plain name  | DTO   | API match                | `User` (matches UserDto) |
| `*Filter`   | Model | Internal filtering state | `LogFilter`              |
| `*State`    | Model | Internal component state | `TableState`             |

### 4.3 Action: Add JSDoc to `user.model.ts`

**File**: `#file:SeventySix.Client/src/app/features/admin/users/models/user.model.ts`

**Add JSDoc** (already present, verify it matches backend):

```typescript
/** User model from API. Matches backend UserDto structure. */
export interface User {
	// ...
}
```

### 4.4 Update Client Architecture Docs

**Add to `.claude/CLAUDE.md` under Feature Structure (Client)**:

```markdown
### Client Model Organization

feature/
├── models/
│ ├── index.ts # Barrel export
│ ├── feature.model.ts # DTOs - API contracts (matches backend)
│ └── feature.types.ts # Models - internal types (optional, create when needed)

**Naming**:

-   `*Request`, `*Dto`, `*Response` = DTOs (API contracts)
-   `*Filter`, `*State`, `*Options` = Models (internal, not API)
-   No `entities/` folder on client (Entities are server-side DB models only)
```

---

## Phase 5: Move AuthResult to Models (Complete the Pattern)

> **Consistency**: Since we're establishing the DTO/Entity/Model pattern, move `AuthResult.cs` now to avoid technical debt.

### 5.1 Move AuthResult.cs

| Current Location              | New Location                    |
| ----------------------------- | ------------------------------- |
| `Identity/DTOs/AuthResult.cs` | `Identity/Models/AuthResult.cs` |

**Changes**:

1. Create `Identity/Models/` folder
2. Move `AuthResult.cs` to `Identity/Models/`
3. Update namespace if needed (should stay `SeventySix.Identity`)
4. Update any imports in consuming files

### 5.2 Files to Update

-   `Identity/Services/AuthService.cs` - likely already correct (same namespace)
-   Any test files referencing `AuthResult`

---

## Implementation Checklist

### Phase 1: Documentation (~10 min) ✅ COMPLETE

-   [x] Update `.github/copilot-instructions.md` - Add DTO/Entity/Settings lines
-   [x] Update `.github/instructions/architecture.md` - Add DTO vs Entity vs Settings section
-   [x] Update `.claude/CLAUDE.md` - Update structure + add clarification section

### Phase 2: Move Identity Settings (TDD Approach) (~30 min) ✅ COMPLETE

**Step 1: Create new files**

-   [x] Create `Identity/Settings/JwtSettings.cs` with namespace `SeventySix.Identity`
-   [x] Create `Identity/Settings/AuthSettings.cs` with namespace `SeventySix.Identity`
-   [x] Create `Identity/Validators/JwtSettingsValidator.cs` with namespace `SeventySix.Identity`

**Step 2: Update consuming code**

-   [x] Update `SeventySix.Api/Extensions/AuthenticationExtensions.cs` - Add `using SeventySix.Identity;`
-   [x] Update `SeventySix.Api/Extensions/ServiceCollectionExtensions.cs` - Add `using SeventySix.Identity;`
-   [x] Update `SeventySix.Api/Controllers/AuthController.cs` - Keep `using SeventySix.Shared;` for CryptoExtensions
-   [x] Update `Identity/Services/TokenService.cs` - Keep `using SeventySix.Shared;` for CryptoExtensions
-   [x] Update `Identity/Services/AuthService.cs` - Keep `using SeventySix.Shared;` for CryptoExtensions
-   [x] Update `Identity/Services/TokenCleanupService.cs` - Removed old using

**Step 3: Update tests**

-   [x] Move `JwtSettingsValidatorTests.cs` to `Tests/SeventySix.Tests/Identity/Validators/`
-   [x] Update test file namespace to `SeventySix.Tests.Identity.Validators`
-   [x] Update `AuthServiceTests.cs` using statements
-   [x] Update `TokenServiceTests.cs` using statements

**Step 4: Verify and cleanup**

-   [x] Run `dotnet build` - ensure no errors
-   [x] Run `dotnet test` - ensure all tests pass (596 tests passing)
-   [x] Delete old files from `Shared/DTOs/` and `Shared/Validators/`
-   [x] Run `dotnet build` again - ensure no errors

### Phase 3: Server Audit (~5 min) ✅ COMPLETE

-   [x] Verify Shared/DTOs/ only contains cross-context types (BaseQueryRequest, PagedResult, Result)
-   [x] Verify Identity/DTOs/ naming convention (*Request, *Response, \*Dto)
-   [x] Verify Identity/Entities/ naming convention (plain names: User, RefreshToken, etc.)
-   [x] Verify Logging and ApiTracking follow same conventions

### Phase 4: Client Audit (~5 min) ✅ COMPLETE

-   [x] Verify `user.model.ts` has JSDoc comment (`/** User model from API. Matches backend UserDto structure. */`)
-   [x] Verify `log.model.ts` has Dto suffix (`LogDto`)
-   [x] Run `npm test` to verify (811 tests passing)

### Phase 5: Move AuthResult to Models (~5 min) ✅ COMPLETE

-   [x] Create `Identity/Models/` folder
-   [x] Move `AuthResult.cs` from `Identity/DTOs/` to `Identity/Models/`
-   [x] Verify namespace is still `SeventySix.Identity`
-   [x] Run `dotnet build` - ensure no errors
-   [x] Run `dotnet test` - ensure all tests pass (596 tests passing)

---

## Risk Assessment

| Risk                                 | Likelihood | Mitigation                                |
| ------------------------------------ | ---------- | ----------------------------------------- |
| Namespace change breaks builds       | Medium     | Build after each file creation            |
| Test file moves break test discovery | Low        | Verify test count before/after            |
| Missing using statement              | Medium     | IDE will show errors immediately          |
| Circular dependency introduced       | Low        | Identity → Shared is allowed, not reverse |

---

## Verification Commands

```powershell
# Phase 2 - After creating new files (before deleting old)
cd c:\SeventySix\SeventySix.Server
dotnet build --no-restore

# Phase 2 - After deleting old files
dotnet build
dotnet test

# Final verification - Compare test counts
dotnet test --no-build --verbosity quiet | Select-String "total:"

# Phase 4 - Client tests
cd c:\SeventySix\SeventySix.Client
npm test
```

---

## Code Smell Check

| Potential Issue                      | Status   | Notes                                                       |
| ------------------------------------ | -------- | ----------------------------------------------------------- |
| DRY violation in Settings            | ✅ None  | Settings are distinct, no duplication                       |
| Unused `using` statements after move | ⚠️ Clean | Remove old `using SeventySix.Shared;`                       |
| Test file in wrong location          | ⚠️ Fix   | `JwtSettingsValidatorTests.cs` should be in Identity folder |
| `AuthResult` in wrong folder         | ⚠️ Fix   | Move from `DTOs/` to `Models/` (Phase 5)                    |
| Hardcoded values in Settings         | ✅ None  | All use `appsettings.json` binding                          |

---

## Summary

| Phase                    | Effort | Impact                                 |
| ------------------------ | ------ | -------------------------------------- |
| Phase 1: Docs            | 10 min | High - Establishes conventions         |
| Phase 2: Move Settings   | 30 min | High - Fixes bounded context violation |
| Phase 3: Server Audit    | 5 min  | Low - Verification only                |
| Phase 4: Client Audit    | 5 min  | Low - Verification only                |
| Phase 5: Move AuthResult | 5 min  | Medium - Completes DTO/Model pattern   |

**Total Estimated Time**: ~55 minutes

**Key Benefits**:

1. Identity context is self-contained with its authentication/authorization configuration
2. Clear separation: DTOs (API), Entities (DB), Models (internal)
3. Bounded context principle properly followed

---

## Post-Implementation Verification

```powershell
# Final check - ensure no references to old locations
cd c:\SeventySix\SeventySix.Server
Select-String -Path "**/*.cs" -Pattern "SeventySix\.Shared.*JwtSettings|SeventySix\.Shared.*AuthSettings" -Recurse

# Should return no matches
```
