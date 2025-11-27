# Copilot Instructions System

## Tiered Instruction System

| Tier       | Files                             | When Loaded            |
| ---------- | --------------------------------- | ---------------------- |
| **Tier 1** | `copilot-instructions.md`         | Always (auto-loaded)   |
| **Tier 2** | `instructions/*.md`               | On-demand via `#file:` |
| **Tier 3** | `CLAUDE.md`, `Implementation*.md` | Deep dives only        |

## How to Use

### For General Work

Core instructions are auto-loaded. No action needed.

### For Domain-Specific Work

Reference the relevant file in your prompt:

```
#file:.github/instructions/angular.md - Help me create a new component
#file:.github/instructions/csharp.md - Create a new service
#file:.github/instructions/architecture-server.md - Working on bounded contexts
```

### For Architecture Work

```
#file:.github/instructions/architecture-overall.md - System-wide decisions
#file:.github/instructions/architecture-server.md - Server/API architecture
#file:.github/instructions/architecture-client.md - Angular client architecture
```

### For Deep Dives

```
#file:.claude/CLAUDE.md - Full coding standards
#file:Implementation-complete.md - Migration phases
#file:implementation-plan-critical.md - Architecture rationale
```

## File Inventory

| File                      | Purpose                        | Lines |
| ------------------------- | ------------------------------ | ----- |
| `copilot-instructions.md` | Critical rules (always loaded) | ~50   |
| `csharp.md`               | .NET/C# patterns               | ~90   |
| `angular.md`              | Angular/TypeScript patterns    | ~90   |
| `testing.md`              | Test commands & requirements   | ~60   |
| `architecture-overall.md` | System architecture overview   | ~70   |
| `architecture-server.md`  | Server bounded contexts        | ~80   |
| `architecture-client.md`  | Angular client structure       | ~70   |
| `quick-reference.md`      | Scannable cheat sheet          | ~80   |

## Prompt Examples

### Creating a New Feature

```
#file:.github/instructions/architecture-server.md
Create a new bounded context for Weather data
```

### Fixing Angular Tests

```
#file:.github/instructions/angular.md #file:.github/instructions/testing.md
Help me fix this zoneless test that's failing
```

### Code Review

```
#file:.github/instructions/quick-reference.md
Review this PR for coding standard violations
```

