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

## Exception Handling

See `security.instructions.md` for ProblemDetails patterns and message classification.

**Key rules:**

- Raw exception details → `ILogger` only (never in HTTP response)
- `ProblemDetailConstants.Details.*` → `ProblemDetails.Detail` (returned to client)
- Domain exceptions (`EntityNotFoundException`, `DomainException`) use `.Message` (curated in domain code)
- Framework exceptions (`ArgumentException`, `KeyNotFoundException`) use constants (their messages expose internals)

## Transactions

- Single write: Direct `SaveChangesAsync`
- Multiple entities: Consolidated `SaveChangesAsync`
- Read-then-write: `TransactionManager`

## Cross-Platform

See `copilot-instructions.md` Cross-Platform Compatibility section for Windows/Linux rules.

---

## Wolverine CQRS Handler Pattern

Static class + static `HandleAsync` method. Dependencies injected as **method parameters** (NOT constructor). Each command/query lives in its own subfolder. Wolverine auto-discovers and wires them.

```csharp
// Command (record in {Domain}/Commands/{Action}{Entity}/)
public record DeleteLogCommand(long LogId);

// Handler (static class in same folder)
public static class DeleteLogCommandHandler
{
	public static async Task<Result> HandleAsync(
		DeleteLogCommand command,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		bool deleted =
			await repository.DeleteByIdAsync(
				command.LogId,
				cancellationToken);

		return deleted
			? Result.Success()
			: Result.Failure($"Log {command.LogId} not found");
	}
}
```

**Optional**: Colocate `{Action}{Entity}RequestValidator.cs` (FluentValidation) in same subfolder.

## Registration Pattern

Static extension method per domain. Named `Add{Domain}Domain(this IServiceCollection, ...)`. Registers DbContext, validators, services, repositories, health checks.

```csharp
public static class LoggingRegistration
{
	public static IServiceCollection AddLoggingDomain(
		this IServiceCollection services,
		string connectionString,
		IConfiguration configuration)
	{
		services.AddDomainDbContext<LoggingDbContext>(
			connectionString,
			SchemaConstants.Logging);

		services.AddScoped<ILogRepository, LogRepository>();
		services.AddTransactionManagerFor<LoggingDbContext>();
		services.AddWolverineHealthCheck<CheckLoggingHealthQuery>(
			SchemaConstants.Logging);
		services.AddDomainValidatorsFromAssemblyContaining<LoggingDbContext>();

		return services;
	}
}
```

## Settings Pattern

Record with `get/init` properties, `const SectionName`, paired FluentValidation validator.

```csharp
public record LogCleanupSettings
{
	public const string SectionName = "Logging:Cleanup";
	public bool Enabled { get; init; }
	public int IntervalHours { get; init; }
	public int RetentionDays { get; init; }
	public string LogDirectory { get; init; } = string.Empty;
}

public sealed class LogCleanupSettingsValidator : AbstractValidator<LogCleanupSettings>
{
	public LogCleanupSettingsValidator()
	{
		When(
			cleanup => cleanup.Enabled,
			() =>
			{
				RuleFor(cleanup => cleanup.IntervalHours)
					.InclusiveBetween(1, 168);
				RuleFor(cleanup => cleanup.RetentionDays)
					.InclusiveBetween(1, 365);
			});
	}
}
```

## Entity Interface Hierarchy

```
IEntity (long Id)
  └── ICreatableEntity (+CreateDate)
        └── IModifiableEntity (+ModifyDate)
              └── IAuditableEntity (+CreatedBy, +ModifiedBy)
ISoftDeletable (+IsDeleted, +DeletedAt, +DeletedBy)  — separate mixin
```

`AuditInterceptor` in `SeventySix.Shared.Persistence` auto-sets timestamps/user tracking from these interfaces.

## Date/Time Handling (CRITICAL)

| Required | Forbidden |
| --- | --- |
| `DateTimeOffset` for all date/time values | `DateTime` anywhere |
| `TimeProvider` (injected) for current time | `DateTimeOffset.UtcNow`, `DateTime.Now` |
| `TimeProvider.GetUtcNow()` | Direct clock access |

**Rule**: All entities use `DateTimeOffset`. All "get current time" calls go through `TimeProvider` for testability. Roslyn analyzer `STS002` enforces the `DateTime` ban at compile time.

## Controller Pattern (Thin CQRS Dispatcher)

Controllers are thin dispatchers — NO business logic. Use `IMessageBus.InvokeAsync` for CQRS. Evict cache on mutations.

```csharp
[ApiController]
[Authorize(Policy = PolicyConstants.AdminOnly)]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/logs")]
public class LogsController(
	IMessageBus messageBus,
	IOutputCacheStore outputCacheStore) : ControllerBase
{
	[HttpGet]
	[OutputCache(PolicyName = CachePolicyConstants.Logs)]
	public async Task<ActionResult<PagedResult<LogDto>>> GetPagedAsync(
		[FromQuery] LogQueryRequest request,
		CancellationToken cancellationToken = default)
	{
		PagedResult<LogDto> result =
			await messageBus.InvokeAsync<
				PagedResult<LogDto>>(
					new GetLogsPagedQuery(request),
					cancellationToken);

		return Ok(result);
	}

	[HttpDelete("{id}")]
	public async Task<IActionResult> DeleteLogAsync(
		long id,
		CancellationToken cancellationToken = default)
	{
		Result deleted =
			await messageBus.InvokeAsync<Result>(
				new DeleteLogCommand(id),
				cancellationToken);

		if (!deleted.IsSuccess)
		{
			return NotFound();
		}

		await outputCacheStore.EvictByTagAsync(
			CachePolicyConstants.Logs,
			cancellationToken);

		return NoContent();
	}
}
```

## EF Core Migrations (CRITICAL)

### Migration Folder Structure

**RULE**: Each domain has ONE migrations folder at `{Domain}/Migrations/`. Never place migrations in `Infrastructure/Migrations/`.

| [CORRECT]                             | [NEVER]                                              |
| ------------------------------------- | ---------------------------------------------------- |
| `Identity/Migrations/`                | `Identity/Infrastructure/Migrations/`                |
| `Logging/Migrations/`                 | `Logging/Infrastructure/Migrations/`                 |
| `ApiTracking/Migrations/`             | `ApiTracking/Infrastructure/Migrations/`             |
| `ElectronicNotifications/Migrations/` | `ElectronicNotifications/Infrastructure/Migrations/` |

### Migration Commands

Run from `SeventySix.Server/SeventySix.Domains/` directory:

```powershell
# Identity
dotnet ef migrations add MigrationName -c IdentityDbContext -o Identity/Migrations

# Logging
dotnet ef migrations add MigrationName -c LoggingDbContext -o Logging/Migrations

# ApiTracking
dotnet ef migrations add MigrationName -c ApiTrackingDbContext -o ApiTracking/Migrations

# ElectronicNotifications
dotnet ef migrations add MigrationName -c ElectronicNotificationsDbContext -o ElectronicNotifications/Migrations
```

### Migration Naming

- `InitialCreate` — First migration establishing the schema
- `Add{Feature}` — Adding new tables or columns
- `Remove{Feature}` — Removing tables or columns
- `Update{Entity}{Property}` — Modifying existing columns

> **Reminder**: Do NOT create documentation files in `/docs/`. Update existing READMEs and instruction files instead. See `copilot-instructions.md` for the full documentation rules.
