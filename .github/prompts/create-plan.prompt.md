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
7. **Final phase MUST run all 3 test suites**:
    - `dotnet test` → `Test summary: total: X, failed: 0`
    - `npm test` → `X passed (X)`
    - `npm run test:e2e` → `[PASS] All E2E tests passed!`

## Output

Write the complete plan to `Implementation.md` (overwrite if existing). Include:

- **Executive Summary** with problem, goal, and key constraints
- **Numbered phases** with substeps, file paths, and code patterns
- **Appendices** for file inventories and checklists where helpful
