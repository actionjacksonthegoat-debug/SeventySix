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
2. Add an explicit phase checkpoint step that links #file:../copilot-instructions.md before the start of **every** phase
3. Add an explicit resume checkpoint step: after **every compaction**, re-read #file:../copilot-instructions.md before continuing. Insert compaction checkpoints at major domain/technology boundaries (e.g., between server and client phases, between unrelated feature areas). Each compaction checkpoint: compact → re-read copilot-instructions.md → re-read relevant instruction files for next phase → continue.
4. Follow the existing `Implementation.md` structure: Executive Summary → numbered Phases → Appendices
5. Each phase must have clear **deliverables** and **verification steps**
6. Follow **KISS, DRY, YAGNI** — no speculative features, no duplication
7. Include a **TDD-First 80/20** testing strategy — write tests BEFORE implementation for the 20% of code carrying 80% of risk (Red → Green → Refactor). Each phase that adds new code MUST list test deliverables before implementation code.
8. Architecture: server `Shared ← Domains ← Api` (never reverse), client domains import only `@shared/*` + themselves
9. Add a mandatory runtime/browser verification gate before completion for client-impacting work:
    - Run `npm run stop` then `npm run start`
    - Verify visual/interaction changes using Chrome DevTools MCP browser before calling work complete
10. **Phase-level verification**: Intermediate phases should build and run unit tests for changed code (`dotnet build`, `ng build`, relevant unit tests). Do NOT run E2E or load tests mid-phase.
11. **Final phase MUST run all required test suites — NO SKIPPING, NO EXCEPTIONS, REGARDLESS OF TIME NEEDED**:
    - `dotnet test` → `Test summary: total: X, failed: 0`
    - `npm test` → `X passed (X)`
    - `npm run test:e2e` → `[PASS] All E2E tests passed!`
    - `npm run loadtest:quick` → All scenarios pass thresholds
    - E2E and load tests CAN run in parallel to save time
    - If infrastructure is not running, **start it** — do not skip the suite
    - Use `--keepalive` for iterative E2E debugging: `npm run test:e2e -- --keepalive`
    - E2E and load tests run in **fully isolated Docker environments** — no dev environment needed

## Optional: Pre-Plan Codebase Review

If the work touches a broad area of the codebase (refactors, cross-domain features, migrations), consider running `/review-solution` first to understand the current state before drafting the plan. This surfaces hidden dead code, structural misalignment, and outdated patterns that should be addressed in the plan.

## Output

Split the plan into focused, completable files:

- **`Implementation.md`** — Orchestrator that lists all `implementation-N.md` files, tracks their status, and contains the final validation gate (all required test suites). Include an Executive Summary with problem, goal, and key constraints. The CRITICAL no-skip rule MUST appear at both the TOP and BOTTOM.
- **Instruction checkpoints** — Every phase in orchestrator and `implementation-N.md` files must start with a checkpoint that links #file:../copilot-instructions.md and also include a post-compaction checkpoint rule.
- **Security review gate** — The orchestrator MUST include a security review step (invoke `/security-review`) between the final implementation file and the test gate. This is mandatory for all plans.
- **Runtime/browser gate** — The orchestrator MUST include `npm run stop` -> `npm run start` and Chrome DevTools MCP visual verification before completion sign-off.
- **`implementation-1.md`, `implementation-2.md`, etc.** — Each covers one logical unit of work with numbered phases, substeps, file paths, and code patterns. Each file MUST have the CRITICAL no-skip rule at both TOP and BOTTOM.
- **Appendices** go in the orchestrator for file inventories and checklists
- **Final validation** (all required test suites + documentation check) lives ONLY in the orchestrator — it runs after ALL implementation files complete
