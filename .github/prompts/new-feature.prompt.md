---
agent: agent
description: Scaffold full-stack feature with Angular client and .NET server
---

# Generate Full-Stack Feature

Create a complete feature spanning Angular client and .NET server.

## Server Structure

```
SeventySix/
└── {{Context}}/
    ├── Commands/
    │   └── Create{{Name}}/
    │       ├── Create{{Name}}Command.cs
    │       ├── Create{{Name}}CommandHandler.cs
    │       └── Create{{Name}}RequestValidator.cs
    ├── Queries/
    │   └── Get{{Name}}ById/
    │       ├── Get{{Name}}ByIdQuery.cs
    │       └── Get{{Name}}ByIdQueryHandler.cs
    ├── DTOs/
    │   └── {{Name}}Dto.cs
    ├── Entities/
    │   └── {{Name}}.cs
    ├── Configurations/
    │   └── {{Name}}Configuration.cs
    └── Repositories/
        └── {{Name}}Repository.cs
```

## Client Structure

```
SeventySix.Client/src/app/features/
└── {{feature}}/
    ├── models/
    │   ├── index.ts
    │   └── {{name}}.model.ts
    ├── services/
    │   └── {{name}}.service.ts
    ├── {{name}}-list/
    │   └── {{name}}-list.component.ts
    ├── {{name}}-detail/
    │   └── {{name}}-detail.component.ts
    └── {{feature}}.routes.ts
```

## Server Patterns

### Entity

```csharp
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
public record {{Name}}Dto(
	int Id,
	string Name,
	DateTime CreatedAt);
```

### Wolverine Handler

```csharp
public record Get{{Name}}ByIdQuery(int Id);

public static class Get{{Name}}ByIdQueryHandler
{
	public static async Task<{{Name}}Dto?> HandleAsync(
		Get{{Name}}ByIdQuery query,
		{{Context}}DbContext dbContext,
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

### Service

```typescript
@Injectable()
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
					switchMap((params: Params) =>
						this.service.getById(+params['id'])),
					takeUntilDestroyed()));
}
```

### Routes

```typescript
export const {{FEATURE}}_ROUTES: Routes =
	[
		{
			path: '',
			providers: [{{Name}}Service],
			children: [
				{
					path: '',
					loadComponent: () =>
						import('./{{name}}-list/{{name}}-list.component')
							.then((m) => m.{{Name}}ListComponent),
				},
				{
					path: ':id',
					loadComponent: () =>
						import('./{{name}}-detail/{{name}}-detail.component')
							.then((m) => m.{{Name}}DetailComponent),
				},
			],
		},
	];
```

## Key Rules

-   Feature services scoped to route `providers`, never `providedIn: 'root'`
-   Path aliases: `@infrastructure`, `@shared`, `@admin`, `@game`
-   Features import from `@infrastructure` and `@shared` only
-   Validators colocate with handlers
-   New line after every `=`, before every `.`
