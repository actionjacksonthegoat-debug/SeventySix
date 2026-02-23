---
description: Secure exception handling, ProblemDetails, and auth error patterns
applyTo: "**/SeventySix.Client/src/**/*.ts,**/SeventySix.Server/**/*.cs"
---

# Security Patterns

## Exception Handling = Secure ProblemDetails (CRITICAL)

> **RULE**: API responses MUST NEVER expose raw `exception.Message` in `ProblemDetails.Detail`.
> Raw exception text (parameter names, stack traces, SQL, connection strings) is **Internal Only** — logged server-side, never returned to clients.

| [NEVER] (in ProblemDetails.Detail)      | [ALWAYS]                                                  |
| --------------------------------------- | --------------------------------------------------------- |
| `Detail = exception.Message`            | `Detail = ProblemDetailConstants.Details.BadRequest`      |
| `Detail = argumentException.Message`    | `Detail = ProblemDetailConstants.Details.*` constant      |
| `Detail = keyNotFoundException.Message` | Log raw message via `ILogger`, return safe constant       |
| Raw .NET runtime text in API response   | Curated human-readable text from `ProblemDetailConstants` |

## Message Classification

| Classification        | Rule                                                                  | Example                                        |
| --------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| **Public Safe**       | Display directly; hardcoded or constant-sourced                       | `"User already has this role."`                |
| **Public Actionable** | Display directly; curated `AuthResult.Error` + `errorCode`            | `"Invalid or expired token"` + `INVALID_TOKEN` |
| **Internal Only**     | NEVER display; replace with `ProblemDetailConstants`; log server-side | `exception.Message`, stack traces, SQL errors  |

## Server Pattern

```csharp
// Log the raw details for diagnostics
logger.LogWarning(exception, "Operation failed: {Error}", exception.Message);

// Return safe constant to client
return BadRequest(
	new ProblemDetails
	{
		Detail = ProblemDetailConstants.Details.BadRequest,
	});
```

| [NEVER]                         | [ALWAYS]                                            |
| ------------------------------- | --------------------------------------------------- |
| `throw new Exception("...")`    | Use built-in .NET exceptions or `Result<T>` pattern |
| Catch-all swallowing exceptions | Re-throw or log with `ILogger`                      |

## Client Error Handling Pattern

- Display `detail` from 4xx responses (curated after server hardening)
- NEVER display `detail` from 5xx responses
- URL and HTTP status line go to `diagnosticDetails` (copy-only), never shown in toast
- Auth errors use `mapAuthError()` with explicit switch cases — default returns generic message, never passes through `error.error?.detail`

```typescript
// [CORRECT] Auth error mapping — explicit switch, never pass-through
function mapAuthError(errorCode: string): string {
	switch (errorCode) {
		case "INVALID_TOKEN":
			return "Your session has expired. Please sign in again.";
		case "ACCOUNT_LOCKED":
			return "Account locked. Contact support.";
		default:
			return "An authentication error occurred.";
	}
}
```

## Chrome DevTools Security Verification (REQUIRED)

After auth/security changes, verify via Chrome DevTools MCP `list_network_requests` to check headers, cookies, CORS — see `copilot-instructions.md` Chrome DevTools section.

## CodeQL Local Scanning

> Run before every push to catch security issues before CI.

```powershell
# Full scan (C# + TypeScript)
npm run scan:codeql

# C# only
npm run scan:codeql:cs

# TypeScript only
npm run scan:codeql:ts
```

Results open in VS Code via `github.vscode-codeql`. Use Command Palette →
**CodeQL: Open SARIF File** to view results inline.

## Cookie Consent Security Patterns

```typescript
// [ALWAYS] — check consent before activating optional tracking
export class AnalyticsService
{
    private readonly consentService = inject(CookieConsentService);

    initialize(): void
    {
        // Only initialize analytics AFTER analytics consent is granted
        if (this.consentService.hasAnalytics())
        {
            // initialize analytics SDK here
        }
    }
}
```

**Rules:**
- NEVER set non-essential cookies before consent is granted
- Consent cookie (`seventysix_consent`) itself is essential (stores the choice)
- Auth cookies (session, CSRF) are essential — no consent needed
- Re-check consent on every app initialization, not just on first load

## URL Redirect Security (CodeQL: js/client-side-unvalidated-url-redirect)

Session storage and local storage are **CodeQL-tainted sources**. Any URL read from
storage must be re-validated at the point of navigation even if validated before storing.

```typescript
// [NEVER] — reads tainted value directly into router
const returnUrl = sessionStorage.getItem("returnUrl") ?? "/";
this.router.navigateByUrl(returnUrl); // CodeQL alert

// [ALWAYS] — sanitize at point of use with shared utility
import { sanitizeReturnUrl } from "@shared/utilities/url.utility";
const stored = sessionStorage.getItem("returnUrl") ?? "/";
this.router.navigateByUrl(sanitizeReturnUrl(stored));
```

