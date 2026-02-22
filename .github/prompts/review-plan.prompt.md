---
agent: agent
description: Review an Implementation.md plan against all project rules
---

# Review Implementation Plan

Read `Implementation.md` (orchestrator) and ALL `implementation-N.md` files listed in it. Validate the complete plan against every project rule and convention.

## MCP Tools

- Use **context7** to verify any referenced library APIs are current and correct

## Validation Checklist

1. **Read** `Implementation.md` and all `implementation-N.md` files fully — understand every phase across all files
2. **Cross-reference** `.github/copilot-instructions.md` and every file in `.github/instructions/` — flag anything the plan misses or contradicts
3. **Principles**: Confirm KISS, DRY, YAGNI are followed — no duplication, no speculative features
4. **TDD 80/20**: Verify testing strategy focuses on the 20% of code carrying 80% of risk
5. **Naming & formatting**: Check proposed names, structure, and patterns match the instruction files
6. **Architecture**: Server dependencies flow `Shared ← Domains ← Api` (never reverse). Client domains import only `@shared/*` + themselves
7. **Final phase MUST run all required test suites — NO SKIPPING, NO EXCEPTIONS, REGARDLESS OF TIME NEEDED**:
    - `dotnet test` → `Test summary: total: X, failed: 0`
    - `npm test` → `X passed (X)`
    - `npm run test:e2e` → `[PASS] All E2E tests passed!`
    - `npm run loadtest:quick` → All scenarios pass thresholds
    - E2E and load tests CAN run in parallel to save time
    - If infrastructure is not running, **start it** — do not skip the suite

## Output

Report and update all reviewed plans with:

- **Violations** found (with file name, phase number, and specific issue)
- **Missing coverage** (rules/patterns not addressed by the plan)
- **Suggestions** for improvement — add to plans unless it truly violates YAGNI

Confirm CRITICAL no-skip rule appears at TOP and BOTTOM of every `implementation-N.md` file AND the orchestrator.

Overall **pass/fail** assessment.

## Plan Update Requirements (CRITICAL)

> **RULE**: This review is NOT complete until all implementation plans are updated with the findings.

1. **Every violation** must have a fix incorporated into the relevant `implementation-N.md` phase
2. **Every missing coverage item** must be added as a new phase or step in the appropriate plan file
3. **Suggestions** are added to plans unless explicitly rejected as YAGNI
4. **Re-read updated plans** after modifications to verify no new conflicts were introduced
5. **Do NOT** call this prompt complete if any violation or gap remains unaddressed in the plan files
