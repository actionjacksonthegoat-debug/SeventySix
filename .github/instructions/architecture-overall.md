# Overall System Architecture Quick Reference

> **Full documentation**: See `.claude/CLAUDE.md` for comprehensive guidelines.

---

## System Overview

```
Angular Client ◄──HTTP──► .NET API Server
                              │
                     Bounded Contexts (SeventySix/)
                      ├─ Identity
                      ├─ Logging
                      └─ ApiTracking
                              │
                         PostgreSQL
                    (Separate schemas)
```

---

## Server-Client Alignment

| Server Context    | Client Feature        | Path Alias            |
| ----------------- | --------------------- | --------------------- |
| `Identity/`       | `admin/users/`        | `@admin/users`        |
| `Logging/`        | `admin/logs/`         | `@admin/logs`         |
| `ApiTracking/`    | `admin/api-tracking/` | `@admin/api-tracking` |
| `Infrastructure/` | `infrastructure/`     | `@infrastructure`     |

---

## Architecture Decisions

| Decision              | Rationale                           |
| --------------------- | ----------------------------------- |
| Bounded contexts      | Clear boundaries, future extraction |
| No generic repository | EF Core IS the repository           |
| Separate DbContext    | Each domain owns its data           |
| No CQRS/MediatR (yet) | YAGNI - add when pain happens       |
| PostgreSQL only       | Polyglot ready, not needed yet      |

---

## Configuration (CRITICAL)

**NEVER hardcode**: API URLs, connection strings, intervals, limits

| Server             | Client           |
| ------------------ | ---------------- |
| `appsettings.json` | `environment.ts` |

---

## Testing

| Layer | Server      | Client          |
| ----- | ----------- | --------------- |
| Unit  | xUnit + Moq | Jasmine + spies |
| E2E   | -           | Playwright      |

-   **Angular**: `npm test` (headless, no-watch)
-   **.NET**: `dotnet test` (Docker required)

---

## When to Extract

| Trigger              | Action           |
| -------------------- | ---------------- |
| 100+ files in domain | Separate project |
| 1M+ req/day          | Microservice     |
| Different scaling    | Microservice     |

**NOT before pain happens (YAGNI)**

