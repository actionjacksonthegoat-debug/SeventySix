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
| Stage 1 (Rules Compliance) | Angular 21 signals, TanStack Query v5, Wolverine CQRS, EF Core 10, FusionCache, FluentValidation, Playwright latest, k6 options, SvelteKit 2, Svelte 5 runes, TanStack Start/Router, Drizzle ORM |
| Stage 2 (Security) | .NET 10 auth middleware, ASP.NET Core data protection, OWASP .NET checklists, Stripe webhook verification, SvelteKit security headers |
| Stage 3 (Dead Code) | Angular standalone components barrel exports, .NET trimming attributes, SvelteKit/TanStack unused exports |
| Stage 4 (Consistency) | Any pattern you are unsure about before flagging |

**Use the MCP servers in every stage:**
- **context7** — look up CURRENT API patterns before flagging any usage as incorrect
- **postgresql** to inspect schema for data model alignment
- **github** to check for any open issues or PR comments
- **chrome-devtools** to verify deployed behavior matches expected patterns

## Review Stages

### Stage 1: Rules Compliance Scan

Read EVERY file in `.github/instructions/` and scan the ENTIRE codebase for violations — this includes the main app (Angular + .NET), both commerce apps (SvelteKit + TanStack), and the shared commerce library:
- **formatting.instructions.md** — variable naming, code structure, null coercion, constants, return types
- **angular.instructions.md** — DI patterns, domain boundaries, service scoping, signals, TanStack Query
- **csharp.instructions.md** — type usage, constructors, collections, async patterns, EF Core
- **security.instructions.md** — ProblemDetails, exception messages, auth error handling (applies to ALL projects including commerce)
- **accessibility.instructions.md** — WCAG AA, aria labels, icons, live regions (applies to ALL user-facing projects including commerce)
- **testing-server.instructions.md** — test structure, mocking, builders, time-based testing
- **testing-client.instructions.md** — Vitest, zoneless, provider helpers, mock factories
- **e2e.instructions.md** — import rules, anti-flake, CI compatibility
- **e2e-svelte.instructions.md** — SvelteKit E2E patterns, fixture chain, CI compatibility
- **e2e-tanstack.instructions.md** — TanStack E2E patterns, fixture chain, CI compatibility
- **load-testing.instructions.md** — scenario patterns, constants, guards, thresholds (applies to ALL projects including commerce)
- **sveltekit.instructions.md** — Svelte 5 runes, SvelteKit form actions, `$env/` usage, server data patterns, mock services
- **tanstack.instructions.md** — `createServerFn()`, Zod input validation, CSRF middleware, route conventions, server functions
- **commerce-shared.instructions.md** — shared library patterns, peer dependencies, date-fns usage, Drizzle ORM patterns
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

**C) Commerce Shared Library:**
- Unused exports in `ECommerce/seventysixcommerce-shared/` (check both consumer apps)
- Missing exports that consumer apps import directly from source files instead of barrel
- Peer dependency mismatches between shared library and consumer apps

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

**C) SvelteKit patterns to verify:**
- Svelte 5 runes usage (`$state`, `$derived`, `$effect`) — query context7 for Svelte 5 runes API
- SvelteKit form actions and load functions — query context7 for SvelteKit 2 data loading
- `$env/` usage for environment variables — query context7 for SvelteKit environment
- Drizzle ORM query patterns — query context7 for Drizzle ORM latest API

**D) TanStack patterns to verify:**
- `createServerFn()` patterns — query context7 for TanStack Start server functions
- Route `loader` and data loading — query context7 for TanStack Router data loading
- Zod input validation on server functions — query context7 for Zod v4 API
- `createMiddleware()` patterns — query context7 for TanStack Start middleware

**E) Cross-cutting patterns to verify:**
- Any custom pattern that does not have explicit documentation in `.github/instructions/` — look it up

**Deliverable**: Flag any pattern that Context7 shows is deprecated, outdated, or against current best practices — even if it exists in many places today.

## Output

Write a prioritized plan to `Implementation.md` with:
1. **Critical** — Security vulnerabilities, data exposure, broken functionality
2. **High** — Rules violations that affect maintainability or consistency
3. **Medium** — Dead code, structural misalignment, unused dependencies
4. **Low** — Style inconsistencies, documentation gaps

> **After writing the plan**: Run `/create-plan` on the output if the scope is large enough to warrant phased execution. For smaller findings, fixes can be applied directly.

Each item must include: file path, line number, rule violated, specific fix required.
