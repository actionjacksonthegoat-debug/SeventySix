# TanStack Query + ASP.NET Output Caching Implementation Plan

## Overview

This plan implements a modern, centralized caching strategy using **TanStack Query v5 (Angular Experimental)** on the client and **ASP.NET Core Output Caching** on the server. This replaces all existing cache infrastructure with a single source of truth configuration.

**Key Principle:** Zero custom cache code, single configuration location per layer, full alignment with SOLID principles and Clean Architecture.

---

## Phase 1: Server-Side Configuration (ASP.NET Core Output Caching)

### 1.1 Add Cache Configuration Section to appsettings.json

**File:** `SeventySix.Server/SeventySix.Api/appsettings.json`

**Add new section:**

```json
{
	"Cache": {
		"OutputCache": {
			"Policies": {
				"Weather": {
					"DurationSeconds": 300,
					"VaryByQuery": ["latitude", "longitude", "units", "language", "exclude", "timestamp"],
					"Tag": "weather",
					"Enabled": true
				},
				"Users": {
					"DurationSeconds": 60,
					"VaryByQuery": ["id"],
					"Tag": "users",
					"Enabled": true
				},
				"Logs": {
					"DurationSeconds": 300,
					"VaryByQuery": ["logLevel", "startDate", "endDate", "sourceContext", "requestPath", "page", "pageSize"],
					"Tag": "logs",
					"Enabled": true
				},
				"LogCharts": {
					"DurationSeconds": 120,
					"VaryByQuery": ["startDate", "endDate", "hoursBack", "topN", "count", "period"],
					"Tag": "logs",
					"Enabled": true
				},
				"Health": {
					"DurationSeconds": 30,
					"VaryByQuery": [],
					"Tag": "health",
					"Enabled": true
				},
				"ThirdPartyRequests": {
					"DurationSeconds": 60,
					"VaryByQuery": ["page", "pageSize"],
					"Tag": "third-party",
					"Enabled": true
				}
			}
		}
	}
}
```

**Development override:** `appsettings.Development.json`

```json
{
	"Cache": {
		"OutputCache": {
			"Policies": {
				"Weather": { "DurationSeconds": 10, "Enabled": false },
				"Users": { "DurationSeconds": 5, "Enabled": false },
				"Logs": { "DurationSeconds": 5, "Enabled": false },
				"LogCharts": { "DurationSeconds": 5, "Enabled": false },
				"Health": { "DurationSeconds": 5, "Enabled": false },
				"ThirdPartyRequests": { "DurationSeconds": 5, "Enabled": false }
			}
		}
	}
}
```

### 1.2 Create Configuration Models

**File:** `SeventySix.BusinessLogic/Configuration/OutputCacheOptions.cs`

```csharp
namespace SeventySix.BusinessLogic.Configuration;

public class OutputCacheOptions
{
	public const string SECTION_NAME = "Cache:OutputCache";

	public Dictionary<string, CachePolicyConfig> Policies { get; set; } = new();
}

public class CachePolicyConfig
{
	public int DurationSeconds { get; set; }
	public string[] VaryByQuery { get; set; } = Array.Empty<string>();
	public string Tag { get; set; } = string.Empty;
	public bool Enabled { get; set; } = true;
}
```

### 1.3 Configure Output Caching in Program.cs

**File:** `SeventySix.Server/SeventySix.Api/Program.cs`

**Replace existing cache configuration:**

```csharp
// Configure and validate output cache options
builder.Services.Configure<OutputCacheOptions>(
	builder.Configuration.GetSection(OutputCacheOptions.SECTION_NAME));

builder.Services.AddOptions<OutputCacheOptions>()
	.Bind(builder.Configuration.GetSection(OutputCacheOptions.SECTION_NAME))
	.ValidateOnStart();

// Add output caching with dynamic policy registration
builder.Services.AddOutputCache(options =>
{
	var cacheConfig = builder.Configuration
		.GetSection(OutputCacheOptions.SECTION_NAME)
		.Get<OutputCacheOptions>();

	if (cacheConfig?.Policies == null) return;

	foreach (var (name, config) in cacheConfig.Policies)
	{
		if (!config.Enabled) continue;

		var policyName = name.ToLowerInvariant();

		options.AddPolicy(policyName, policyBuilder =>
		{
			policyBuilder
				.Expire(TimeSpan.FromSeconds(config.DurationSeconds))
				.Tag(config.Tag);

			if (config.VaryByQuery.Length > 0)
			{
				policyBuilder.SetVaryByQuery(config.VaryByQuery);
			}
		});
	}
});

// Remove old response caching (replaced by output caching)
// builder.Services.AddResponseCaching(); // DELETE THIS LINE

// Memory cache still needed for OpenWeather API
builder.Services.AddMemoryCache();
```

**Update middleware pipeline:**

```csharp
// Enable response compression
app.UseResponseCompression();

// DELETE: app.UseResponseCaching(); // Replaced by output caching

// Enable output caching (must be before UseAuthorization)
app.UseOutputCache();
```

### 1.4 Update Controllers with OutputCache Attributes

**File:** `SeventySix.Server/SeventySix.Api/Controllers/WeatherForecastController.cs`

**Replace all `[ResponseCache]` with `[OutputCache]`:**

```csharp
using Microsoft.AspNetCore.OutputCaching;

// Example endpoints
[HttpGet("current")]
[OutputCache(PolicyName = "weather")] // REPLACE ResponseCache
public async Task<ActionResult<CurrentWeather>> GetCurrentWeatherAsync(...)

[HttpGet("hourly")]
[OutputCache(PolicyName = "weather")]
public async Task<ActionResult<HourlyForecast[]>> GetHourlyForecastAsync(...)

[HttpGet("daily")]
[OutputCache(PolicyName = "weather")]
public async Task<ActionResult<DailyForecast[]>> GetDailyForecastAsync(...)
```

**File:** `SeventySix.Server/SeventySix.Api/Controllers/UserController.cs`

```csharp
using Microsoft.AspNetCore.OutputCaching;

[HttpGet]
[OutputCache(PolicyName = "users")]
public async Task<ActionResult<IEnumerable<UserDto>>> GetAllAsync(...)

[HttpGet("{id}")]
[OutputCache(PolicyName = "users")]
public async Task<ActionResult<UserDto>> GetByIdAsync(int id, ...)
```

**File:** `SeventySix.Server/SeventySix.Api/Controllers/LogsController.cs`

```csharp
// Already has OutputCache attributes from previous implementation
// Verify they match configuration:
[HttpGet]
[OutputCache(PolicyName = "logs")]
public async Task<ActionResult<PagedLogResponse>> GetLogsAsync(...)

[HttpGet("charts/by-level")]
[OutputCache(PolicyName = "logcharts")]
public async Task<ActionResult<LogsByLevelResponse>> GetLogsByLevelAsync(...)
```

**File:** `SeventySix.Server/SeventySix.Api/Controllers/HealthController.cs`

```csharp
using Microsoft.AspNetCore.OutputCaching;

[HttpGet]
[OutputCache(PolicyName = "health")]
public async Task<ActionResult<HealthCheckResponse>> GetHealthAsync(...)
```

**File:** `SeventySix.Server/SeventySix.Api/Controllers/ThirdPartyApiRequestController.cs`

```csharp
using Microsoft.AspNetCore.OutputCaching;

[HttpGet]
[OutputCache(PolicyName = "thirdpartyrequests")]
public async Task<ActionResult<PagedThirdPartyRequestResponse>> GetRequestsAsync(...)
```

### 1.5 Add Cache Invalidation Helper

**File:** `SeventySix.Server/SeventySix.Api/Extensions/CacheInvalidationExtensions.cs`

```csharp
using Microsoft.AspNetCore.OutputCaching;

namespace SeventySix.Api.Extensions;

public static class CacheInvalidationExtensions
{
	public static async Task InvalidateCacheByTagAsync(
		this IServiceProvider services,
		string tag,
		CancellationToken cancellationToken = default)
	{
		var cache = services.GetRequiredService<IOutputCacheStore>();
		await cache.EvictByTagAsync(tag, cancellationToken);
	}

	public static async Task InvalidateMultipleTagsAsync(
		this IServiceProvider services,
		string[] tags,
		CancellationToken cancellationToken = default)
	{
		var cache = services.GetRequiredService<IOutputCacheStore>();

		foreach (var tag in tags)
		{
			await cache.EvictByTagAsync(tag, cancellationToken);
		}
	}
}
```

**Usage in controllers (already implemented in LogsController):**

```csharp
// After mutations
await HttpContext.RequestServices.InvalidateCacheByTagAsync("logs", cancellationToken);
```

---

## Phase 2: Client-Side Configuration (TanStack Query)

### 2.1 Install TanStack Query

**File:** `SeventySix.Client/package.json`

```bash
npm install @tanstack/angular-query-experimental @tanstack/query-core
```

### 2.2 Add Cache Configuration to Environment

**File:** `SeventySix.Client/src/environments/environment.ts`

```typescript
export const environment = {
	production: true,
	apiUrl: "https://localhost:7074/api",
	logging: {
		enableRemoteLogging: true,
		batchSize: 10,
		batchInterval: 5000,
		maxQueueSize: 100,
		maxRetryCount: 3,
		circuitBreakerThreshold: 5,
		circuitBreakerTimeout: 30000,
	},
	cache: {
		query: {
			// Global defaults
			default: {
				staleTime: 30000, // 30s - Consider fresh
				gcTime: 300000, // 5min - Keep in memory
				retry: 3,
				refetchOnWindowFocus: true,
				refetchOnReconnect: true,
			},
			// Resource-specific overrides
			weather: {
				staleTime: 300000, // 5min
				gcTime: 600000, // 10min
				retry: 2,
			},
			users: {
				staleTime: 60000, // 1min
				gcTime: 300000, // 5min
				retry: 3,
			},
			logs: {
				staleTime: 30000, // 30s
				gcTime: 300000, // 5min
				retry: 2,
			},
			health: {
				staleTime: 10000, // 10s
				gcTime: 60000, // 1min
				retry: 1,
			},
		},
	},
};
```

**File:** `SeventySix.Client/src/environments/environment.development.ts`

```typescript
export const environment = {
	production: false,
	apiUrl: "https://localhost:7074/api",
	logging: {
		enableRemoteLogging: true,
		batchSize: 10,
		batchInterval: 5000,
		maxQueueSize: 100,
		maxRetryCount: 3,
		circuitBreakerThreshold: 5,
		circuitBreakerTimeout: 30000,
	},
	cache: {
		query: {
			default: {
				staleTime: 0, // Always stale in dev
				gcTime: 60000, // 1min in dev
				retry: 1,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
			},
			weather: { staleTime: 0, gcTime: 60000, retry: 1 },
			users: { staleTime: 0, gcTime: 60000, retry: 1 },
			logs: { staleTime: 0, gcTime: 60000, retry: 1 },
			health: { staleTime: 0, gcTime: 60000, retry: 1 },
		},
	},
};
```

### 2.3 Configure TanStack Query in App Config

**File:** `SeventySix.Client/src/app/app.config.ts`

```typescript
import { ApplicationConfig, ErrorHandler, isDevMode, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, APP_INITIALIZER } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from "@angular/common/http";
import { provideServiceWorker } from "@angular/service-worker";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideAngularQuery, QueryClient } from "@tanstack/angular-query-experimental";

import { routes } from "./app.routes";
import {
	errorInterceptor,
	loggingInterceptor,
	authInterceptor,
	// DELETE: cacheInterceptor - TanStack handles caching
} from "@core/interceptors";
import { ErrorHandlerService, ThemeService } from "@core/services";
import { environment } from "@environments/environment";

function initializeTheme(_themeService: ThemeService) {
	return () => {
		return Promise.resolve();
	};
}

export const appConfig: ApplicationConfig = {
	providers: [
		// TanStack Query with environment-based configuration
		provideAngularQuery(
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: environment.cache.query.default.staleTime,
						gcTime: environment.cache.query.default.gcTime,
						retry: environment.cache.query.default.retry,
						refetchOnWindowFocus: environment.cache.query.default.refetchOnWindowFocus,
						refetchOnReconnect: environment.cache.query.default.refetchOnReconnect,
					},
				},
			})
		),
		provideHttpClient(
			withInterceptors([
				// REMOVED: cacheInterceptor
				authInterceptor,
				loggingInterceptor,
				errorInterceptor,
			]),
			withXsrfConfiguration({
				cookieName: "XSRF-TOKEN",
				headerName: "X-XSRF-TOKEN",
			})
		),
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(routes),
		provideAnimationsAsync(),
		{ provide: ErrorHandler, useClass: ErrorHandlerService },
		{
			provide: APP_INITIALIZER,
			useFactory: initializeTheme,
			deps: [ThemeService],
			multi: true,
		},
		// Keep Service Worker for offline support and asset caching only
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(),
			registrationStrategy: "registerWhenStable:30000",
		}),
	],
};
```

### 2.4 Update ngsw-config.json (Assets Only)

**File:** `SeventySix.Client/ngsw-config.json`

```json
{
	"$schema": "./node_modules/@angular/service-worker/config/schema.json",
	"index": "/index.html",
	"appData": {
		"name": "SeventySix",
		"version": "1.0.0",
		"description": "SeventySix Application with Progressive Web App capabilities"
	},
	"assetGroups": [
		{
			"name": "app",
			"installMode": "prefetch",
			"updateMode": "prefetch",
			"resources": {
				"files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"]
			}
		},
		{
			"name": "assets",
			"installMode": "lazy",
			"updateMode": "prefetch",
			"resources": {
				"files": ["/assets/**", "/*.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)"]
			}
		}
	],
	"navigationUrls": ["/**", "!/**/*.*", "!/**/*__*", "!/**/*__*/**"]
}
```

**Note:** Removed `dataGroups` section - TanStack Query handles API caching.

---

## Phase 3: Migrate Services to TanStack Query

### 3.1 Create Query Configuration Helper

**File:** `SeventySix.Client/src/app/core/utils/query-config.ts`

```typescript
import { environment } from "@environments/environment";

export interface QueryOptions {
	staleTime?: number;
	gcTime?: number;
	retry?: number;
}

export function getQueryConfig(resource: string): QueryOptions {
	const config = environment.cache.query;
	const resourceConfig = config[resource as keyof typeof config];

	if (resourceConfig && typeof resourceConfig === "object") {
		return {
			staleTime: resourceConfig.staleTime,
			gcTime: resourceConfig.gcTime,
			retry: resourceConfig.retry,
		};
	}

	return {
		staleTime: config.default.staleTime,
		gcTime: config.default.gcTime,
		retry: config.default.retry,
	};
}
```

### 3.2 Migrate Weather Service

**File:** `SeventySix.Client/src/app/features/home/weather/services/weather.service.ts`

**BEFORE:**

```typescript
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { WeatherForecast } from "@home/weather/models";
import { WeatherForecastRepository } from "@home/weather/repositories";

@Injectable({ providedIn: "root" })
export class WeatherService {
	private readonly weatherRepository = inject(WeatherForecastRepository);

	getAllForecasts(): Observable<WeatherForecast[]> {
		return this.weatherRepository.getAll();
	}

	getForecastById(id: number | string): Observable<WeatherForecast> {
		return this.weatherRepository.getById(id);
	}

	createForecast(forecast: Partial<WeatherForecast>): Observable<WeatherForecast> {
		return this.weatherRepository.create(forecast);
	}

	updateForecast(id: number | string, forecast: Partial<WeatherForecast>): Observable<WeatherForecast> {
		return this.weatherRepository.update(id, forecast);
	}

	deleteForecast(id: number | string): Observable<void> {
		return this.weatherRepository.delete(id);
	}
}
```

**AFTER:**

```typescript
import { inject, Injectable } from "@angular/core";
import { injectQuery, injectMutation, injectQueryClient } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { WeatherForecast } from "@home/weather/models";
import { WeatherForecastRepository } from "@home/weather/repositories";
import { getQueryConfig } from "@core/utils/query-config";

@Injectable({ providedIn: "root" })
export class WeatherService {
	private readonly weatherRepository = inject(WeatherForecastRepository);
	private readonly queryClient = injectQueryClient();
	private readonly queryConfig = getQueryConfig("weather");

	/**
	 * Query for all weather forecasts
	 * Automatically cached with TanStack Query
	 */
	getAllForecasts() {
		return injectQuery(() => ({
			queryKey: ["weather", "forecasts"],
			queryFn: () => lastValueFrom(this.weatherRepository.getAll()),
			...this.queryConfig,
		}));
	}

	/**
	 * Query for weather forecast by ID
	 */
	getForecastById(id: number | string) {
		return injectQuery(() => ({
			queryKey: ["weather", "forecast", id],
			queryFn: () => lastValueFrom(this.weatherRepository.getById(id)),
			...this.queryConfig,
		}));
	}

	/**
	 * Mutation for creating weather forecast
	 * Automatically invalidates related queries on success
	 */
	createForecast() {
		return injectMutation(() => ({
			mutationFn: (forecast: Partial<WeatherForecast>) => lastValueFrom(this.weatherRepository.create(forecast)),
			onSuccess: () => {
				// Invalidate and refetch all forecasts
				this.queryClient.invalidateQueries({
					queryKey: ["weather", "forecasts"],
				});
			},
		}));
	}

	/**
	 * Mutation for updating weather forecast
	 */
	updateForecast() {
		return injectMutation(() => ({
			mutationFn: ({ id, forecast }: { id: number | string; forecast: Partial<WeatherForecast> }) => lastValueFrom(this.weatherRepository.update(id, forecast)),
			onSuccess: (_, variables) => {
				// Invalidate specific forecast and list
				this.queryClient.invalidateQueries({
					queryKey: ["weather", "forecast", variables.id],
				});
				this.queryClient.invalidateQueries({
					queryKey: ["weather", "forecasts"],
				});
			},
		}));
	}

	/**
	 * Mutation for deleting weather forecast
	 */
	deleteForecast() {
		return injectMutation(() => ({
			mutationFn: (id: number | string) => lastValueFrom(this.weatherRepository.delete(id)),
			onSuccess: () => {
				// Invalidate all forecasts
				this.queryClient.invalidateQueries({
					queryKey: ["weather", "forecasts"],
				});
			},
		}));
	}
}
```

### 3.3 Migrate User Service

**File:** `SeventySix.Client/src/app/features/admin/users/services/user.service.ts`

**AFTER:**

```typescript
import { inject, Injectable } from "@angular/core";
import { injectQuery, injectMutation, injectQueryClient } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { User } from "@admin/users/models";
import { UserRepository } from "@admin/users/repositories";
import { getQueryConfig } from "@core/utils/query-config";

@Injectable({ providedIn: "root" })
export class UserService {
	private readonly userRepository = inject(UserRepository);
	private readonly queryClient = injectQueryClient();
	private readonly queryConfig = getQueryConfig("users");

	getAllUsers() {
		return injectQuery(() => ({
			queryKey: ["users"],
			queryFn: () => lastValueFrom(this.userRepository.getAll()),
			...this.queryConfig,
		}));
	}

	getUserById(id: number | string) {
		return injectQuery(() => ({
			queryKey: ["users", id],
			queryFn: () => lastValueFrom(this.userRepository.getById(id)),
			...this.queryConfig,
		}));
	}

	createUser() {
		return injectMutation(() => ({
			mutationFn: (user: Partial<User>) => lastValueFrom(this.userRepository.create(user)),
			onSuccess: () => {
				this.queryClient.invalidateQueries({ queryKey: ["users"] });
			},
		}));
	}

	updateUser() {
		return injectMutation(() => ({
			mutationFn: ({ id, user }: { id: number | string; user: Partial<User> }) => lastValueFrom(this.userRepository.update(id, user)),
			onSuccess: (_, variables) => {
				this.queryClient.invalidateQueries({ queryKey: ["users", variables.id] });
				this.queryClient.invalidateQueries({ queryKey: ["users"] });
			},
		}));
	}

	deleteUser() {
		return injectMutation(() => ({
			mutationFn: (id: number | string) => lastValueFrom(this.userRepository.delete(id)),
			onSuccess: () => {
				this.queryClient.invalidateQueries({ queryKey: ["users"] });
			},
		}));
	}
}
```

### 3.4 Migrate Log Management Service

**File:** `SeventySix.Client/src/app/features/admin/log-management/services/log-management.service.ts`

**AFTER (completely rewritten):**

```typescript
import { inject, Injectable } from "@angular/core";
import { injectQuery, injectMutation, injectQueryClient } from "@tanstack/angular-query-experimental";
import { signal, computed } from "@angular/core";
import { lastValueFrom } from "rxjs";
import { LogsApiService } from "./logs-api.service";
import { LogFilterRequest } from "@admin/log-management/models";
import { getQueryConfig } from "@core/utils/query-config";

@Injectable({ providedIn: "root" })
export class LogManagementService {
	private readonly logsApiService = inject(LogsApiService);
	private readonly queryClient = injectQueryClient();
	private readonly queryConfig = getQueryConfig("logs");

	// Filter state using signals
	readonly filter = signal<LogFilterRequest>({
		pageNumber: 1,
		pageSize: 50,
	});

	// Selected log IDs using signals
	readonly selectedIds = signal<Set<number>>(new Set());

	// Computed selected count
	readonly selectedCount = computed(() => this.selectedIds().size);

	/**
	 * Query for logs based on current filter
	 */
	getLogs() {
		return injectQuery(() => ({
			queryKey: ["logs", this.filter()],
			queryFn: () => lastValueFrom(this.logsApiService.getLogs(this.filter())),
			...this.queryConfig,
		}));
	}

	/**
	 * Query for log count based on current filter
	 */
	getLogCount() {
		return injectQuery(() => ({
			queryKey: ["logs", "count", this.filter()],
			queryFn: () => lastValueFrom(this.logsApiService.getLogCount(this.filter())),
			...this.queryConfig,
		}));
	}

	/**
	 * Update filter and automatically refetch
	 */
	updateFilter(filter: Partial<LogFilterRequest>): void {
		this.filter.update((current) => ({ ...current, ...filter, pageNumber: 1 }));
	}

	/**
	 * Set page number
	 */
	setPage(pageNumber: number): void {
		this.filter.update((current) => ({ ...current, pageNumber }));
	}

	/**
	 * Set page size
	 */
	setPageSize(pageSize: number): void {
		this.filter.update((current) => ({ ...current, pageSize, pageNumber: 1 }));
	}

	/**
	 * Clear all filters
	 */
	clearFilters(): void {
		this.filter.set({
			pageNumber: 1,
			pageSize: this.filter().pageSize || 50,
		});
		this.clearSelection();
	}

	/**
	 * Mutation for deleting a single log
	 */
	deleteLog() {
		return injectMutation(() => ({
			mutationFn: (id: number) => lastValueFrom(this.logsApiService.deleteLog(id)),
			onSuccess: () => {
				// Invalidate all log queries
				this.queryClient.invalidateQueries({ queryKey: ["logs"] });
			},
		}));
	}

	/**
	 * Mutation for batch deleting logs
	 */
	deleteLogs() {
		return injectMutation(() => ({
			mutationFn: (ids: number[]) => lastValueFrom(this.logsApiService.deleteLogs(ids)),
			onSuccess: () => {
				this.clearSelection();
				this.queryClient.invalidateQueries({ queryKey: ["logs"] });
			},
		}));
	}

	/**
	 * Delete selected logs
	 */
	deleteSelected() {
		const mutation = this.deleteLogs();
		const ids = Array.from(this.selectedIds());
		return mutation.mutate(ids);
	}

	/**
	 * Toggle log ID selection
	 */
	toggleSelection(id: number): void {
		this.selectedIds.update((current) => {
			const newSet = new Set(current);
			if (newSet.has(id)) {
				newSet.delete(id);
			} else {
				newSet.add(id);
			}
			return newSet;
		});
	}

	/**
	 * Select all visible logs
	 */
	selectAll(logIds: number[]): void {
		this.selectedIds.set(new Set(logIds));
	}

	/**
	 * Clear all selections
	 */
	clearSelection(): void {
		this.selectedIds.set(new Set());
	}
}
```

### 3.5 Update Component Usage

**Example:** `SeventySix.Client/src/app/features/admin/users/subpages/users-page.ts`

**BEFORE:**

```typescript
export class UsersPage implements OnInit {
	private readonly userService = inject(UserService);
	users: User[] = [];
	loading = true;

	ngOnInit(): void {
		this.userService.getAllUsers().subscribe((users) => {
			this.users = users;
			this.loading = false;
		});
	}
}
```

**AFTER:**

```typescript
export class UsersPage {
	private readonly userService = inject(UserService);

	// TanStack Query handles loading, error, and data states
	readonly usersQuery = this.userService.getAllUsers();

	// Computed signals for derived state
	readonly users = computed(() => this.usersQuery.data() ?? []);
	readonly isLoading = computed(() => this.usersQuery.isLoading());
	readonly error = computed(() => this.usersQuery.error());
}
```

**Template:**

```html
@if (isLoading()) {
<mat-spinner />
} @else if (error()) {
<div class="error">{{ error()?.message }}</div>
} @else { @for (user of users(); track user.id) {
<user-card [user]="user" />
} }
```

---

## Phase 4: Cleanup and Removal

### 4.1 Delete Obsolete Files

**Delete these files:**

1. `SeventySix.Client/src/app/core/interceptors/cache.interceptor.ts`
2. `SeventySix.Client/src/app/core/interceptors/cache.interceptor.spec.ts`
3. `SeventySix.Client/src/app/core/services/cache.service.ts`
4. `SeventySix.Client/src/app/core/services/cache-config.service.ts`

### 4.2 Update Barrel Exports

**File:** `SeventySix.Client/src/app/core/interceptors/index.ts`

```typescript
export * from "./auth.interceptor";
export * from "./error.interceptor";
export * from "./logging.interceptor";
// REMOVED: export * from './cache.interceptor';
```

**File:** `SeventySix.Client/src/app/core/services/index.ts`

```typescript
// Remove cache-related exports
// export * from './cache.service';
// export * from './cache-config.service';
```

---

## Phase 5: Testing Strategy

### 5.1 Server-Side Tests

**Test configuration loading:**

```csharp
[Fact]
public void OutputCacheOptions_LoadsFromConfiguration()
{
	// Arrange
	var config = new ConfigurationBuilder()
		.AddJsonFile("appsettings.json")
		.Build();

	// Act
	var options = config.GetSection(OutputCacheOptions.SECTION_NAME)
		.Get<OutputCacheOptions>();

	// Assert
	Assert.NotNull(options);
	Assert.NotEmpty(options.Policies);
	Assert.True(options.Policies.ContainsKey("Weather"));
}
```

**Test cache invalidation:**

```csharp
[Fact]
public async Task CreateLog_InvalidatesCacheByTag()
{
	// Arrange
	var mockCache = new Mock<IOutputCacheStore>();

	// Act
	await controller.LogClientErrorAsync(request);

	// Assert
	mockCache.Verify(c => c.EvictByTagAsync("logs", It.IsAny<CancellationToken>()),
		Times.Once);
}
```

### 5.2 Client-Side Tests

**Test query configuration:**

```typescript
describe("getQueryConfig", () => {
	it("should return weather-specific config", () => {
		const config = getQueryConfig("weather");
		expect(config.staleTime).toBe(environment.cache.query.weather.staleTime);
	});

	it("should return default config for unknown resource", () => {
		const config = getQueryConfig("unknown");
		expect(config.staleTime).toBe(environment.cache.query.default.staleTime);
	});
});
```

**Test service with TanStack Query:**

```typescript
describe("UserService", () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), provideAngularQuery(new QueryClient())],
		});
	});

	it("should create query for all users", () => {
		const service = TestBed.inject(UserService);
		const query = service.getAllUsers();

		expect(query.queryKey()).toEqual(["users"]);
	});
});
```

---

## Phase 6: Migration Checklist

### Server-Side Checklist

-   [ ] Add `OutputCacheOptions` configuration model
-   [ ] Update `appsettings.json` with cache policies
-   [ ] Update `appsettings.Development.json` with dev overrides
-   [ ] Configure output caching in `Program.cs`
-   [ ] Replace all `[ResponseCache]` with `[OutputCache]` in controllers:
    -   [ ] `WeatherForecastController`
    -   [ ] `UserController`
    -   [ ] `LogsController` (already done)
    -   [ ] `HealthController`
    -   [ ] `ThirdPartyApiRequestController`
-   [ ] Add cache invalidation to mutation endpoints
-   [ ] Remove `AddResponseCaching()` from `Program.cs`
-   [ ] Remove `UseResponseCaching()` from middleware pipeline
-   [ ] Update controller tests
-   [ ] Verify cache policies work in production

### Client-Side Checklist

-   [ ] Install `@tanstack/angular-query-experimental`
-   [ ] Add cache configuration to `environment.ts`
-   [ ] Add cache configuration to `environment.development.ts`
-   [ ] Configure TanStack Query in `app.config.ts`
-   [ ] Create `query-config.ts` helper
-   [ ] Migrate services:
    -   [ ] `WeatherService`
    -   [ ] `UserService`
    -   [ ] `LogManagementService`
    -   [ ] Other services as needed
-   [ ] Update components to use queries/mutations
-   [ ] Remove `cacheInterceptor` from `app.config.ts`
-   [ ] Delete `cache.interceptor.ts`
-   [ ] Delete `cache.service.ts`
-   [ ] Delete `cache-config.service.ts`
-   [ ] Update barrel exports
-   [ ] Remove API `dataGroups` from `ngsw-config.json`
-   [ ] Update component tests
-   [ ] Verify queries work in production

---

## Benefits Summary

### Code Deletion

**Server:**

-   Delete: Custom cache middleware (if any)
-   Replace: `ResponseCache` → `OutputCache` (built-in, better)

**Client:**

-   Delete: `cache.interceptor.ts` (~70 lines)
-   Delete: `cache.service.ts` (~400 lines)
-   Delete: `cache-config.service.ts` (~300 lines)
-   Delete: `ngsw-config.json` API dataGroups (~50 lines)
-   Delete: BehaviorSubject boilerplate in services (~200+ lines across multiple files)

**Total:** ~1000+ lines of custom cache code deleted

### Single Source of Truth

**Server:** `appsettings.json` → All cache durations and policies
**Client:** `environment.ts` → All query configurations

### Maintainability

-   No custom cache logic to debug
-   Industry-standard patterns (TanStack Query)
-   Automatic cache invalidation
-   DevTools for debugging (TanStack Query DevTools)
-   Type-safe query keys
-   Automatic loading/error states
-   Background refetching
-   Optimistic updates
-   Infinite queries support (future)

### Performance

-   Deduplication built-in
-   Stale-while-revalidate
-   Memory management
-   Server-side caching reduces DB load
-   Client-side caching reduces network calls

---

## Future Enhancements

### Redis Integration (Optional)

When you need distributed caching:

```csharp
// Program.cs
builder.Services.AddStackExchangeRedisOutputCache(options =>
{
	options.Configuration = builder.Configuration.GetConnectionString("Redis");
});
```

**No code changes needed in controllers or configuration!**

### TanStack Query DevTools (Development)

```typescript
import { provideTanStackQueryDevtools } from "@tanstack/angular-query-experimental";

// app.config.ts
providers: [
	// Add devtools in development
	...(isDevMode() ? [provideTanStackQueryDevtools()] : []),
];
```

### Prefetching

```typescript
// Prefetch next page
queryClient.prefetchQuery({
	queryKey: ["users", nextPage],
	queryFn: () => lastValueFrom(userRepository.getAll({ page: nextPage })),
});
```

---

## Migration Order

1. **Week 1:** Server-side configuration and controller updates
2. **Week 2:** Client-side TanStack Query setup and helper utilities
3. **Week 3:** Migrate one feature (e.g., Users) end-to-end
4. **Week 4:** Migrate remaining features
5. **Week 5:** Delete obsolete code and cleanup
6. **Week 6:** Testing and documentation

---

## Success Criteria

-   [ ] All API endpoints use `OutputCache` with configuration
-   [ ] All client queries use TanStack Query
-   [ ] Cache configuration exists in ONE location per layer
-   [ ] All custom cache code deleted
-   [ ] Tests passing (>80% coverage)
-   [ ] No performance regressions
-   [ ] DevTools show query states correctly
-   [ ] Documentation updated

---

**END OF IMPLEMENTATION PLAN**
