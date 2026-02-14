---
description: Angular/TypeScript patterns and rules for SeventySix.Client
applyTo: "**/SeventySix.Client/src/**/*.ts"
---

# Angular Instructions

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

## Accessibility

See `accessibility.instructions.md` for WCAG AA patterns (icons, loading, live regions).

## Service Scoping (CRITICAL)

| Type           | Location             | Injectable              |
| -------------- | -------------------- | ----------------------- |
| App Singleton  | `@shared/services`   | `providedIn: 'root'`    |
| Domain Persist | `@{domain}/core`     | `providedIn: 'root'` OK |
| Domain Scoped  | `@{domain}/services` | Route `providers` ONLY  |

**Rule**: `@{domain}/services/` must NEVER use `providedIn: 'root'`

## Domain Boundaries (CRITICAL)

Each domain imports ONLY `@shared/*` + itself. NEVER another domain.

| From → To  | @shared  | @admin   | @sandbox | @developer |
| ---------- | -------- | -------- | -------- | ---------- |
| @shared    | [SELF]   | [NEVER]  | [NEVER]  | [NEVER]    |
| @admin     | [OK]     | [SELF]   | [NEVER]  | [NEVER]    |
| @sandbox   | [OK]     | [NEVER]  | [SELF]   | [NEVER]    |
| @developer | [OK]     | [NEVER]  | [NEVER]  | [SELF]     |

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

## Error Handling (CRITICAL)

> **RULE**: Client error display must separate user-visible details from diagnostic-only details.

| Data                      | Destination              | Never              |
| ------------------------- | ------------------------ | ------------------ |
| Validation field errors   | User-visible `details[]` | —                  |
| Server `title` (4xx only) | User-visible `details[]` | 5xx titles         |
| URL, HTTP status line     | `diagnosticDetails[]`    | User-visible toast |
| `detail` from 5xx         | `diagnosticDetails[]`    | User-visible toast |
| `detail` from 4xx         | User-visible message     | —                  |

**Auth errors** use `mapAuthError()` with explicit `errorCode` switch cases:

- All server `AuthErrorCodes` must have matching client `AUTH_ERROR_CODE` entries
- Default case returns generic message — NEVER passes through `error.error?.detail`
- Use `AUTH_ERROR_CODE` constants, not string literals

## Date/Time Handling (CRITICAL)

| Required | Forbidden |
| --- | --- |
| `DateService` (wraps `date-fns` v4) | Native `new Date()`, `Date.now()`, `Date.parse()` |
| `date-fns` functions via `DateService` | Direct `moment`, `dayjs`, or other date libraries |

**Rule**: All production code AND test code must use `DateService` for date operations. Architecture tests enforce this — `new Date()` in any `.ts` file (except `date.service.ts` itself) will fail the build.

## Cross-Platform

See `copilot-instructions.md` Cross-Platform Compatibility section for Windows/Linux rules.

---

## TanStack Query Service Pattern

Services extend `BaseQueryService<TFilter>` which extends `BaseFilterService<TFilter>`. Use `injectQuery()` for reads, `createMutation()` for writes. `QueryKeys` for cache key management. `lastValueFrom()` bridges Observable → Promise for TanStack.

```typescript
@Injectable()
export class UserService extends BaseQueryService<UserQueryRequest> {
	protected readonly queryKeyPrefix: string = "users";
	private readonly apiService: ApiService = inject(ApiService);

	// Query — returns reactive CreateQueryResult
	getPagedUsers(): CreateQueryResult<PagedResultOfUserDto> {
		return injectQuery(() => ({
			queryKey: QueryKeys.users.paged(this.getCurrentFilter()).concat(this.forceRefreshTrigger()),
			queryFn: () => lastValueFrom(this.getPaged(this.getCurrentFilter(), this.getForceRefreshContext())),
			...this.queryConfig,
		}));
	}

	// Mutation — returns CreateMutationResult
	createUser(): CreateMutationResult<UserDto, Error, Partial<UserDto>> {
		return this.createMutation<Partial<UserDto>, UserDto>((user) => this.apiService.post<UserDto>(this.endpoint, user as CreateUserRequest));
	}
}
```

**Key classes:**

| Class                      | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `BaseFilterService`        | Signal-based filter management              |
| `BaseQueryService`         | Query/mutation helpers + cache invalidation |
| `QueryKeys`                | Centralized cache key factory               |
| `CacheCoordinationService` | Cross-feature cache invalidation            |

## App Initialization Pattern

```typescript
// app.config.ts critical patterns:
// 1. provideZonelessChangeDetection() — ALWAYS
// 2. provideRouter(routes, withPreloading(SelectivePreloadingStrategy))
// 3. provideTanStackQuery(new QueryClient({...})) — env-based config
// 4. HTTP interceptor pipeline ORDER matters:
//    cacheBypass → dateParse → auth → logging → error
// 5. App initializers run at startup:
//    initializeTheme, initializeTelemetry, initializeWebVitals, initializeAuth
// 6. ErrorHandler: { provide: ErrorHandler, useClass: ErrorHandlerService }
```

Standalone app (no NgModule), PWA service worker, `provideAppInitializer()` for startup hooks.

## Route Guard Pattern

Factory functions returning `CanMatchFn`. Use `inject()` inside the returned function. `passwordChangeGuard()` ALWAYS runs before `roleGuard()` in `canMatch` arrays.

```typescript
export function roleGuard(...requiredRoles: string[]): CanMatchFn {
	return () => {
		const authService: AuthService = inject(AuthService);
		const router: Router = inject(Router);

		if (!authService.isAuthenticated()) {
			const navigation: Navigation | null = router.currentNavigation();
			const targetUrl: string = navigation?.extractedUrl?.toString() ?? "/";
			const redirectUrl: UrlTree = router.createUrlTree([APP_ROUTES.AUTH.LOGIN], { queryParams: { returnUrl: targetUrl } });
			return redirectUrl;
		}

		if (requiredRoles.length === 0) {
			return true;
		}

		const hasRequiredRole: boolean = authService.hasAnyRole(...requiredRoles);
		return hasRequiredRole ? true : router.createUrlTree(["/"]);
	};
}
```

**Usage in routes:** `canMatch: [passwordChangeGuard(), roleGuard("Admin")]`

## Chrome DevTools Verification (REQUIRED)

After any component/service change, verify via Chrome DevTools MCP — see `copilot-instructions.md` Chrome DevTools section. Take screenshot + check console at minimum.

Use `chrome-devtools` MCP for verifying deployed component behavior:
- `mcp_chrome-devtoo_take_snapshot` — verify DOM structure and accessibility
- `mcp_chrome-devtoo_list_console_messages` — check for runtime errors
- `mcp_chrome-devtoo_list_network_requests` — verify API call patterns
- `mcp_chrome-devtoo_take_screenshot` — visual verification
- `mcp_chrome-devtoo_evaluate_script` — test signal values and component state

> **Reminder**: Do NOT create documentation files in `/docs/`. Update existing READMEs and instruction files instead. See `copilot-instructions.md` for the full documentation rules.
