# Copilot Instructions System

## Tiered Loading

| Tier  | Files                     | When                   |
| ----- | ------------------------- | ---------------------- |
| **1** | `copilot-instructions.md` | Always (auto-loaded)   |
| **2** | `instructions/*.md`       | On-demand via `#file:` |
| **3** | `CLAUDE.md`               | Deep dives             |

## Usage

**General work**: Auto-loaded. No action needed.

**Domain-specific**: Reference in prompt:

```
#file:.github/instructions/angular.md
#file:.github/instructions/csharp.md
#file:.github/instructions/architecture.md
```

**Deep dives**:

```
#file:.claude/CLAUDE.md
```

## File Inventory

| File                      | Purpose                     |
| ------------------------- | --------------------------- |
| `copilot-instructions.md` | Critical rules (auto)       |
| `angular.md`              | Angular/TypeScript patterns |
| `csharp.md`               | .NET/C# patterns            |
| `testing.md`              | Test commands               |
| `architecture.md`         | System architecture         |
| `quick-reference.md`      | Scannable cheat sheet       |
| `CLAUDE.md`               | Full comprehensive guide    |
