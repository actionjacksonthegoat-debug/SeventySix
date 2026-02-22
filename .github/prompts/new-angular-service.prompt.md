---
agent: agent
description: Generate Angular service with correct scoping for SeventySix domains
---

# Generate Angular Service

Create a new Angular service following domain boundary rules.

## MCP Tools

- Use **context7** to fetch up-to-date Angular and TanStack Query API docs before generating code

## Domain Selection (REQUIRED)

Ask user:

1. Which domain: admin, auth, account, developer, sandbox, home (or shared)
2. Service type: **domain-scoped** or **persistent state**

## Service Types

| Type             | Location             | Injectable             | Use Case                     |
| ---------------- | -------------------- | ---------------------- | ---------------------------- |
| Domain Scoped    | `@{domain}/services` | Route `providers` ONLY | Feature-specific, HTTP calls |
| Persistent State | `@{domain}/core`     | `providedIn: 'root'`   | Cross-route state, caches    |
| App Singleton    | `@shared/services`   | `providedIn: 'root'`   | Auth, notifications, logging |

## Import Boundaries (CRITICAL)

- Domain services import ONLY from `@shared/*` + own domain
- NEVER import from another domain (`@admin/*`, `@auth/*`, `@developer/*`, etc.)

## Domain Scoped Service Template

Location: `SeventySix.Client/src/app/domains/{{domain}}/services/{{name}}.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@shared/environments';
import { {{Name}}Dto } from '@{{domain}}/api';

@Injectable() // NO providedIn - MUST use route providers
export class {{Name}}Service {
    private readonly http: HttpClient =
        inject(HttpClient);
    private readonly apiUrl: string =
        environment.apiUrl;

    getAll(): Observable<{{Name}}Dto[]> {
        return this.http
            .get<{{Name}}Dto[]>(`${this.apiUrl}/{{names}}`);
    }

    getById(id: number): Observable<{{Name}}Dto> {
        return this.http
            .get<{{Name}}Dto>(`${this.apiUrl}/{{names}}/${id}`);
    }

    create(request: Create{{Name}}Request): Observable<{{Name}}Dto> {
        return this.http
            .post<{{Name}}Dto>(
                `${this.apiUrl}/{{names}}`,
                request);
    }
}
```

**Usage in routes:**

```typescript
export const {{FEATURE}}_ROUTES: Routes =
    [
        {
            path: '',
            providers: [{{Name}}Service], // Service scoped here
            children: [...]
        }
    ];
```

## Persistent State Service Template

Location: `SeventySix.Client/src/app/domains/{{domain}}/core/{{name}}.state.ts`

```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' }) // OK for core/ folder
export class {{Name}}State {
    private readonly items =
        signal<{{Name}}[]>([]);

    readonly all =
        this.items.asReadonly();

    readonly count =
        computed(() =>
            this.items().length);

    setItems(items: {{Name}}[]): void {
        this.items.set(items);
    }

    addItem(item: {{Name}}): void {
        this.items.update(
            (current: {{Name}}[]) =>
                [...current, item]);
    }
}
```

## Shared Service Template

Location: `SeventySix.Client/src/app/shared/services/{{name}}.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' }) // OK for shared/services
export class {{Name}}Service {
    private readonly http: HttpClient =
        inject(HttpClient);

    // Shared functionality used across multiple domains
}
```

## CRITICAL Rules

1. **NEVER** use `providedIn: 'root'` in `@{domain}/services/`
2. **ALWAYS** register domain services in route `providers` array
3. **ONLY** `@{domain}/core/` and `@shared/services/` can use `providedIn: 'root'`
4. **NEVER** import from another domain — domains import ONLY `@shared/*` + themselves
