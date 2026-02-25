# Implementation Plan: Zero-Friction Onboarding & Bootstrap Testing

> **CRITICAL — NO SKIPPING**: All required test suites MUST run and pass before this plan is marked complete. NO EXCEPTIONS. If infrastructure is not running, START IT. Never claim "done" without passing tests.

---

## Executive Summary

### Problem

The current bootstrap script (`bootstrap.cmd` / `bootstrap.sh` → `bootstrap.ps1`) is comprehensive but **untestable** — the developer's machine already has all dependencies installed, making it impossible to verify the first-run experience. Additionally, laymen users face a multi-step terminal workflow that assumes comfort with command-line interfaces. There is no way to verify that the entire setup flow works on clean Windows, Ubuntu, and macOS environments without manually provisioning VMs.

### The EXE Question — Analysis & Recommendation

| Approach | Trust | Maintenance | Cross-Platform | Transparency | Verdict |
|----------|-------|-------------|----------------|--------------|---------|
| **Installable EXE** | Low — users can't inspect what it does; requires paid code-signing cert to avoid Windows SmartScreen warnings | High — must rebuild, sign, and distribute for every change | Poor — need separate builds for Win/Mac/Linux | None | **REJECT** |
| **Current scripts** | High — users can read every line before running | Low — plain text, version-controlled | Good — `.cmd`/`.sh`/`.ps1` cover all platforms | Full | **KEEP as primary** |
| **Dev Container / Codespace** | High — standard Docker + VS Code pattern; GitHub-hosted | Low — single `devcontainer.json` + Dockerfile | Perfect — runs in cloud, identical everywhere | Full | **ADD as zero-install option** |

**Recommendation: Do NOT build an EXE.** Instead, offer **two paths**:

1. **Zero-Install Path (Laymen)**: GitHub Codespaces — user clicks ONE button on the repo page, gets a fully configured dev environment in their browser. No local installs. No terminal commands. This is the "outside the box" answer for non-technical users.

2. **Local Path (Developers)**: Keep the existing `scripts/bootstrap.cmd` / `bootstrap.sh` flow, enhanced with better UX (progress indicators, clearer prompts, graceful error recovery). Add Dev Container support so VS Code users can "Reopen in Container" for a pre-configured local environment.

### Goal

1. **Bootstrap Smoke Test CI** — automated GitHub Actions workflow that tests the bootstrap on clean Windows/Ubuntu/macOS runners on every PR to master
2. **Bootstrap UX hardening** — non-interactive mode, structured progress output, better error recovery, prerequisite health report
3. **Dev Container (owner testing tool)** — `.devcontainer/` configuration used by the repo owner via GitHub Codespaces to simulate a clean Ubuntu new-user install; NOT a recommended developer path

### Key Constraints

- MIT-licensed, zero paid dependencies (no code-signing certs, no paid CI runners beyond GitHub Free tier)
- Cross-platform: Windows + Ubuntu + macOS
- All existing tests must continue passing
- No changes to the core application — only onboarding/DX infrastructure
- `git add` / `git commit` / `git push` are USER-ONLY operations

---

## Implementation Files

| File | Scope | Status |
|------|-------|--------|
| [implementation-1.md](implementation-1.md) | Dev Container config (owner testing tool) + Non-Interactive bootstrap | Not Started |
| [implementation-2.md](implementation-2.md) | Bootstrap Smoke Test CI Workflow (automated clean-VM testing) | Not Started |
| [implementation-3.md](implementation-3.md) | Bootstrap UX Hardening & Non-Interactive Mode | Not Started |

---

## Execution Order

1. **implementation-2.md** first — non-interactive bootstrap flag is required by all other work
2. **implementation-1.md** second — Dev Container config for owner testing uses the non-interactive flag
3. **implementation-3.md** third — UX improvements to the local interactive flow

---

## Security Review Gate

After all three implementation files are complete, invoke `/security-review` to audit:
- Dev Container configuration (no secrets baked into images, not exposed to developers)
- CI workflow permissions (minimal `GITHUB_TOKEN` scope, secrets masked in logs)
- Non-interactive mode (no secrets printed, generated values are cryptographically random)
- `check-prerequisites.ps1` auto-install in CI does not escalate privileges unexpectedly

---

## Final Validation Gate (MANDATORY)

> **CRITICAL — NO SKIPPING**: Every suite below MUST run and PASS. If infrastructure is not running, START IT.

| Suite | Command | Must See |
|-------|---------|----------|
| Server | `dotnet test` | `Test summary: total: X, failed: 0` |
| Client | `npm test` | `X passed (X)` |
| E2E | `npm run test:e2e` | `[PASS] All E2E tests passed!` |
| Load (quick) | `npm run loadtest:quick` | All scenarios pass thresholds |

E2E and load tests CAN run in parallel to save time. Both run in fully isolated Docker environments.

### Documentation Check

After all tests pass, verify:
- All `.github/instructions/*.instructions.md` reflect current patterns
- `README.md` Quick Start section has NO Codespaces badge or recommendation — only local bootstrap paths
- `docs/Startup-Instructions.md` documents the non-interactive bootstrap flag and CI secret setup
- New CI workflow documented in repo with clear note it is owner-only

---

## Appendix A: File Inventory (New Files)

| File | Purpose | Audience |
|------|---------|----------|
| `.devcontainer/devcontainer.json` | Dev Container config for owner clean-install testing | Repo owner only |
| `.devcontainer/Dockerfile` | Container image with all prerequisites pre-installed | Repo owner only |
| `.devcontainer/post-create.sh` | Lifecycle script — installs deps on container creation | Repo owner only |
| `.github/workflows/bootstrap-test.yml` | CI workflow testing bootstrap on clean Windows/Ubuntu/macOS VMs | Repo owner only |

## Appendix B: Modified Files

| File | Change |
|------|--------|
| `README.md` | Update Quick Start — local bootstrap only, no Codespaces badge |
| `docs/Startup-Instructions.md` | Document `-NonInteractive` flag and GitHub Actions secret setup |
| `scripts/bootstrap.ps1` | Add `-NonInteractive` flag for CI |
| `scripts/internal/collect-secrets.ps1` | Respect `-NonInteractive` with generated defaults |
| `scripts/internal/check-prerequisites.ps1` | Respect `-NonInteractive` and `SKIP_DOCKER_CHECK` env vars |

---

> **CRITICAL — NO SKIPPING (REPEATED)**: All required test suites MUST run and pass before this plan is marked complete. NO EXCEPTIONS.
