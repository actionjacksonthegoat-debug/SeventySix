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

- **Formatting**: Null coercion (`!!value`, `|| for defaults`), single-letter variables, missing explicit return types, `var` usage in C#
- **Security**: Raw `exception.Message` in ProblemDetails, missing `ProblemDetailConstants`
- **Accessibility**: Missing `aria-labels` on icon-only buttons, missing `aria-hidden="true"` on decorative icons
- **Architecture**: Cross-domain imports, `providedIn: 'root'` in domain services, reverse dependency direction
- **Naming**: Missing `Async` suffix on async C# methods, magic strings/values not extracted to constants
- **Testing**: Missing `[Collection(CollectionNames.PostgreSql)]` on DB tests, `Task.Delay()` instead of `FakeTimeProvider`, missing copyright headers, not using mock factories, test names not matching behavior
- **Cross-platform**: Hardcoded `\\` paths, `C:\Temp`, platform-specific assumptions
- **Dead code**: Unused variables, unreachable code, speculative parameters (YAGNI)

## Workflow

1. Scan every changed file for violations
2. **Fix each violation immediately** by editing the source file
3. After all fixes, run `npm run format` to ensure consistent formatting
4. Report a summary of what was fixed

## Report Format

For each violation that was fixed:

- **File** and **line number**
- **Rule** reference (which instruction file)
- **What was fixed**
