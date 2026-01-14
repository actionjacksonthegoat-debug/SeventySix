# Implementation Plan: Background Job Infrastructure

## Executive Summary

This plan outlines the modernization of the background job infrastructure for SeventySix, targeting .NET 10+ with Docker deployment. The goal is to create resilient, non-blocking scheduled jobs that properly handle container restarts, scaling, and observability while respecting Domain-Driven Design (DDD) boundaries.

**Key Design Decision:** Leverage Wolverine Scheduled Messaging (already integrated) with DDD-compliant abstractions in `SeventySix.Shared` (contracts only) and domain-specific adapters.

---

## 📋 Current State Analysis

### Existing Background Services

| Service                      | Domain                  | Pattern                               | Schedule         |
| ---------------------------- | ----------------------- | ------------------------------------- | ---------------- |
| `RefreshTokenCleanupService` | Identity                | `BackgroundService` + `PeriodicTimer` | Every 24 hours   |
| `IpAnonymizationService`     | Identity                | `BackgroundService` + `PeriodicTimer` | Every 7 days     |
| `AdminSeederService`         | Identity                | `BackgroundService` (one-shot)        | Startup only     |
| `EmailQueueProcessorService` | ElectronicNotifications | `BackgroundService` + `PeriodicTimer` | Every 10 seconds |
| `LogCleanupService`          | Logging                 | `BackgroundService` + `Task.Delay`    | Every 24 hours   |

### Current Implementation Characteristics

**Strengths:**

-   Primary constructors with proper DI
-   `TimeProvider` abstraction for testability
-   Settings via `IOptions<T>` pattern
-   Public methods for unit testing hooks
-   Centralized registration in `BackgroundJobRegistration`
-   Descriptive variable names (e.g., `deletedRefreshTokens`, `anonymizedCount`)

**Weaknesses:**

-   No persistence of job execution state
-   Jobs restart from zero interval on container restart
-   No distributed locking for horizontal scaling
-   No built-in retry with backoff for failures
-   Mixed timer patterns (`PeriodicTimer` vs `Task.Delay`)
-   No visibility into job history/status

---

## 🔍 Framework Comparison

### Option 1: Native .NET `BackgroundService` (Current)

| Aspect                      | Assessment                                               |
| --------------------------- | -------------------------------------------------------- |
| **Docker Restart Handling** | ❌ Jobs restart from zero; no state persistence          |
| **Distributed Locking**     | ❌ Not built-in; requires manual Redis/DB implementation |
| **Horizontal Scaling**      | ❌ All instances run all jobs simultaneously             |
| **Job History**             | ❌ None; requires custom implementation                  |
| **Complexity**              | ✅ Minimal; built into .NET                              |
| **Dependencies**            | ✅ None                                                  |
| **KISS Compliance**         | ✅ Simple pattern                                        |

**Verdict:** Insufficient for production-grade scheduled jobs in scaled Docker environments.

---

### Option 2: Hangfire

| Aspect                      | Assessment                                               |
| --------------------------- | -------------------------------------------------------- |
| **Docker Restart Handling** | ✅ Persistent storage; jobs survive restarts             |
| **Distributed Locking**     | ✅ Built-in; only one server runs each job               |
| **Horizontal Scaling**      | ✅ Automatic work distribution                           |
| **Job History**             | ✅ Full history with dashboard                           |
| **Complexity**              | ⚠️ Moderate; adds storage dependency                     |
| **Dependencies**            | PostgreSQL storage (already have), NuGet packages        |
| **KISS Compliance**         | ⚠️ Dashboard adds complexity; can disable for simplicity |
| **License**                 | MIT for core; paid for some features                     |

**Notable Features:**

-   Cron-based scheduling with `RecurringJob.AddOrUpdate`
-   Automatic retry with configurable backoff
-   Built-in dashboard (optional)
-   Integrates with existing PostgreSQL

---

### Option 3: Quartz.NET

| Aspect                      | Assessment                                                 |
| --------------------------- | ---------------------------------------------------------- |
| **Docker Restart Handling** | ✅ Persistent storage with ADO.NET job store               |
| **Distributed Locking**     | ✅ Clustered mode with DB locking                          |
| **Horizontal Scaling**      | ✅ Supports clustering                                     |
| **Job History**             | ⚠️ Requires custom implementation or third-party dashboard |
| **Complexity**              | ❌ Higher; more configuration required                     |
| **Dependencies**            | PostgreSQL storage, NuGet packages                         |
| **KISS Compliance**         | ❌ Complex XML/fluent configuration                        |

**Notable Features:**

-   Enterprise-grade scheduler ported from Java
-   Rich trigger types (cron, calendar, interval)
-   Job listeners and plugins

---

### Option 4: Wolverine Scheduled Messaging (Already Integrated) ✅ SELECTED

| Aspect                      | Assessment                                |
| --------------------------- | ----------------------------------------- |
| **Docker Restart Handling** | ✅ Messages persisted with durable queues |
| **Distributed Locking**     | ✅ Handled via message ownership          |
| **Horizontal Scaling**      | ✅ Built into Wolverine                   |
| **Job History**             | ⚠️ Requires OpenTelemetry integration     |
| **Complexity**              | ✅ Already using Wolverine for CQRS       |
| **Dependencies**            | ✅ Already integrated                     |
| **KISS Compliance**         | ✅ Extends existing patterns              |

**Notable Features:**

-   `ScheduleAsync` for delayed messages
-   Durable message persistence with PostgreSQL
-   Integrates with existing Wolverine handlers
-   No new dependencies

---

### Option 5: Enhanced Native Pattern (Hybrid Approach)

Enhance existing `BackgroundService` pattern with:

-   Startup state checking (did job run within interval?)
-   Simple DB table for last execution tracking
-   Distributed locking via PostgreSQL advisory locks

| Aspect                      | Assessment                        |
| --------------------------- | --------------------------------- |
| **Docker Restart Handling** | ✅ Check last run time on startup |
| **Distributed Locking**     | ✅ PostgreSQL advisory locks      |
| **Horizontal Scaling**      | ✅ Only leader runs jobs          |
| **Job History**             | ⚠️ Simple; last run only          |
| **Complexity**              | ✅ Minimal new code               |
| **Dependencies**            | ✅ None                           |
| **KISS Compliance**         | ✅ Builds on existing patterns    |

---

## ✅ Recommendation: Wolverine Scheduled Messaging

### Rationale

1. **Already Integrated**: Wolverine is already used for CQRS handlers; adding scheduling extends existing patterns
2. **KISS Principle**: No new frameworks to learn or maintain
3. **DRY Principle**: Reuses existing Wolverine infrastructure and handlers
4. **YAGNI Principle**: No dashboard (use OpenTelemetry for observability instead)
5. **Docker-Friendly**: Durable message persistence handles container restarts
6. **Horizontal Scaling**: Built-in message ownership prevents duplicate execution
7. **Testability**: Wolverine handlers are already unit-tested via bus invocation
8. **DDD Compliance**: Abstractions in Shared, implementations in Domains

### Why Not Hangfire?

-   Adds another framework to maintain
-   Dashboard is feature bloat for this use case
-   Wolverine already provides same capabilities

### Why Not Quartz.NET?

-   More complex configuration
-   Overkill for the job types we have
-   No significant advantage over Wolverine

---

## 📐 Architecture Design (DDD-Compliant)

### Design Principles

1. **Shared Contains Contracts Only**: Interfaces, DTOs, and POCOs — no framework dependencies
2. **Domains Implement Adapters**: Repository implementations, Wolverine scheduling adapters
3. **No "Infrastructure" Domain**: Cross-cutting persistence lives in Logging domain
4. **Dependency Inversion**: Job handlers depend on `IRecurringJobService` abstraction

### Component Structure

```
SeventySix.Shared/
└── BackgroundJobs/
    ├── IRecurringJobService.cs         # Orchestration contract (scheduling + recording)
    ├── IRecurringJobRepository.cs      # Persistence contract
    ├── IMessageScheduler.cs            # Message scheduling contract (framework-agnostic)
    ├── RecurringJobExecution.cs        # POCO entity for tracking
    └── RecurringJobService.cs          # Implementation (depends only on abstractions)

SeventySix.Domains/
├── Logging/
│   ├── Entities/
│   │   └── RecurringJobExecutionConfiguration.cs  # EF Fluent config
│   └── Repositories/
│       └── RecurringJobRepository.cs              # IRecurringJobRepository impl
│
├── Registration/
│   ├── BackgroundJobRegistration.cs               # Central DI registration
│   ├── RecurringJobSchedulerService.cs            # IHostedService (startup scheduler)
│   └── WolverineMessageScheduler.cs               # IMessageScheduler impl
│
├── Identity/
│   └── Jobs/
│       ├── RefreshTokenCleanupJob.cs              # Wolverine message
│       ├── RefreshTokenCleanupJobHandler.cs       # Wolverine handler
│       ├── IpAnonymizationJob.cs
│       └── IpAnonymizationJobHandler.cs
│
├── ElectronicNotifications/
│   └── Jobs/
│       ├── EmailQueueProcessJob.cs
│       └── EmailQueueProcessJobHandler.cs
│
└── Logging/
    └── Jobs/
        ├── LogCleanupJob.cs
        └── LogCleanupJobHandler.cs
```

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Startup                          │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  RecurringJobSchedulerService (IHostedService - runs once)          │
│  ──────────────────────────────────────────────────────────────     │
│  1. Inject IRecurringJobService                                     │
│  2. Call EnsureScheduledAsync for each job type                     │
│  3. Service checks last execution, calculates next run              │
│  4. Exit (Wolverine handles recurring scheduling from there)        │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Wolverine Message Bus (Durable Queue)                  │
│  ──────────────────────────────────────────────────────────────     │
│  - Messages persisted in PostgreSQL                                 │
│  - Survives container restarts                                      │
│  - Distributed locking via message ownership                        │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Job Handler Execution                            │
│  ──────────────────────────────────────────────────────────────     │
│  1. Handler receives message                                        │
│  2. Execute domain-specific job logic                               │
│  3. Call IRecurringJobService.RecordAndScheduleNextAsync            │
│  4. Service persists execution and schedules next via abstraction   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Tasks

### Phase 1: Shared Abstractions (Foundation)

#### Task 1.1: Create Message Scheduler Contract

**File:** `SeventySix.Shared/BackgroundJobs/IMessageScheduler.cs`

```csharp
namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Framework-agnostic contract for scheduling delayed messages.
/// Implemented by Wolverine adapter in Domains layer.
/// </summary>
public interface IMessageScheduler
{
	/// <summary>
	/// Schedules a message for future delivery.
	/// </summary>
	/// <typeparam name="TMessage">
	/// The type of message to schedule.
	/// </typeparam>
	/// <param name="message">
	/// The message instance to schedule.
	/// </param>
	/// <param name="scheduledTime">
	/// When the message should be delivered.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	Task ScheduleAsync<TMessage>(
		TMessage message,
		DateTimeOffset scheduledTime,
		CancellationToken cancellationToken = default)
		where TMessage : class;
}
```

#### Task 1.2: Create Job Repository Contract

**File:** `SeventySix.Shared/BackgroundJobs/IRecurringJobRepository.cs`

```csharp
namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Repository contract for recurring job execution tracking.
/// Implemented in Logging domain for cross-cutting persistence.
/// </summary>
public interface IRecurringJobRepository
{
	/// <summary>
	/// Gets the last execution record for a job.
	/// </summary>
	/// <param name="jobName">
	/// The unique name of the job.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// The execution record if found; otherwise null.
	/// </returns>
	Task<RecurringJobExecution?> GetLastExecutionAsync(
		string jobName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Records or updates a job execution.
	/// </summary>
	/// <param name="execution">
	/// The execution record to persist.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	Task UpsertExecutionAsync(
		RecurringJobExecution execution,
		CancellationToken cancellationToken = default);
}
```

#### Task 1.3: Create Job Tracking Entity

**File:** `SeventySix.Shared/BackgroundJobs/RecurringJobExecution.cs`

```csharp
namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Tracks execution history for recurring background jobs.
/// Enables restart-aware scheduling and distributed coordination.
/// </summary>
public record RecurringJobExecution
{
	/// <summary>
	/// Gets or sets the unique job identifier.
	/// </summary>
	public required string JobName { get; init; }

	/// <summary>
	/// Gets or sets the timestamp of the last successful execution.
	/// </summary>
	public DateTimeOffset LastExecutedAt { get; set; }

	/// <summary>
	/// Gets or sets the timestamp of the next scheduled execution.
	/// </summary>
	public DateTimeOffset? NextScheduledAt { get; set; }

	/// <summary>
	/// Gets or sets the instance ID that last executed this job.
	/// Useful for debugging in scaled deployments.
	/// </summary>
	public string? LastExecutedBy { get; set; }
}
```

#### Task 1.4: Create Recurring Job Service Contract

**File:** `SeventySix.Shared/BackgroundJobs/IRecurringJobService.cs`

```csharp
namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Orchestrates recurring job scheduling and execution tracking.
/// Coordinates between <see cref="IRecurringJobRepository"/> and <see cref="IMessageScheduler"/>.
/// </summary>
public interface IRecurringJobService
{
	/// <summary>
	/// Ensures a job is scheduled based on its last execution and interval.
	/// Called at application startup to resume scheduling after restart.
	/// </summary>
	/// <typeparam name="TJob">
	/// The job message type.
	/// </typeparam>
	/// <param name="jobName">
	/// The unique name of the job.
	/// </param>
	/// <param name="interval">
	/// The interval between executions.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	Task EnsureScheduledAsync<TJob>(
		string jobName,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new();

	/// <summary>
	/// Records a job execution and schedules the next occurrence.
	/// Called by job handlers after successful execution.
	/// </summary>
	/// <typeparam name="TJob">
	/// The job message type.
	/// </typeparam>
	/// <param name="jobName">
	/// The unique name of the job.
	/// </param>
	/// <param name="executedAt">
	/// When the job was executed.
	/// </param>
	/// <param name="interval">
	/// The interval until the next execution.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	Task RecordAndScheduleNextAsync<TJob>(
		string jobName,
		DateTimeOffset executedAt,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new();
}
```

#### Task 1.5: Create Recurring Job Service Implementation

**File:** `SeventySix.Shared/BackgroundJobs/RecurringJobService.cs`

```csharp
namespace SeventySix.Shared.BackgroundJobs;

/// <summary>
/// Default implementation of <see cref="IRecurringJobService"/>.
/// Framework-agnostic; depends only on abstractions.
/// </summary>
/// <param name="repository">
/// The repository for job execution tracking.
/// </param>
/// <param name="scheduler">
/// The message scheduler for delayed delivery.
/// </param>
/// <param name="timeProvider">
/// Provides current time for scheduling calculations.
/// </param>
public class RecurringJobService(
	IRecurringJobRepository repository,
	IMessageScheduler scheduler,
	TimeProvider timeProvider) : IRecurringJobService
{
	/// <inheritdoc />
	public async Task EnsureScheduledAsync<TJob>(
		string jobName,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new()
	{
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		RecurringJobExecution? lastExecution =
			await repository.GetLastExecutionAsync(
				jobName,
				cancellationToken);

		DateTimeOffset nextRun;

		if (lastExecution is null)
		{
			// Never run before - schedule immediately
			nextRun = now;
		}
		else
		{
			// Calculate when it should run next
			nextRun =
				lastExecution.LastExecutedAt.Add(interval);

			// If overdue, run immediately
			if (nextRun <= now)
			{
				nextRun = now;
			}
		}

		await scheduler.ScheduleAsync(
			new TJob(),
			nextRun,
			cancellationToken);
	}

	/// <inheritdoc />
	public async Task RecordAndScheduleNextAsync<TJob>(
		string jobName,
		DateTimeOffset executedAt,
		TimeSpan interval,
		CancellationToken cancellationToken = default)
		where TJob : class, new()
	{
		DateTimeOffset nextScheduledAt =
			executedAt.Add(interval);

		RecurringJobExecution execution =
			new()
			{
				JobName = jobName,
				LastExecutedAt = executedAt,
				NextScheduledAt = nextScheduledAt,
				LastExecutedBy = Environment.MachineName
			};

		await repository.UpsertExecutionAsync(
			execution,
			cancellationToken);

		await scheduler.ScheduleAsync(
			new TJob(),
			nextScheduledAt,
			cancellationToken);
	}
}
```

---

### Phase 2: Domain Adapters

#### Task 2.1: Create Wolverine Message Scheduler Adapter

**File:** `SeventySix.Domains/Registration/WolverineMessageScheduler.cs`

```csharp
using SeventySix.Shared.BackgroundJobs;
using Wolverine;

namespace SeventySix.Registration;

/// <summary>
/// Wolverine implementation of <see cref="IMessageScheduler"/>.
/// Wraps Wolverine's ScheduleAsync for framework-agnostic scheduling.
/// </summary>
/// <param name="messageBus">
/// The Wolverine message bus.
/// </param>
public class WolverineMessageScheduler(
	IMessageBus messageBus) : IMessageScheduler
{
	/// <inheritdoc />
	public async Task ScheduleAsync<TMessage>(
		TMessage message,
		DateTimeOffset scheduledTime,
		CancellationToken cancellationToken = default)
		where TMessage : class
	{
		await messageBus.ScheduleAsync(
			message,
			scheduledTime);
	}
}
```

#### Task 2.2: Create Job Repository Implementation

**File:** `SeventySix.Domains/Logging/Repositories/RecurringJobRepository.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Logging;

/// <summary>
/// EF Core implementation of <see cref="IRecurringJobRepository"/>.
/// Persists job execution tracking in the Logging database.
/// </summary>
/// <param name="dbContext">
/// The Logging database context.
/// </param>
public class RecurringJobRepository(
	LoggingDbContext dbContext) : IRecurringJobRepository
{
	/// <inheritdoc />
	public async Task<RecurringJobExecution?> GetLastExecutionAsync(
		string jobName,
		CancellationToken cancellationToken = default)
	{
		return await dbContext.RecurringJobExecutions
			.AsNoTracking()
			.FirstOrDefaultAsync(
				execution => execution.JobName == jobName,
				cancellationToken);
	}

	/// <inheritdoc />
	public async Task UpsertExecutionAsync(
		RecurringJobExecution execution,
		CancellationToken cancellationToken = default)
	{
		RecurringJobExecution? existing =
			await dbContext.RecurringJobExecutions
				.FirstOrDefaultAsync(
					record => record.JobName == execution.JobName,
					cancellationToken);

		if (existing is null)
		{
			dbContext.RecurringJobExecutions.Add(execution);
		}
		else
		{
			existing.LastExecutedAt = execution.LastExecutedAt;
			existing.NextScheduledAt = execution.NextScheduledAt;
			existing.LastExecutedBy = execution.LastExecutedBy;
		}

		await dbContext.SaveChangesAsync(cancellationToken);
	}
}
```

#### Task 2.3: Add EF Configuration for Job Tracking

**File:** `SeventySix.Domains/Logging/Entities/RecurringJobExecutionConfiguration.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Logging;

/// <summary>
/// EF Core configuration for <see cref="RecurringJobExecution"/>.
/// </summary>
public class RecurringJobExecutionConfiguration
	: IEntityTypeConfiguration<RecurringJobExecution>
{
	/// <inheritdoc />
	public void Configure(EntityTypeBuilder<RecurringJobExecution> builder)
	{
		builder
			.ToTable("recurring_job_executions");

		builder
			.HasKey(
				execution => execution.JobName);

		builder
			.Property(
				execution => execution.JobName)
			.HasMaxLength(128)
			.IsRequired();

		builder
			.Property(
				execution => execution.LastExecutedAt)
			.IsRequired();

		builder
			.Property(
				execution => execution.NextScheduledAt);

		builder
			.Property(
				execution => execution.LastExecutedBy)
			.HasMaxLength(256);
	}
}
```

#### Task 2.4: Update LoggingDbContext

Add to `LoggingDbContext.cs`:

```csharp
public DbSet<RecurringJobExecution> RecurringJobExecutions => Set<RecurringJobExecution>();
```

Add to `OnModelCreating`:

```csharp
modelBuilder.ApplyConfiguration(new RecurringJobExecutionConfiguration());
```

---

### Phase 3: Domain Job Conversions

#### Task 3.1: RefreshTokenCleanupJob (Identity Domain)

**Message:** `SeventySix.Identity/Jobs/RefreshTokenCleanupJob.cs`

```csharp
namespace SeventySix.Identity.Jobs;

/// <summary>
/// Wolverine message that triggers refresh token cleanup.
/// </summary>
public record RefreshTokenCleanupJob;
```

**Handler:** `SeventySix.Identity/Jobs/RefreshTokenCleanupJobHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Identity.Jobs;

/// <summary>
/// Handles periodic cleanup of expired refresh tokens.
/// </summary>
/// <param name="dbContext">
/// The Identity database context.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="settings">
/// Configuration for cleanup behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for cutoff calculations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class RefreshTokenCleanupJobHandler(
	IdentityDbContext dbContext,
	IRecurringJobService recurringJobService,
	IOptions<RefreshTokenCleanupSettings> settings,
	TimeProvider timeProvider,
	ILogger<RefreshTokenCleanupJobHandler> logger)
{
	/// <summary>
	/// Handles the refresh token cleanup job.
	/// </summary>
	/// <param name="job">
	/// The job message (marker type).
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task HandleAsync(
		RefreshTokenCleanupJob job,
		CancellationToken cancellationToken)
	{
		RefreshTokenCleanupSettings config =
			settings.Value;

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		DateTime cutoffDate =
			now.AddDays(-config.RetentionDays).UtcDateTime;

		int deletedCount =
			await dbContext.RefreshTokens
				.Where(
					token => token.ExpiresAt < cutoffDate)
				.ExecuteDeleteAsync(cancellationToken);

		if (deletedCount > 0)
		{
			logger.LogInformation(
				"Refresh token cleanup completed: {DeletedCount} expired tokens removed",
				deletedCount);
		}

		TimeSpan interval =
			TimeSpan.FromHours(config.IntervalHours);

		await recurringJobService.RecordAndScheduleNextAsync<RefreshTokenCleanupJob>(
			nameof(RefreshTokenCleanupJob),
			now,
			interval,
			cancellationToken);
	}
}
```

---

#### Task 3.2: IpAnonymizationJob (Identity Domain)

**Message:** `SeventySix.Identity/Jobs/IpAnonymizationJob.cs`

```csharp
namespace SeventySix.Identity.Jobs;

/// <summary>
/// Wolverine message that triggers IP address anonymization for GDPR compliance.
/// </summary>
public record IpAnonymizationJob;
```

**Handler:** `SeventySix.Identity/Jobs/IpAnonymizationJobHandler.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Identity.Jobs;

/// <summary>
/// Handles periodic anonymization of old IP addresses for GDPR compliance.
/// </summary>
/// <param name="dbContext">
/// The Identity database context.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="settings">
/// Configuration for anonymization behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for cutoff calculations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class IpAnonymizationJobHandler(
	IdentityDbContext dbContext,
	IRecurringJobService recurringJobService,
	IOptions<IpAnonymizationSettings> settings,
	TimeProvider timeProvider,
	ILogger<IpAnonymizationJobHandler> logger)
{
	/// <summary>
	/// Handles the IP anonymization job.
	/// </summary>
	/// <param name="job">
	/// The job message (marker type).
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task HandleAsync(
		IpAnonymizationJob job,
		CancellationToken cancellationToken)
	{
		IpAnonymizationSettings config =
			settings.Value;

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		DateTime cutoffDate =
			now.AddDays(-config.RetentionDays).UtcDateTime;

		int anonymizedCount =
			await dbContext.Users
				.Where(
					user => user.LastLoginIp != null)
				.Where(
					user => user.LastLoginAt <= cutoffDate)
				.ExecuteUpdateAsync(
					setter => setter.SetProperty(
						user => user.LastLoginIp,
						(string?)null),
					cancellationToken);

		if (anonymizedCount > 0)
		{
			logger.LogInformation(
				"IP anonymization completed: {AnonymizedCount} user IP addresses anonymized",
				anonymizedCount);
		}

		TimeSpan interval =
			TimeSpan.FromDays(config.IntervalDays);

		await recurringJobService.RecordAndScheduleNextAsync<IpAnonymizationJob>(
			nameof(IpAnonymizationJob),
			now,
			interval,
			cancellationToken);
	}
}
```

---

#### Task 3.3: EmailQueueProcessJob (ElectronicNotifications Domain)

**Message:** `SeventySix.ElectronicNotifications/Jobs/EmailQueueProcessJob.cs`

```csharp
namespace SeventySix.ElectronicNotifications.Jobs;

/// <summary>
/// Wolverine message that triggers email queue processing.
/// </summary>
public record EmailQueueProcessJob;
```

**Handler:** `SeventySix.ElectronicNotifications/Jobs/EmailQueueProcessJobHandler.cs`

```csharp
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.BackgroundJobs;
using Wolverine;

namespace SeventySix.ElectronicNotifications.Jobs;

/// <summary>
/// Handles periodic processing of the email queue.
/// </summary>
/// <param name="messageBus">
/// The Wolverine message bus for invoking queries/commands.
/// </param>
/// <param name="emailService">
/// The email sending service.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="emailSettings">
/// Configuration for email delivery.
/// </param>
/// <param name="queueSettings">
/// Configuration for queue processing behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for execution tracking.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class EmailQueueProcessJobHandler(
	IMessageBus messageBus,
	IEmailService emailService,
	IRecurringJobService recurringJobService,
	IOptions<EmailSettings> emailSettings,
	IOptions<EmailQueueSettings> queueSettings,
	TimeProvider timeProvider,
	ILogger<EmailQueueProcessJobHandler> logger)
{
	/// <summary>
	/// Handles the email queue processing job.
	/// </summary>
	/// <param name="job">
	/// The job message (marker type).
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task HandleAsync(
		EmailQueueProcessJob job,
		CancellationToken cancellationToken)
	{
		EmailSettings emailConfig =
			emailSettings.Value;

		EmailQueueSettings queueConfig =
			queueSettings.Value;

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		if (emailConfig.Enabled && queueConfig.Enabled)
		{
			IReadOnlyList<EmailQueueEntry> pendingEmails =
				await messageBus.InvokeAsync<IReadOnlyList<EmailQueueEntry>>(
					new GetPendingEmailsQuery(queueConfig.BatchSize),
					cancellationToken);

			if (pendingEmails.Count > 0)
			{
				int successCount = 0;
				int failCount = 0;

				foreach (EmailQueueEntry entry in pendingEmails)
				{
					bool success =
						await ProcessSingleEmailAsync(
							entry,
							cancellationToken);

					if (success)
					{
						successCount++;
					}
					else
					{
						failCount++;
					}
				}

				logger.LogInformation(
					"Email queue batch processed. Sent: {SuccessCount}, Failed: {FailCount}",
					successCount,
					failCount);
			}
		}

		TimeSpan interval =
			TimeSpan.FromSeconds(queueConfig.ProcessingIntervalSeconds);

		await recurringJobService.RecordAndScheduleNextAsync<EmailQueueProcessJob>(
			nameof(EmailQueueProcessJob),
			now,
			interval,
			cancellationToken);
	}

	private async Task<bool> ProcessSingleEmailAsync(
		EmailQueueEntry entry,
		CancellationToken cancellationToken)
	{
		// Implementation delegates to existing email processing logic
		// Moved from EmailQueueProcessorService.ProcessSingleEmailAsync
		// Returns true on success, false on failure
		throw new NotImplementedException("Move existing logic here");
	}
}
```

---

#### Task 3.4: LogCleanupJob (Logging Domain)

**Message:** `SeventySix.Logging/Jobs/LogCleanupJob.cs`

```csharp
namespace SeventySix.Logging.Jobs;

/// <summary>
/// Wolverine message that triggers log cleanup (database and file system).
/// </summary>
public record LogCleanupJob;
```

**Handler:** `SeventySix.Logging/Jobs/LogCleanupJobHandler.cs`

```csharp
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Logging.Jobs;

/// <summary>
/// Handles periodic cleanup of old logs from database and file system.
/// </summary>
/// <param name="logRepository">
/// Repository for database log operations.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="settings">
/// Configuration for cleanup behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for cutoff calculations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class LogCleanupJobHandler(
	ILogRepository logRepository,
	IRecurringJobService recurringJobService,
	IOptions<LogCleanupSettings> settings,
	TimeProvider timeProvider,
	ILogger<LogCleanupJobHandler> logger)
{
	/// <summary>
	/// Handles the log cleanup job.
	/// </summary>
	/// <param name="job">
	/// The job message (marker type).
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task HandleAsync(
		LogCleanupJob job,
		CancellationToken cancellationToken)
	{
		LogCleanupSettings config =
			settings.Value;

		if (!config.Enabled)
		{
			return;
		}

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		DateTime cutoffDate =
			now.AddDays(-config.RetentionDays).UtcDateTime;

		// Database cleanup
		int deletedDatabaseLogs =
			await logRepository.DeleteOlderThanAsync(
				cutoffDate,
				cancellationToken);

		if (deletedDatabaseLogs > 0)
		{
			logger.LogInformation(
				"Database log cleanup completed: {DeletedCount} logs removed",
				deletedDatabaseLogs);
		}

		// File system cleanup
		int deletedLogFiles =
			CleanupLogFiles(
				config,
				cutoffDate);

		if (deletedLogFiles > 0)
		{
			logger.LogInformation(
				"File log cleanup completed: {DeletedCount} files removed",
				deletedLogFiles);
		}

		TimeSpan interval =
			TimeSpan.FromHours(config.IntervalHours);

		await recurringJobService.RecordAndScheduleNextAsync<LogCleanupJob>(
			nameof(LogCleanupJob),
			now,
			interval,
			cancellationToken);
	}

	private int CleanupLogFiles(
		LogCleanupSettings config,
		DateTime cutoffDate)
	{
		string logDirectory =
			Path.Combine(
				AppContext.BaseDirectory,
				config.LogDirectory);

		if (!Directory.Exists(logDirectory))
		{
			return 0;
		}

		int deletedCount = 0;

		string[] logFiles =
			Directory.GetFiles(
				logDirectory,
				config.LogFilePattern);

		foreach (string filePath in logFiles)
		{
			FileInfo fileInfo =
				new(filePath);

			if (fileInfo.LastWriteTimeUtc < cutoffDate)
			{
				try
				{
					fileInfo.Delete();
					deletedCount++;
				}
				catch (IOException)
				{
					// File in use - skip
				}
			}
		}

		return deletedCount;
	}
}
```

---

### Phase 4: Database Schema

#### Task 4.1: Add Job Tracking Table

**Migration:** Add to appropriate DbContext (suggest Logging domain for cross-cutting concerns)

```csharp
public class RecurringJobExecutionConfiguration : IEntityTypeConfiguration<RecurringJobExecution>
{
	public void Configure(EntityTypeBuilder<RecurringJobExecution> builder)
	{
		builder
			.ToTable("recurring_job_executions");

		builder
			.HasKey(
				execution => execution.JobName);

		builder
			.Property(
				execution => execution.JobName)
			.HasMaxLength(128)
			.IsRequired();

		builder
			.Property(
				execution => execution.LastExecutedAt)
			.IsRequired();

		builder
			.Property(
				execution => execution.LastExecutedBy)
			.HasMaxLength(256);
	}
}
```

### Phase 5: Registration Updates

#### Task 5.1: Update BackgroundJobRegistration

**File:** `SeventySix.Domains/Registration/BackgroundJobRegistration.cs`

```csharp
public static class BackgroundJobRegistration
{
	/// <summary>
	/// Registers background job infrastructure and scheduling.
	/// </summary>
	/// <param name="services">
	/// The service collection.
	/// </param>
	/// <param name="configuration">
	/// The application configuration.
	/// </param>
	/// <returns>
	/// The service collection for chaining.
	/// </returns>
	public static IServiceCollection AddBackgroundJobs(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		bool enabled =
			configuration.GetValue<bool?>("BackgroundJobs:Enabled") ?? true;

		if (!enabled)
		{
			return services;
		}

		// Job tracking repository
		services.AddScoped<IRecurringJobRepository, RecurringJobRepository>();

		// Settings for each job
		services.Configure<RefreshTokenCleanupSettings>(
			configuration.GetSection(RefreshTokenCleanupSettings.SectionName));
		services.Configure<IpAnonymizationSettings>(
			configuration.GetSection(IpAnonymizationSettings.SectionName));
		services.Configure<LogCleanupSettings>(
			configuration.GetSection(LogCleanupSettings.SectionName));

		// One-shot startup services (not recurring)
		services.Configure<AdminSeederSettings>(
			configuration.GetSection(AdminSeederSettings.SectionName));
		services.AddHostedService<AdminSeederService>();

		// Recurring job scheduler (runs once at startup to queue jobs)
		services.AddHostedService<RecurringJobSchedulerService>();

		return services;
	}
}
```

---

## 🧪 Testing Strategy

### Unit Tests (80% Focus)

Following 80/20 rule - test critical paths only using TDD approach.

#### RecurringJobService Tests

**File:** `SeventySix.Shared.Tests/BackgroundJobs/RecurringJobServiceTests.cs`

```csharp
public class RecurringJobServiceTests
{
	[Fact]
	public async Task EnsureScheduledAsync_WhenNeverExecuted_SchedulesImmediatelyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new();

		IRecurringJobRepository repository =
			Substitute.For<IRecurringJobRepository>();

		IMessageScheduler scheduler =
			Substitute.For<IMessageScheduler>();

		repository
			.GetLastExecutionAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns((RecurringJobExecution?)null);

		RecurringJobService service =
			new(
				repository,
				scheduler,
				timeProvider);

		// Act
		await service.EnsureScheduledAsync<TestJob>(
			"TestJob",
			TimeSpan.FromHours(24),
			CancellationToken.None);

		// Assert
		await scheduler
			.Received(1)
			.ScheduleAsync(
				Arg.Any<TestJob>(),
				timeProvider.GetUtcNow(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task EnsureScheduledAsync_WhenOverdue_SchedulesImmediatelyAsync()
	{
		// Arrange - last execution 2 days ago, interval is 1 day
		// Act
		// Assert - schedules for now
	}

	[Fact]
	public async Task EnsureScheduledAsync_WhenNotYetDue_SchedulesAtNextIntervalAsync()
	{
		// Arrange - last execution 1 hour ago, interval is 24 hours
		// Act
		// Assert - schedules for 23 hours from now
	}

	[Fact]
	public async Task RecordAndScheduleNextAsync_PersistsExecutionAndSchedulesAsync()
	{
		// Arrange
		// Act
		// Assert - repository.UpsertExecutionAsync called
		// Assert - scheduler.ScheduleAsync called with correct next time
	}

	private record TestJob;
}
```

#### Job Handler Tests (Per Domain)

**File:** `SeventySix.Domains.Tests/Identity/Jobs/RefreshTokenCleanupJobHandlerTests.cs`

```csharp
public class RefreshTokenCleanupJobHandlerTests
{
	[Fact]
	public async Task HandleAsync_WhenExpiredTokensExist_DeletesAndSchedulesNextAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new();

		IdentityDbContext dbContext =
			CreateTestDbContext();

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		RefreshTokenCleanupJobHandler handler =
			new(
				dbContext,
				recurringJobService,
				CreateSettings(
					retentionDays: 7,
					intervalHours: 24),
				timeProvider,
				NullLogger<RefreshTokenCleanupJobHandler>.Instance);

		// Act
		await handler.HandleAsync(
			new RefreshTokenCleanupJob(),
			CancellationToken.None);

		// Assert
		await recurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<RefreshTokenCleanupJob>(
				nameof(RefreshTokenCleanupJob),
				Arg.Any<DateTimeOffset>(),
				TimeSpan.FromHours(24),
				Arg.Any<CancellationToken>());
	}
}
```

### Integration Tests (20% Focus)

**File:** `SeventySix.Domains.Tests/Integration/RecurringJobIntegrationTests.cs`

```csharp
public class RecurringJobIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
	[Fact]
	public async Task JobExecution_PersistsTrackingRecord_AndSchedulesNextAsync()
	{
		// End-to-end: trigger job → verify DB record → verify next scheduled
	}

	[Fact]
	public async Task JobScheduler_OnStartup_SchedulesAllEnabledJobsAsync()
	{
		// Verify RecurringJobSchedulerService schedules all jobs
	}
}
```

---

## 📦 Dependencies

### New NuGet Packages

None required - Wolverine is already integrated.

### Database Changes

-   New table: `recurring_job_executions` (in Logging database for cross-cutting)

---

## 🚀 Migration Path

### Step 1: Add Infrastructure

1. Create entities, interfaces, repository
2. Run migration for tracking table
3. Implement `RecurringJobSchedulerService`

### Step 2: Convert Jobs Incrementally

1. Convert `RefreshTokenCleanupService` first (simplest)
2. Write tests, verify in development
3. Convert remaining services one at a time

### Step 3: Cleanup

1. Remove old `BackgroundService` implementations
2. Update registration
3. Update appsettings documentation

### Step 4: Verification

1. Run full test suite
2. Test Docker restart scenarios manually
3. Verify OpenTelemetry traces for job execution

---

## ⚠️ Risk Mitigation

| Risk                          | Mitigation                                                  |
| ----------------------------- | ----------------------------------------------------------- |
| Wolverine message loss        | PostgreSQL durable queues; messages survive restarts        |
| Duplicate execution           | Wolverine message ownership; only one consumer processes    |
| Job tracking table contention | Simple upsert pattern; low-frequency writes                 |
| Migration complexity          | Incremental conversion; old and new can coexist temporarily |

---

## 📊 Success Criteria

-   [ ] All background jobs survive Docker container restarts
-   [ ] Jobs do not run simultaneously across scaled instances
-   [ ] Job execution is visible in OpenTelemetry traces
-   [ ] Unit tests pass with >80% code coverage on `RecurringJobService` and handlers
-   [ ] No Hangfire or Quartz dependencies added (YAGNI)
-   [ ] Existing Wolverine patterns extended consistently (DRY)
-   [ ] All abstractions in `SeventySix.Shared` (DDD compliant)
-   [ ] No "Infrastructure" domain created
-   [ ] All variable names are descriptive (no single-letter names)

---

## 🗓️ Estimated Effort

| Phase                        | Tasks              | Estimate        |
| ---------------------------- | ------------------ | --------------- |
| Phase 1: Shared Abstractions | 5 tasks            | 2-3 hours       |
| Phase 2: Domain Adapters     | 4 tasks            | 1-2 hours       |
| Phase 3: Job Conversions     | 4 jobs             | 3-4 hours       |
| Phase 4: Scheduler Service   | 1 task             | 1 hour          |
| Phase 5: Registration        | 1 task             | 30 min          |
| Phase 6: Migration           | 1 task             | 30 min          |
| Phase 7: Cleanup             | 2 tasks            | 30 min          |
| Testing                      | Unit + Integration | 2-3 hours       |
| **Total**                    |                    | **11-15 hours** |

---

## 📚 References

-   [Wolverine Durable Messaging](https://wolverinefx.io/guide/durability/)
-   [.NET BackgroundService Best Practices](https://learn.microsoft.com/en-us/dotnet/core/extensions/workers)
-   [Domain-Driven Design Bounded Contexts](https://martinfowler.com/bliki/BoundedContext.html)
-   [PostgreSQL Advisory Locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS) (alternative approach)
