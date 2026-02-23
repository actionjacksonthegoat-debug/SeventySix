---
agent: agent
description: Execute all remaining phases in Implementation.md
---

# Execute Implementation Plan

Proceed through **all remaining phases** across all `implementation-N.md` files listed in the `Implementation.md` orchestrator, following every project rule. Execute each implementation file completely before moving to the next. A mandatory security review (OWASP/PII/Auth) runs after all implementation phases complete and before the final test gate. Final validation (all required test suites) runs ONLY after the security review passes.

## MCP Tools

- Use **context7** to verify up-to-date API usage for .NET, Angular, Wolverine, EF Core, TanStack Query
- Use **postgresql** to inspect existing schema when touching data-layer code
- Use **github** for PR context if needed

## Rules

1. **Read** `Implementation.md` (orchestrator) and ALL `implementation-N.md` files listed in it, plus all `.github/instructions/*.instructions.md` files before starting
2. Follow **KISS, DRY, YAGNI** — simplest solution, no duplication, no speculative features
3. Follow **TDD 80/20** — tests on the 20% of code carrying 80% of risk
4. Fix all IDE warnings — never suppress with `#pragma warning disable`, `// @ts-ignore`, or `[SuppressMessage]`
5. **Do NOT send commits** — I will handle these
6. **Do NOT run** `npm run db:reset`, `db:reset`, or any `reset-database` command

## [CRITICAL] Security Review Gate — Runs Before Final Tests

After completing ALL implementation phases but BEFORE running the final test gate:

1. **Execute the `/security-review` prompt** — perform a full OWASP/PII/Auth security audit
2. **Fix ALL Critical and High findings** — these block release
3. **Document Medium findings** as GitHub issues if not fixable immediately
4. **Run `npm run format`** after any security fixes

This security review is NON-NEGOTIABLE. The codebase must be verified clean of:
- Hardcoded secrets, API keys, passwords, connection strings
- PII exposure (developer names, emails, machine paths)
- OWASP Top 10 vulnerabilities
- Authentication/authorization bypasses
- Sensitive data in logs or error responses

Only after the security review passes with zero Critical/High findings do you proceed to the test gate.

## [CRITICAL] Completion Gate — all required test suites, no exceptions

After the security review passes, run all required test suites and confirm they pass:

| Suite        | Command              | Must See                            |
| ------------ | -------------------- | ----------------------------------- |
| Server       | `dotnet test`        | `Test summary: total: X, failed: 0` |
| Client       | `npm test`           | `X passed (X)`                      |
| E2E          | `npm run test:e2e`   | `[PASS] All E2E tests passed!`      |
| Load (quick) | `npm run loadtest:quick` | All scenarios pass thresholds   |

**All required test suites MUST RUN AND PASS. NO SKIPPING. NO EXCEPTIONS. REGARDLESS OF TIME NEEDED OR CURRENT STATE OF THE CODE.**
- E2E and load tests CAN run in parallel to save time
- If infrastructure is not running, **start it** — do not skip the suite
- Never claim "done" without running and passing all required test suites
- Use `--keepalive` for iterative E2E debugging: `npm run test:e2e -- --keepalive`
- E2E and load tests run in **fully isolated Docker environments** — no dev environment needed
