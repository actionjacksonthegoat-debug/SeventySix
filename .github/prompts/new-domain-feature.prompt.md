---
agent: agent
description: Scaffold full-stack feature with Angular client and .NET server
---

# Generate Full-Stack Feature

Create a complete feature spanning Angular client and .NET server.

## Domain Selection (REQUIRED)

Ask user which domain this feature belongs to:

-   **Server**: Identity, Logging, ApiTracking, ElectronicNotifications
-   **Client**: admin, sandbox, developer

## Server Structure

```
SeventySix.Domains/
└── {{Domain}}/                     # Namespace: SeventySix.{{Domain}}
    ├── Commands/
    │   └── Create{{Name}}/
    │       ├── Create{{Name}}Command.cs
    │       ├── Create{{Name}}CommandHandler.cs
    │       └── Create{{Name}}RequestValidator.cs
    ├── Queries/
    │   └── Get{{Name}}ById/
    │       ├── Get{{Name}}ByIdQuery.cs
    │       └── Get{{Name}}ByIdQueryHandler.cs
    ├── POCOs/
    │   ├── DTOs/
    │   │   └── {{Name}}Dto.cs
    │   ├── Requests/
    │   │   └── Create{{Name}}Request.cs
    │   ├── Responses/
    │   │   └── {{Name}}Response.cs (if API contract output needed)
    │   └── Results/
    │       └── {{Name}}Result.cs (if internal operation outcome needed)
    ├── Entities/
    │   └── {{Name}}.cs
    ├── Infrastructure/
    │   └── {{Name}}Configuration.cs
    └── Repositories/
        └── {{Name}}Repository.cs
```

## Client Structure

```
SeventySix.Client/src/app/domains/
└── {{domain}}/                     # Path alias: @{{domain}}/*
    ├── api/
    │   └── {{name}}.dto.ts
    ├── models/
    │   └── {{name}}.model.ts
    ├── services/                   # NEVER providedIn: 'root'
    │   └── {{name}}.service.ts
    ├── {{name}}-list/
    │   └── {{name}}-list.component.ts
    ├── {{name}}-detail/
    │   └── {{name}}-detail.component.ts
    └── routes/
        └── {{feature}}.routes.ts
```

## Server Patterns

### Entity

```csharp
namespace SeventySix.{{Domain}};

public class {{Name}}
{
    public int Id { get; set; }
    public string Name { get; set; } =
        string.Empty;
    public string CreatedBy { get; set; } =
        string.Empty;
    public DateTime CreatedAt { get; set; }
}
```

### DTO (Positional Record)

```csharp
namespace SeventySix.{{Domain}};

public record {{Name}}Dto(
    int Id,
    string Name,
    DateTime CreatedAt);
```

### Wolverine Handler

```csharp
namespace SeventySix.{{Domain}};

public record Get{{Name}}ByIdQuery(int Id);

public static class Get{{Name}}ByIdQueryHandler
{
    public static async Task<{{Name}}Dto?> HandleAsync(
        Get{{Name}}ByIdQuery query,
        {{Domain}}DbContext dbContext,
        CancellationToken cancellationToken)
    {
        {{Name}}? entity =
            await dbContext.{{Names}}
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item => item.Id == query.Id,
                    cancellationToken);

        return entity?.ToDto();
    }
}
```

## Client Patterns

### Service (Route Scoped)

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@shared/environments';
import { {{Name}}Dto } from '@{{domain}}/api';

@Injectable() // NO providedIn - use route providers
export class {{Name}}Service {
    private readonly http: HttpClient =
        inject(HttpClient);
    private readonly apiUrl: string =
        environment.apiUrl;

    getById(id: number): Observable<{{Name}}Dto> {
        return this.http
            .get<{{Name}}Dto>(`${this.apiUrl}/{{names}}/${id}`);
    }
}
```

### Component

```typescript
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params } from '@angular/router';
import { switchMap } from 'rxjs';
import { {{Name}}Service } from '@{{domain}}/services';

@Component({
    selector: 'app-{{name}}-detail',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (item()) {
            <h1>{{ item()!.name }}</h1>
        }
    `,
})
export class {{Name}}DetailComponent {
    private readonly service: {{Name}}Service =
        inject({{Name}}Service);
    private readonly route: ActivatedRoute =
        inject(ActivatedRoute);

    item =
        toSignal(
            this.route.params
                .pipe(
                    switchMap(
                        (params: Params) =>
                            this.service.getById(+params['id'])),
                    takeUntilDestroyed()));
}
```

### Routes

```typescript
import { Routes } from '@angular/router';
import { {{Name}}Service } from '@{{domain}}/services';

export const {{FEATURE}}_ROUTES: Routes =
    [
        {
            path: '',
            providers: [{{Name}}Service], // Service scoped here
            children: [
                {
                    path: '',
                    loadComponent: () =>
                        import('./{{name}}-list/{{name}}-list.component')
                            .then(
                                (module) => module.{{Name}}ListComponent),
                },
                {
                    path: ':id',
                    loadComponent: () =>
                        import('./{{name}}-detail/{{name}}-detail.component')
                            .then(
                                (module) => module.{{Name}}DetailComponent),
                },
            ],
        },
    ];
```

## Key Rules

### Import Boundaries (CRITICAL)

-   **Server**: `Shared ← Domains ← Api` (never reverse)
-   **Client**: Domain imports ONLY `@shared/*` + itself, NEVER another domain

### Service Scoping (CRITICAL)

-   Domain services in `services/` → Route `providers` array, NEVER `providedIn: 'root'`
-   Persistent state in `core/` → `providedIn: 'root'` OK
-   Shared services → `@shared/services/` with `providedIn: 'root'`

### Path Aliases

-   `@shared/*` - Cross-cutting utilities
-   `@admin/*`, `@game/*`, `@commerce/*` - Domain-specific

### Other Rules

-   Validators colocate with handlers
-   New line after every `=`, before every `.`
-   Server namespace: `SeventySix.{Domain}` (NOT `SeventySix.Domains.{Domain}`)
