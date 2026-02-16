# Implementation 3 — Magic String Constants Extraction

> **⚠️ CRITICAL — NO-SKIP RULE**: ALL required test suites MUST RUN AND PASS after ALL implementation files complete. NO SKIPPING. NO EXCEPTIONS. REGARDLESS OF TIME NEEDED OR CURRENT STATE OF THE CODE.

---

## Summary

Extract hardcoded string literals from logic code into named constants. This eliminates drift risk, improves searchability, and aligns with the project's "No Magic Values" formatting rule. Changes are organized by priority (HIGH first) and grouped by server/client.

---

## Phase 1 — Server: ProblemDetails Titles in GlobalExceptionHandler

### Problem

`GlobalExceptionHandler.MapExceptionToProblemDetails` uses 9 hardcoded title strings (e.g., `"Resource Not Found"`, `"Bad Request"`, `"Business Rule Violation"`) even though `ProblemDetailConstants.Titles` already exists with some matching entries.

### Changes

#### File: `SeventySix.Server/SeventySix.Shared/Constants/ProblemDetailConstants.cs`

**Step 1 — Fix `NotFound` constant** to match RFC 7807 convention (Title Case, no period) and align with other titles:

```csharp
// Before:
public const string NotFound = "Resource not found.";

// After:
public const string NotFound = "Not Found";
```

> **Decision**: RFC 7807 `title` is "a short, human-readable summary of the problem type." All other titles use Title Case without periods (`"Access Denied"`, `"Conflict"`, `"Too Many Requests"`). `"Not Found"` follows `HttpStatusCode.NotFound` and matches the RFC pattern. The `EntityNotFoundException` handler currently uses `"Resource Not Found"` — this now maps to the same `NotFound` constant since both convey the same RFC semantics.

**Step 2 — Add missing title constants** to the `Titles` class:

```csharp
/// <summary>Title for business rule violation errors.</summary>
public const string BusinessRuleViolation = "Business Rule Violation";

/// <summary>Title for domain logic errors.</summary>
public const string DomainError = "Domain Error";

/// <summary>Title for bad request errors.</summary>
public const string BadRequest = "Bad Request";

/// <summary>Title for unauthorized access errors.</summary>
public const string Unauthorized = "Unauthorized";

/// <summary>Title for internal server errors.</summary>
public const string InternalServerError = "Internal Server Error";

/// <summary>Title for validation errors.</summary>
public const string ValidationError = "Validation Error";
```

**Step 3 — Verify**: Search all usages of `ProblemDetailConstants.Titles.NotFound` across the codebase to ensure the value change from `"Resource not found."` to `"Not Found"` doesn't break any assertions in existing tests. Update any test assertions that check for the old value.

#### File: `SeventySix.Server/SeventySix.Api/Infrastructure/GlobalExceptionHandler.cs`

Replace all hardcoded title strings with constants:

| Current Hardcoded String | Replacement |
|---|---|
| `"Resource Not Found"` | `ProblemDetailConstants.Titles.NotFound` |
| `"Business Rule Violation"` | `ProblemDetailConstants.Titles.BusinessRuleViolation` |
| `"Domain Error"` | `ProblemDetailConstants.Titles.DomainError` |
| `"Bad Request"` (2 occurrences) | `ProblemDetailConstants.Titles.BadRequest` |
| `"Not Found"` | `ProblemDetailConstants.Titles.NotFound` |
| `"Unauthorized"` | `ProblemDetailConstants.Titles.Unauthorized` |
| `"Internal Server Error"` | `ProblemDetailConstants.Titles.InternalServerError` |
| `"Validation Error"` | `ProblemDetailConstants.Titles.ValidationError` |
| `"One or more validation errors occurred."` | `ProblemDetailConstants.Titles.ValidationFailed` |

### Verification

1. `dotnet test --filter GlobalException` — existing tests pass with constant values
2. `dotnet test` — full server test suite passes

---

## Phase 2 — Server: Endpoint Path Constants Already Exist — Use Them

### Problem

`"/health"`, `"/metrics"`, `"/openapi"`, `"/scalar"`, and `"/api/v1/health"` appear hardcoded across 3+ files, but `EndpointPathConstants.cs` in `SeventySix.Shared/Constants/` **already defines most of them**: `Health.Base`, `Health.Detailed`, `Health.Ready`, `Health.Live`, `Metrics`, `OpenApi`, `ApiV1`. The existing constants just aren't being used.

### Changes

#### File: `SeventySix.Server/SeventySix.Shared/Constants/EndpointPathConstants.cs`

Add **only** the 2 missing constants:

```csharp
/// <summary>Scalar documentation route prefix.</summary>
public const string Scalar = "/scalar";
```
(Add at class level alongside `Metrics` and `OpenApi`.)

```csharp
/// <summary>Versioned health check route prefix.</summary>
public const string Versioned = "/api/v1/health";
```
(Add inside the `Health` nested class alongside `Base`, `Detailed`, `Ready`, `Live`.)

#### Files to Update

| File | Current | Replacement |
|---|---|---|
| `SmartHttpsRedirectionMiddleware.cs` (L86) | `"/health"` | `EndpointPathConstants.Health.Base` |
| `SmartHttpsRedirectionMiddleware.cs` (L79) | `"/metrics"` | `EndpointPathConstants.Metrics` |
| `SmartHttpsRedirectionMiddleware.cs` (L94) | `"/openapi"` | `EndpointPathConstants.OpenApi` |
| `SmartHttpsRedirectionMiddleware.cs` (L94) | `"/scalar"` | `EndpointPathConstants.Scalar` |
| `RateLimitingRegistration.cs` (L218) | `"/health"` | `EndpointPathConstants.Health.Base` |
| `RateLimitingRegistration.cs` (L219) | `"/api/v1/health"` | `EndpointPathConstants.Health.Versioned` |
| `WebApplicationExtensions.cs` (L495) | `"/health/live"` | `EndpointPathConstants.Health.Live` |
| `WebApplicationExtensions.cs` (L505) | `"/health/ready"` | `EndpointPathConstants.Health.Ready` |
| `WebApplicationExtensions.cs` (L515) | `"/health"` | `EndpointPathConstants.Health.Base` |

### Verification

1. `dotnet test` — all server tests pass

---

## Phase 3 — Client: Route Paths in Login and MFA Pages

### Problem

`login.ts` and `mfa-verify.ts` use hardcoded route strings like `"/auth/mfa/verify"` and `"/auth/change-password"` instead of the existing `APP_ROUTES` constants.

### Changes

#### File: `SeventySix.Client/src/app/domains/auth/pages/login/login.ts`

```typescript
// Before:
this.router.navigate(["/auth/mfa/verify"]);
this.router.navigate(["/auth/change-password"]);

// After:
this.router.navigate([APP_ROUTES.AUTH.MFA_VERIFY]);
this.router.navigate([APP_ROUTES.AUTH.CHANGE_PASSWORD]);
```

Ensure `APP_ROUTES` is imported (may already be imported via `@shared/constants`).

#### File: `SeventySix.Client/src/app/domains/auth/pages/mfa-verify/mfa-verify.ts`

```typescript
// Before:
this.router.navigate(["/auth/change-password"]);

// After:
this.router.navigate([APP_ROUTES.AUTH.CHANGE_PASSWORD]);
```

### Verification

1. `npx vitest run` — all client tests pass
2. `node scripts/architecture-tests.mjs` — all pass
3. If app is running: Chrome DevTools MCP — `take_screenshot` + `list_console_messages` on login and MFA pages to verify no runtime errors

---

## Phase 4 — Client: Duplicate Notification Message

### Problem

`"You must change your password before continuing."` is duplicated verbatim in `login.ts` and `mfa-verify.ts`.

### Changes

#### File: `SeventySix.Client/src/app/shared/constants/error-messages.constants.ts`

Add to the existing file alongside `AUTH_ERROR_MESSAGES` (which holds error codes). This holds user-facing notification message text:

```typescript
export const AUTH_NOTIFICATION_MESSAGES = {
    PASSWORD_CHANGE_REQUIRED: "You must change your password before continuing."
} as const;
```

> Note: `AUTH_ERROR_MESSAGES.PASSWORD_CHANGE_REQUIRED` is an error **code** (`"PASSWORD_CHANGE_REQUIRED"`), not message text. `AUTH_NOTIFICATION_MESSAGES.PASSWORD_CHANGE_REQUIRED` is the user-facing **notification** message.

#### Barrel Export

If `AUTH_NOTIFICATION_MESSAGES` is not re-exported via `index.ts`, add it to the barrel in `shared/constants/index.ts`.

#### Files to Update

| File | Replace | With |
|---|---|---|
| `login.ts` | `"You must change your password before continuing."` | `AUTH_NOTIFICATION_MESSAGES.PASSWORD_CHANGE_REQUIRED` |
| `mfa-verify.ts` | `"You must change your password before continuing."` | `AUTH_NOTIFICATION_MESSAGES.PASSWORD_CHANGE_REQUIRED` |

### Verification

1. `npx vitest run` — all client tests pass

---

## Phase 5 — Server: `"text/html"` Content Type Constant

### Problem

`"text/html"` appears twice in `AuthControllerBase.cs`. `MediaTypeConstants.cs` in `Shared/Constants/` already defines `Json`, `Xml`, `FormUrlEncoded`, `MultipartFormData` — missing `TextHtml`.

### Changes

#### File: `SeventySix.Server/SeventySix.Shared/Constants/MediaTypeConstants.cs`

Add the missing constant to the existing class:

```csharp
/// <summary>HTML content type (text/html).</summary>
public const string TextHtml = "text/html";
```

#### File: `SeventySix.Server/SeventySix.Api/Controllers/V1/AuthControllerBase.cs`

Replace both occurrences:

```csharp
// Before:
return Content(html, "text/html");

// After:
return Content(html, MediaTypeConstants.TextHtml);
```

### Verification

1. `dotnet test` — all server tests pass

---

## Phase 6 — Verification

1. `dotnet test` — all server tests pass
2. `npm test` — all client + architecture tests pass
3. No new magic strings in changed files

---

> **⚠️ CRITICAL — NO-SKIP RULE**: ALL required test suites MUST RUN AND PASS after ALL implementation files complete. NO SKIPPING. NO EXCEPTIONS.
