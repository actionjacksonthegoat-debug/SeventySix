---
agent: agent
description: Generate Angular component following SeventySix patterns
---

# Generate Angular Component

Create a new Angular component with these requirements:

## Required Patterns

1. **Signal inputs/outputs**: `input.required<T>()`, `output<T>()`
2. **OnPush detection**: Always `changeDetection: ChangeDetectionStrategy.OnPush`
3. **Inject DI**: Use `inject()` function, never constructor
4. **Computed state**: Derive with `computed()`
5. **Host bindings**: Use `host: {}` object, not decorators
6. **Control flow**: `@if`, `@for`, `@switch`
7. **Explicit types**: `const x: string = ""` everywhere
8. **Zoneless**: Never use Zone.js

## Formatting Rules

-   New line after every `=` with indented value
-   New line before every `.` in chains
-   Lambda params on new line after `(`
-   Each param on new line when 2+ params

## Template

```typescript
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

## Naming Convention

-   Use `*Page` suffix ONLY when a model with same name exists
-   Otherwise use `*Component` suffix
