---
agent: agent
description: Execute all remaining phases in Implementation.md
---

# Execute Implementation Plan

Proceed through **all remaining phases** across all `implementation-N.md` files listed in the `Implementation.md` orchestrator, following every project rule. Execute each implementation file completely before moving to the next. Final validation (all required test suites) runs ONLY after all implementation files are complete.

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

## [CRITICAL] Completion Gate — all required test suites, no exceptions

After the final phase, run all required test suites and confirm they pass:

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
