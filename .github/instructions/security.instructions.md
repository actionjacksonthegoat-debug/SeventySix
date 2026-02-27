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

Use the CI-equivalent Docker variants — these produce results identical to GitHub Actions:

```bash
npm run scan:codeql:ci            # TypeScript then C# (sequential, ~25 min total)
npm run scan:codeql:ci:csharp    # C# only (~15-20 min)
npm run scan:codeql:ci:typescript # TypeScript only (~5 min)
```

Results written to `.codeql/results/`. Open with Command Palette →
**CodeQL: Open SARIF File** to view results inline in VS Code.

### CodeQL Alert Dismissal

**Do NOT use `// codeql[rule-id]` inline suppression comments** — they do not reliably suppress
taint-tracking alerts in C# or JS. Instead, dismiss false-positive alerts directly in the
GitHub Security tab (`Security → Code scanning → Dismiss alert → False positive`).
Dismissals persist across future scans and do not require code changes.

## PII Masking in Structured Logs (CRITICAL)

> **RULE**: Personal Identifiable Information (PII) and user-controlled strings MUST NEVER
> appear verbatim in structured log parameters. Use `LogSanitizer` for all log arguments
> that could contain user data.

| Input Type | Method | Output Example |
|---|---|---|
| User-controlled string (provider name, raw input) | `LogSanitizer.Sanitize(value)` | `"github"` → `"github"` (stripped of newlines/CR) |
| Email address | `LogSanitizer.MaskEmail(email)` | `"user@example.com"` → `"u***@example.com"` |
| Username | `LogSanitizer.MaskUsername(username)` | `"johnsmith"` → `"jo***"` |
| Email subject | `LogSanitizer.MaskEmailSubject(subject)` | `"Password Reset"` → `"password-reset"` |

```csharp
// [NEVER] — logs PII directly
logger.LogWarning("OAuth failed for {Provider}. Error: {Error}", provider, result.Error);
logger.LogWarning("Email sent to {To}: {Subject}", to, subject);
logger.LogWarning("Registration attempt with {Email}", email);

// [ALWAYS] — mask with LogSanitizer
using SeventySix.Shared.Utilities;

logger.LogWarning(
    "OAuth failed for {Provider}. Error: {Error}",
    LogSanitizer.Sanitize(provider),
    LogSanitizer.Sanitize(result.Error));
logger.LogWarning(
    "Email sent to {To}: {Subject}",
    LogSanitizer.MaskEmail(to),
    LogSanitizer.MaskEmailSubject(subject));
logger.LogWarning(
    "Registration attempt with {Email}",
    LogSanitizer.MaskEmail(email));
```

`LogSanitizer` lives in `SeventySix.Shared.Utilities` — available to all server projects.

## Open Redirect Validation

OAuth redirects MUST be validated against the configured authorization endpoint host before
issuing a `Redirect()` response. Use `OAuthRedirectValidator.GetValidatedUri` (returns `Uri?`)
so the value passed to `Redirect()` comes from a parsed `Uri` object — not the raw user-supplied
string — breaking CodeQL taint chains (`cs/web/unvalidated-url-redirection`).

```csharp
// [ALWAYS] — validate and redirect via the parsed Uri, never via the raw string
Uri? validatedAuthUri =
    OAuthRedirectValidator.GetValidatedUri(authorizationUrl, providerSettings);

if (validatedAuthUri is null)
{
    Logger.LogWarning(
        "OAuth authorization URL failed host validation for provider {Provider}",
        LogSanitizer.Sanitize(provider));
    return BadRequest(new ProblemDetails { ... });
}

return Redirect(validatedAuthUri.AbsoluteUri); // AbsoluteUri, not the raw input string

// OAuthRedirectValidator in SeventySix.Api/Infrastructure/ — compare URI hosts, not string contains
public static Uri? GetValidatedUri(string url, OAuthProviderSettings providerSettings)
{
    if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? redirectUri)) return null;
    if (!Uri.TryCreate(providerSettings.AuthorizationEndpoint, UriKind.Absolute, out Uri? allowedUri)) return null;
    return string.Equals(redirectUri.Host, allowedUri!.Host, StringComparison.OrdinalIgnoreCase)
        ? redirectUri
        : null;
}
```

**NEVER** use `string.Contains("github.com")` — always parse the URI and compare `.Host`.
**NEVER** call `Redirect(rawStringVariable)` — always call `Redirect(parsedUri.AbsoluteUri)`.

For HTTPS redirection middleware, return a config-sourced host from the allowlist validation
helper (`GetAllowedHost`) rather than a `bool`. Then build the redirect URL via `UriBuilder`
using that config-sourced value to break the taint chain from the `Host` header.

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

