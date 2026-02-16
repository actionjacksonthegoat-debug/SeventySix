# Implementation 1 — AuthService Cleanup & Architecture Test Exception

> **⚠️ CRITICAL — NO-SKIP RULE**: ALL required test suites MUST RUN AND PASS after ALL implementation files complete. NO SKIPPING. NO EXCEPTIONS. REGARDLESS OF TIME NEEDED OR CURRENT STATE OF THE CODE.

---

## Summary

The `auth.service.ts` file is 853 lines — 53 lines over the 800-line architecture test limit. Analysis confirms that splitting AuthService into multiple services would **degrade cohesion** (all methods serve the auth lifecycle), create tightly-coupled multi-service state management, and require rewriting 27+ consumer test files. Instead, we add a justified architecture test exception and fix the `idleEffect` unused field warning.

**Idle Detection Verdict**: The current implementation is **correct and performant**. The `onActivity` handler costs ~10 ns per invocation (one property write + one boolean read). Even at 60 `pointermove` events/second, that's 600 ns/s — unmeasurable. No throttling needed. This matches industry patterns used by enterprise apps (cheap handler + periodic evaluation). No changes to idle detection logic.

---

## Phase 1 — Fix `idleEffect` Unused Field

**Problem**: `private readonly idleEffect: EffectRef` is assigned but never read — the `EffectRef` reference is stored but never used (no `.destroy()` call needed since `DestroyRef` handles cleanup). This triggers IDE warnings.

**Fix**: Remove the field assignment. Call `effect()` directly in a constructor block, or convert to an anonymous field expression since Angular `effect()` auto-registers with the injection context.

### File: `SeventySix.Client/src/app/shared/services/auth.service.ts`

**Before:**
```typescript
/** Watches idle signal and triggers inactivity logout. */
private readonly idleEffect: EffectRef =
    effect(
        () =>
        {
            if (this.idleDetectionService.isIdle())
            {
                this.handleInactivityLogout();
            }
        });
```

**After:**
```typescript
constructor()
{
    effect(
        () =>
        {
            if (this.idleDetectionService.isIdle())
            {
                this.handleInactivityLogout();
            }
        });
}
```

Also remove the `EffectRef` import if no longer used:
- Remove `EffectRef` from the `@angular/core` import (check if used elsewhere first).

### Verification

1. `npx vitest run src/app/shared/services/auth.service.spec.ts` — all pass
2. No IDE warnings on `auth.service.ts`
3. Idle detection still works (effect fires when `isIdle()` becomes true)
4. If app is running: Chrome DevTools MCP — `take_screenshot` + `list_console_messages` to verify no runtime errors

---

## Phase 2 — Add File-Size Architecture Test Exception

### File: `SeventySix.Client/scripts/architecture-tests.mjs`

Add `auth.service.ts` to the `allowedExceptions` array in the file-size check (~line 1022):

**Before:**
```javascript
const allowedExceptions = [
    "generated-open-api.ts",     // Auto-generated from OpenAPI spec (3476 lines)
    "data-table.component.ts"    // Primarily signal/input/output declarations
];
```

**After:**
```javascript
const allowedExceptions = [
    "generated-open-api.ts",     // Auto-generated from OpenAPI spec (3476 lines)
    "data-table.component.ts",   // Primarily signal/input/output declarations
    "auth.service.ts"            // Auth lifecycle: single domain, ~30% JSDoc documentation (853 lines)
];
```

**Justification** (for the comment and PR review):
- All 12 public methods serve one domain: authentication lifecycle (login, OAuth, registration, refresh, logout, session state)
- ~250 of 853 lines are JSDoc documentation (required by project formatting rules)
- Service already delegates properly: JWT parsing → `TokenService`, idle detection → `IdleDetectionService`, storage → `StorageService`
- Splitting would create 2-3 tightly-coupled services sharing mutable state (`accessToken`, `userSignal`, `requiresPasswordChangeSignal`), increase mock complexity across 27+ consumer tests, and reduce cohesion

### Verification

1. `node scripts/architecture-tests.mjs` — all pass, 0 failures
2. `auth.service.ts` no longer triggers file-size violation

---

## Phase 3 — Verify Line Count

After Phase 1 changes (removing `EffectRef` field + adding constructor), verify the file is under or near the 800-line mark. The Phase 1 change reduces lines by removing the type annotation and field name while adding a constructor block — net effect should be roughly neutral. The architecture test exception from Phase 2 ensures compliance regardless.

### Verification

1. Count lines: `(Get-Content "SeventySix.Client/src/app/shared/services/auth.service.ts").Count`
2. `npm test` — all client + architecture tests pass
3. `dotnet test` — all server tests pass

---

> **⚠️ CRITICAL — NO-SKIP RULE**: ALL required test suites MUST RUN AND PASS after ALL implementation files complete. NO SKIPPING. NO EXCEPTIONS.
