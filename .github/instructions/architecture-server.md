# Server Architecture Quick Reference

> **Full documentation**: See `.claude/CLAUDE.md` for comprehensive guidelines.

---

## Bounded Context Structure

```
BoundedContext/
├── Configurations/     # EF Core Fluent API configs
├── DTOs/              # Data Transfer Objects (records)
├── Entities/          # Domain entities
├── Exceptions/        # Domain exceptions
├── Extensions/        # Mapping (ToDto, ToEntity)
├── Infrastructure/    # DbContext
├── Interfaces/        # Contracts
├── Migrations/        # EF Core migrations
├── Repositories/      # Domain-specific (NO generic)
├── Services/          # Business logic
└── Validators/        # FluentValidation
```

---

## Current Contexts

| Context        | Schema         | DbContext              | Purpose               |
| -------------- | -------------- | ---------------------- | --------------------- |
| `Identity/`    | `identity`     | `IdentityDbContext`    | Users, auth           |
| `Logging/`     | `logging`      | `LoggingDbContext`     | System logs           |
| `ApiTracking/` | `api_tracking` | `ApiTrackingDbContext` | Third-party API calls |

---

## Key Rules

| Rule                      | Guidance                               |
| ------------------------- | -------------------------------------- |
| **No generic repository** | Domain-specific repos only             |
| **Fluent API only**       | No data annotations for EF config      |
| **Primary constructors**  | `class Service(IRepo repo)`            |
| **Records for DTOs**      | `record UserDto(int Id, string Name);` |
| **Explicit types**        | No `var` - always explicit             |
| **Async suffix**          | `GetByIdAsync`, not `GetById`          |
| **AsNoTracking()**        | For all read-only queries              |
| **Separate DbContext**    | One per bounded context                |

---

## Registration Pattern

```csharp
// Program.cs
builder.Services.AddIdentityDomain(connectionString);
builder.Services.AddLoggingDomain(connectionString);
builder.Services.AddApiTrackingDomain(connectionString);
```

---

## Related Files

-   **Migration plan**: `Implementation-complete.md`
-   **Architecture rationale**: `implementation-plan-critical.md`

