You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- ALWAYS use explicit types: `const name: string = "test";` - not inferred
- Avoid the `any` type; use `unknown` when type is uncertain

## Code Formatting (CRITICAL)

- ALWAYS put each parameter on new line when 2+ parameters
- ALWAYS place binary operators (`+`, `||`, `&&`, `??`) on LEFT of new lines
- ALWAYS new line AFTER every `=` sign with continuation indented
- ALWAYS new line BEFORE every `.` delimiter in method chains
- NEVER put `)` alone on its own line - keep with last parameter

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
- **Zoneless only** - never use Zone.js, NgZone, fakeAsync, tick

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- NEVER call methods in templates - use `computed()` signals or pre-compute in data model
- Component naming: `*Page` suffix ONLY when model with same name exists; otherwise use `*Component`

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- ALWAYS use `takeUntilDestroyed()` for subscription cleanup

## Services

- Design services around a single responsibility
- NEVER use `providedIn: 'root'` for feature services - use route `providers` array
- Use `providedIn: 'root'` ONLY for cross-cutting services (LoggerService, ApiService)
- Use the `inject()` function instead of constructor injection

## Testing

- ALWAYS follow **80/20 rule** - test critical paths only, no exhaustive edge case testing
- ALWAYS use `provideZonelessChangeDetection()` in tests
- NEVER skip failing tests - fix immediately
- Use `npm test` (headless, no-watch) - NOT runTests tool
