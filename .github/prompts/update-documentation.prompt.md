---
agent: agent
description: Study and align all READMEs and documentation across the project
---

# Update Documentation

Study every README and documentation file in the project. Ensure all documentation is aligned and cleanly sharing responsibilities.

## MCP Tools

- Use **chrome-devtools** MCP to:
  - Navigate to `https://localhost:4200` (or the running client URL)
  - Log in using credentials from user secrets (NEVER hardcode or expose credentials)
  - Take screenshots of standard flows: login → dashboard → admin → permissions → logs
  - Capture screenshots for documentation visuals
- Use **context7** to verify any library references are current

## Documentation Hierarchy

| Level | File | Focus |
|-------|------|-------|
| Root | `README.md` | Architecture, functionality overview, getting started, npm scripts |
| Server | `SeventySix.Server/README.md` | Server-specific patterns, domain structure, API endpoints |
| Client | `SeventySix.Client/README.md` | Angular patterns, domain structure, component library |
| E2E | `SeventySix.Client/e2e/README.md` | E2E test structure, fixtures, running tests |
| Load | `SeventySix.Client/load-testing/README.md` | k6 patterns, profiles, scenarios |

## Rules

1. **Read** all `.github/instructions/*.instructions.md` files first
2. **Top-level README** focuses on architecture, functionality, and getting started
3. **Nested READMEs** focus on implementation details for that specific area
4. **No duplication** — if information exists in an instruction file, reference it, don't repeat it
5. **Do NOT create files in `/docs/`** — documentation lives in READMEs and instruction files only
6. **Screenshots**: Use Chrome DevTools MCP to capture current UI state
7. **Credentials**: Read from user secrets via `scripts/manage-user-secrets.ps1` — NEVER expose in docs
8. **Writing style**: High-level enough for novice developers, but with sufficient technical depth that an architect can understand the true patterns used
9. **Standard flows to document** (with screenshots):
   - Login flow (including MFA)
   - Admin dashboard
   - User management
   - Permission requests
   - Log viewer
   - Developer tools
   - Account settings / TOTP setup

## Output

Update all README files in-place. Do NOT create new documentation files.
