---
agent: agent
description: Scaffold a complete new server-side bounded context domain
---

# Scaffold Server Domain

Create a new server-side bounded context domain following the blueprint in `.github/instructions/new-domain.instructions.md`.

## MCP Tools

- Use **context7** to fetch up-to-date .NET, Wolverine, EF Core, and FluentValidation API docs before generating code
- Use **postgresql** MCP to inspect existing schema when wiring new domain tables

## Gather Requirements

Ask the user for:

1. **Domain name** (e.g., "Notifications", "Billing")
2. **Initial entity name** (e.g., "Notification", "Invoice")
3. **Separate project or folder?** (default: separate project if >5 entities or has background jobs)
4. **Needs background jobs?** (default: no)

## Then Create ALL Files

Follow the **Server Checklist** from `new-domain.instructions.md`:

1. Create `.csproj` referencing `SeventySix.Shared` only
2. Create entity implementing `IEntity` / `IAuditableEntity`
3. Create DbContext with domain schema
4. Create Registration extension method
5. Create Wolverine command/query handlers (static class + static HandleAsync)
6. Create FluentValidation validators
7. Create DTOs as positional records
8. Create controller as thin CQRS dispatcher
9. Create settings record + validator if needed
10. Wire into `ApplicationServicesRegistration.cs`
11. Add connection string to `appsettings.*.json`
12. Create initial EF Core migration

## Validation

Run `dotnet build` — must be zero warnings.
Create test project with fluent builders and high-priority tests.
