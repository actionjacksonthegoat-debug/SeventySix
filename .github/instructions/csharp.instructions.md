---
description: C#/.NET patterns and rules for SeventySix.Server
applyTo: "**/SeventySix.Server/**/*.cs"
---

# C# Instructions (.NET 10+)

## Language Patterns

| Pattern      | Required                              | Forbidden                |
| ------------ | ------------------------------------- | ------------------------ |
| Types        | `string name = ""`                    | `var`                    |
| Constructors | `class Service(IRepo repo)` (primary) | Traditional constructors |
| Collections  | `[1, 2, 3]`                           | `new List<int>()`        |
| Async        | Suffix `*Async` always                | Non-suffixed async       |
| DTOs         | `record UserDto(int Id)` positional   | Classes for DTOs         |
| Settings     | `record X { prop { get; init; } }`    | Mutable settings         |
| EF Config    | Fluent API                            | Data annotations         |
| Queries      | `AsNoTracking()` for reads            | Tracked read queries     |

## Naming

| Type          | Pattern                     |
| ------------- | --------------------------- |
| FK columns    | Suffix `*Id`: `UserId`      |
| Audit fields  | `string CreatedBy` (not FK) |
| Async methods | `*Async` suffix always      |

## Project Structure

```
SeventySix.Shared     → Base abstractions (NO domain refs)
SeventySix.Domains    → Bounded contexts (refs Shared only)
SeventySix.Api        → HTTP layer (refs Domains)
```

Import direction: `Shared ← Domains ← Api` (never reverse)

## Domain File Locations

| Type      | Location                    | Namespace             |
| --------- | --------------------------- | --------------------- |
| Commands  | `{Domain}/Commands/`        | `SeventySix.{Domain}` |
| Queries   | `{Domain}/Queries/`         | `SeventySix.{Domain}` |
| DTOs      | `{Domain}/POCOs/DTOs/`      | `SeventySix.{Domain}` |
| Requests  | `{Domain}/POCOs/Requests/`  | `SeventySix.{Domain}` |
| Responses | `{Domain}/POCOs/Responses/` | `SeventySix.{Domain}` |
| Results   | `{Domain}/POCOs/Results/`   | `SeventySix.{Domain}` |
| Entities  | `{Domain}/Entities/`        | `SeventySix.{Domain}` |
| DbContext | `{Domain}/Infrastructure/`  | `SeventySix.{Domain}` |

## POCO Naming (Folder = Suffix)

| Folder             | Suffix      | Example        |
| ------------------ | ----------- | -------------- |
| `POCOs/DTOs/`      | `*Dto`      | `UserDto`      |
| `POCOs/Requests/`  | `*Request`  | `LoginRequest` |
| `POCOs/Responses/` | `*Response` | `AuthResponse` |
| `POCOs/Results/`   | `*Result`   | `AuthResult`   |

## Logging Levels

| Level       | Usage                          |
| ----------- | ------------------------------ |
| Debug       | NEVER                          |
| Information | Background job completion ONLY |
| Warning     | Recoverable issues             |
| Error       | Unrecoverable failures         |

## Exception Handling and ProblemDetails (CRITICAL)

> **RULE**: `ProblemDetails.Detail` MUST NEVER contain raw `exception.Message`. Use `ProblemDetailConstants.Details.*` constants instead.

| Exception Type                | Detail Value                                      | Log Level |
| ----------------------------- | ------------------------------------------------- | --------- |
| `ArgumentException`           | `ProblemDetailConstants.Details.BadRequest`       | Warning   |
| `ArgumentNullException`       | `ProblemDetailConstants.Details.BadRequest`       | Warning   |
| `KeyNotFoundException`        | `ProblemDetailConstants.Details.ResourceNotFound` | Warning   |
| `UnauthorizedAccessException` | `ProblemDetailConstants.Details.Unauthorized`     | Warning   |
| `ValidationException`         | Grouped field errors (FluentValidation, safe)     | Warning   |
| `EntityNotFoundException`     | `.Message` (curated domain text, safe)            | Error     |
| `DomainException`             | `.Message` (curated domain text, safe)            | Error     |
| Default (unhandled)           | Generic text; raw message in dev only             | Error     |

**Pattern — catching exceptions in controllers:**

```csharp
catch (ArgumentException argumentException)
{
    logger.LogWarning(
        argumentException,
        "Operation failed for {EntityId}: {Error}",
        entityId,
        argumentException.Message);

    return BadRequest(
        new ProblemDetails
        {
            Title = "Invalid Request",
            Detail = ProblemDetailConstants.Details.BadRequest,
            Status = StatusCodes.Status400BadRequest,
        });
}
```

**Key rules:**

- Raw exception details → `ILogger` only (never in HTTP response)
- `ProblemDetailConstants.Details.*` → `ProblemDetails.Detail` (returned to client)
- Domain exceptions (`EntityNotFoundException`, `BusinessRuleViolationException`, `DomainException`) use `.Message` because those messages are curated in our domain code
- Framework exceptions (`ArgumentException`, `KeyNotFoundException`, etc.) use constants because their messages expose internals

## Transactions

- Single write: Direct `SaveChangesAsync`
- Multiple entities: Consolidated `SaveChangesAsync`
- Read-then-write: `TransactionManager`

## Cross-Platform (Windows + Linux)

| ❌ NEVER                              | ✅ ALWAYS                                   |
| ------------------------------------- | ------------------------------------------- |
| `"folder\\file.txt"` hardcoded paths  | `Path.Combine("folder", "file.txt")`        |
| `Environment.SpecialFolder.Windows`   | `Path.GetTempPath()`, portable APIs         |
| `/bin/bash` or `cmd.exe` assumptions  | Cross-platform alternatives                 |
| Case-insensitive filename assumptions | Consistent casing (Linux is case-sensitive) |

**Rule**: CI runs on `ubuntu-latest`. All server code MUST build and run on Linux.
