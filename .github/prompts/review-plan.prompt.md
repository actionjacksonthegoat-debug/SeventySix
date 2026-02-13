---
agent: agent
description: Review an Implementation.md plan against all project rules
---

# Review Implementation Plan

Read `Implementation.md` and validate the plan against every project rule and convention.

## MCP Tools

- Use **context7** to verify any referenced library APIs are current and correct

## Validation Checklist

1. **Read** `Implementation.md` fully — understand every phase
2. **Cross-reference** `.github/copilot-instructions.md` and every file in `.github/instructions/` — flag anything the plan misses or contradicts
3. **Principles**: Confirm KISS, DRY, YAGNI are followed — no duplication, no speculative features
4. **TDD 80/20**: Verify testing strategy focuses on the 20% of code carrying 80% of risk
5. **Naming & formatting**: Check proposed names, structure, and patterns match the instruction files
6. **Architecture**: Server dependencies flow `Shared ← Domains ← Api` (never reverse). Client domains import only `@shared/*` + themselves
7. **Final phase MUST run all 3 test suites**:
    - `dotnet test` → `Test summary: total: X, failed: 0`
    - `npm test` → `X passed (X)`
    - `npm run test:e2e` → `[PASS] All E2E tests passed!`

## Output

Report:

- **Violations** found (with phase number and specific issue)
- **Missing coverage** (rules/patterns not addressed by the plan)
- **Suggestions** for improvement
- Overall **pass/fail** assessment
