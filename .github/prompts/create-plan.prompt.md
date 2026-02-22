---
agent: agent
description: Create a new Implementation.md plan for upcoming work
---

# Create Implementation Plan

Write a new `Implementation.md` plan for the following work:

> **{DESCRIBE THE FUNCTIONALITY OR CHANGES HERE}**

## MCP Tools

- Use **context7** to verify current API patterns for any libraries involved
- Use **postgresql** to inspect existing schema if the work touches data models

## Plan Requirements

1. **Read** `.github/copilot-instructions.md` and every file in `.github/instructions/` before drafting
2. Follow the existing `Implementation.md` structure: Executive Summary → numbered Phases → Appendices
3. Each phase must have clear **deliverables** and **verification steps**
4. Follow **KISS, DRY, YAGNI** — no speculative features, no duplication
5. Include a **TDD 80/20** testing strategy — tests on the 20% of code carrying 80% of risk
6. Architecture: server `Shared ← Domains ← Api` (never reverse), client domains import only `@shared/*` + themselves
7. **Final phase MUST run all required test suites — NO SKIPPING, NO EXCEPTIONS, REGARDLESS OF TIME NEEDED**:
    - `dotnet test` → `Test summary: total: X, failed: 0`
    - `npm test` → `X passed (X)`
    - `npm run test:e2e` → `[PASS] All E2E tests passed!`
    - `npm run loadtest:quick` → All scenarios pass thresholds
    - E2E and load tests CAN run in parallel to save time
    - If infrastructure is not running, **start it** — do not skip the suite
    - Use `--keepalive` for iterative E2E debugging: `npm run test:e2e -- --keepalive`
    - E2E and load tests run in **fully isolated Docker environments** — no dev environment needed

## Output

Split the plan into focused, completable files:

- **`Implementation.md`** — Orchestrator that lists all `implementation-N.md` files, tracks their status, and contains the final validation gate (all required test suites). Include an Executive Summary with problem, goal, and key constraints. The CRITICAL no-skip rule MUST appear at both the TOP and BOTTOM.
- **`implementation-1.md`, `implementation-2.md`, etc.** — Each covers one logical unit of work with numbered phases, substeps, file paths, and code patterns. Each file MUST have the CRITICAL no-skip rule at both TOP and BOTTOM.
- **Appendices** go in the orchestrator for file inventories and checklists
- **Final validation** (all required test suites + documentation check) lives ONLY in the orchestrator — it runs after ALL implementation files complete
