---
agent: agent
description: Deep review of entire codebase against all rules and best practices
---

# Review Solution

Perform a comprehensive review of the entire codebase against every rule in `.github/instructions/` and industry best practices.

## MCP Tools

Before reporting ANY violation or outdated API usage, use **context7** to verify the CURRENT recommended pattern. Do not rely on training data — always look up the authoritative docs first.

| Stage | Required Context7 Queries |
|-------|--------------------------|
| Stage 1 (Rules Compliance) | Angular 21 signals, TanStack Query v5, Wolverine CQRS, EF Core 10, FusionCache, FluentValidation, Playwright latest, k6 options |
| Stage 2 (Security) | .NET 10 auth middleware, ASP.NET Core data protection, OWASP .NET checklists |
| Stage 3 (Dead Code) | Angular standalone components barrel exports, .NET trimming attributes |
| Stage 4 (Consistency) | Any pattern you are unsure about before flagging |

**Use the MCP servers in every stage:**
- **context7** — look up CURRENT API patterns before flagging any usage as incorrect
- **postgresql** to inspect schema for data model alignment
- **github** to check for any open issues or PR comments
- **chrome-devtools** to verify deployed behavior matches expected patterns

## Review Stages

### Stage 1: Rules Compliance Scan

Read EVERY file in `.github/instructions/` and scan the ENTIRE codebase for violations:
- **formatting.instructions.md** — variable naming, code structure, null coercion, constants, return types
- **angular.instructions.md** — DI patterns, domain boundaries, service scoping, signals, TanStack Query
- **csharp.instructions.md** — type usage, constructors, collections, async patterns, EF Core
- **security.instructions.md** — ProblemDetails, exception messages, auth error handling
- **accessibility.instructions.md** — WCAG AA, aria labels, icons, live regions
- **testing-server.instructions.md** — test structure, mocking, builders, time-based testing
- **testing-client.instructions.md** — Vitest, zoneless, provider helpers, mock factories
- **e2e.instructions.md** — import rules, anti-flake, CI compatibility
- **load-testing.instructions.md** — scenario patterns, constants, guards, thresholds
- **copilot-instructions.md — Cross-Platform Compatibility section** — path handling, line endings, platform compatibility

### Stage 2: Security Sweep (OWASP + Identity)

> **Delegate to `/security-review`** — run the standalone security review prompt which covers:
> - Full OWASP / PII Security Scan (Stages 1-2 of `/security-review`)
> - Authentication / Identity / MFA Deep Audit (Stage 3 of `/security-review`)
> - Infrastructure Security (Stage 4 of `/security-review`)
> - Client-Side Security (Stage 5 of `/security-review`)
>
> Fix all Critical and High findings before proceeding to Stage 3.

### Stage 3: Dead Code and Structural Alignment Sweep

**A) Unused Code Detection:**
- Properties never read or written
- Methods never called (check all call sites)
- Classes never instantiated or referenced
- Tests for code that no longer exists
- Imports/usings that are unused
- Constants defined but never referenced
- Interfaces with single implementation where abstraction adds no value

**B) Structural Alignment:**
- Files in wrong directory per domain structure
- Missing index.ts barrel exports
- Inconsistent naming (file name vs export name)
- Services in wrong scope (root vs route-provided)
- Missing or extra project references

### Stage 4: Consistency Enforcement (Context7 Required)

**For every pattern found in the codebase, use Context7 to verify it matches the current recommended approach.** Do not assume existing code is correct — it may have drifted from library best practices.

**A) Angular patterns to verify:**
- Signal creation and usage (`signal()`, `computed()`, `effect()`) — query context7 for Angular 21 signals API
- TanStack Query v5 query/mutation patterns — query context7 for `injectQuery`, `injectMutation` current API
- Injectable scoping — `providedIn: 'root'` vs route-provided — query context7 for Angular DI scoping
- `APP_INITIALIZER` usage — query context7 for Angular application initialization
- Zoneless change detection setup

**B) Server patterns to verify:**
- Wolverine handler signatures (`static async Task HandleAsync`) — query context7 for current Wolverine API
- EF Core `DbContext` patterns (transactions, savepoints, owned entities) — query context7
- FluentValidation `AbstractValidator<T>` — query context7 for current validation API
- FusionCache patterns — query context7 for current FusionCache API

**C) Cross-cutting patterns to verify:**
- Any custom pattern that does not have explicit documentation in `.github/instructions/` — look it up

**Deliverable**: Flag any pattern that Context7 shows is deprecated, outdated, or against current best practices — even if it exists in many places today.

## Output

Write a prioritized plan to `Implementation.md` with:
1. **Critical** — Security vulnerabilities, data exposure, broken functionality
2. **High** — Rules violations that affect maintainability or consistency
3. **Medium** — Dead code, structural misalignment, unused dependencies
4. **Low** — Style inconsistencies, documentation gaps

Each item must include: file path, line number, rule violated, specific fix required.
