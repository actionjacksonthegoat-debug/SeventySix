# Implementation Plan — Post-Hardening Cleanup: AuthService, Startup Security, Magic Strings

> **⚠️ CRITICAL — NO-SKIP RULE**: ALL required test suites MUST RUN AND PASS after ALL implementation files complete. NO SKIPPING. NO EXCEPTIONS. REGARDLESS OF TIME NEEDED OR CURRENT STATE OF THE CODE. If infrastructure is not running, **start it** — do not skip the suite. Saying "tests will pass when infrastructure is running" is **NOT acceptable**.

---

## Executive Summary

### Problem

After completing the production hardening phase (DateTime migration, session management, security hardening), several cleanup items remain:

1. **AuthService size violation** — At 853 lines, `auth.service.ts` exceeds the 800-line architecture test limit. Analysis confirms splitting would degrade cohesion (all methods serve one domain: auth lifecycle) and create tightly-coupled multi-service state management affecting 27+ consumer test files. The correct fix is a justified architecture test exception plus removing the `idleEffect` unused field warning.

2. **Idle detection review** — Detailed performance analysis confirms the current implementation is correct. The `onActivity` handler costs ~10 ns per invocation (one property write + one boolean read). Even at 60 `pointermove` events/second, total cost is 600 ns/s — unmeasurable. The "cheap handler + periodic evaluation" pattern matches industry best practices. **No changes needed to idle detection logic.**

3. **`Program.cs` clutter** — The `AllowedHosts` validation is inline in `Program.cs` instead of using the existing `StartupValidator` pattern.

4. **Magic strings in logic code** — 12 HIGH-priority and 12 MEDIUM-priority hardcoded string literals in logic code that should be constants. Key items: ProblemDetails titles in `GlobalExceptionHandler` (7 strings), `"/health"` path in 5 locations, route paths in `login.ts`/`mfa-verify.ts` not using `APP_ROUTES`, duplicate notification message.

5. **Development SameSite mismatch** — Development uses `SameSite=Lax` while Production uses `SameSite=Strict`. Since Angular's `proxy.conf.json` makes all dev requests same-origin, Development can and should match Production. E2E/Load Test environments must keep `Lax` (truly cross-origin).

### Goal

Clean, production-aligned codebase with no architecture test violations, no IDE warnings, minimal magic strings in logic code, and development security settings that closely match production.

### Key Constraints

- Architecture: Server `Shared ← Domains ← Api` (never reverse), Client domains import only `@shared/*` + themselves
- KISS, DRY, YAGNI — no speculative features, no duplication
- TDD 80/20 — tests on the 20% of code carrying 80% of risk
- Cross-platform: Windows + Linux (CI on `ubuntu-latest`)
- Existing test suites must remain green throughout

---

## Research Findings

### Idle Detection — No Action Needed

| Concern | Finding |
|---------|---------|
| `pointermove` event storm | Modern browsers coalesce to ~60 Hz. Handler cost: ~10 ns (1 write + 1 read). Total: 600 ns/s. Unmeasurable. |
| Throttling needed? | No. Throttle mechanism itself (`Date.now()` + comparison) costs more than the handler it would guard. |
| Industry comparison | Matches enterprise pattern: cheap handler + periodic evaluation. Auth0/Okta's `setTimeout` reset pattern is actually MORE expensive per-event. |
| W3C `IdleDetector` API | Chrome-only, requires permission prompt. Not viable for cross-browser business app. |
| Mobile/battery impact | `{ passive: true }` on all 5 listeners. `visibilitychange` handles tab-away. 15s check interval is battery-friendly. |

### AuthService Split — Not Recommended

| Concern | Finding |
|---------|---------|
| Core state | `accessToken`, `userSignal`, `requiresPasswordChangeSignal` — written by 5+ flows, read by guards/interceptors. Deeply intertwined. |
| Split candidates | Password reset (30 lines, stateless) — too small to justify new file + test file. OAuth (4 methods) — calls private state setters. Registration — `completeRegistration` touches private state. |
| State split (AuthStateService) | Creates circular dance: AuthService writes → AuthStateService stores → consumers read both. Mock complexity doubles. |
| Test impact | 738-line spec, 88-line mock, 27 consumer test files would need updating for any state split. |
| Recommendation | Add file-size exception. ~30% of lines are JSDoc documentation. Service already delegates: JWT → `TokenService`, idle → `IdleDetectionService`, storage → `StorageService`. |

### Development SameSite — Safe to Align

| Environment | Current | Recommended | Reason |
|-------------|---------|-------------|--------|
| Development | `Lax` | **`Strict`** | Proxy makes all requests same-origin |
| E2E | `Lax` | `Lax` (keep) | Client/API on different ports |
| Load Test | `Lax` | `Lax` (keep) | Same cross-origin architecture |
| Test | `Strict` | `Strict` (keep) | Already matches production |
| Production | `Strict` | `Strict` (keep) | Correct |

---

## Implementation Files

| # | File | Scope | Status |
|---|------|-------|--------|
| 1 | [implementation-1.md](implementation-1.md) | AuthService Cleanup & Architecture Test Exception | ⬜ Not Started |
| 2 | [implementation-2.md](implementation-2.md) | Startup Security Alignment (AllowedHosts + SameSite) | ⬜ Not Started |
| 3 | [implementation-3.md](implementation-3.md) | Magic String Constants Extraction | ⬜ Not Started |

### Execution Order

Files are independent and can be executed in any order. Recommended: 1 → 2 → 3 (smallest to largest).

---

## Final Validation Gate

> This section runs ONLY after ALL implementation files (1-3) are complete.

### Required Test Suites

| Suite | Command | Must See |
|-------|---------|----------|
| Server | `dotnet test` | `Test summary: total: X, failed: 0` |
| Client | `npm test` | `X passed (X)` |
| E2E | `npm run test:e2e` | `[PASS] All E2E tests passed!` |
| Load (quick) | `npm run loadtest:quick` | All scenarios pass thresholds |

> E2E and load tests CAN run in parallel to save time.

### Verification Steps

1. Run `npm run format` — no formatting errors
2. Run `dotnet test` from `SeventySix.Server/` — all pass, 0 failed
3. Run `npm test` from root — all pass
4. Run `npm run test:e2e` — all pass
5. Run `npm run loadtest:quick` — all scenarios pass
6. Verify all `.github/instructions/*.instructions.md` reflect current patterns
7. Verify all `.github/prompts/*.prompt.md` reference current file locations
8. Verify READMEs match implementation

### Documentation Check

After all tests pass, confirm:
- [ ] `csharp.instructions.md` — no stale references
- [ ] `angular.instructions.md` — no stale references
- [ ] `security.instructions.md` — no stale references
- [ ] `formatting.instructions.md` — "No Magic Values" pattern current

---

## Appendix A — Magic String Inventory

### HIGH Priority (Fix in implementation-3)

| Category | Count | Files |
|----------|-------|-------|
| ProblemDetails titles | 7 | `GlobalExceptionHandler.cs` |
| Health path `"/health"` etc. | 8 | `SmartHttpsRedirectionMiddleware.cs`, `RateLimitingRegistration.cs`, `WebApplicationExtensions.cs` (use existing `EndpointPathConstants` + add 2 missing) |
| Route paths | 3 | `login.ts`, `mfa-verify.ts` |
| Duplicate notification message | 2 | `login.ts`, `mfa-verify.ts` |
| `"text/html"` content type | 2 | `AuthControllerBase.cs` |

### MEDIUM Priority (Deferred — acceptable in context)

| Category | Count | Files | Reason to Defer |
|----------|-------|-------|-----------------|
| `"true"` string values (3x) | 3 | `auth.service.ts` | Session marker — `StorageService` stores strings; extracting adds complexity for no safety gain |
| `"oauth_success"` event | 1 | `auth.service.ts` | Shared with server inline HTML — constant can't be shared across client/server |
| DOM event names | 4 | `idle-detection.service.ts`, `auth.service.ts` | Standard DOM API strings — extracting reduces readability |
| Log level check | 1 | `logging.interceptor.ts` | Single usage, clear in context |
| Security header values | 4 | `AttributeBasedSecurityHeadersMiddleware.cs` | Single usage, well-documented |
| Claims error messages | 2 | `ClaimsPrincipalExtensions.cs` | Internal exception messages, single usage |

---

## Appendix B — Checklist

- [ ] implementation-1.md complete (AuthService cleanup)
- [ ] implementation-2.md complete (Startup security alignment)
- [ ] implementation-3.md complete (Magic string constants)
- [ ] All server tests pass (`dotnet test`)
- [ ] All client tests pass (`npm test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Load tests pass (`npm run loadtest:quick`)
- [ ] Documentation updated
- [ ] No IDE warnings (except EF migrations, generated clients)
- [ ] `npm run format` clean

---

> **⚠️ CRITICAL — NO-SKIP RULE**: ALL required test suites MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS. REGARDLESS OF TIME NEEDED OR CURRENT STATE OF THE CODE. If infrastructure is not running, START IT — do not skip the suite.
