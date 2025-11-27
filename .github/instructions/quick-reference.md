# Quick Reference Card

> **Full documentation**: See `.claude/CLAUDE.md` for comprehensive guidelines.

---

## Critical Rules (One-Liners)

### C#

| Rule         | ✅ Do                    | ❌ Don't                    |
| ------------ | ------------------------ | --------------------------- |
| Types        | `string x = ""`          | `var x = ""`                |
| Constructors | `class Svc(IRepo r)`     | `private readonly IRepo _r` |
| Collections  | `int[] x = [1,2]`        | `new int[] {1,2}`           |
| Async        | `GetUserAsync()`         | `GetUser()`                 |
| DTOs         | `record UserDto(int Id)` | `class UserDto`             |
| EF Config    | Fluent API               | Data annotations            |
| Queries      | `AsNoTracking()`         | Tracked reads               |
| Repository   | Domain-specific          | Generic `IRepository<T>`    |

### Angular

| Rule         | ✅ Do                         | ❌ Don't                   |
| ------------ | ----------------------------- | -------------------------- |
| Types        | `const x: string = ""`        | `const x = ""`             |
| DI           | `inject(Service)`             | `constructor(private svc)` |
| Detection    | `OnPush`                      | `Default`                  |
| Inputs       | `input.required<T>()`         | `@Input()`                 |
| Control Flow | `@if`, `@for`                 | `*ngIf`, `*ngFor`          |
| Zone         | Zoneless only                 | Zone.js, NgZone            |
| Host         | `host: { '(click)': 'fn()' }` | `@HostListener`            |
| Cleanup      | `takeUntilDestroyed()`        | Manual subscriptions       |

---

## Commands

```bash
# Angular
npm test                    # Unit tests (headless)
npm run test:e2e            # Playwright E2E

# .NET
dotnet test                 # All tests (Docker required)

# Docker
npm run start:docker        # Start Docker Desktop
```

---

## Path Aliases

| Alias               | Path                       |
| ------------------- | -------------------------- |
| `@infrastructure/*` | `src/app/infrastructure/*` |
| `@shared/*`         | `src/app/shared/*`         |
| `@admin/*`          | `src/app/features/admin/*` |
| `@game/*`           | `src/app/features/game/*`  |

---

## Key Locations

| What           | Where                               |
| -------------- | ----------------------------------- |
| Angular app    | `SeventySix.Client/`                |
| API project    | `SeventySix.Server/SeventySix.Api/` |
| Domain library | `SeventySix.Server/SeventySix/`     |
| Full standards | `.claude/CLAUDE.md`                 |
| Migration plan | `Implementation-complete.md`        |

---

## Configuration (CRITICAL)

| ❌ Never Hardcode  | ✅ Use Instead      |
| ------------------ | ------------------- |
| API URLs           | `environment.ts`    |
| Connection strings | `appsettings.json`  |
| Refresh intervals  | Configuration files |

