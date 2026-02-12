---
description: Angular/TypeScript patterns and rules for SeventySix.Client
applyTo: "**/SeventySix.Client/src/**/*.ts"
---

# Angular Instructions (20+)

## Core Patterns

| Pattern          | Required                 | Forbidden                      |
| ---------------- | ------------------------ | ------------------------------ |
| Zone             | Zoneless only            | Zone.js, NgZone                |
| DI               | `inject(Service)`        | Constructor injection          |
| Change detection | `OnPush` always          | Default                        |
| Inputs           | `input.required<T>()`    | `@Input()`                     |
| Outputs          | `output<T>()`            | `@Output()`                    |
| Control flow     | `@if`, `@for`, `@switch` | `*ngIf`, `*ngFor`, `*ngSwitch` |
| Host bindings    | `host: {}`               | `@HostBinding`                 |
| Classes          | `[class.x]`              | `ngClass`                      |
| Styles           | `[style.x]`              | `ngStyle`                      |
| Return types     | Explicit on all methods  | Implicit return types          |
| Templates        | `computed()` signals     | Method calls in templates      |
| Cleanup          | `takeUntilDestroyed()`   | Manual subscription cleanup    |

## Accessibility (WCAG AA)

| Element               | Required                                       | Forbidden                  |
| --------------------- | ---------------------------------------------- | -------------------------- |
| Decorative `mat-icon` | `aria-hidden="true"`                           | Icon without aria-hidden   |
| Icon-only button      | `aria-label` on button                         | `matTooltip` as only label |
| Toggle button         | `[attr.aria-expanded]`, `[attr.aria-controls]` | Toggle without state       |
| `mat-spinner`         | `aria-label="Loading"`                         | Spinner without label      |
| `mat-progress-bar`    | `aria-label`                                   | Progress without label     |
| Form error            | `aria-live="assertive" role="alert"`           | Silent error               |

See `.github/instructions/accessibility.instructions.md` for complete patterns.

## Service Scoping (CRITICAL)

| Type           | Location             | Injectable              |
| -------------- | -------------------- | ----------------------- |
| App Singleton  | `@shared/services`   | `providedIn: 'root'`    |
| Domain Persist | `@{domain}/core`     | `providedIn: 'root'` OK |
| Domain Scoped  | `@{domain}/services` | Route `providers` ONLY  |

**Rule**: `@{domain}/services/` must NEVER use `providedIn: 'root'`

## Domain Boundaries (CRITICAL)

Each domain imports ONLY `@shared/*` + itself. NEVER another domain.

| From → To  | @shared | @admin | @sandbox | @developer |
| ---------- | ------- | ------ | -------- | ---------- |
| @shared    | ✅      | ❌     | ❌       | ❌         |
| @admin     | ✅      | ✅     | ❌       | ❌         |
| @sandbox   | ✅      | ❌     | ✅       | ❌         |
| @developer | ✅      | ❌     | ❌       | ✅         |

## File Organization

| Type            | Location                | Import From             |
| --------------- | ----------------------- | ----------------------- |
| Route Pages     | `{domain}/pages/`       | Route `loadComponent`   |
| Subdomain Pages | `{domain}/{sub}/pages/` | Route `loadComponent`   |
| Error Pages     | `shared/pages/`         | `@shared/pages`         |
| Domain Models   | `{domain}/models/`      | `@{domain}/models`      |
| Shared Models   | `shared/models/`        | `@shared/models`        |
| Contracts       | `shared/interfaces/`    | `@shared/interfaces`    |
| Domain Services | `{domain}/services/`    | Route `providers` array |
| Shared Services | `shared/services/`      | `providedIn: 'root'`    |

## Single Export Per File

Each `.ts` file exports ONE primary item.

**Exceptions** (approved multi-export patterns):

- `index.ts` barrel exports
- `generated-open-api.ts` (auto-generated)
- `app-error.model.ts` (error hierarchies)
- `*.animations.ts`, `*.utility.ts`, `*.builder.ts`
- `*.constants.ts` (cohesive constant sets)
- All `testing/` folder files

## Testing (Zoneless)

```typescript
TestBed.configureTestingModule({
	providers: [provideZonelessChangeDetection()],
});
```

**Forbidden**: `fakeAsync`, `tick`, `NgZone`
**Use instead**: `TestBed.flushEffects()`, `jasmine.clock().tick()`

## Cross-Platform (Windows + Linux)

| ❌ NEVER                            | ✅ ALWAYS                                         |
| ----------------------------------- | ------------------------------------------------- |
| `"folder\\file.ts"` hardcoded `\\`  | `path.join("folder", "file.ts")` or `/` separator |
| Case-insensitive import assumptions | Consistent casing (Linux is case-sensitive)       |
| `process.platform` without fallback | Conditional with both Windows + Linux paths       |
| PowerShell-only CI scripts          | Cross-platform Node.js scripts or dual support    |

**Rule**: CI runs on `ubuntu-latest`. All build/test scripts MUST work on Linux.
