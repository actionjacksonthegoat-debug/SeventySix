# Implementation Plan: API Test Suite Rationalization

## Overview

Reduce redundant integration tests in `SeventySix.Api.Tests` that duplicate coverage already provided by unit tests and service-layer tests. The current `LogsControllerTests` contains 32+ tests, many testing edge cases that the underlying `LogService` and `LogRepository` already cover.

---

## Guiding Principles

-   **KISS**: Simple, focused tests that verify API contract behavior
-   **DRY**: Don't re-test service logic that's already tested at the service/repository layer
-   **YAGNI**: Remove tests that don't add unique value at the API layer

---

## Phase 1: LogsControllerTests Rationalization

### Current State (32 tests)

The test file contains extensive edge case testing that duplicates service-layer coverage:

-   Multiple filter combination tests
-   Validation edge cases
-   Batch operation variations
-   Pagination edge cases

### Target State (8-10 essential tests)

**Keep these categories:**

1. **Happy Path Tests** (verify API routes work)

    - `GetPagedAsync_NoFilters_ReturnsAllLogsAsync` - Basic GET works
    - `LogClientErrorAsync_WithValidRequest_ReturnsNoContentAsync` - Client logging works
    - `CleanupLogsAsync_WithCutoffDate_DeletesOldLogsAsync` - Cleanup endpoint works
    - `GetCountAsync_NoFilters_ReturnsTotalCountAsync` - Count endpoint works
    - `DeleteLogAsync_WithValidId_ReturnsNoContentAsync` - Delete works

2. **Error Response Tests** (verify API returns correct HTTP status codes)
    - `GetPagedAsync_ExceedsMaxPageSize_ReturnsBadRequestAsync` - Validation returns 400
    - `CleanupLogsAsync_NoCutoffDate_ReturnsBadRequestAsync` - Missing param returns 400
    - `DeleteLogAsync_WithInvalidId_ReturnsNotFoundAsync` - Not found returns 404

**Remove these (redundant with service tests):**

-   All `FilterBy*` variations (6 tests) - Service tests cover filtering
-   All `WithMultipleFilters` tests - Service tests cover filter combinations
-   `LogClientErrorAsync_WithMissingLogLevel_ReturnsBadRequestAsync` - Validator unit tests cover this
-   `LogClientErrorAsync_WithMissingMessage_ReturnsBadRequestAsync` - Validator unit tests cover this
-   `LogClientErrorAsync_WithMinimalRequest_ReturnsNoContentAsync` - Covered by happy path
-   `LogClientErrorAsync_WithDifferentLogLevels_* (Theory with 5 cases)` - Service handles log levels
-   `LogClientErrorAsync_WithAdditionalContext_PreservesContextAsync` - Service tests cover serialization
-   `LogClientErrorBatchAsync_*` (4 tests) - Keep 1 happy path, remove variations
-   `GetCountAsync_FilterBy*` (4 tests) - Service tests cover filtering
-   `DeleteLogBatchAsync_WithSomeInvalidIds_ReturnsPartialCountAsync` - Service tests cover this
-   `GetPagedAsync_WithPagination_ReturnsCorrectPageAsync` - Service tests cover pagination

### Actions

```
File: SeventySix.Server/Tests/SeventySix.Api.Tests/Controllers/LogsControllerTests.cs

1. Delete test methods:
   - GetPagedAsync_FilterByLogLevel_ReturnsMatchingLogsAsync
   - GetPagedAsync_FilterByDateRange_ReturnsLogsInRangeAsync
   - GetPagedAsync_FilterBySourceContext_ReturnsMatchingLogsAsync
   - GetPagedAsync_FilterByRequestPath_ReturnsMatchingLogsAsync
   - GetPagedAsync_WithPagination_ReturnsCorrectPageAsync
   - GetPagedAsync_MultipleFilters_ReturnsMatchingLogsAsync
   - LogClientErrorAsync_WithMissingLogLevel_ReturnsBadRequestAsync
   - LogClientErrorAsync_WithMissingMessage_ReturnsBadRequestAsync
   - LogClientErrorAsync_WithMinimalRequest_ReturnsNoContentAsync
   - LogClientErrorAsync_WithDifferentLogLevels_ReturnsNoContentAsync (Theory)
   - LogClientErrorAsync_WithAdditionalContext_PreservesContextAsync
   - LogClientErrorBatchAsync_WithEmptyArray_ReturnsNoContentAsync
   - LogClientErrorBatchAsync_WithInvalidRequest_ReturnsBadRequestAsync
   - LogClientErrorBatchAsync_WithLargeBatch_ReturnsNoContentAsync
   - GetCountAsync_FilterByLogLevel_ReturnsMatchingCountAsync
   - GetCountAsync_FilterByDateRange_ReturnsMatchingCountAsync
   - GetCountAsync_FilterBySourceContext_ReturnsMatchingCountAsync
   - GetCountAsync_FilterByRequestPath_ReturnsMatchingCountAsync
   - GetCountAsync_MultipleFilters_ReturnsMatchingCountAsync
   - DeleteLogBatchAsync_WithSomeInvalidIds_ReturnsPartialCountAsync

2. Keep test methods (10 total):
   - GetPagedAsync_NoFilters_ReturnsAllLogsAsync
   - GetPagedAsync_ExceedsMaxPageSize_ReturnsMaxRecordsAsync (rename: _ReturnsBadRequestAsync)
   - CleanupLogsAsync_WithCutoffDate_DeletesOldLogsAsync
   - CleanupLogsAsync_NoCutoffDate_ReturnsBadRequestAsync
   - LogClientErrorAsync_WithValidRequest_ReturnsNoContentAsync
   - LogClientErrorBatchAsync_WithValidRequests_ReturnsNoContentAsync
   - GetCountAsync_NoFilters_ReturnsTotalCountAsync
   - DeleteLogAsync_WithValidId_ReturnsNoContentAsync
   - DeleteLogAsync_WithInvalidId_ReturnsNotFoundAsync
   - DeleteLogBatchAsync_WithValidIds_ReturnsDeletedCountAsync
   - DeleteLogBatchAsync_WithEmptyArray_ReturnsBadRequestAsync
```

---

## Phase 2: Review Other ApiPostgreSqlTestBase Tests

### Files to Review

1. **HealthCheckTests.cs** (1 test) - **KEEP AS-IS**

    - Single integration test verifying health endpoint with real database
    - Essential smoke test

2. **DatabaseLogSinkTests.cs** (6 tests) - **KEEP AS-IS**
    - Tests Serilog custom sink integration with real database
    - Cannot be unit tested effectively (requires real DbContext behavior)

### Files Already Well-Structured (No Changes Needed)

3. **HealthControllerTests.cs** - Unit tests with mocks (not using ApiPostgreSqlTestBase)
4. **ThirdPartyApiRequestControllerTests.cs** - Unit tests with mocks
5. **UserControllerTests.cs** - Unit tests with mocks
6. **PollyResiliencePolicyTests.cs** - Unit tests with mocks

---

## Phase 3: Simplify Test Setup in LogsControllerTests

After removing redundant tests, simplify the seeded test data:

```csharp
// Reduce from 4 seeded logs to 2 (minimum needed for remaining tests)
Log[] testLogs =
[
    LogBuilder.CreateWarning()
        .WithMessage("Test warning message")
        .WithSourceContext("SeventySix.Api.Controllers.UsersController")
        .WithTimestamp(DateTime.UtcNow.AddHours(-1))
        .Build(),
    LogBuilder.CreateError()
        .WithMessage("Test error message")
        .WithTimestamp(DateTime.UtcNow.AddDays(-31)) // For cleanup test
        .Build(),
];
```

---

## Execution Checklist

-   [ ] Phase 1: Delete 20 redundant test methods from LogsControllerTests.cs
-   [ ] Phase 1: Simplify test data seeding
-   [ ] Phase 1: Run tests to verify remaining tests pass
-   [ ] Phase 2: Confirm HealthCheckTests.cs and DatabaseLogSinkTests.cs remain unchanged
-   [ ] Phase 3: Run full test suite to ensure no regressions

---

## Test Commands

**Run all API tests:**

```bash
dotnet test SeventySix.Server/Tests/SeventySix.Api.Tests --no-build --logger "console;verbosity=normal"
```

**Run LogsControllerTests specifically:**

```bash
dotnet test SeventySix.Server/Tests/SeventySix.Api.Tests --filter "FullyQualifiedName~LogsControllerTests" --no-build
```

---

## Success Criteria

1. `LogsControllerTests` reduced from ~32 tests to ~10 tests
2. All remaining tests pass
3. Test execution time reduced
4. No loss of meaningful coverage (service/repository tests cover removed scenarios)

