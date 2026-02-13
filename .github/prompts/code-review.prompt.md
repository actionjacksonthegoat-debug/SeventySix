---
agent: agent
description: Review staged changes against all project rules
---

# Code Review

Review all staged/unstaged changes against every rule in the `.github/instructions/` files.

## MCP Tools

- Use **github** MCP to fetch PR diff and changed files for full review context
- Use **context7** to verify API usage follows the latest library versions

## Check For Violations

- **Formatting**: Null coercion (`!!value`, `|| for defaults`), single-letter variables, missing explicit return types, `var` usage in C#
- **Security**: Raw `exception.Message` in ProblemDetails, missing `ProblemDetailConstants`
- **Accessibility**: Missing `aria-labels` on icon-only buttons, missing `aria-hidden="true"` on decorative icons
- **Architecture**: Cross-domain imports, `providedIn: 'root'` in domain services, reverse dependency direction
- **Naming**: Missing `Async` suffix on async C# methods, magic strings/values not extracted to constants
- **Testing**: Missing `[Collection(CollectionNames.PostgreSql)]` on DB tests, `Task.Delay()` instead of `FakeTimeProvider`
- **Cross-platform**: Hardcoded `\\` paths, `C:\Temp`, platform-specific assumptions

## Report Format

For each violation report:

- **File** and **line number**
- **Rule** reference (which instruction file)
- **Specific fix** required
