---
agent: agent
description: Review and auto-fix staged changes against all project rules
---

# Code Review (Auto-Fix)

Review all staged/unstaged changes against every rule in the `.github/instructions/` files.
**Automatically fix every violation found** — do not just report them.

## MCP Tools

- Use **github** MCP to fetch PR diff and changed files for full review context
- Use **context7** to verify API usage follows the latest library versions

## Check For Violations

- **Missing documentation**: New classes, interfaces, enums, methods, functions, properties, or constants without XML doc (C#), JSDoc (TS/JS/MJS), or comment-based help (PS). Tests are exempt.
- **Formatting**: Null coercion (`!!value`, `|| for defaults`), single-letter variables, missing explicit return types, `var` usage in C#
- **Security**: Raw `exception.Message` in ProblemDetails, missing `ProblemDetailConstants`
- **Accessibility**: Missing `aria-labels` on icon-only buttons, missing `aria-hidden="true"` on decorative icons
- **Architecture**: Cross-domain imports, `providedIn: 'root'` in domain services, reverse dependency direction
- **Naming**: Missing `Async` suffix on async C# methods, magic strings/values not extracted to constants
- **Testing**: Missing `[Collection(CollectionNames.PostgreSql)]` on DB tests, `Task.Delay()` instead of `FakeTimeProvider`, missing copyright headers, not using mock factories, test names not matching behavior
- **Cross-platform**: Hardcoded `\\` paths, `C:\Temp`, platform-specific assumptions
- **Dead code**: Unused variables, unreachable code, speculative parameters (YAGNI)
- **Warning suppression** (FORBIDDEN): `#pragma warning disable`, `// @ts-ignore`, `[SuppressMessage]`, `.editorconfig` severity overrides — fix the root cause, never suppress
- **Missing `sealed`**: Non-abstract C# classes with no known subclasses should be `sealed`
- **Test coverage gaps**: New public methods, components, or handlers added without corresponding tests

## Workflow

> **[CRITICAL] NEVER COMMIT OR PUSH.** After all fixes and tests pass, inform the user that changes are ready for their review — the user gates all staging, committing, and pushing.
> Do NOT run `git add`, `git stage`, `git commit`, or `git push` at any point.

1. Scan every changed file for violations
2. **Fix each violation immediately** by editing the source file
3. After all fixes, run `npm run format` to ensure consistent formatting
4. Run **`/fix-warnings`** — confirm zero build warnings across server and client
5. Run the **full validation suite** — ALL suites must pass before calling this complete:

   | Suite | Command | Success Indicator |
   |-------|---------|-------------------|
   | Server tests | `npm run test:server` | `Test summary: total: X, failed: 0` |
   | Client tests | `npm run test:client` | `X passed (X)` |
   | Commerce SvelteKit Build & Test | `node scripts/link-commerce-shared-node-modules.mjs --app sveltekit && cd ECommerce/seventysixcommerce-sveltekit && npm run check && npm run test:coverage && npm run build` | `svelte-check found 0 errors`, coverage succeeds, build succeeds |
   | Commerce TanStack Build & Test | `node scripts/link-commerce-shared-node-modules.mjs --app tanstack && cd ECommerce/seventysixcommerce-tanstack && npm run build && npm run typecheck && npm run test:coverage` | build/typecheck/coverage succeed |
   | E2E tests | `npm run test:e2e` | `[PASS] All E2E tests passed!` |
   | Commerce SvelteKit E2E | `npm run test:e2e:svelte` | Playwright suite passes |
   | Commerce TanStack E2E | `npm run test:e2e:tanstack` | Playwright suite passes |
   | Quick load test | `npm run loadtest:quick` | All scenarios pass thresholds |
   | Commerce SvelteKit Load | `npm run loadtest:svelte:quick` | All scenarios pass thresholds |
   | Commerce TanStack Load | `npm run loadtest:tanstack:quick` | All scenarios pass thresholds |

   > **NO EXCEPTIONS.** If infrastructure is not running, start it. Do not skip any suite.
   > **NEVER** label a failure "pre-existing" or "unrelated" and move on — ALL failures must be fixed.
   > **Debug single specs:** `npm run test:e2e -- specs/path/to/failing.spec.ts`. If it can't reproduce standalone, re-run the full suite — it may be cross-test corruption.
   > **NEVER pipe or filter command output** — run raw commands, full output, no truncation.
   > **A full passing E2E suite run is REQUIRED before calling this review complete.**

6. Report a summary of what was fixed

## Report Format

For each violation that was fixed:

- **File** and **line number**
- **Rule** reference (which instruction file)
- **What was fixed**
