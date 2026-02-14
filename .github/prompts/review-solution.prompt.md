---
agent: agent
description: Deep review of entire codebase against all rules and best practices
---

# Review Solution

Perform a comprehensive review of the entire codebase against every rule in `.github/instructions/` and industry best practices.

## MCP Tools

- Use **context7** to verify ALL library usage follows current API patterns for: Angular, .NET, Wolverine, EF Core, TanStack Query, FusionCache, FluentValidation, Playwright, k6
- Use **postgresql** to inspect schema for data model alignment
- Use **github** to check for any open issues or PR comments
- Use **chrome-devtools** to verify deployed behavior matches expected patterns

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
- **cross-platform.instructions.md** — path handling, line endings, platform compatibility

### Stage 2: Security Sweep (OWASP + Identity)

**A) Full OWASP / PII Security Scan:**
- Scan ALL code and checked-in files for:
  - Hardcoded secrets, API keys, connection strings, passwords
  - PII exposure in logs, error messages, or API responses
  - SQL injection vectors (raw SQL, string concatenation in queries)
  - XSS vectors (unescaped user input in templates)
  - CSRF token validation
  - Insecure deserialization
  - Missing input validation
  - Insecure direct object references
  - Security misconfiguration (default passwords, debug modes)
  - Vulnerable dependencies (check package versions)

**B) Authentication / Identity / MFA Deep Audit:**
- Review EVERY file in `SeventySix.Domains.Identity/` and `auth/` client domain:
  - Login flow: credential validation, lockout, brute-force protection
  - MFA flow: code generation, hashing, verification, timing-safe comparison
  - TOTP flow: secret generation, encryption at rest, enrollment, verification
  - Token rotation: access token, refresh token, sliding expiration, revocation
  - Backup codes: generation, hashing, single-use enforcement
  - Trusted devices: cookie security, token lifetime, device limits
  - Password policy: hashing algorithm (Argon2), complexity rules, breach detection
  - Session management: cookie flags (Secure, HttpOnly, SameSite), CSRF
  - Rate limiting: per-endpoint limits, MFA attempt tracking

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

## Output

Write a prioritized plan to `Implementation.md` with:
1. **Critical** — Security vulnerabilities, data exposure, broken functionality
2. **High** — Rules violations that affect maintainability or consistency
3. **Medium** — Dead code, structural misalignment, unused dependencies
4. **Low** — Style inconsistencies, documentation gaps

Each item must include: file path, line number, rule violated, specific fix required.
