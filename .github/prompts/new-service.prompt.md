---
agent: agent
description: Generate .NET service with repository following SeventySix patterns
---

# Generate .NET Service

Create a new .NET service with repository following these requirements:

## Domain Selection (REQUIRED)

Ask user which domain: Identity, Logging, ApiTracking, ElectronicNotifications

## File Locations

| Type       | Path                                           | Namespace             |
| ---------- | ---------------------------------------------- | --------------------- |
| Service    | `SeventySix.Domains/{Domain}/Services/`        | `SeventySix.{Domain}` |
| Repository | `SeventySix.Domains/{Domain}/Repositories/`    | `SeventySix.{Domain}` |
| Entity     | `SeventySix.Domains/{Domain}/Entities/`        | `SeventySix.{Domain}` |
| DTO        | `SeventySix.Domains/{Domain}/POCOs/DTOs/`      | `SeventySix.{Domain}` |
| Request    | `SeventySix.Domains/{Domain}/POCOs/Requests/`  | `SeventySix.{Domain}` |
| Response   | `SeventySix.Domains/{Domain}/POCOs/Responses/` | `SeventySix.{Domain}` |
| Result     | `SeventySix.Domains/{Domain}/POCOs/Results/`   | `SeventySix.{Domain}` |

## Required Patterns

1. **Primary constructors**: `class Svc(IRepo repo)` not traditional
2. **Explicit types**: `string name = ""` never `var`
3. **Async suffix**: All async methods end with `Async`
4. **AsNoTracking**: For all read-only queries
5. **Fluent API**: For EF Core configuration, never attributes
6. **Records for DTOs**: Positional parameters
7. **Records for Settings**: Init properties with defaults

## Formatting Rules

- New line after every `=` with indented value
- New line before every `.` in chains
- Lambda params on new line after `(`
- Each param on new line when 2+ params
- Null-conditional `?.` over verbose null checks

## Service Template

```csharp
namespace SeventySix.{{Domain}};

public class {{Name}}Service(
    I{{Name}}Repository repository,
    ILogger<{{Name}}Service> logger)
{
    public async Task<{{Name}}?> GetByIdAsync(int id) =>
        await repository.GetByIdAsync(id);

    public async Task<{{Name}}Dto> CreateAsync(Create{{Name}}Request request)
    {
        {{Name}} entity =
            new()
            {
                Name =
                    request.Name,
                CreatedBy =
                    request.Username,
            };

        await repository.AddAsync(entity);
        return entity.ToDto();
    }
}
```

## Repository Template

```csharp
namespace SeventySix.{{Domain}};

public class {{Name}}Repository({{Domain}}DbContext dbContext)
{
    public async Task<{{Name}}?> GetByIdAsync(int id) =>
        await dbContext.{{Names}}
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == id);

    public async Task AddAsync({{Name}} entity)
    {
        dbContext.{{Names}}.Add(entity);
        await dbContext.SaveChangesAsync();
    }
}
```

## DTO Template

```csharp
namespace SeventySix.{{Domain}};

public record {{Name}}Dto(
    int Id,
    string Name,
    DateTime CreatedAt);

public record Create{{Name}}Request(
    string Name,
    string Username);
```

## Logging Rules

| Level       | Usage                          |
| ----------- | ------------------------------ |
| Debug       | NEVER                          |
| Information | Background job completion ONLY |
| Warning     | Recoverable issues             |
| Error       | Unrecoverable failures         |

## Test Requirements (CRITICAL)

When creating a service, ALWAYS create corresponding tests:

| Test Type         | File Name                     | Location                             |
| ----------------- | ----------------------------- | ------------------------------------ |
| Unit tests        | `{{Name}}ServiceUnitTests.cs` | `Tests/{Domain}.Tests/Services/`     |
| Integration tests | `{{Name}}ServiceTests.cs`     | `Tests/{Domain}.Tests/Services/`     |
| Repository tests  | `{{Name}}RepositoryTests.cs`  | `Tests/{Domain}.Tests/Repositories/` |

**Test Rules:**

- Use `FakeTimeProvider` not `Task.Delay()` for time tests
- Use `[Collection(CollectionNames.PostgreSql)]` for DB tests
- Use fluent builders for test data, not inline `new Entity()`
- Test file location MUST mirror source file location
