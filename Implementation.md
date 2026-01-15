# POCO Reorganization & Naming Convention Implementation Plan

## Executive Summary

This plan reorganizes all POCO (Plain Old CLR Object) types across the SeventySix codebase into a consistent, intuitive folder structure with clear naming conventions. The goal is to eliminate confusion between `DTOs/`, `Entities/`, and `Models/` folders by consolidating into a unified `POCOs/` folder with **four** purpose-driven subfolders.

### Core Principles

| Principle | Application                                                              |
| --------- | ------------------------------------------------------------------------ |
| **KISS**  | 4 folders with intuitive folder=suffix mapping; no complex hierarchies   |
| **DRY**   | Single source of truth for naming conventions in copilot-instructions.md |
| **YAGNI** | Only create folders with files; no empty placeholder folders             |
| **TDD**   | Existing tests validate functionality; no new tests for file locations   |

### Key Design Decisions

| Decision                            | Rationale                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| **4 folders**                       | Folder name = File suffix (intuitive navigation)                              |
| **Keep `*Request` naming**          | `UserQueryRequest` IS an API request (used with `[FromQuery]`) - don't rename |
| **Separate Results from Responses** | `*Response` = API contract, `*Result` = internal outcome (different purposes) |
| **Commands/Queries stay put**       | Already correctly colocated with handlers - no change needed                  |

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Naming Conventions](#3-naming-conventions)
4. [Implementation Phases](#4-implementation-phases)
5. [Detailed Migration Tasks](#5-detailed-migration-tasks)
6. [Client-Side Impact](#6-client-side-impact)
7. [Testing Strategy](#7-testing-strategy)
8. [Risk Mitigation](#8-risk-mitigation)
9. [Acceptance Criteria](#9-acceptance-criteria)

---

## 1. Current State Analysis

### 1.1 Current Server Structure Problems

**Identity Domain (`SeventySix.Domains/Identity/`):**

```
├── DTOs/                    # ❌ MIXED: Contains Requests, Responses, AND DTOs
│   ├── AuthResponse.cs      # Should be: POCOs/Responses/
│   ├── LoginRequest.cs      # Should be: POCOs/Requests/
│   ├── UserDto.cs           # Should be: POCOs/DTOs/
│   ├── UserQueryRequest.cs  # Should be: POCOs/Requests/ (NOT Parameters!)
│   └── ...18 files mixed
├── Entities/                # ✅ KEEP: Domain entities stay here
│   ├── ApplicationUser.cs
│   ├── RefreshToken.cs
│   └── ...
├── Models/                  # ❌ REMOVE: "Models" is ambiguous
│   ├── AuthResult.cs        # Should be: POCOs/Results/ (internal result)
│   └── OAuthCodeExchangeResult.cs
├── Commands/                # ✅ KEEP: Command + Handler colocated (NO CHANGE)
│   └── Login/
│       ├── LoginCommand.cs
│       ├── LoginCommandHandler.cs
│       └── LoginCommandValidator.cs
└── Queries/                 # ✅ KEEP: Query + Handler colocated (NO CHANGE)
    └── GetUserById/
        ├── GetUserByIdQuery.cs
        └── GetUserByIdQueryHandler.cs
```

**Logging Domain (`SeventySix.Domains/Logging/`):**

```
├── DTOs/                    # ❌ Same problems
│   ├── CreateLogRequest.cs  # Should be POCOs/Requests/
│   ├── LogDto.cs            # Should be POCOs/DTOs/
│   └── LogQueryRequest.cs   # Should be POCOs/Requests/ (IS a request!)
```

**ApiTracking Domain (`SeventySix.Domains/ApiTracking/`):**

```
├── DTOs/                    # ❌ Misleading names
│   ├── ThirdPartyApiRequestResponse.cs  # Should be ThirdPartyApiRequestDto
│   └── ThirdPartyApiStatisticsResponse.cs  # Should be ThirdPartyApiStatisticsDto
```

**Shared Project (`SeventySix.Shared/`):**

```
├── DTOs/                    # ❌ Mixed types
│   ├── BaseQueryRequest.cs  # Should be POCOs/Requests/
│   ├── PagedResult.cs       # Should be POCOs/Responses/
│   └── Result.cs            # Should be POCOs/Responses/
├── Entities/                # ✅ OK: Interfaces for entities
```

### 1.2 Identified Code Smells

| Issue              | Location                         | Impact                               | Resolution                                   |
| ------------------ | -------------------------------- | ------------------------------------ | -------------------------------------------- |
| Mixed naming       | `AuthResponse` vs `AuthResult`   | Different purposes (API vs internal) | Separate folders: `Responses/` vs `Results/` |
| Wrong folders      | All `*Request` in `DTOs/` folder | Requests are API contracts           | Move to `POCOs/Requests/`                    |
| Ambiguous "Models" | `Identity/Models/`               | "Model" means nothing specific       | Remove folder entirely                       |
| Misleading suffix  | `ThirdPartyApiRequestResponse`   | Not an API response, it's a DTO      | Rename to `*Dto`                             |

### 1.3 What's CORRECT (Don't Change)

| Item               | Location                                  | Why It's Correct                    |
| ------------------ | ----------------------------------------- | ----------------------------------- |
| `LoginCommand`     | `Commands/Login/LoginCommand.cs`          | CQRS command colocated with handler |
| `GetUserByIdQuery` | `Queries/GetUserById/GetUserByIdQuery.cs` | CQRS query colocated with handler   |
| `ApplicationUser`  | `Entities/ApplicationUser.cs`             | Domain entity, not a POCO           |
| `*Validator`       | Same folder as Command/Query              | Validation logic colocated          |

---

## 2. Target Architecture

### 2.1 Intuitive Folder Structure (4 Folders)

**Core Principle:** Folder name = File suffix (no confusion)

**Domain Structure (Identity, Logging, ApiTracking):**

```
{Domain}/
├── Commands/                 # ✅ UNCHANGED - Command + Handler + Validator colocated
│   └── Login/
│       ├── LoginCommand.cs
│       ├── LoginCommandHandler.cs
│       └── LoginCommandValidator.cs
├── Queries/                  # ✅ UNCHANGED - Query + Handler colocated
│   └── GetUserById/
│       ├── GetUserByIdQuery.cs
│       └── GetUserByIdQueryHandler.cs
├── Entities/                 # ✅ UNCHANGED - Domain entities
│   ├── ApplicationUser.cs
│   └── RefreshToken.cs
├── POCOs/                    # 🆕 NEW CONSOLIDATED FOLDER
│   ├── DTOs/                 # Read-only entity projections (*Dto suffix)
│   │   ├── UserDto.cs
│   │   ├── UserProfileDto.cs
│   │   └── AvailableRoleDto.cs
│   ├── Requests/             # ALL input objects (*Request suffix)
│   │   ├── LoginRequest.cs
│   │   ├── CreateUserRequest.cs
│   │   ├── UpdateProfileRequest.cs
│   │   └── UserQueryRequest.cs
│   ├── Responses/            # API contract outputs (*Response suffix)
│   │   └── AuthResponse.cs
│   └── Results/              # Internal operation outcomes (*Result suffix)
│       ├── AuthResult.cs
│       └── OAuthCodeExchangeResult.cs
├── Services/                 # ✅ UNCHANGED
├── Repositories/             # ✅ UNCHANGED
├── Interfaces/               # ✅ UNCHANGED
├── Infrastructure/           # ✅ UNCHANGED
├── Configurations/           # ✅ UNCHANGED
├── Constants/                # ✅ UNCHANGED
├── Settings/                 # ✅ UNCHANGED
├── Extensions/               # ✅ UNCHANGED
├── Helpers/                  # ✅ UNCHANGED
├── Utilities/                # ✅ UNCHANGED
├── Jobs/                     # ✅ UNCHANGED
├── Migrations/               # ✅ UNCHANGED
└── Exceptions/               # ✅ UNCHANGED
```

**Shared Project Structure:**

```
SeventySix.Shared/
├── POCOs/                    # 🆕 NEW CONSOLIDATED FOLDER
│   ├── DTOs/                 # Shared DTOs used across domains (*Dto suffix)
│   │   └── CombinedRegistrationToken.cs
│   ├── Requests/             # Base request types (*Request suffix)
│   │   └── BaseQueryRequest.cs
│   └── Results/              # Shared result patterns (*Result suffix)
│       ├── Result.cs
│       └── PagedResult.cs
├── Entities/                 # ✅ KEEP: Entity interfaces
├── Constants/                # ✅ UNCHANGED
├── Interfaces/               # ✅ UNCHANGED
├── Extensions/               # ✅ UNCHANGED
└── ...
```

### 2.2 Folder Purpose Reference

| Folder             | Contains                                  | Naming Pattern                | Example                            |
| ------------------ | ----------------------------------------- | ----------------------------- | ---------------------------------- |
| `POCOs/DTOs/`      | Read-only entity projections              | `{Entity}Dto`                 | `UserDto`, `LogDto`                |
| `POCOs/Requests/`  | ALL inputs (body, query, method params)   | `{Action}Request`             | `LoginRequest`, `UserQueryRequest` |
| `POCOs/Responses/` | API contract outputs (HTTP response body) | `{Action}Response`            | `AuthResponse`                     |
| `POCOs/Results/`   | Internal operation outcomes               | `{Action}Result`              | `AuthResult`, `Result<T>`          |
| `Commands/`        | CQRS command + handler + validator        | `{Verb}{Entity}Command`       | `CreateUserCommand`                |
| `Queries/`         | CQRS query + handler                      | `Get{Entity}[By{Field}]Query` | `GetUserByIdQuery`                 |
| `Entities/`        | Domain entities                           | `{Entity}`                    | `ApplicationUser`, `Log`           |

### 2.3 Why 4 Folders, Not 5

**Original (Over-Engineered):**

```
POCOs/
├── DTOs/
├── Requests/
├── Responses/
├── Parameters/      # ❌ Redundant - these ARE requests
└── Results/
```

**Optimal (Folder = Suffix):**

```
POCOs/
├── DTOs/           # *Dto suffix
├── Requests/       # *Request suffix
├── Responses/      # *Response suffix (API contracts)
└── Results/        # *Result suffix (internal outcomes)
```

**Why 4 Folders is Optimal:**

-   `UserQueryRequest` uses `[FromQuery]` in controller → It IS a request, not a "parameter" ❌ No Parameters folder
-   `AuthResponse` = API contract (exposed to clients) → Goes in `Responses/`
-   `AuthResult` = Internal outcome (has Success/Error) → Goes in `Results/`
-   **Folder name = File suffix** → Developer instantly knows where to find/create files

---

## 3. Naming Conventions

### 3.1 POCO Naming Rules

| Type     | Suffix     | Folder               | When to Use                                      | Example                            |
| -------- | ---------- | -------------------- | ------------------------------------------------ | ---------------------------------- |
| DTO      | `Dto`      | `POCOs/DTOs/`        | Read-only entity projection for clients          | `UserDto`, `LogDto`                |
| Request  | `Request`  | `POCOs/Requests/`    | ANY input (HTTP body, query params)              | `LoginRequest`, `UserQueryRequest` |
| Response | `Response` | `POCOs/Responses/`   | API endpoint output (HTTP response body)         | `AuthResponse`                     |
| Result   | `Result`   | `POCOs/Results/`     | Internal operation outcome (not exposed via API) | `AuthResult`, `Result<T>`          |
| Command  | `Command`  | `Commands/{Action}/` | CQRS write operation (colocated with handler)    | `CreateUserCommand`                |
| Query    | `Query`    | `Queries/{Action}/`  | CQRS read operation (colocated with handler)     | `GetUserByIdQuery`                 |

### 3.2 Response vs Result Distinction

| Scenario                          | Suffix     | Folder             | Example                       |
| --------------------------------- | ---------- | ------------------ | ----------------------------- |
| HTTP POST/PUT body input          | `Request`  | `POCOs/Requests/`  | `LoginRequest`                |
| HTTP query parameters input       | `Request`  | `POCOs/Requests/`  | `UserQueryRequest`            |
| HTTP response body (API contract) | `Response` | `POCOs/Responses/` | `AuthResponse`                |
| Handler return value (internal)   | `Result`   | `POCOs/Results/`   | `AuthResult`                  |
| Generic result wrapper            | `Result`   | `POCOs/Results/`   | `Result<T>`, `PagedResult<T>` |

**Key Distinction:**

-   `*Response` = **External** - What the API client sees (HTTP response body)
-   `*Result` = **Internal** - What the handler/service returns (includes success/error info)

### 3.3 Files That Need Renaming

| Current Name                         | New Name                        | Reason                                     |
| ------------------------------------ | ------------------------------- | ------------------------------------------ |
| `ThirdPartyApiRequestResponse.cs`    | `ThirdPartyApiRequestDto.cs`    | It's a DTO projection, not an API response |
| `ThirdPartyApiStatisticsResponse.cs` | `ThirdPartyApiStatisticsDto.cs` | It's a DTO projection, not an API response |

### 3.4 Files That Stay the Same

| File                  | Why No Rename                                           |
| --------------------- | ------------------------------------------------------- |
| `UserQueryRequest.cs` | It IS a request - used with `[FromQuery]` in controller |
| `LogQueryRequest.cs`  | It IS a request - used with `[FromQuery]` in controller |
| `BaseQueryRequest.cs` | It IS a base request class - naming is correct          |
| `AuthResult.cs`       | It IS an internal result - naming is correct            |
| `PagedResult.cs`      | It IS a result wrapper - naming is correct              |

### 3.5 Namespace Convention

All POCOs keep the flat domain namespace pattern:

```csharp
namespace SeventySix.Identity;          // ✅ All Identity POCOs
namespace SeventySix.Logging;           // ✅ All Logging POCOs
namespace SeventySix.ApiTracking;       // ✅ All ApiTracking POCOs
namespace SeventySix.Shared.POCOs;      // ✅ Shared POCOs (new namespace)
```

---

## 4. Implementation Phases

### Phase Overview

| Phase       | Description                  | Estimated Effort | Risk   |
| ----------- | ---------------------------- | ---------------- | ------ |
| **Phase 1** | Identity Domain Migration    | 1.5-2 hours      | Low    |
| **Phase 2** | Logging Domain Migration     | 30 min           | Low    |
| **Phase 3** | ApiTracking Domain Migration | 30 min           | Low    |
| **Phase 4** | Shared Project Migration     | 45 min           | Low    |
| **Phase 5** | API Project Validation       | 15 min           | Low    |
| **Phase 6** | Client OpenAPI Regeneration  | 20 min           | Medium |
| **Phase 7** | Documentation Update         | 30 min           | Low    |
| **Phase 8** | Final Validation & Cleanup   | 30 min           | Low    |

**Total Estimated Time: 4.5-5.5 hours**

---

## 5. Detailed Migration Tasks

### Phase 1: Identity Domain Migration

#### 1.1 Create POCOs Folder Structure

```powershell
# Create new folder structure (4 folders - folder name = suffix)
New-Item -ItemType Directory -Path "SeventySix.Domains/Identity/POCOs"
New-Item -ItemType Directory -Path "SeventySix.Domains/Identity/POCOs/DTOs"
New-Item -ItemType Directory -Path "SeventySix.Domains/Identity/POCOs/Requests"
New-Item -ItemType Directory -Path "SeventySix.Domains/Identity/POCOs/Responses"
New-Item -ItemType Directory -Path "SeventySix.Domains/Identity/POCOs/Results"
```

#### 1.2 File Migrations

**DTOs (5 files):**

| From                                 | To                                         |
| ------------------------------------ | ------------------------------------------ |
| `DTOs/UserDto.cs`                    | `POCOs/DTOs/UserDto.cs`                    |
| `DTOs/UserProfileDto.cs`             | `POCOs/DTOs/UserProfileDto.cs`             |
| `DTOs/AvailableRoleDto.cs`           | `POCOs/DTOs/AvailableRoleDto.cs`           |
| `DTOs/PermissionRequestDto.cs`       | `POCOs/DTOs/PermissionRequestDto.cs`       |
| `DTOs/CreatePermissionRequestDto.cs` | `POCOs/DTOs/CreatePermissionRequestDto.cs` |

**Requests (12 files):**

| From                                  | To                                              |
| ------------------------------------- | ----------------------------------------------- |
| `DTOs/LoginRequest.cs`                | `POCOs/Requests/LoginRequest.cs`                |
| `DTOs/RegisterRequest.cs`             | `POCOs/Requests/RegisterRequest.cs`             |
| `DTOs/CreateUserRequest.cs`           | `POCOs/Requests/CreateUserRequest.cs`           |
| `DTOs/UpdateUserRequest.cs`           | `POCOs/Requests/UpdateUserRequest.cs`           |
| `DTOs/UpdateProfileRequest.cs`        | `POCOs/Requests/UpdateProfileRequest.cs`        |
| `DTOs/ChangePasswordRequest.cs`       | `POCOs/Requests/ChangePasswordRequest.cs`       |
| `DTOs/SetPasswordRequest.cs`          | `POCOs/Requests/SetPasswordRequest.cs`          |
| `DTOs/ForgotPasswordRequest.cs`       | `POCOs/Requests/ForgotPasswordRequest.cs`       |
| `DTOs/InitiateRegistrationRequest.cs` | `POCOs/Requests/InitiateRegistrationRequest.cs` |
| `DTOs/CompleteRegistrationRequest.cs` | `POCOs/Requests/CompleteRegistrationRequest.cs` |
| `DTOs/OAuthCodeExchangeRequest.cs`    | `POCOs/Requests/OAuthCodeExchangeRequest.cs`    |
| `DTOs/UserQueryRequest.cs`            | `POCOs/Requests/UserQueryRequest.cs`            |

**Responses (1 file):**

| From                   | To                                |
| ---------------------- | --------------------------------- |
| `DTOs/AuthResponse.cs` | `POCOs/Responses/AuthResponse.cs` |

**Results (2 files):**

| From                                | To                                         |
| ----------------------------------- | ------------------------------------------ |
| `Models/AuthResult.cs`              | `POCOs/Results/AuthResult.cs`              |
| `Models/OAuthCodeExchangeResult.cs` | `POCOs/Results/OAuthCodeExchangeResult.cs` |

#### 1.3 Delete Empty Folders

```powershell
# After migration, remove empty folders
Remove-Item -Path "SeventySix.Domains/Identity/DTOs" -Recurse
Remove-Item -Path "SeventySix.Domains/Identity/Models" -Recurse
```

#### 1.4 What Stays Unchanged

-   `Commands/` folder - All command files stay with their handlers
-   `Queries/` folder - All query files stay with their handlers
-   `Entities/` folder - Domain entities are not POCOs
-   All validators stay colocated with their Command/Query

---

### Phase 2: Logging Domain Migration

#### 2.1 Create POCOs Folder Structure

```powershell
New-Item -ItemType Directory -Path "SeventySix.Domains/Logging/POCOs"
New-Item -ItemType Directory -Path "SeventySix.Domains/Logging/POCOs/DTOs"
New-Item -ItemType Directory -Path "SeventySix.Domains/Logging/POCOs/Requests"
```

#### 2.2 File Migrations

| From                       | To                                   |
| -------------------------- | ------------------------------------ |
| `DTOs/LogDto.cs`           | `POCOs/DTOs/LogDto.cs`               |
| `DTOs/CreateLogRequest.cs` | `POCOs/Requests/CreateLogRequest.cs` |
| `DTOs/LogQueryRequest.cs`  | `POCOs/Requests/LogQueryRequest.cs`  |

#### 2.3 Delete Empty Folders

```powershell
Remove-Item -Path "SeventySix.Domains/Logging/DTOs" -Recurse
```

---

### Phase 3: ApiTracking Domain Migration

#### 3.1 Create POCOs Folder Structure

```powershell
New-Item -ItemType Directory -Path "SeventySix.Domains/ApiTracking/POCOs"
New-Item -ItemType Directory -Path "SeventySix.Domains/ApiTracking/POCOs/DTOs"
```

#### 3.2 File Migrations (WITH RENAMES)

| From                                      | To                                         | Notes      |
| ----------------------------------------- | ------------------------------------------ | ---------- |
| `DTOs/ThirdPartyApiRequestResponse.cs`    | `POCOs/DTOs/ThirdPartyApiRequestDto.cs`    | **RENAME** |
| `DTOs/ThirdPartyApiStatisticsResponse.cs` | `POCOs/DTOs/ThirdPartyApiStatisticsDto.cs` | **RENAME** |

#### 3.3 Update Class Names

```csharp
// Before
public record ThirdPartyApiRequestResponse(
	int Id,
	string ApiName,
	DateTime RequestedAt);

// After
public record ThirdPartyApiRequestDto(
	int Id,
	string ApiName,
	DateTime RequestedAt);
```

```csharp
// Before
public record ThirdPartyApiStatisticsResponse(
	int TotalRequests,
	int SuccessCount,
	int FailureCount);

// After
public record ThirdPartyApiStatisticsDto(
	int TotalRequests,
	int SuccessCount,
	int FailureCount);
```

#### 3.4 Delete Empty Folders

```powershell
Remove-Item -Path "SeventySix.Domains/ApiTracking/DTOs" -Recurse
```

---

### Phase 4: Shared Project Migration

#### 4.1 Create POCOs Folder Structure

```powershell
New-Item -ItemType Directory -Path "SeventySix.Shared/POCOs"
New-Item -ItemType Directory -Path "SeventySix.Shared/POCOs/DTOs"
New-Item -ItemType Directory -Path "SeventySix.Shared/POCOs/Requests"
New-Item -ItemType Directory -Path "SeventySix.Shared/POCOs/Results"
```

#### 4.2 File Migrations

| From                                | To                                        | Namespace Change          |
| ----------------------------------- | ----------------------------------------- | ------------------------- |
| `DTOs/CombinedRegistrationToken.cs` | `POCOs/DTOs/CombinedRegistrationToken.cs` | `SeventySix.Shared.POCOs` |
| `DTOs/BaseQueryRequest.cs`          | `POCOs/Requests/BaseQueryRequest.cs`      | `SeventySix.Shared.POCOs` |
| `DTOs/PagedResult.cs`               | `POCOs/Results/PagedResult.cs`            | `SeventySix.Shared.POCOs` |
| `DTOs/Result.cs`                    | `POCOs/Results/Result.cs`                 | `SeventySix.Shared.POCOs` |

#### 4.3 Update Namespaces

```csharp
// Before
namespace SeventySix.Shared.DTOs;

public record BaseQueryRequest(
	int Page,
	int PageSize);

// After
namespace SeventySix.Shared.POCOs;

public record BaseQueryRequest(
	int Page,
	int PageSize);
```

#### 4.4 Update All Domain References

Update using statements in all files that reference Shared POCOs:

```csharp
// Before (in UserQueryRequest.cs)
using SeventySix.Shared.DTOs;

namespace SeventySix.Identity;

public record UserQueryRequest(
	int Page,
	int PageSize,
	string? SearchTerm) : BaseQueryRequest(
		Page,
		PageSize);

// After
using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

public record UserQueryRequest(
	int Page,
	int PageSize,
	string? SearchTerm) : BaseQueryRequest(
		Page,
		PageSize);
```

**Files to update:**

-   `Identity/POCOs/Requests/UserQueryRequest.cs`
-   `Logging/POCOs/Requests/LogQueryRequest.cs`
-   All query handlers using `PagedResult<T>`
-   All services using `Result<T>`

#### 4.5 Delete Empty Folders

```powershell
Remove-Item -Path "SeventySix.Shared/DTOs" -Recurse
```

---

### Phase 5: API Project Validation

#### 5.1 Verify Controller Imports

Check all controllers in `SeventySix.Api/Controllers/V1/`:

-   `AuthController.cs` - Uses `LoginRequest`, `AuthResponse`, etc.
-   `UsersController.cs` - Uses `UserDto`, `CreateUserRequest`, `UserQueryRequest`
-   `LogsController.cs` - Uses `LogDto`, `CreateLogRequest`, `LogQueryRequest`
-   `ThirdPartyApiRequestsController.cs` - Uses renamed DTOs

All should compile since domain namespaces are unchanged.

#### 5.2 Update ApiTracking References

Find and replace in API project:

```csharp
// Before
ThirdPartyApiRequestResponse
ThirdPartyApiStatisticsResponse

// After
ThirdPartyApiRequestDto
ThirdPartyApiStatisticsDto
```

---

### Phase 6: Client OpenAPI Regeneration

#### 6.1 Regenerate TypeScript Types

```powershell
cd SeventySix.Client
npm run generate:openapi
```

#### 6.2 Verify Generated Types

The OpenAPI spec will reflect renamed types:

-   `ThirdPartyApiRequestResponse` → `ThirdPartyApiRequestDto`
-   `ThirdPartyApiStatisticsResponse` → `ThirdPartyApiStatisticsDto`

#### 6.3 Update Client Domain Models

Update `domains/admin/models/index.ts` if referencing renamed types:

```typescript
// Before
export type ThirdPartyApiRequestResponse = components["schemas"]["ThirdPartyApiRequestResponse"];

// After
export type ThirdPartyApiRequestDto = components["schemas"]["ThirdPartyApiRequestDto"];
```

---

### Phase 7: Documentation Update

#### 7.1 Update Copilot Instructions

Update `.github/copilot-instructions.md` with new folder structure:

```markdown
### Server File Locations

| Type      | Location in Domain          | Namespace             |
| --------- | --------------------------- | --------------------- |
| Commands  | `{Domain}/Commands/`        | `SeventySix.{Domain}` |
| Queries   | `{Domain}/Queries/`         | `SeventySix.{Domain}` |
| DTOs      | `{Domain}/POCOs/DTOs/`      | `SeventySix.{Domain}` |
| Requests  | `{Domain}/POCOs/Requests/`  | `SeventySix.{Domain}` |
| Responses | `{Domain}/POCOs/Responses/` | `SeventySix.{Domain}` |
| Results   | `{Domain}/POCOs/Results/`   | `SeventySix.{Domain}` |
| Entities  | `{Domain}/Entities/`        | `SeventySix.{Domain}` |
| DbContext | `{Domain}/Infrastructure/`  | `SeventySix.{Domain}` |
| ...       | ...                         | ...                   |
```

---

### Phase 8: Final Validation & Cleanup

#### 8.1 Build Validation

```powershell
# Server
cd SeventySix.Server
dotnet build SeventySix.Server.slnx

# Client
cd SeventySix.Client
npm run build
```

#### 8.2 Run All Tests

```powershell
# Server tests
cd SeventySix.Server
dotnet test

# Client tests
cd SeventySix.Client
npm test
```

#### 8.3 Verify No Empty Folders Remain

```powershell
# Check for empty DTOs/Models folders
Get-ChildItem -Path "SeventySix.Domains" -Directory -Recurse | Where-Object { $_.Name -eq "DTOs" -or $_.Name -eq "Models" }
```

---

## 6. Client-Side Impact

### 6.1 Expected Changes

| Change                                                           | Impact               | Action Required                  |
| ---------------------------------------------------------------- | -------------------- | -------------------------------- |
| `ThirdPartyApiRequestResponse` → `ThirdPartyApiRequestDto`       | OpenAPI type renamed | Regenerate types, update imports |
| `ThirdPartyApiStatisticsResponse` → `ThirdPartyApiStatisticsDto` | OpenAPI type renamed | Regenerate types, update imports |
| All other types                                                  | No change            | None                             |

### 6.2 No Client Changes Needed For

-   `UserQueryRequest` - Name unchanged
-   `LogQueryRequest` - Name unchanged
-   `BaseQueryRequest` - Name unchanged (internal to server anyway)
-   All other Request/Response/DTO types - Names unchanged

---

## 7. Testing Strategy

### 7.1 TDD Approach (80/20 Rule)

**Core Principles:**

-   **KISS**: Simple file moves, no over-engineering
-   **DRY**: One source of truth for folder conventions
-   **YAGNI**: Only create folders that have files (no empty `Responses/` in Logging)

Focus testing on **critical paths only** (no excessive test coverage):

| Area                | Test Focus             | Priority |
| ------------------- | ---------------------- | -------- |
| Build compilation   | All projects compile   | P0       |
| Existing unit tests | All pass unchanged     | P0       |
| API integration     | OpenAPI spec generates | P1       |
| Client build        | Angular compiles       | P1       |

### 7.2 No New Tests Required

This is a **structural refactor only**:

-   No logic changes
-   Minimal API contract changes (2 DTO renames)
-   No behavior changes
-   Existing tests validate functionality

**Why no new tests?** Per 80/20 rule, existing tests cover functionality. Adding tests for file locations adds maintenance burden without value.

### 7.3 Validation Checklist

-   [ ] `dotnet build SeventySix.Server.slnx` passes
-   [ ] `dotnet test` passes (all existing tests)
-   [ ] `npm run build` passes in Client
-   [ ] `npm test` passes in Client
-   [ ] OpenAPI spec generates without errors
-   [ ] No runtime errors in dev environment

---

## 8. Risk Mitigation

### 8.1 Low Risk Factors

-   **No code logic changes** - Only file moves
-   **Minimal renames** - Only 2 files renamed
-   **Namespaces mostly unchanged** - Domain POCOs keep flat namespace
-   **Version control** - Easy rollback if issues

### 8.2 Medium Risk Factors

-   **Shared namespace change** - `SeventySix.Shared.DTOs` → `SeventySix.Shared.POCOs`
    -   **Mitigation**: Update all using statements in one commit
-   **OpenAPI DTO renames** - May affect client components
    -   **Mitigation**: Regenerate client types immediately after server changes

### 8.3 Rollback Plan

If issues arise:

```powershell
git revert HEAD  # Revert last commit
```

---

## 9. Acceptance Criteria

### 9.1 Structural Criteria

-   [ ] All domains have `POCOs/` folder with subfolders as needed: `DTOs/`, `Requests/`, `Responses/`, `Results/`
-   [ ] `DTOs/` and `Models/` folders removed from all domains
-   [ ] Shared project uses `POCOs/` folder structure with `Results/` for result types
-   [ ] Commands stay in `Commands/` folder with handlers
-   [ ] Queries stay in `Queries/` folder with handlers
-   [ ] Entities stay in `Entities/` folder

### 9.2 Naming Criteria (Folder = Suffix)

-   [ ] All DTOs end with `Dto` suffix and are in `POCOs/DTOs/`
-   [ ] All Requests end with `Request` suffix and are in `POCOs/Requests/`
-   [ ] All Responses end with `Response` suffix and are in `POCOs/Responses/`
-   [ ] All Results end with `Result` suffix and are in `POCOs/Results/`
-   [ ] No misleading `*Response` suffix on DTOs (ApiTracking fixed)

### 9.3 Quality Criteria

-   [ ] All builds pass (Server + Client)
-   [ ] All existing tests pass
-   [ ] OpenAPI spec generates correctly
-   [ ] `.github/copilot-instructions.md` updated
-   [ ] Only 2 breaking changes to API contracts (DTO renames)

---

## Appendix A: Complete File Migration Checklist

### Identity Domain (20 files)

| #   | Current Path                          | New Path                                        | Action |
| --- | ------------------------------------- | ----------------------------------------------- | ------ |
| 1   | `DTOs/UserDto.cs`                     | `POCOs/DTOs/UserDto.cs`                         | Move   |
| 2   | `DTOs/UserProfileDto.cs`              | `POCOs/DTOs/UserProfileDto.cs`                  | Move   |
| 3   | `DTOs/AvailableRoleDto.cs`            | `POCOs/DTOs/AvailableRoleDto.cs`                | Move   |
| 4   | `DTOs/PermissionRequestDto.cs`        | `POCOs/DTOs/PermissionRequestDto.cs`            | Move   |
| 5   | `DTOs/CreatePermissionRequestDto.cs`  | `POCOs/DTOs/CreatePermissionRequestDto.cs`      | Move   |
| 6   | `DTOs/LoginRequest.cs`                | `POCOs/Requests/LoginRequest.cs`                | Move   |
| 7   | `DTOs/RegisterRequest.cs`             | `POCOs/Requests/RegisterRequest.cs`             | Move   |
| 8   | `DTOs/CreateUserRequest.cs`           | `POCOs/Requests/CreateUserRequest.cs`           | Move   |
| 9   | `DTOs/UpdateUserRequest.cs`           | `POCOs/Requests/UpdateUserRequest.cs`           | Move   |
| 10  | `DTOs/UpdateProfileRequest.cs`        | `POCOs/Requests/UpdateProfileRequest.cs`        | Move   |
| 11  | `DTOs/ChangePasswordRequest.cs`       | `POCOs/Requests/ChangePasswordRequest.cs`       | Move   |
| 12  | `DTOs/SetPasswordRequest.cs`          | `POCOs/Requests/SetPasswordRequest.cs`          | Move   |
| 13  | `DTOs/ForgotPasswordRequest.cs`       | `POCOs/Requests/ForgotPasswordRequest.cs`       | Move   |
| 14  | `DTOs/InitiateRegistrationRequest.cs` | `POCOs/Requests/InitiateRegistrationRequest.cs` | Move   |
| 15  | `DTOs/CompleteRegistrationRequest.cs` | `POCOs/Requests/CompleteRegistrationRequest.cs` | Move   |
| 16  | `DTOs/OAuthCodeExchangeRequest.cs`    | `POCOs/Requests/OAuthCodeExchangeRequest.cs`    | Move   |
| 17  | `DTOs/UserQueryRequest.cs`            | `POCOs/Requests/UserQueryRequest.cs`            | Move   |
| 18  | `DTOs/AuthResponse.cs`                | `POCOs/Responses/AuthResponse.cs`               | Move   |
| 19  | `Models/AuthResult.cs`                | `POCOs/Results/AuthResult.cs`                   | Move   |
| 20  | `Models/OAuthCodeExchangeResult.cs`   | `POCOs/Results/OAuthCodeExchangeResult.cs`      | Move   |

### Logging Domain (3 files)

| #   | Current Path               | New Path                             | Action |
| --- | -------------------------- | ------------------------------------ | ------ |
| 1   | `DTOs/LogDto.cs`           | `POCOs/DTOs/LogDto.cs`               | Move   |
| 2   | `DTOs/CreateLogRequest.cs` | `POCOs/Requests/CreateLogRequest.cs` | Move   |
| 3   | `DTOs/LogQueryRequest.cs`  | `POCOs/Requests/LogQueryRequest.cs`  | Move   |

### ApiTracking Domain (2 files)

| #   | Current Path                              | New Path                                   | Action            |
| --- | ----------------------------------------- | ------------------------------------------ | ----------------- |
| 1   | `DTOs/ThirdPartyApiRequestResponse.cs`    | `POCOs/DTOs/ThirdPartyApiRequestDto.cs`    | Move + **RENAME** |
| 2   | `DTOs/ThirdPartyApiStatisticsResponse.cs` | `POCOs/DTOs/ThirdPartyApiStatisticsDto.cs` | Move + **RENAME** |

### Shared Project (4 files)

| #   | Current Path                        | New Path                                  | Action           |
| --- | ----------------------------------- | ----------------------------------------- | ---------------- |
| 1   | `DTOs/CombinedRegistrationToken.cs` | `POCOs/DTOs/CombinedRegistrationToken.cs` | Move + namespace |
| 2   | `DTOs/BaseQueryRequest.cs`          | `POCOs/Requests/BaseQueryRequest.cs`      | Move + namespace |
| 3   | `DTOs/PagedResult.cs`               | `POCOs/Results/PagedResult.cs`            | Move + namespace |
| 4   | `DTOs/Result.cs`                    | `POCOs/Results/Result.cs`                 | Move + namespace |

---

## Appendix B: Namespace Update Reference

### Shared Project Namespace Change

```csharp
// Before
namespace SeventySix.Shared.DTOs;

// After
namespace SeventySix.Shared.POCOs;
```

### Files Requiring Using Statement Updates

All files that import from `SeventySix.Shared.DTOs`:

```csharp
// Before
using SeventySix.Shared.DTOs;

// After
using SeventySix.Shared.POCOs;
```

**Impacted files (search for `using SeventySix.Shared.DTOs`):**

-   Domain query request files
-   Query handlers returning `PagedResult<T>`
-   Services using `Result<T>`
-   Any file referencing `BaseQueryRequest`

---

## Appendix C: Git Workflow

### Recommended Commit Sequence

```bash
# 1. Create feature branch
git checkout -b refactor/poco-reorganization

# 2. Phase 1 - Identity Domain
git add -A
git commit -m "refactor(identity): reorganize POCOs into DTOs/Requests/Responses/Results folders"

# 3. Phase 2 - Logging Domain
git add -A
git commit -m "refactor(logging): reorganize POCOs into typed folders"

# 4. Phase 3 - ApiTracking Domain (includes renames)
git add -A
git commit -m "refactor(api-tracking): reorganize POCOs and fix misleading Response suffixes"

# 5. Phase 4 - Shared Project
git add -A
git commit -m "refactor(shared): reorganize POCOs and update namespace"

# 6. Phase 5-6 - API + Client
git add -A
git commit -m "chore: update API references and regenerate OpenAPI types"

# 7. Phase 7 - Documentation
git add -A
git commit -m "docs: update copilot instructions with new POCO structure"

# 8. Squash and merge
git checkout master
git merge --squash refactor/poco-reorganization
git commit -m "refactor: reorganize all POCOs with folder=suffix convention"
```

---

**Document Version:** 3.0
**Created:** January 14, 2026
**Last Updated:** January 14, 2026
**Author:** GitHub Copilot (Claude Opus 4.5)

### Change Log

| Version | Date       | Changes                                                                        |
| ------- | ---------- | ------------------------------------------------------------------------------ |
| 1.0     | 2026-01-14 | Initial 5-folder structure                                                     |
| 2.0     | 2026-01-14 | Simplified to 3 folders; kept `*Request` naming; merged Results into Responses |
| 3.0     | 2026-01-14 | 4 folders: separated Results from Responses (folder name = file suffix)        |
