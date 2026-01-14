# Implementation Plan: Background Job Monitoring Dashboard

## Executive Summary

This plan outlines the implementation of an Admin Dashboard panel for monitoring Wolverine-based background jobs. The feature will display job execution history, scheduling status, and health metrics directly in the existing Admin Dashboard under a new "Scheduled Jobs" section within the External Systems tab.

**Key Design Decision:** Extend the existing `HealthController` API with a dedicated endpoint that queries the `recurring_job_executions` table, paired with a new Angular component following existing patterns (TanStack Query, Material Design, OnPush change detection).

---

## 📋 Current State Analysis

### Background Job Infrastructure (Staged)

The staged changes implement Wolverine-based scheduled messaging with execution tracking:

| Job                      | Domain                  | Interval   |
| ------------------------ | ----------------------- | ---------- |
| `RefreshTokenCleanupJob` | Identity                | 24 hours   |
| `IpAnonymizationJob`     | Identity                | 7 days     |
| `EmailQueueProcessJob`   | ElectronicNotifications | 10 seconds |
| `LogCleanupJob`          | Logging                 | 24 hours   |

### Existing Tracking Entity

`RecurringJobExecution` (already in `SeventySix.Shared/BackgroundJobs/`):

| Property          | Type              | Description                    |
| ----------------- | ----------------- | ------------------------------ |
| `JobName`         | `string` (PK)     | Unique job identifier          |
| `LastExecutedAt`  | `DateTimeOffset`  | Last successful execution time |
| `NextScheduledAt` | `DateTimeOffset?` | Next scheduled execution       |
| `LastExecutedBy`  | `string?`         | Machine/container name         |

### Admin Dashboard Structure (Current)

The Admin Dashboard has 3 tabs:

1. **System Overview** - Grafana embed for system health
2. **API Metrics** - Grafana embed for API metrics
3. **External Systems** - Third-party API stats + Log validations + Observability links

**Target Location:** New card component in "External Systems" tab, positioned after third-party API statistics table.

---

## 🔍 Design Decision: API vs Grafana

### Option 1: Grafana Dashboard ❌ NOT SELECTED

| Aspect          | Assessment                                                          |
| --------------- | ------------------------------------------------------------------- |
| **Feasibility** | ❌ No Wolverine/PostgreSQL job table metrics available in Grafana   |
| **Integration** | ⚠️ Requires custom Prometheus exporter or Grafana PostgreSQL plugin |
| **Consistency** | ❌ Different data source than existing third-party API stats        |
| **Complexity**  | ❌ Additional infrastructure (exporter/plugin configuration)        |

#### Why Custom Prometheus Exporter/Grafana Plugin Is NOT Recommended

**Custom Prometheus Exporter (8-16+ hours additional effort):**

-   Requires separate .NET service/sidecar querying PostgreSQL, exposing `/metrics` endpoint
-   Must create custom metric types (gauges for timestamps, counters for executions)
-   Metric cardinality management for dynamic job names
-   Prometheus scrape configuration changes in `prometheus.yml`
-   Deployment complexity: additional container/service to manage

**Grafana PostgreSQL Plugin (4-8+ hours additional effort):**

-   Requires Grafana Enterprise OR community PostgreSQL datasource configuration
-   Security concern: Grafana container needs database credentials/connection string
-   Cross-database access complicates security boundaries
-   SQL queries in Grafana panels harder to maintain than typed C# code
-   No computed status logic (Healthy/Degraded) without complex SQL CASE statements
-   Panel configurations are infrastructure-as-code complexity

### Option 2: API Endpoint + Angular Component ✅ SELECTED

| Aspect          | Assessment                                                    |
| --------------- | ------------------------------------------------------------- |
| **Feasibility** | ✅ Direct query to existing `recurring_job_executions` table  |
| **Integration** | ✅ Same pattern as `ThirdPartyApiService`                     |
| **Consistency** | ✅ Matches existing External Systems tab components           |
| **Complexity**  | ✅ Minimal - extends existing patterns (5-8 hours total)      |
| **Testability** | ✅ Unit-testable status logic with `TimeProvider` abstraction |

**Rationale:**

-   Data already persisted in PostgreSQL via `RecurringJobRepository` (Logging domain)
-   Aligns with existing `ThirdPartyApiService` pattern for custom application data
-   No additional Grafana/Prometheus infrastructure required
-   Computed status logic in C# enables proper unit testing with `TimeProvider`
-   Faster development with established patterns (KISS, DRY, YAGNI)

---

## 📐 Architecture Design

### DDD Bounded Context Analysis

The `ScheduledJobService` aggregates data from multiple bounded contexts for admin display:

| Data Source                   | Bounded Context         | Access Pattern                 |
| ----------------------------- | ----------------------- | ------------------------------ |
| `RecurringJobExecution`       | Logging (cross-cutting) | Via `IRecurringJobRepository`  |
| `RefreshTokenCleanupSettings` | Identity                | Via `IOptions<T>` (registered) |
| `IpAnonymizationSettings`     | Identity                | Via `IOptions<T>` (registered) |
| `LogCleanupSettings`          | Logging                 | Via `IOptions<T>` (registered) |
| `EmailQueueSettings`          | ElectronicNotifications | Via `IOptions<T>` (registered) |

**Why Api Layer is Correct:**

-   Read-only aggregation for admin dashboard (presentation concern)
-   Does not modify domain state
-   `HealthController` already handles cross-cutting health queries
-   Settings already registered in DI via `BackgroundJobRegistration`
-   No bounded context boundary violations

### Component Structure

```
SeventySix.Server/
├── SeventySix.Shared/
│   ├── BackgroundJobs/
│   │   └── IRecurringJobRepository.cs      # Extended with GetAllAsync
│   └── Constants/
│       └── HealthStatusConstants.cs        # Add Unknown constant
└── SeventySix.Api/
    └── Infrastructure/
        ├── DTOs/
        │   └── RecurringJobStatusResponse.cs
        ├── Interfaces/
        │   └── IScheduledJobService.cs
        └── Services/
            └── ScheduledJobService.cs

SeventySix.Client/
└── src/app/domains/admin/
    ├── components/
    │   └── scheduled-jobs-table/
    │       ├── scheduled-jobs-table.component.ts
    │       ├── scheduled-jobs-table.component.html
    │       ├── scheduled-jobs-table.component.scss
    │       └── scheduled-jobs-table.component.spec.ts
    ├── models/
    │   └── index.ts                        # Add RecurringJobStatusResponse export
    └── services/
        └── health-api.service.ts           # Extended with getScheduledJobs
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Admin Dashboard Page                             │
│                    (External Systems Tab)                           │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│              ScheduledJobsTableComponent                            │
│  ──────────────────────────────────────────────────────────────     │
│  - Uses HealthApiService.getScheduledJobs() (TanStack Query)        │
│  - Displays job table with status indicators                        │
│  - Shows last run time, next scheduled, status                      │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   HealthApiService                                  │
│  ──────────────────────────────────────────────────────────────     │
│  getScheduledJobs(): CreateQueryResult<RecurringJobStatusResponse[]>│
│  Endpoint: GET /api/v1/health/scheduled-jobs                        │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    HealthController                                 │
│  ──────────────────────────────────────────────────────────────     │
│  [HttpGet("scheduled-jobs")]                                        │
│  Calls IRecurringJobRepository.GetAllAsync()                        │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│              RecurringJobRepository                                 │
│  ──────────────────────────────────────────────────────────────     │
│  Queries LoggingDbContext.RecurringJobExecutions                    │
│  Returns List<RecurringJobExecution>                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Tasks

### Phase 1: Server-Side API Extension

#### Task 1.1: Extend IRecurringJobRepository with GetAllAsync

**File:** `SeventySix.Shared/BackgroundJobs/IRecurringJobRepository.cs`

Add method to retrieve all job executions:

```csharp
/// <summary>
/// Gets all job execution records.
/// </summary>
/// <param name="cancellationToken">
/// The cancellation token.
/// </param>
/// <returns>
/// All execution records.
/// </returns>
Task<IReadOnlyList<RecurringJobExecution>> GetAllAsync(
	CancellationToken cancellationToken = default);
```

#### Task 1.2: Implement GetAllAsync in RecurringJobRepository

**File:** `SeventySix.Domains/Logging/Repositories/RecurringJobRepository.cs`

```csharp
/// <inheritdoc />
public async Task<IReadOnlyList<RecurringJobExecution>> GetAllAsync(
	CancellationToken cancellationToken = default)
{
	return await dbContext.RecurringJobExecutions
		.AsNoTracking()
		.OrderBy(
			execution => execution.JobName)
		.ToListAsync(cancellationToken);
}
```

#### Task 1.3: Create RecurringJobStatusResponse DTO

**File:** `SeventySix.Api/Infrastructure/DTOs/RecurringJobStatusResponse.cs`

```csharp
namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Response DTO for recurring job execution status.
/// </summary>
public record RecurringJobStatusResponse
{
	/// <summary>
	/// Gets or sets the unique job name.
	/// </summary>
	public required string JobName { get; init; }

	/// <summary>
	/// Gets or sets the human-readable display name.
	/// </summary>
	public required string DisplayName { get; init; }

	/// <summary>
	/// Gets or sets when the job was last executed.
	/// </summary>
	public DateTimeOffset? LastExecutedAt { get; init; }

	/// <summary>
	/// Gets or sets when the next execution is scheduled.
	/// </summary>
	public DateTimeOffset? NextScheduledAt { get; init; }

	/// <summary>
	/// Gets or sets the machine that last executed this job.
	/// </summary>
	public string? LastExecutedBy { get; init; }

	/// <summary>
	/// Gets or sets the job health status.
	/// </summary>
	/// <value>
	/// "Healthy" if on schedule, "Warning" if overdue, "Unknown" if never run.
	/// </value>
	public required string Status { get; init; }

	/// <summary>
	/// Gets or sets the configured interval as human-readable string.
	/// </summary>
	public required string Interval { get; init; }
}
```

#### Task 1.4: Create IScheduledJobService Interface

**File:** `SeventySix.Api/Infrastructure/Interfaces/IScheduledJobService.cs`

```csharp
namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Service for retrieving scheduled job status.
/// </summary>
public interface IScheduledJobService
{
	/// <summary>
	/// Gets status for all scheduled jobs.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of job status responses.
	/// </returns>
	Task<IReadOnlyList<RecurringJobStatusResponse>> GetAllJobStatusesAsync(
		CancellationToken cancellationToken);
}
```

#### Task 1.5: Implement ScheduledJobService

**File:** `SeventySix.Api/Infrastructure/Services/ScheduledJobService.cs`

```csharp
// <copyright file="ScheduledJobService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity.Settings;
using SeventySix.Logging;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Service for retrieving scheduled job statuses.
/// Maps raw execution data to display-friendly responses with computed health status.
/// </summary>
/// <param name="recurringJobRepository">
/// Repository for job execution records.
/// </param>
/// <param name="refreshTokenCleanupSettings">
/// Settings for refresh token cleanup job interval.
/// </param>
/// <param name="ipAnonymizationSettings">
/// Settings for IP anonymization job interval.
/// </param>
/// <param name="logCleanupSettings">
/// Settings for log cleanup job interval.
/// </param>
/// <param name="emailQueueSettings">
/// Settings for email queue processing job interval.
/// </param>
/// <param name="timeProvider">
/// Provides current time for status calculations (enables testability).
/// </param>
public class ScheduledJobService(
	IRecurringJobRepository recurringJobRepository,
	IOptions<RefreshTokenCleanupSettings> refreshTokenCleanupSettings,
	IOptions<IpAnonymizationSettings> ipAnonymizationSettings,
	IOptions<LogCleanupSettings> logCleanupSettings,
	IOptions<EmailQueueSettings> emailQueueSettings,
	TimeProvider timeProvider) : IScheduledJobService
{
	/// <summary>
	/// Multiplier for calculating grace period (10% of interval).
	/// </summary>
	private const double GracePeriodMultiplier = 0.1;

	/// <summary>
	/// Job configuration metadata for display and status calculation.
	/// </summary>
	private readonly Dictionary<string, (string DisplayName, TimeSpan Interval)> jobMetadata =
		new()
		{
			["RefreshTokenCleanupJob"] =
				("Refresh Token Cleanup", TimeSpan.FromHours(refreshTokenCleanupSettings.Value.IntervalHours)),
			["IpAnonymizationJob"] =
				("IP Anonymization (GDPR)", TimeSpan.FromDays(ipAnonymizationSettings.Value.IntervalDays)),
			["LogCleanupJob"] =
				("Log Cleanup", TimeSpan.FromHours(logCleanupSettings.Value.IntervalHours)),
			["EmailQueueProcessJob"] =
				("Email Queue Processor", TimeSpan.FromSeconds(emailQueueSettings.Value.ProcessingIntervalSeconds))
		};

	/// <inheritdoc />
	public async Task<IReadOnlyList<RecurringJobStatusResponse>> GetAllJobStatusesAsync(
		CancellationToken cancellationToken)
	{
		IReadOnlyList<RecurringJobExecution> executionRecords =
			await recurringJobRepository.GetAllAsync(cancellationToken);

		DateTimeOffset currentTime =
			timeProvider.GetUtcNow();

		List<RecurringJobStatusResponse> jobStatusResponses =
			[];

		// Include all known jobs, even if never executed
		foreach (KeyValuePair<string, (string DisplayName, TimeSpan Interval)> jobEntry in jobMetadata)
		{
			RecurringJobExecution? executionRecord =
				executionRecords.FirstOrDefault(
					record => record.JobName == jobEntry.Key);

			RecurringJobStatusResponse statusResponse =
				MapToResponse(
					jobEntry.Key,
					jobEntry.Value.DisplayName,
					jobEntry.Value.Interval,
					executionRecord,
					currentTime);

			jobStatusResponses.Add(statusResponse);
		}

		return jobStatusResponses;
	}

	/// <summary>
	/// Maps execution data to response DTO with computed status.
	/// </summary>
	/// <param name="jobName">
	/// The unique job identifier.
	/// </param>
	/// <param name="displayName">
	/// The human-readable job name.
	/// </param>
	/// <param name="interval">
	/// The configured execution interval.
	/// </param>
	/// <param name="executionRecord">
	/// The execution record if exists; otherwise null.
	/// </param>
	/// <param name="currentTime">
	/// The current UTC time for status calculation.
	/// </param>
	/// <returns>
	/// The mapped status response.
	/// </returns>
	private static RecurringJobStatusResponse MapToResponse(
		string jobName,
		string displayName,
		TimeSpan interval,
		RecurringJobExecution? executionRecord,
		DateTimeOffset currentTime)
	{
		string healthStatus =
			CalculateHealthStatus(
				executionRecord,
				interval,
				currentTime);

		string intervalDisplay =
			FormatIntervalForDisplay(interval);

		return new RecurringJobStatusResponse
		{
			JobName = jobName,
			DisplayName = displayName,
			LastExecutedAt = executionRecord?.LastExecutedAt,
			NextScheduledAt = executionRecord?.NextScheduledAt,
			LastExecutedBy = executionRecord?.LastExecutedBy,
			Status = healthStatus,
			Interval = intervalDisplay
		};
	}

	/// <summary>
	/// Calculates job health status based on execution timing.
	/// </summary>
	/// <param name="executionRecord">
	/// The execution record if exists; otherwise null.
	/// </param>
	/// <param name="interval">
	/// The configured execution interval.
	/// </param>
	/// <param name="currentTime">
	/// The current UTC time.
	/// </param>
	/// <returns>
	/// Health status string: Healthy, Degraded, or Unknown.
	/// </returns>
	private static string CalculateHealthStatus(
		RecurringJobExecution? executionRecord,
		TimeSpan interval,
		DateTimeOffset currentTime)
	{
		if (executionRecord is null)
		{
			return HealthStatusConstants.Unknown;
		}

		DateTimeOffset expectedNextExecution =
			executionRecord.LastExecutedAt.Add(interval);

		// Allow 10% grace period for timing variance
		TimeSpan gracePeriod =
			TimeSpan.FromTicks(
				(long)(interval.Ticks * GracePeriodMultiplier));

		DateTimeOffset gracePeriodDeadline =
			expectedNextExecution.Add(gracePeriod);

		if (currentTime <= gracePeriodDeadline)
		{
			return HealthStatusConstants.Healthy;
		}

		// More than grace period overdue
		return HealthStatusConstants.Degraded;
	}

	/// <summary>
	/// Formats interval for human-readable display.
	/// </summary>
	/// <param name="interval">
	/// The time interval to format.
	/// </param>
	/// <returns>
	/// Human-readable interval string.
	/// </returns>
	private static string FormatIntervalForDisplay(TimeSpan interval)
	{
		if (interval.TotalDays >= 1)
		{
			return interval.Days == 1
				? "1 day"
				: $"{interval.Days} days";
		}

		if (interval.TotalHours >= 1)
		{
			return interval.Hours == 1
				? "1 hour"
				: $"{interval.Hours} hours";
		}

		if (interval.TotalMinutes >= 1)
		{
			return interval.Minutes == 1
				? "1 minute"
				: $"{interval.Minutes} minutes";
		}

		return interval.Seconds == 1
			? "1 second"
			: $"{interval.Seconds} seconds";
	}
}
```

#### Task 1.6: Add Health Status Constant

**File:** `SeventySix.Shared/Constants/HealthStatusConstants.cs`

Add the Unknown constant:

```csharp
/// <summary>
/// Indicates status cannot be determined (never executed).
/// </summary>
public const string Unknown = "Unknown";
```

#### Task 1.7: Extend HealthController with Scheduled Jobs Endpoint

**File:** `SeventySix.Api/Controllers/V1/HealthController.cs`

Add new endpoint using `[FromServices]` for single-use dependency:

```csharp
/// <summary>
/// Retrieves status of all scheduled background jobs.
/// </summary>
/// <param name="scheduledJobService">
/// Service for job status queries.
/// </param>
/// <param name="cancellationToken">
/// Cancellation token for the async operation.
/// </param>
/// <returns>
/// List of scheduled job statuses.
/// </returns>
/// <response code="200">Returns the scheduled job statuses.</response>
[HttpGet("scheduled-jobs")]
[ProducesResponseType(
	typeof(IReadOnlyList<RecurringJobStatusResponse>),
	StatusCodes.Status200OK)]
[OutputCache(PolicyName = CachePolicyConstants.Health)]
public async Task<ActionResult<IReadOnlyList<RecurringJobStatusResponse>>> GetScheduledJobsAsync(
	[FromServices] IScheduledJobService scheduledJobService,
	CancellationToken cancellationToken)
{
	IReadOnlyList<RecurringJobStatusResponse> jobStatuses =
		await scheduledJobService.GetAllJobStatusesAsync(cancellationToken);

	return Ok(jobStatuses);
}
```

#### Task 1.8: Register ScheduledJobService in DI

**File:** `SeventySix.Api/Registration/InfrastructureRegistration.cs` (or equivalent)

```csharp
services.AddScoped<IScheduledJobService, ScheduledJobService>();
```

---

### Phase 2: Client-Side Implementation

#### Task 2.1: Add RecurringJobStatusResponse Type

**File:** `SeventySix.Client/src/app/domains/admin/models/index.ts`

```typescript
/**
 * Recurring job status response for scheduled job monitoring.
 * Mirrors the generated `RecurringJobStatusResponse` schema.
 */
export type RecurringJobStatusResponse = components["schemas"]["RecurringJobStatusResponse"];
```

_Note: Run OpenAPI generator after server implementation to include new schema._

#### Task 2.2: Extend HealthApiService

**File:** `SeventySix.Client/src/app/domains/admin/services/health-api.service.ts`

Add method following existing patterns:

```typescript
/**
 * Retrieves status for all scheduled background jobs.
 * @returns {CreateQueryResult<RecurringJobStatusResponse[], Error>}
 * CreateQueryResult for scheduled job statuses.
 */
getScheduledJobs(): CreateQueryResult<RecurringJobStatusResponse[], Error>
{
	return injectQuery(
		() => (
			{
				queryKey: QueryKeys.health.scheduledJobs,
				queryFn: () =>
					lastValueFrom(
						this.apiService.get<RecurringJobStatusResponse[]>(
							`${this.endpoint}/scheduled-jobs`)),
				...this.queryConfig
			}));
}
```

#### Task 2.3: Add Query Key

**File:** `SeventySix.Client/src/app/shared/utilities/query-keys.utility.ts`

Add to health section:

```typescript
health: {
	status: ["health", "status"],
	database: ["health", "database"],
	externalApis: ["health", "external-apis"],
	scheduledJobs: ["health", "scheduled-jobs"]
}
```

#### Task 2.4: Create ScheduledJobsTableComponent

**File:** `SeventySix.Client/src/app/domains/admin/components/scheduled-jobs-table/scheduled-jobs-table.component.ts`

```typescript
import { RecurringJobStatusResponse } from "@admin/models";
import { HealthApiService } from "@admin/services";
import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { SKELETON_TABLE_CELL, SkeletonTheme } from "@shared/constants";
import { DateService } from "@shared/services/date.service";
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";

/**
 * Extended interface with computed display properties.
 */
interface ScheduledJobDisplay extends RecurringJobStatusResponse {
	formattedLastExecuted: string;
	formattedNextScheduled: string;
	statusIcon: string;
	statusClass: string;
}

/**
 * Component for displaying scheduled background job status in a table.
 * Shows job name, last execution, next scheduled, status, and interval.
 */
@Component({
	selector: "app-scheduled-jobs-table",
	imports: [MatTableModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule, NgxSkeletonLoaderModule],
	templateUrl: "./scheduled-jobs-table.component.html",
	styleUrl: "./scheduled-jobs-table.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledJobsTableComponent {
	/**
	 * Health API service for querying job statuses.
	 * @type {HealthApiService}
	 * @private
	 * @readonly
	 */
	private readonly healthApiService: HealthApiService = inject(HealthApiService);

	/**
	 * Date service for formatting timestamps.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService = inject(DateService);

	/**
	 * Skeleton theme for table cells during loading.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonTableCell: SkeletonTheme = SKELETON_TABLE_CELL;

	/**
	 * TanStack Query for job status data.
	 * @type {ReturnType<typeof this.healthApiService.getScheduledJobs>}
	 */
	readonly scheduledJobsQuery: ReturnType<typeof this.healthApiService.getScheduledJobs> = this.healthApiService.getScheduledJobs();

	/**
	 * Loading state derived from query.
	 * @type {Signal<boolean>}
	 */
	readonly isLoading: Signal<boolean> = computed(() => this.scheduledJobsQuery.isLoading());

	/**
	 * Error message for display.
	 * @type {Signal<string | null>}
	 */
	readonly errorMessage: Signal<string | null> = computed(() => {
		const queryError: Error | null = this.scheduledJobsQuery.error();

		return queryError ? queryError.message || "Failed to load job statuses" : null;
	});

	/**
	 * Data source with computed display properties.
	 * @type {Signal<MatTableDataSource<ScheduledJobDisplay>>}
	 */
	readonly dataSource: Signal<MatTableDataSource<ScheduledJobDisplay>> = computed(() => {
		const jobData: RecurringJobStatusResponse[] = this.scheduledJobsQuery.data() ?? [];

		const displayData: ScheduledJobDisplay[] = jobData.map((jobStatus) => ({
			...jobStatus,
			formattedLastExecuted: this.formatTimestamp(jobStatus.lastExecutedAt),
			formattedNextScheduled: this.formatTimestamp(jobStatus.nextScheduledAt),
			statusIcon: this.getStatusIcon(jobStatus.status),
			statusClass: this.getStatusClass(jobStatus.status),
		}));

		return new MatTableDataSource<ScheduledJobDisplay>(displayData);
	});

	/**
	 * Displayed columns for the table.
	 * @type {WritableSignal<string[]>}
	 */
	readonly displayedColumns: WritableSignal<string[]> = signal<string[]>(["status", "displayName", "interval", "lastExecutedAt", "nextScheduledAt", "lastExecutedBy"]);

	/**
	 * Refreshes the job status query.
	 * @returns {void}
	 */
	onRefresh(): void {
		this.scheduledJobsQuery.refetch();
	}

	/**
	 * Formats a timestamp for display.
	 * @param {string | null | undefined} timestamp
	 * ISO timestamp to format.
	 * @returns {string}
	 * Formatted relative time or "Never" if null.
	 */
	private formatTimestamp(timestamp: string | null | undefined): string {
		if (!timestamp) {
			return "Never";
		}

		return this.dateService.formatRelative(new Date(timestamp));
	}

	/**
	 * Gets the icon name for a status.
	 * @param {string} status
	 * Job status value.
	 * @returns {string}
	 * Material icon name.
	 */
	private getStatusIcon(status: string): string {
		switch (status) {
			case "Healthy":
				return "check_circle";
			case "Degraded":
				return "warning";
			case "Unknown":
				return "help_outline";
			default:
				return "error";
		}
	}

	/**
	 * Gets the CSS class for status styling.
	 * @param {string} status
	 * Job status value.
	 * @returns {string}
	 * CSS class name.
	 */
	private getStatusClass(status: string): string {
		switch (status) {
			case "Healthy":
				return "status-healthy";
			case "Degraded":
				return "status-warning";
			case "Unknown":
				return "status-unknown";
			default:
				return "status-error";
		}
	}
}
```

#### Task 2.5: Create Component Template

**File:** `SeventySix.Client/src/app/domains/admin/components/scheduled-jobs-table/scheduled-jobs-table.component.html`

```html
<mat-card>
	<mat-card-header>
		<mat-card-title>
			<mat-icon aria-hidden="true">schedule</mat-icon>
			Scheduled Jobs
		</mat-card-title>
		<span class="spacer"></span>
		<button mat-icon-button (click)="onRefresh()" [disabled]="isLoading()" matTooltip="Refresh job statuses" aria-label="Refresh job statuses">
			<mat-icon>refresh</mat-icon>
		</button>
	</mat-card-header>

	<mat-card-content>
		@if (errorMessage(); as displayError) {
		<div class="error-state">
			<mat-icon color="warn">error</mat-icon>
			<span>{{ displayError }}</span>
		</div>
		} @else {
		<table mat-table [dataSource]="dataSource()" class="jobs-table">
			<!-- Status Column -->
			<ng-container matColumnDef="status">
				<th mat-header-cell *matHeaderCellDef>Status</th>
				<td mat-cell *matCellDef="let jobRow">
					@if (isLoading()) {
					<ngx-skeleton-loader [theme]="skeletonTableCell"></ngx-skeleton-loader>
					} @else {
					<mat-icon [class]="jobRow.statusClass" [matTooltip]="jobRow.status" aria-hidden="true">{{ jobRow.statusIcon }}</mat-icon>
					}
				</td>
			</ng-container>

			<!-- Display Name Column -->
			<ng-container matColumnDef="displayName">
				<th mat-header-cell *matHeaderCellDef>Job Name</th>
				<td mat-cell *matCellDef="let jobRow">
					@if (isLoading()) {
					<ngx-skeleton-loader [theme]="skeletonTableCell"></ngx-skeleton-loader>
					} @else { {{ jobRow.displayName }} }
				</td>
			</ng-container>

			<!-- Interval Column -->
			<ng-container matColumnDef="interval">
				<th mat-header-cell *matHeaderCellDef>Interval</th>
				<td mat-cell *matCellDef="let jobRow">
					@if (isLoading()) {
					<ngx-skeleton-loader [theme]="skeletonTableCell"></ngx-skeleton-loader>
					} @else { {{ jobRow.interval }} }
				</td>
			</ng-container>

			<!-- Last Executed Column -->
			<ng-container matColumnDef="lastExecutedAt">
				<th mat-header-cell *matHeaderCellDef>Last Run</th>
				<td mat-cell *matCellDef="let jobRow">
					@if (isLoading()) {
					<ngx-skeleton-loader [theme]="skeletonTableCell"></ngx-skeleton-loader>
					} @else { {{ jobRow.formattedLastExecuted }} }
				</td>
			</ng-container>

			<!-- Next Scheduled Column -->
			<ng-container matColumnDef="nextScheduledAt">
				<th mat-header-cell *matHeaderCellDef>Next Run</th>
				<td mat-cell *matCellDef="let jobRow">
					@if (isLoading()) {
					<ngx-skeleton-loader [theme]="skeletonTableCell"></ngx-skeleton-loader>
					} @else { {{ jobRow.formattedNextScheduled }} }
				</td>
			</ng-container>

			<!-- Last Executed By Column -->
			<ng-container matColumnDef="lastExecutedBy">
				<th mat-header-cell *matHeaderCellDef>Instance</th>
				<td mat-cell *matCellDef="let jobRow">
					@if (isLoading()) {
					<ngx-skeleton-loader [theme]="skeletonTableCell"></ngx-skeleton-loader>
					} @else { {{ jobRow.lastExecutedBy || "—" }} }
				</td>
			</ng-container>

			<tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
			<tr mat-row *matRowDef="let tableRow; columns: displayedColumns();"></tr>
		</table>
		}
	</mat-card-content>
</mat-card>
```

#### Task 2.6: Create Component Styles

**File:** `SeventySix.Client/src/app/domains/admin/components/scheduled-jobs-table/scheduled-jobs-table.component.scss`

```scss
@use "vars";

:host {
	display: block;
}

mat-card-header {
	display: flex;
	align-items: center;
	gap: vars.$spacing-sm;

	mat-card-title {
		display: flex;
		align-items: center;
		gap: vars.$spacing-sm;
		margin: 0;
	}

	.spacer {
		flex: 1;
	}
}

.jobs-table {
	width: 100%;
}

.status-healthy {
	color: var(--color-success);
}

.status-warning {
	color: var(--color-warning);
}

.status-unknown {
	color: var(--color-info);
}

.status-error {
	color: var(--color-error);
}

.error-state {
	display: flex;
	align-items: center;
	gap: vars.$spacing-sm;
	padding: vars.$spacing-md;
	color: var(--color-error);
}
```

#### Task 2.7: Update Admin Dashboard to Include Component

**File:** `SeventySix.Client/src/app/domains/admin/pages/admin-dashboard/admin-dashboard.ts`

Add import:

```typescript
import { ScheduledJobsTableComponent } from "@admin/components/scheduled-jobs-table/scheduled-jobs-table.component";
```

Add to imports array:

```typescript
imports: [
	MatToolbarModule,
	MatTabsModule,
	GrafanaDashboardEmbedComponent,
	ApiStatisticsTableComponent,
	ScheduledJobsTableComponent, // Add this
	PageHeaderComponent,
	...CARD_MATERIAL_MODULES,
];
```

#### Task 2.8: Update Admin Dashboard Template

**File:** `SeventySix.Client/src/app/domains/admin/pages/admin-dashboard/admin-dashboard.html`

Add component after `<app-api-statistics-table>`:

```html
<!-- External Systems Tab -->
<mat-tab label="External Systems">
	<div class="tab-content">
		<!-- Third-Party API Statistics -->
		<app-api-statistics-table></app-api-statistics-table>

		<!-- Scheduled Jobs Status -->
		<app-scheduled-jobs-table></app-scheduled-jobs-table>

		<!-- Log Validations (existing) -->
		...
	</div>
</mat-tab>
```

---

### Phase 3: Testing (TDD - 80/20 Rule)

**Testing Strategy:** Focus on critical business logic (status calculation) rather than exhaustive coverage. Status calculation is the only non-trivial logic worth testing.

#### Task 3.1: Server Unit Tests (Critical Path Only)

**File:** `Tests/SeventySix.Api.Tests/Infrastructure/Services/ScheduledJobServiceTests.cs`

```csharp
// <copyright file="ScheduledJobServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Api.Infrastructure;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity.Settings;
using SeventySix.Logging;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;
using Shouldly;
using Xunit;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for <see cref="ScheduledJobService"/>.
/// Focuses on status calculation logic (80/20 rule).
/// </summary>
public class ScheduledJobServiceTests
{
	private readonly IRecurringJobRepository mockRepository;
	private readonly FakeTimeProvider fakeTimeProvider;
	private readonly ScheduledJobService service;

	/// <summary>
	/// Initializes test dependencies with default settings.
	/// </summary>
	public ScheduledJobServiceTests()
	{
		mockRepository =
			Substitute.For<IRecurringJobRepository>();
		fakeTimeProvider =
			new FakeTimeProvider(DateTimeOffset.UtcNow);

		service =
			new ScheduledJobService(
				mockRepository,
				Options.Create(new RefreshTokenCleanupSettings()),
				Options.Create(new IpAnonymizationSettings()),
				Options.Create(new LogCleanupSettings()),
				Options.Create(new EmailQueueSettings()),
				fakeTimeProvider);
	}

	[Fact]
	public async Task GetAllJobStatusesAsync_WhenJobNeverExecuted_ReturnsUnknownStatusAsync()
	{
		// Arrange
		mockRepository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IReadOnlyList<RecurringJobStatusResponse> results =
			await service.GetAllJobStatusesAsync(CancellationToken.None);

		// Assert
		results.ShouldAllBe(
			response => response.Status == HealthStatusConstants.Unknown);
	}

	[Fact]
	public async Task GetAllJobStatusesAsync_WhenJobOnSchedule_ReturnsHealthyStatusAsync()
	{
		// Arrange - job ran 1 hour ago, interval is 24 hours
		DateTimeOffset oneHourAgo =
			fakeTimeProvider.GetUtcNow().AddHours(-1);

		mockRepository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(
				[
					new RecurringJobExecution
					{
						JobName = "RefreshTokenCleanupJob",
						LastExecutedAt = oneHourAgo,
						NextScheduledAt = oneHourAgo.AddHours(24)
					}
				]);

		// Act
		IReadOnlyList<RecurringJobStatusResponse> results =
			await service.GetAllJobStatusesAsync(CancellationToken.None);

		// Assert
		RecurringJobStatusResponse refreshTokenJob =
			results.First(
				response => response.JobName == "RefreshTokenCleanupJob");

		refreshTokenJob.Status.ShouldBe(HealthStatusConstants.Healthy);
	}

	[Fact]
	public async Task GetAllJobStatusesAsync_WhenJobOverdue_ReturnsDegradedStatusAsync()
	{
		// Arrange - job ran 30 hours ago, interval is 24 hours (beyond 10% grace)
		DateTimeOffset thirtyHoursAgo =
			fakeTimeProvider.GetUtcNow().AddHours(-30);

		mockRepository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(
				[
					new RecurringJobExecution
					{
						JobName = "RefreshTokenCleanupJob",
						LastExecutedAt = thirtyHoursAgo,
						NextScheduledAt = thirtyHoursAgo.AddHours(24)
					}
				]);

		// Act
		IReadOnlyList<RecurringJobStatusResponse> results =
			await service.GetAllJobStatusesAsync(CancellationToken.None);

		// Assert
		RecurringJobStatusResponse refreshTokenJob =
			results.First(
				response => response.JobName == "RefreshTokenCleanupJob");

		refreshTokenJob.Status.ShouldBe(HealthStatusConstants.Degraded);
	}

	[Fact]
	public async Task GetAllJobStatusesAsync_AlwaysReturnsFourKnownJobsAsync()
	{
		// Arrange
		mockRepository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IReadOnlyList<RecurringJobStatusResponse> results =
			await service.GetAllJobStatusesAsync(CancellationToken.None);

		// Assert
		results.Count.ShouldBe(4);
		results.ShouldContain(
			response => response.JobName == "RefreshTokenCleanupJob");
		results.ShouldContain(
			response => response.JobName == "IpAnonymizationJob");
		results.ShouldContain(
			response => response.JobName == "LogCleanupJob");
		results.ShouldContain(
			response => response.JobName == "EmailQueueProcessJob");
	}
}
```

#### Task 3.2: Client Unit Tests (Display States Only)

**File:** `scheduled-jobs-table.component.spec.ts`

Focus on states, not exhaustive logic:

```typescript
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting, HttpTestingController } from "@angular/common/http/testing";
import { provideTanStackQuery, QueryClient } from "@tanstack/angular-query-experimental";
import { ScheduledJobsTableComponent } from "./scheduled-jobs-table.component";

describe("ScheduledJobsTableComponent", () => {
	let component: ScheduledJobsTableComponent;
	let fixture: ComponentFixture<ScheduledJobsTableComponent>;
	let httpMock: HttpTestingController;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ScheduledJobsTableComponent],
			providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideTanStackQuery(new QueryClient())],
		}).compileComponents();

		fixture = TestBed.createComponent(ScheduledJobsTableComponent);
		component = fixture.componentInstance;
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should display loading state initially", () => {
		fixture.detectChanges();

		expect(component.isLoading()).toBeTrue();
	});

	it("should map status to correct icon", () => {
		// Access private method via any cast for testing
		const componentAny: { getStatusIcon(status: string): string } = component as unknown as { getStatusIcon(status: string): string };

		expect(componentAny.getStatusIcon("Healthy")).toBe("check_circle");
		expect(componentAny.getStatusIcon("Degraded")).toBe("warning");
		expect(componentAny.getStatusIcon("Unknown")).toBe("help_outline");
	});
});
```

---

## 🎨 UX Design Specifications

### Component Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  🗓️ Scheduled Jobs                                          [🔄]   │
├──────────────────────────────────────────────────────────────────────┤
│  Status │ Job Name              │ Interval  │ Last Run  │ Next Run │
│─────────┼───────────────────────┼───────────┼───────────┼──────────│
│  ✅     │ Refresh Token Cleanup │ 24 hours  │ 2h ago    │ in 22h   │
│  ✅     │ IP Anonymization      │ 7 days    │ 3d ago    │ in 4d    │
│  ⚠️     │ Email Queue Processor │ 10 secs   │ 5m ago    │ overdue  │
│  ❓     │ Log Cleanup           │ 24 hours  │ Never     │ —        │
└──────────────────────────────────────────────────────────────────────┘
```

### Status Indicators

| Status    | Icon           | Color             | Meaning                 |
| --------- | -------------- | ----------------- | ----------------------- |
| Healthy   | `check_circle` | `--color-success` | Running on schedule     |
| Degraded  | `warning`      | `--color-warning` | Overdue (10%+ past due) |
| Unknown   | `help_outline` | `--color-info`    | Never executed          |
| Unhealthy | `error`        | `--color-error`   | Significantly overdue   |

### Responsive Behavior

-   Table scrolls horizontally on small screens
-   Instance column hidden on mobile (< 600px)
-   Status icons remain visible at all breakpoints

---

## 📦 Dependencies

### Server-Side

-   No new NuGet packages required
-   Extends existing `IRecurringJobRepository` interface

### Client-Side

-   No new npm packages required
-   Uses existing Material Design components

---

## 🚀 Migration Path

### Step 1: Server Implementation

1. Add `GetAllAsync` to `IRecurringJobRepository`
2. Implement in `RecurringJobRepository`
3. Create `RecurringJobStatusResponse` DTO
4. Create `IScheduledJobService` and implementation
5. Extend `HealthController` with new endpoint
6. Register service in DI

### Step 2: OpenAPI Generation

1. Run OpenAPI generator to update client types
2. Verify `RecurringJobStatusResponse` in generated types

### Step 3: Client Implementation

1. Add query key for scheduled jobs
2. Extend `HealthApiService` with `getScheduledJobs()`
3. Create `ScheduledJobsTableComponent`
4. Integrate into Admin Dashboard

### Step 4: Testing & Verification

1. Write unit tests following TDD
2. Verify in development environment
3. Test with actual job executions

---

## ⚠️ Risk Mitigation

| Risk                        | Mitigation                                             |
| --------------------------- | ------------------------------------------------------ |
| Empty table on first deploy | Show "Unknown" status for jobs that haven't run yet    |
| Stale data display          | Query config with appropriate refresh interval (30s)   |
| Missing job metadata        | Default interval display if settings not configured    |
| Database query performance  | Simple query on small table (~4 rows); no optimization |

---

## 📊 Success Criteria

-   [ ] Admin users can view all scheduled job statuses in dashboard
-   [ ] Status indicators accurately reflect job health
-   [ ] Table displays last run time, next scheduled, and interval
-   [ ] Refresh button updates data without page reload
-   [ ] Loading and error states handled gracefully
-   [ ] Component follows existing code patterns (OnPush, TanStack Query)
-   [ ] Unit tests cover critical status calculation logic
-   [ ] No new external dependencies introduced

---

## 🗓️ Estimated Effort

| Phase                | Tasks   | Estimate      |
| -------------------- | ------- | ------------- |
| Phase 1: Server API  | 8 tasks | 2-3 hours     |
| Phase 2: Client UI   | 8 tasks | 2-3 hours     |
| Phase 3: Testing     | 2 tasks | 1-2 hours     |
| OpenAPI Regeneration | 1 task  | 15 min        |
| **Total**            |         | **5-8 hours** |

---

## 📚 References

-   [TanStack Query Angular](https://tanstack.com/query/latest/docs/angular/overview)
-   [Angular Material Table](https://material.angular.io/components/table/overview)
-   [Wolverine Documentation](https://wolverinefx.io/guide/)
-   Existing patterns: `ApiStatisticsTableComponent`, `ThirdPartyApiService`
