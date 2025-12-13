---
agent: agent
description: Generate .NET service with repository following SeventySix patterns
---

# Generate .NET Service

Create a new .NET service with repository following these requirements:

## Required Patterns

1. **Primary constructors**: `class Svc(IRepo repo)` not traditional
2. **Explicit types**: `string x = ""` never `var`
3. **Async suffix**: All async methods end with `Async`
4. **AsNoTracking**: For all read-only queries
5. **Fluent API**: For EF Core configuration, never attributes
6. **Records for DTOs**: Positional parameters
7. **Records for Settings**: Init properties with defaults

## Formatting Rules

-   New line after every `=` with indented value
-   New line before every `.` in chains
-   Lambda params on new line after `(`
-   Each param on new line when 2+ params
-   Null-conditional `?.` over verbose null checks

## Service Template

```csharp
public class {{Name}}Service(
	I{{Name}}Repository repo,
	ILogger<{{Name}}Service> logger)
{
	public async Task<{{Name}}?> GetByIdAsync(int id) =>
		await repo.GetByIdAsync(id);

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

		await repo.AddAsync(entity);
		return entity.ToDto();
	}
}
```

## Repository Template

```csharp
public class {{Name}}Repository({{Context}}DbContext db)
{
	public async Task<{{Name}}?> GetByIdAsync(int id) =>
		await db.{{Names}}
			.AsNoTracking()
			.FirstOrDefaultAsync(
				item => item.Id == id);

	public async Task AddAsync({{Name}} entity)
	{
		db.{{Names}}.Add(entity);
		await db.SaveChangesAsync();
	}
}
```

## DTO Template

```csharp
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
