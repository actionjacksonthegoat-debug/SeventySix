---
agent: agent
description: Generate Angular component following SeventySix patterns
---

# Generate Angular Component

Create a new Angular component with these requirements:

## MCP Tools

- Use **context7** to fetch up-to-date Angular API docs before generating code
- Use **figma** MCP if user provides a Figma design link — extract layout and styling for pixel-accurate implementation

## Domain Selection (REQUIRED)

Ask user which domain: admin, auth, account, developer, sandbox, home (or shared for cross-cutting)

## Import Boundaries (CRITICAL)

- Domain imports ONLY from `@shared/*` + own domain (`@{domain}/*`)
- NEVER import from another domain

## Required Patterns

1. **Signal inputs/outputs**: `input.required<T>()`, `output<T>()`
2. **OnPush detection**: Always `changeDetection: ChangeDetectionStrategy.OnPush`
3. **Inject DI**: Use `inject()` function, never constructor
4. **Computed state**: Derive with `computed()`
5. **Host bindings**: Use `host: {}` object, not decorators
6. **Control flow**: `@if`, `@for`, `@switch`
7. **Explicit types**: `const name: string = ""` everywhere
8. **Zoneless**: Never use Zone.js

## Formatting Rules

- New line after every `=` with indented value
- New line before every `.` in chains
- Lambda params on new line after `(`
- Each param on new line when 2+ params

## Template

```typescript
import { Component, ChangeDetectionStrategy, inject, input, output, computed } from '@angular/core';
import { SomeService } from '@{{domain}}/services'; // ONLY @shared/* or own domain

@Component({
    selector: 'app-{{name}}',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (data()) {
            <div [class.active]="isActive()">{{ data()!.name }}</div>
        }
    `,
    host: {
        '(click)': 'onClick()',
        '[class.active]': 'isActive()',
    },
})
export class {{Name}}Component {
    private readonly service: {{Service}} =
        inject({{Service}});

    data =
        input.required<{{Type}}>();
    selected =
        output<{{Type}}>();

    isActive =
        computed(() =>
            this.data()?.isActive ?? false);
}
```

## Service Scoping (CRITICAL)

| Location             | Injectable              |
| -------------------- | ----------------------- |
| `@shared/services`   | `providedIn: 'root'`    |
| `@{domain}/core`     | `providedIn: 'root'` OK |
| `@{domain}/services` | Route `providers` ONLY  |

**Rule**: `@{domain}/services/` must NEVER use `providedIn: 'root'`

## Naming Convention

- Use `*Page` suffix ONLY when a model with same name exists
- Otherwise use `*Component` suffix
