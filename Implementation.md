# Implementation Plan: Remove Deprecated Endpoints and Observability Cleanup

## Executive Summary

**Objective**: Remove all client-side and server-side code related to deprecated weather, logchart, and logstatistic endpoints, while streamlining the admin dashboard to focus on Grafana-based observability with only two custom panels (API Statistics and Observability Quick Links).

**Approach**: ULTRATHINK methodology with systematic discovery, analysis, and incremental removal following KISS, DRY, and YAGNI principles.

**Architecture Compliance**: All changes align with Clean Architecture, Three-Layer Architecture, Feature Module Pattern, and established coding standards from `.editorconfig` and `CLAUDE.md`.

---

## Phase 0: ULTRATHINK Analysis

### Problem Decomposition

1. **Observability Migration Context**

    - Transition from custom dashboards to Grafana-based observability
    - Legacy endpoints (weather, logchart, logstatistic) no longer needed
    - Admin dashboard simplified to two custom panels + Grafana embeds

2. **Code Removal Scope**

    - **Client-side**: Components, services, repositories, models, routes, tests
    - **Server-side**: Controllers, services, repositories, DTOs, validators, tests
    - **Shared**: Configuration, documentation references

3. **Dependencies to Preserve**
    - Logs endpoint (still used for application logging)
    - Third-party API tracking (still needed for rate limiting/monitoring)
    - Health endpoint (core infrastructure)
    - User management (core feature)

### Risk Assessment

| Risk                            | Mitigation                                               |
| ------------------------------- | -------------------------------------------------------- |
| Breaking existing observability | Verify Grafana dashboards fully replace removed features |
| Test failures                   | Comprehensive test suite review and cleanup              |
| Configuration drift             | Update all environment files consistently                |
| Documentation gaps              | Update architecture docs to reflect new state            |

### Success Criteria

-   ✅ No weather/logchart/logstatistic code remains
-   ✅ Admin dashboard only contains API Statistics + Quick Links panels
-   ✅ All Grafana dashboards functional
-   ✅ All tests pass (client + server)
-   ✅ No unused imports, services, or dependencies
-   ✅ Architecture documentation updated

---

## Phase 1: Discovery & Inventory

### 1.1 Client-Side Code Audit

#### Components to Remove

```
SeventySix.Client/src/app/features/home/
  └─ weather/                           # REMOVE: Entire weather feature
      ├─ components/
      ├─ models/
      ├─ services/
      └─ repositories/
```

#### Services & Repositories to Audit

-   Search for any `*weather*`, `*log-chart*`, `*log-statistic*` files
-   Identify imports and dependencies in admin dashboard components
-   Catalog all test files referencing these endpoints

#### Routes to Update

-   Remove weather route from `app.routes.ts` or feature routes
-   Clean up breadcrumb mappings
-   Update sidebar navigation

#### Test Files to Clean

-   `e2e/` directory for weather/log-related tests
-   Component spec files with weather/log-chart/log-statistic mocks

### 1.2 Server-Side Code Audit

#### Controllers (Confirmed Existence)

-   ❌ `WeatherController` - NOT FOUND (already removed?)
-   ❌ `LogChartController` - NOT FOUND (already removed?)
-   ❌ `LogStatisticController` - NOT FOUND (already removed?)
-   ✅ `LogsController` - KEEP (still needed for logging)
-   ✅ `HealthController` - KEEP (infrastructure)
-   ✅ `ThirdPartyApiRequestsController` - KEEP (API tracking)

#### Services & Repositories to Search

-   Business logic layer: `*Weather*`, `*LogChart*`, `*LogStatistic*`
-   Data layer: Repository implementations
-   Infrastructure: HTTP clients (e.g., `OpenWeatherApiClient`)

#### DTOs to Remove

-   Weather-related request/response DTOs
-   Log chart/statistic DTOs (if separate from main Log DTOs)

#### Validators to Remove

-   FluentValidation validators for weather requests
-   Log chart/statistic validators

#### Tests to Clean

-   Unit tests for removed services/repositories
-   Integration tests for removed controllers
-   Test utilities/builders referencing weather data
-   Mock helpers for OpenWeather API

### 1.3 Configuration Audit

#### Environment Files

-   `SeventySix.Client/src/environments/environment*.ts`
    -   Remove weather API configuration
    -   Verify Grafana dashboard UIDs present

#### App Settings

-   `SeventySix.Server/SeventySix.Api/appsettings*.json`
    -   Remove OpenWeather API keys/configuration
    -   Clean up rate limiting rules for removed endpoints

#### Docker Compose

-   Verify observability stack (Grafana, Prometheus, Jaeger) configuration
-   Remove any weather-specific containers or volumes

---

## Phase 2: Client-Side Cleanup

### 2.1 Remove Weather Feature Module

**Action**: Delete entire weather feature directory

```powershell
Remove-Item -Recurse -Force SeventySix.Client/src/app/features/home/weather
```

**Verification**:

-   No broken imports in remaining code
-   No route references to `/weather`
-   Breadcrumb component updated
-   Sidebar navigation cleaned

### 2.2 Update Admin Dashboard

**Current State** (from `admin-dashboard.component.html`):

-   ✅ System Overview Tab (Grafana embed) - KEEP
-   ✅ API Metrics Tab (Grafana embed) - KEEP
-   ✅ Tools Tab - SIMPLIFY
    -   ✅ API Statistics Table - KEEP
    -   ✅ Observability Quick Links - KEEP
    -   ❌ Remove any log chart/weather panels if present

**Action**:

1. Review `admin-dashboard.component.html` for log-chart/weather references
2. Verify only two custom panels remain:
    - `ApiStatisticsTableComponent`
    - Observability Quick Links (inline in template)
3. Remove unused component imports from `admin-dashboard.component.ts`

### 2.3 Clean Admin Dashboard Components

**Components to Review**:

```
SeventySix.Client/src/app/features/admin/admin-dashboard/components/
  ├─ api-statistics-table/          # KEEP - core functionality
  └─ grafana-dashboard-embed/       # KEEP - core functionality
```

**Action**:

-   Search for any log-chart/weather components
-   Remove if found
-   Update barrel exports (`index.ts`)

### 2.4 Clean Services & Repositories

**Services to Audit** (`admin-dashboard/services/`):

-   `health-api.service.ts` - REVIEW for weather references
-   `third-party-api.service.ts` - REVIEW for weather references
-   Remove any dedicated weather/log-chart services

**Repositories to Audit** (`admin-dashboard/repositories/`):

-   Remove weather/log-chart repositories if present

**Action**:

1. Search all service/repository files for "weather", "logchart", "logstatistic"
2. Remove methods/endpoints no longer needed
3. Update tests to remove weather/log-chart test cases
4. Clean barrel exports

### 2.5 Update Models

**Action**:

-   Review `admin-dashboard/models/` for weather/log-chart interfaces
-   Remove deprecated models
-   Update barrel exports
-   Clean TypeScript imports throughout codebase

### 2.6 Remove E2E Tests

**Action**:

-   Search `e2e/` directory for weather/log-chart tests
-   Remove deprecated test files
-   Update remaining tests if they reference removed features

### 2.7 Update Routing

**Files to Update**:

-   `app.routes.ts` - Remove weather routes
-   `features/home/*.routes.ts` - Clean up home feature routes
-   `features/admin/admin.routes.ts` - Verify admin routes clean

**Action**:

```typescript
// BEFORE
{ path: 'weather', loadComponent: () => import('./weather/...') }

// AFTER
// Removed - functionality now in Grafana dashboards
```

### 2.8 Update Navigation

**Files to Update**:

-   `core/layout/sidebar/sidebar.component.ts` - Remove weather links
-   `shared/components/breadcrumb/breadcrumb.component.ts` - Clean breadcrumb mappings

**Action**:

-   Remove weather navigation items
-   Update breadcrumb route labels
-   Verify no broken links

### 2.9 Clean Test Mocks & Fixtures

**Action**:

-   Search `testing/mocks/` for weather/log-chart mocks
-   Remove deprecated mock data
-   Update remaining tests using cleaned mocks

### 2.10 Run Client Tests

**Action**:

```powershell
cd SeventySix.Client
npm test
```

**Expected**:

-   All tests pass
-   No references to removed features
-   Coverage maintained >80%

---

## Phase 3: Server-Side Cleanup

### 3.1 Remove Controllers

**Status**: Controllers appear already removed

-   ❌ `WeatherController` - NOT FOUND
-   ❌ `LogChartController` - NOT FOUND
-   ❌ `LogStatisticController` - NOT FOUND

**Action**:

-   Verify no controller files exist
-   Search for route registrations in `Program.cs`
-   Clean up any middleware specific to these endpoints

### 3.2 Remove Services (Business Logic Layer)

**Search Pattern**:

```
SeventySix.BusinessLogic/Services/
  - *Weather*.cs
  - *LogChart*.cs
  - *LogStatistic*.cs
```

**Action**:

1. Identify weather/log-chart/log-statistic service implementations
2. Remove service files
3. Remove service interfaces from `Interfaces/`
4. Update DI registration in `Program.cs` or extension methods
5. Search for `IWeatherService`, `ILogChartService`, `ILogStatisticService`

### 3.3 Remove Infrastructure (HTTP Clients)

**Search Pattern**:

```
SeventySix.BusinessLogic/Infrastructure/
  - OpenWeatherApiClient.cs or similar
```

**Action**:

1. Remove HTTP client implementations for weather APIs
2. Remove Polly policies specific to weather endpoints
3. Clean up rate limiting configuration for OpenWeather
4. Update DI registration

### 3.4 Remove Repositories (Data Layer)

**Search Pattern**:

```
SeventySix.Data/Repositories/
  - *Weather*.cs
  - *LogChart*.cs
  - *LogStatistic*.cs
```

**Action**:

1. Remove repository implementations
2. Verify repository interfaces removed from BusinessLogic
3. Clean up any weather-specific database queries
4. **NOTE**: Keep `LogRepository` (needed for application logging)

### 3.5 Remove DTOs

**Search Pattern**:

```
SeventySix.BusinessLogic/DTOs/
  - Weather/
  - LogChart/
  - LogStatistic/
```

**Action**:

1. Remove weather/log-chart/log-statistic DTO folders
2. Update barrel exports if any
3. Search for references in remaining code

### 3.6 Remove Validators

**Search Pattern**:

```
SeventySix.BusinessLogic/Validators/
  - *Weather*Validator.cs
  - *LogChart*Validator.cs
  - *LogStatistic*Validator.cs
```

**Action**:

1. Remove validator files
2. Clean up FluentValidation registration in DI

### 3.7 Remove Entities (If Weather-Specific)

**Search Pattern**:

```
SeventySix.BusinessLogic/Entities/
  - Weather.cs (if exists)
```

**Action**:

-   Remove weather-specific entities
-   **NOTE**: Keep `Log` entity (still needed)
-   **NOTE**: Keep `ThirdPartyApiRequest` entity (still needed for API tracking)

### 3.8 Clean Database Migrations

**Action**:

-   Review EF Core migrations for weather-specific tables
-   If weather tables exist, create migration to drop them
-   **NOTE**: Do NOT remove Log or ThirdPartyApiRequest tables

### 3.9 Update Configuration

**Files to Update**:

-   `appsettings.json` - Remove OpenWeather configuration
-   `appsettings.Development.json`
-   `appsettings.Production.json`
-   `appsettings.Test.json`

**Action**:

```json
// REMOVE
{
	"OpenWeather": {
		"ApiKey": "...",
		"BaseUrl": "..."
	}
}
```

### 3.10 Update DI Registration

**File**: `SeventySix.Api/Program.cs` or extension methods

**Action**:

1. Remove weather service registrations
2. Remove weather repository registrations
3. Remove OpenWeather HTTP client registrations
4. Remove weather validator registrations
5. Clean up Polly policies for weather endpoints

### 3.11 Clean Test Projects

#### 3.11.1 Remove Test Files

**Search Pattern**:

```
Tests/SeventySix.Api.Tests/Controllers/
  - WeatherControllerTests.cs
  - LogChartControllerTests.cs
  - LogStatisticControllerTests.cs

Tests/SeventySix.BusinessLogic.Tests/Services/
  - *Weather*Tests.cs
  - *LogChart*Tests.cs
  - *LogStatistic*Tests.cs

Tests/SeventySix.Data.Tests/Repositories/
  - *Weather*RepositoryTests.cs
  - *LogChart*RepositoryTests.cs
  - *LogStatistic*RepositoryTests.cs
```

**Action**:

-   Remove all test files for deleted features
-   Clean up test references in existing tests (e.g., `LogsControllerTests.cs` has `WeatherController` references in test data)

#### 3.11.2 Clean Test Utilities

**Search Pattern**:

```
Tests/SeventySix.TestUtilities/
  - Builders/*Weather*.cs
  - Helpers/*Weather*.cs
  - Attributes/ (review comments mentioning OpenWeather)
```

**Found References**:

-   `ThirdPartyApiRequestBuilder.CreateOpenWeather()` - REMOVE
-   Comments in `IntegrationTestAttribute.cs` mentioning OpenWeather - UPDATE
-   Comments in `ApiPostgreSqlTestBase.cs` mentioning OpenWeather - UPDATE

**Action**:

1. Remove `CreateOpenWeather()` factory method from builder
2. Update comments to remove OpenWeather references
3. Search for "OpenWeather" in all test files and clean up

#### 3.11.3 Update Remaining Tests

**Files with Weather References**:

-   `LogsControllerTests.cs` - Uses `WeatherController` in test data
-   `LogRepositoryTests.cs` - Uses "SeventySix.Services.WeatherService" source context

**Action**:

1. Replace weather-related test data with generic equivalents
2. Use different controller names (e.g., "UsersController", "HealthController")
3. Update source contexts to real services

### 3.12 Run Server Tests

**CRITICAL**: Ensure Docker Desktop is running

**Action**:

```powershell
cd SeventySix.Server
npm run start:docker  # Start Docker if not running
dotnet test
```

**Expected**:

-   All tests pass
-   No references to weather/log-chart/log-statistic
-   Coverage maintained >80%

---

## Phase 4: Documentation & Configuration

### 4.1 Update Architecture Documentation

**File**: `ARCHITECTURE.md`

**Action**:

1. Remove weather feature from frontend architecture examples
2. Update feature module examples to use real features (Users, Admin)
3. Clean up data flow diagrams if they reference weather
4. Verify admin dashboard description matches new reality

### 4.2 Update Implementation Guide

**File**: `Implementation.md` (this file)

**Action**:

-   Mark implementation complete
-   Document final state of system
-   List all removed components

### 4.3 Update Style Guide

**File**: `STYLE_GUIDE.md`

**Action**:

-   Review for weather/log-chart examples
-   Replace with current features

### 4.4 Clean Environment Configuration

**Client**:

```typescript
// SeventySix.Client/src/environments/environment.ts
export const environment = {
	// REMOVE weather-related config
	// VERIFY Grafana dashboard UIDs present
	observability: {
		enabled: true,
		grafanaUrl: "http://localhost:3000",
		prometheusUrl: "http://localhost:9090",
		jaegerUrl: "http://localhost:16686",
		dashboards: {
			systemOverview: "xxxxxxxx",
			apiEndpoints: "yyyyyyyy",
		},
	},
};
```

**Server**:

-   Verify appsettings.json files cleaned (Phase 3.9)

### 4.5 Update README

**Action**:

-   Remove weather feature from feature list
-   Update observability section to reflect Grafana-first approach
-   Clean up setup instructions if they reference weather

### 4.6 Update Docker Compose

**Files**:

-   `docker-compose.yml`
-   `docker-compose.override.yml`
-   `docker-compose.production.yml`

**Action**:

-   Verify observability stack configured
-   Remove weather-specific services/volumes if any

---

## Phase 5: Verification & Testing

### 5.1 Code Search Verification

**Search Patterns**:

```powershell
# Client-side
grep -r "weather" SeventySix.Client/src/app --include="*.ts" --include="*.html"
grep -r "log-chart\|logchart" SeventySix.Client/src/app --include="*.ts" --include="*.html"
grep -r "log-statistic\|logstatistic" SeventySix.Client/src/app --include="*.ts" --include="*.html"

# Server-side
grep -r "Weather" SeventySix.Server --include="*.cs" | grep -v "Test"
grep -r "LogChart\|LogStatistic" SeventySix.Server --include="*.cs"
grep -r "OpenWeather" SeventySix.Server --include="*.cs"
```

**Expected**: Only legitimate references (e.g., "Weather" in comments, historical test data)

### 5.2 Build Verification

**Client**:

```powershell
cd SeventySix.Client
npm run build
```

**Server**:

```powershell
cd SeventySix.Server
dotnet build
```

**Expected**: No compilation errors, no unused imports

### 5.3 Test Suite Verification

**Client**:

```powershell
cd SeventySix.Client
npm test
npm run test:e2e
```

**Server**:

```powershell
cd SeventySix.Server
dotnet test --logger "console;verbosity=detailed"
```

**Expected**: All tests pass, coverage >80%

### 5.4 Runtime Verification

**Action**:

1. Start observability stack (Grafana, Prometheus, Jaeger)
2. Start backend API
3. Start frontend
4. Navigate to Admin Dashboard
5. Verify only two custom panels visible
6. Verify Grafana embeds load correctly
7. Test observability quick links

**Checklist**:

-   [ ] API Statistics Table displays data
-   [ ] Observability Quick Links functional
-   [ ] Grafana System Overview dashboard embeds
-   [ ] Grafana API Metrics dashboard embeds
-   [ ] No 404 errors in console
-   [ ] No broken routes
-   [ ] Jaeger button opens correct URL
-   [ ] Prometheus button opens correct URL
-   [ ] Grafana button opens correct URL

### 5.5 API Endpoint Verification

**Test Removed Endpoints**:

```bash
# These should return 404
curl http://localhost:5000/api/v1/weather
curl http://localhost:5000/api/v1/logchart
curl http://localhost:5000/api/v1/logstatistic
```

**Test Preserved Endpoints**:

```bash
# These should still work
curl http://localhost:5000/api/v1/health
curl http://localhost:5000/api/v1/logs
curl http://localhost:5000/api/v1/third-party-api-requests
curl http://localhost:5000/api/v1/users
```

---

## Phase 6: Final Cleanup & Optimization

### 6.1 Dependency Cleanup

**Client**:

```powershell
cd SeventySix.Client
npm prune
npm audit fix
```

**Action**:

-   Remove unused npm packages related to weather/charts
-   Verify no broken peer dependencies

**Server**:

-   Review NuGet packages
-   Remove packages only used by weather feature (e.g., OpenWeather client library)

### 6.2 Code Formatting

**Action**:

```powershell
# Client
cd SeventySix.Client
npm run lint:fix

# Server
cd SeventySix.Server
dotnet format
```

**Expected**: All code adheres to `.editorconfig` rules

### 6.3 Final Code Review

**Checklist**:

-   [ ] No unused imports
-   [ ] No commented-out code
-   [ ] No `TODO` comments for removed features
-   [ ] All files follow naming conventions
-   [ ] All async methods end with 'Async'
-   [ ] All interfaces start with 'I'
-   [ ] Tabs (4 spaces) used consistently
-   [ ] CRLF line endings (Windows)
-   [ ] Allman brace style (C#)
-   [ ] Next-line brace style (TypeScript)

### 6.4 Performance Baseline

**Action**:

-   Measure application startup time
-   Measure admin dashboard load time
-   Compare with pre-cleanup metrics

**Expected**: Equal or better performance (fewer unused services)

---

## Implementation Strategy

### Execution Order

1. **Phase 1 (Discovery)** - 2-4 hours

    - Comprehensive code audit
    - Document all removal targets
    - Create dependency graph

2. **Phase 2 (Client Cleanup)** - 4-6 hours

    - Remove features in isolation
    - Run tests after each major change
    - Commit incrementally

3. **Phase 3 (Server Cleanup)** - 4-6 hours

    - Remove backend code layer-by-layer
    - API → BusinessLogic → Data
    - Run tests after each layer

4. **Phase 4 (Documentation)** - 2-3 hours

    - Update all documentation files
    - Clean configuration files

5. **Phase 5 (Verification)** - 2-3 hours

    - Comprehensive testing
    - Runtime verification
    - API endpoint validation

6. **Phase 6 (Final Cleanup)** - 1-2 hours
    - Dependencies and formatting
    - Performance baseline

**Total Estimated Time**: 15-24 hours

### Incremental Commits

**Commit Strategy**:

```
feat: Remove weather feature from client
feat: Remove log chart/statistic components from admin dashboard
refactor: Clean admin dashboard to two custom panels
feat: Remove weather services and repositories (server)
feat: Remove weather DTOs and validators
test: Clean up weather-related test code
docs: Update architecture documentation
chore: Clean dependencies and configuration
```

### Rollback Plan

**Git Strategy**:

1. Create feature branch: `feat/remove-deprecated-endpoints`
2. Commit after each phase completion
3. Tag stable points: `cleanup-phase-1`, `cleanup-phase-2`, etc.
4. Merge to main only after Phase 5 verification passes

**Rollback**:

```powershell
git revert <commit-hash>
# Or revert entire branch
git reset --hard <tag-name>
```

---

## Risk Mitigation

### Breaking Changes

**Risk**: Removing code breaks existing functionality

**Mitigation**:

1. Comprehensive test suite execution
2. Incremental commits with verification
3. Manual runtime testing
4. API endpoint verification

### Data Loss

**Risk**: Dropping weather database tables loses historical data

**Mitigation**:

1. Backup database before migrations
2. Archive weather data if needed for historical analysis
3. Only drop tables if confirmed unnecessary

### Configuration Drift

**Risk**: Inconsistent configuration across environments

**Mitigation**:

1. Update all environment files (dev, test, prod)
2. Document configuration changes
3. Verify in each environment

### Test Coverage Gaps

**Risk**: Removing tests reduces coverage below 80%

**Mitigation**:

1. Run coverage reports before and after
2. Identify gaps introduced by cleanup
3. Add missing tests for preserved features

---

## Success Metrics

### Quantitative

-   [ ] 0 references to "weather" in production code
-   [ ] 0 references to "logchart" or "logstatistic" in production code
-   [ ] 100% test pass rate (client + server)
-   [ ] Test coverage maintained ≥80%
-   [ ] Admin dashboard loads in <2 seconds
-   [ ] Grafana embeds load successfully
-   [ ] API response times unchanged or improved

### Qualitative

-   [ ] Clean code structure (no unused imports/services)
-   [ ] Clear separation of concerns maintained
-   [ ] Architecture documentation accurate
-   [ ] Admin dashboard UX simplified
-   [ ] Observability stack fully functional
-   [ ] No regression in existing features

---

## Architectural Principles Applied

### KISS (Keep It Simple, Stupid)

-   Remove complex custom dashboards in favor of Grafana
-   Simplify admin dashboard to two core panels
-   Delete unused code rather than commenting out

### DRY (Don't Repeat Yourself)

-   Leverage Grafana for all metrics visualization
-   Consolidate observability tools into single interface
-   Remove duplicate test utilities

### YAGNI (You Aren't Gonna Need It)

-   Delete weather feature (no longer needed)
-   Remove log chart/statistic endpoints (Grafana provides this)
-   Clean up OpenWeather integration (not used)

### SOLID Principles

-   **SRP**: Each remaining service has single responsibility
-   **OCP**: Preserved services remain open for extension
-   **LSP**: Repository interfaces still substitutable
-   **ISP**: Cleaned interfaces only expose needed methods
-   **DIP**: Dependency injection patterns maintained

### Clean Architecture

-   Layer boundaries preserved (API → BusinessLogic → Data)
-   Domain entities unchanged (Log, User, ThirdPartyApiRequest)
-   Repository pattern maintained
-   Service layer integrity preserved

---

## Post-Implementation Review

### Checklist

-   [ ] All phases completed successfully
-   [ ] All tests passing (client + server)
-   [ ] Documentation updated and accurate
-   [ ] Configuration files cleaned
-   [ ] No unused dependencies
-   [ ] Performance baseline met or exceeded
-   [ ] Code review completed
-   [ ] Pull request approved
-   [ ] Changes deployed to staging
-   [ ] Smoke tests passed in staging
-   [ ] Production deployment planned

### Lessons Learned

_To be completed after implementation_

### Future Considerations

1. **Monitoring**: Ensure Grafana dashboards cover all removed custom functionality
2. **Alerts**: Configure Prometheus alerts for critical metrics
3. **Documentation**: Keep architecture docs in sync with code
4. **Dependency Management**: Regular audits to prevent accumulation of unused code

---

## Appendix A: File Removal Checklist

### Client-Side Files to Remove

```
SeventySix.Client/src/app/features/home/weather/           # Entire directory
SeventySix.Client/e2e/*weather*.spec.ts                    # E2E tests
SeventySix.Client/src/app/testing/mocks/*weather*          # Mocks
```

### Server-Side Files to Remove

```
# Controllers (if exist)
SeventySix.Api/Controllers/WeatherController.cs
SeventySix.Api/Controllers/LogChartController.cs
SeventySix.Api/Controllers/LogStatisticController.cs

# Services
SeventySix.BusinessLogic/Services/*Weather*.cs
SeventySix.BusinessLogic/Services/*LogChart*.cs
SeventySix.BusinessLogic/Services/*LogStatistic*.cs

# Interfaces
SeventySix.BusinessLogic/Interfaces/I*Weather*.cs
SeventySix.BusinessLogic/Interfaces/I*LogChart*.cs
SeventySix.BusinessLogic/Interfaces/I*LogStatistic*.cs

# DTOs
SeventySix.BusinessLogic/DTOs/Weather/                     # Entire directory
SeventySix.BusinessLogic/DTOs/LogChart/                    # Entire directory
SeventySix.BusinessLogic/DTOs/LogStatistic/                # Entire directory

# Validators
SeventySix.BusinessLogic/Validators/*Weather*.cs
SeventySix.BusinessLogic/Validators/*LogChart*.cs
SeventySix.BusinessLogic/Validators/*LogStatistic*.cs

# Infrastructure
SeventySix.BusinessLogic/Infrastructure/OpenWeather*.cs

# Repositories
SeventySix.Data/Repositories/*Weather*.cs
SeventySix.Data/Repositories/*LogChart*.cs
SeventySix.Data/Repositories/*LogStatistic*.cs

# Tests
Tests/SeventySix.Api.Tests/Controllers/*Weather*.cs
Tests/SeventySix.Api.Tests/Controllers/*LogChart*.cs
Tests/SeventySix.Api.Tests/Controllers/*LogStatistic*.cs
Tests/SeventySix.BusinessLogic.Tests/Services/*Weather*.cs
Tests/SeventySix.Data.Tests/Repositories/*Weather*.cs
```

### Files to Update (Not Remove)

```
# Client
SeventySix.Client/src/app/app.routes.ts
SeventySix.Client/src/app/core/layout/sidebar/sidebar.component.ts
SeventySix.Client/src/app/shared/components/breadcrumb/breadcrumb.component.ts
SeventySix.Client/src/environments/environment*.ts

# Server
SeventySix.Api/Program.cs
SeventySix.Api/appsettings*.json
Tests/SeventySix.Api.Tests/Controllers/LogsControllerTests.cs
Tests/SeventySix.Data.Tests/Repositories/LogRepositoryTests.cs
Tests/SeventySix.TestUtilities/Builders/ThirdPartyApiRequestBuilder.cs
Tests/SeventySix.TestUtilities/TestBases/ApiPostgreSqlTestBase.cs
Tests/SeventySix.TestUtilities/Attributes/IntegrationTestAttribute.cs

# Documentation
ARCHITECTURE.md
STYLE_GUIDE.md
README.md
```

---

## Appendix B: Search Commands Reference

### PowerShell Search Commands

```powershell
# Find all files containing "weather"
Get-ChildItem -Recurse -Include *.ts,*.cs,*.html | Select-String "weather" -List

# Find all files containing "logchart" or "logstatistic"
Get-ChildItem -Recurse -Include *.ts,*.cs,*.html | Select-String "logchart|logstatistic" -List

# Find component files
Get-ChildItem -Recurse -Filter "*weather*.ts"

# Find test files
Get-ChildItem -Recurse -Filter "*.spec.ts" | Select-String "weather"

# Count remaining references
(Get-ChildItem -Recurse -Include *.ts,*.cs | Select-String "weather").Count
```

### Grep Search Commands

```bash
# Client-side searches
grep -r "weather" SeventySix.Client/src --include="*.ts" --include="*.html"
grep -r "log-chart\|logchart" SeventySix.Client/src --include="*.ts"
grep -r "log-statistic\|logstatistic" SeventySix.Client/src --include="*.ts"

# Server-side searches
grep -r "Weather" SeventySix.Server --include="*.cs"
grep -r "LogChart\|LogStatistic" SeventySix.Server --include="*.cs"
grep -r "OpenWeather" SeventySix.Server --include="*.cs"

# Case-insensitive search
grep -ri "weather" .
```

---

## Appendix C: Testing Commands

### Client-Side Testing

```powershell
cd SeventySix.Client

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- --include="**/admin-dashboard.component.spec.ts"

# Run linter
npm run lint

# Fix linter issues
npm run lint:fix

# Build production
npm run build
```

### Server-Side Testing

```powershell
cd SeventySix.Server

# Ensure Docker running
npm run start:docker

# Run all tests
dotnet test

# Run with detailed logging
dotnet test --logger "console;verbosity=detailed"

# Run specific test project
dotnet test Tests/SeventySix.Api.Tests

# Run with coverage
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover

# Build solution
dotnet build

# Format code
dotnet format
```

---

## Appendix D: Environment Configuration Template

### Client Environment (Post-Cleanup)

```typescript
// SeventySix.Client/src/environments/environment.ts
export const environment = {
	production: false,
	apiUrl: "http://localhost:5000/api/v1",
	observability: {
		enabled: true,
		grafanaUrl: "http://localhost:3000",
		prometheusUrl: "http://localhost:9090",
		jaegerUrl: "http://localhost:16686",
		dashboards: {
			systemOverview: "system-overview-uid",
			apiEndpoints: "api-endpoints-uid",
		},
	},
	logging: {
		level: "debug",
		enableConsole: true,
	},
};
```

### Server Configuration (Post-Cleanup)

```json
// SeventySix.Api/appsettings.json
{
	"Logging": {
		"LogLevel": {
			"Default": "Information",
			"Microsoft.AspNetCore": "Warning"
		}
	},
	"ConnectionStrings": {
		"DefaultConnection": "Host=localhost;Database=seventysix;Username=postgres;Password=..."
	},
	"Observability": {
		"Jaeger": {
			"AgentHost": "localhost",
			"AgentPort": 6831,
			"ServiceName": "SeventySix.Api"
		},
		"Prometheus": {
			"Enabled": true,
			"Port": 9090
		}
	},
	"RateLimiting": {
		"Enabled": true,
		"DefaultLimit": 100
	}
}
```

---

## Document Control

**Version**: 1.0
**Author**: GitHub Copilot (Claude Sonnet 4.5)
**Date**: November 23, 2025
**Status**: Draft - Pending Implementation
**Methodology**: ULTRATHINK

**Change History**:
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-23 | Copilot | Initial implementation plan created |

**Review Status**:

-   [ ] Technical Review
-   [ ] Architecture Review
-   [ ] Security Review
-   [ ] Approved for Implementation

---

_This implementation plan follows ULTRATHINK methodology, adhering to KISS, DRY, and YAGNI principles while maintaining Clean Architecture and SOLID compliance as defined in ARCHITECTURE.md, CLAUDE.md, and .editorconfig._

