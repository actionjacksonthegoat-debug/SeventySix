---
agent: agent
description: Execute all remaining phases in Implementation.md
---

# Execute Implementation Plan

Proceed through **all remaining phases** in `Implementation.md`, following every project rule.

## MCP Tools

- Use **context7** to verify up-to-date API usage for .NET, Angular, Wolverine, EF Core, TanStack Query
- Use **postgresql** to inspect existing schema when touching data-layer code
- Use **github** for PR context if needed

## Rules

1. **Read** `Implementation.md` and all `.github/instructions/*.instructions.md` files before starting
2. Follow **KISS, DRY, YAGNI** — simplest solution, no duplication, no speculative features
3. Follow **TDD 80/20** — tests on the 20% of code carrying 80% of risk
4. Fix all IDE warnings — never suppress with `#pragma warning disable`, `// @ts-ignore`, or `[SuppressMessage]`
5. **Do NOT send commits** — I will handle these
6. **Do NOT run** `npm run db:reset`, `db:reset`, or any `reset-database` command

## Completion Gate

After the final phase, run ALL 3 test suites and confirm they pass:

| Suite  | Command            | Must See                            |
| ------ | ------------------ | ----------------------------------- |
| Server | `dotnet test`      | `Test summary: total: X, failed: 0` |
| Client | `npm test`         | `X passed (X)`                      |
| E2E    | `npm run test:e2e` | `[PASS] All E2E tests passed!`      |

**Never claim "done" without running all suites.**
