# Implementation 2 — Startup Security Alignment

> **⚠️ CRITICAL — NO-SKIP RULE**: ALL required test suites MUST RUN AND PASS after ALL implementation files complete. NO SKIPPING. NO EXCEPTIONS. REGARDLESS OF TIME NEEDED OR CURRENT STATE OF THE CODE.

---

## Summary

Two small but important changes to align development and production security configurations and clean up `Program.cs`:

1. **AllowedHosts validation** — Move inline check from `Program.cs` to `StartupValidator` (follows existing pattern)
2. **Development SameSite alignment** — Change `SameSiteLax: true` → `false` in `appsettings.Development.json` so Development matches Production's `SameSite=Strict` cookie policy

### Why Development Can Use `SameSite=Strict`

The Angular dev server uses `proxy.conf.json` to proxy `/api/*` requests to the API. From the browser's perspective, all API calls and cookie operations happen on the same origin (`https://localhost:4200`). The refresh token cookie (controlled by `SameSiteLax`) is only sent via same-origin XHR calls — never on cross-site navigation. OAuth state/code-verifier cookies are **hardcoded to `SameSite=Lax`** in `AuthCookieService.cs` regardless of this setting, so OAuth redirects from GitHub are unaffected.

**E2E and Load Test** environments must keep `SameSiteLax: true` because the client and API run on different ports/containers (truly cross-origin).

---

## Phase 1 — Extract AllowedHosts Validation to StartupValidator

### File: `SeventySix.Server/SeventySix.Api/Configuration/StartupValidator.cs`

Add a new public static method `ValidateAllowedHosts` following the existing `ValidateConfiguration` pattern:

```csharp
/// <summary>
/// Validates that AllowedHosts is not a wildcard in production.
/// </summary>
/// <param name="configuration">
/// The application configuration.
/// </param>
/// <param name="environment">
/// The hosting environment.
/// </param>
/// <exception cref="InvalidOperationException">
/// Thrown when AllowedHosts is '*' in production.
/// </exception>
public static void ValidateAllowedHosts(
    IConfiguration configuration,
    IHostEnvironment environment)
{
    ArgumentNullException.ThrowIfNull(configuration);
    ArgumentNullException.ThrowIfNull(environment);

    if (!environment.IsProduction())
    {
        return;
    }

    string? allowedHosts =
        configuration["AllowedHosts"];

    if (string.Equals(
        allowedHosts,
        "*",
        StringComparison.Ordinal))
    {
        throw new InvalidOperationException(
            "AllowedHosts must not be '*' in production. "
                + "Configure specific hostnames in appsettings.Production.json.");
    }
}
```

### File: `SeventySix.Server/SeventySix.Api/Program.cs`

**Replace** the inline AllowedHosts block:

```csharp
// Before (inline):
// Validate AllowedHosts is not wildcard in production
if (app.Environment.IsProduction())
{
    string? allowedHosts =
        builder.Configuration["AllowedHosts"];
    ...
}

// After (extracted):
StartupValidator.ValidateAllowedHosts(
    builder.Configuration,
    app.Environment);
```

Place the call immediately after the existing `StartupValidator.ValidateConfiguration(...)` call.

### Verification

1. `dotnet test` — all server tests pass
2. `Program.cs` is cleaner — no inline validation blocks

---

## Phase 2 — Align Development SameSite with Production

### File: `SeventySix.Server/SeventySix.Api/appsettings.Development.json`

Change `SameSiteLax` from `true` to `false`:

```json
"SameSiteLax": false
```

This makes Development use `SameSite=Strict` for refresh token cookies, matching Production. The proxy-based development setup means this changes nothing functionally — all requests are same-origin from the browser's perspective.

### Files NOT Changed (keep `SameSiteLax: true`):
- `appsettings.E2E.json` — client/API on different ports (cross-origin)
- `docker-compose.e2e.yml` — same reason
- `docker-compose.loadtest.yml` — same reason

### Verification

1. `dotnet test` — all server tests pass (Test environment already uses `SameSiteLax: false`)
2. Manual: `npm start` → login → verify cookies have `SameSite=Strict` in browser DevTools (if app is running)

---

## Phase 3 — Add StartupValidator Unit Tests

Add tests for the new `ValidateAllowedHosts` method to the **existing** test file.

### File: `SeventySix.Server/Tests/SeventySix.Api.Tests/Configuration/StartupValidatorUnitTests.cs`

Add 3 new test methods following the existing patterns in this file (xUnit, NSubstitute, Shouldly, `CreateEnvironment()` helper):

**Test cases:**
1. `ValidateAllowedHosts_Production_WildcardAllowedHosts_Throws` — production + `"*"` → `InvalidOperationException`
2. `ValidateAllowedHosts_Production_SpecificHost_DoesNotThrow` — production + `"example.com"` → no exception
3. `ValidateAllowedHosts_Development_WildcardAllowedHosts_DoesNotThrow` — development + `"*"` → no exception (skipped in non-prod)

### Verification

1. `dotnet test --filter StartupValidator` — new tests pass
2. `dotnet test` — all server tests pass

---

> **⚠️ CRITICAL — NO-SKIP RULE**: ALL required test suites MUST RUN AND PASS after ALL implementation files complete. NO SKIPPING. NO EXCEPTIONS.
