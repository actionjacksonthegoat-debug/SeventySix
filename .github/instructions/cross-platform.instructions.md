---
description: Cross-platform Windows/Linux compatibility rules
applyTo: "**/*.{ts,cs,ps1,sh,mjs}"
---

# Cross-Platform Compatibility (CRITICAL)

> All code MUST work on both **Windows** and **Linux** (CI runs on `ubuntu-latest`).

## General Rules

| Area             | ❌ NEVER                                    | ✅ ALWAYS                                                   |
| ---------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Line endings     | Assume `\r\n`                               | Use `.gitattributes`, `.editorconfig` for normalization     |
| Shell scripts    | PowerShell-only (`.ps1`) for CI/automation  | Dual support: `.ps1` + shell fallback, or cross-platform JS |
| Case sensitivity | `"MyFile.ts"` vs `"myfile.ts"` interchanged | Consistent casing everywhere (Linux is case-sensitive)      |

## C# (.NET)

| ❌ NEVER                                   | ✅ ALWAYS                                   |
| ------------------------------------------ | ------------------------------------------- |
| `"folder\\file.txt"`, string concatenation | `Path.Combine("folder", "file.txt")`        |
| `C:\Temp\...`                              | `Path.GetTempPath()`                        |
| `Path.DirectorySeparatorChar` assumptions  | `Path.Combine` everywhere                   |
| `%VAR%` (CMD-only)                         | `Environment.GetEnvironmentVariable("VAR")` |
| Assume `\r\n` line endings                 | Use `.editorconfig` settings                |

## TypeScript / Node.js

| ❌ NEVER                      | ✅ ALWAYS                        |
| ----------------------------- | -------------------------------- |
| Hardcode `\\` path separators | Use `/` or `path.join()`         |
| `localStorage` without check  | Guard with `isPlatformBrowser`   |
| Assume `Window` exists        | Check `typeof window`            |
| `"folder\\file.ts"`           | `path.join("folder", "file.ts")` |
| `C:\Temp\...`                 | `os.tmpdir()`                    |
| `%VAR%` (CMD-only)            | `process.env.VAR`                |

**Rule**: Before merging, verify the code would work on Linux—CI will catch failures.

