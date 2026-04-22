# scripts/ — Repo-Root Automation Scripts

This folder contains the repository-wide orchestration scripts used by `npm run …` from the repo root.

## Cross-Platform Invariant (Node-First Rule)

> **Every new automation script MUST be Node-first** (`.mjs`) unless it is genuinely PowerShell-dependent
> (Windows-specific cmdlets, IIS, user-secrets via `dotnet user-secrets`, `New-SelfSignedCertificate`, etc.).

Rationale: CI runs on `ubuntu-latest`, developers on Windows/macOS/Linux. Node 22+ gives us cross-platform
process control, HTTP, and file system out of the box. PowerShell 7+ is still available via
[run-pwsh.mjs](run-pwsh.mjs), but only as a bridge for scripts that genuinely need it.

### Decision Checklist

When adding a new automation script, ask in order:

1. Can this be expressed using `node:child_process`, `node:fs`, `node:https`, etc.? → Write `scripts/<name>.mjs`.
2. Does it wrap a cross-platform binary (k6, docker, dotnet, npx)? → Write `.mjs` and `spawn` the binary.
3. Does it use Windows-only cmdlets (cert management, registry, `Get-CimInstance`, IIS)? → `.ps1` is acceptable; wrap with `run-pwsh.mjs` in `package.json`.
4. Is it purely a bash pipeline for Linux/CI? → Prefer `.mjs` for parity; only use `.sh` when a bash-only CI step is genuinely simpler.

### Smoke-Test Every Unified Script

Any script consolidated from per-app duplicates (e.g. `run-load-tests.mjs`, `ECommerce/scripts/start.mjs`,
`ECommerce/scripts/e2e.mjs`) MUST export a pure `parseArgs` / `resolveConfig` pair and ship a smoke test
under `scripts/__tests__/` using Node's built-in `node:test`.

Run all script smoke tests:

```bash
node --test scripts/__tests__/*.test.mjs
```

## Script Inventory

### Node-first (`.mjs`)

| Script | Purpose |
|--------|---------|
| [bootstrap.mjs](bootstrap.mjs) | Cross-platform bootstrap dispatcher (delegates to `.cmd`/`.sh`/`.ps1`). |
| [link-commerce-shared-node-modules.mjs](link-commerce-shared-node-modules.mjs) | Link `seventysixcommerce-shared` into sveltekit/tanstack node_modules. |
| [load-commerce-secrets.mjs](load-commerce-secrets.mjs) | Exported helper used by commerce startup to hydrate `process.env` from user-secrets. |
| [run-e2e-all.mjs](run-e2e-all.mjs) | Orchestrates E2E runs across all apps. |
| [run-load-tests.mjs](run-load-tests.mjs) | **Unified** k6 orchestrator for main/sveltekit/tanstack (replaces 3 per-app `.ps1`). |
| [run-pwsh.mjs](run-pwsh.mjs) | Cross-platform PowerShell bridge — dispatches to `pwsh` on Linux/macOS, `powershell` on Windows. |
| [shared-load-test-summary.mjs](shared-load-test-summary.mjs) | Shared aggregation helper for k6 summaries. |
| [start-all.mjs](start-all.mjs) | Start Main + SvelteKit + TanStack concurrently (the default `npm start`). |
| [ECommerce/scripts/start.mjs](../ECommerce/scripts/start.mjs) | **Unified** dev startup for sveltekit/tanstack (replaces 2 per-app copies). |
| [ECommerce/scripts/e2e.mjs](../ECommerce/scripts/e2e.mjs) | **Unified** Playwright E2E orchestrator for sveltekit/tanstack. |

### PowerShell-dependent (`.ps1`)

| Script | Why PowerShell |
|--------|----------------|
| [start-dev.ps1](start-dev.ps1) | Windows-first developer flow; uses Start-Process, New-Service semantics. |
| [start-infrastructure.ps1](start-infrastructure.ps1) | Docker compose orchestration with PS-specific waits. |
| [stop-all.ps1](stop-all.ps1), [stop-api.ps1](stop-api.ps1) | Process management via `Get-Process` / `Stop-Process`. |
| [reset-database.ps1](reset-database.ps1) | **USER-ONLY** destructive reset — intentionally PS-gated. |
| [generate-dev-ssl-cert.ps1](generate-dev-ssl-cert.ps1) | `New-SelfSignedCertificate` + cert-store trust (Windows cert store). |
| [generate-dataprotection-cert.ps1](generate-dataprotection-cert.ps1) | Windows data-protection cert generation. |
| [generate-internal-ca.ps1](generate-internal-ca.ps1) | Internal CA issuance via X509 APIs. |
| [manage-user-secrets.ps1](manage-user-secrets.ps1) | Wraps `dotnet user-secrets` with PS parameter binding. |
| [run-server-coverage.ps1](run-server-coverage.ps1) | Wraps `dotnet test` + `reportgenerator` with PS-friendly output. |
| [run-dast.ps1](run-dast.ps1) | DAST orchestration (ZAP + docker) with PS pipelining. |
| [cleanup-docker.ps1](cleanup-docker.ps1) | Cross-platform via pwsh, kept PS to share cmdlet output formatting. |

### Shell-script helpers (`.sh`)

| Script | Notes |
|--------|-------|
| [backup.sh](backup.sh) | Linux-only DB backup helper for production. |
| [bootstrap.sh](bootstrap.sh) | Bash-first bootstrap counterpart (pair with `bootstrap.ps1`/`.cmd`). |
| [codeql-ci-scan.sh](codeql-ci-scan.sh) | CI-only CodeQL invocation. |
| [verify-cert-uids.sh](verify-cert-uids.sh) | CI-side cert verification. |

### Tests

| File                                                                          | Purpose                                                                     |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`__tests__/run-load-tests.test.mjs`](__tests__/run-load-tests.test.mjs)      | Argparse + config smoke tests for the unified load-test orchestrator.       |
| [`__tests__/commerce-scripts.test.mjs`](__tests__/commerce-scripts.test.mjs)  | Argparse + config smoke tests for `ECommerce/scripts/{start,e2e}.mjs`.      |
