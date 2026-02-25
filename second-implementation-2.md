# Implementation 2: Bootstrap Smoke Test CI Workflow

> **CRITICAL — NO SKIPPING**: All required test suites MUST run and pass before this implementation file is marked complete. NO EXCEPTIONS.

---

## Overview

Create a GitHub Actions workflow that tests the bootstrap process on **clean virtual machines** — Windows, Ubuntu, and macOS — on every PR and weekly schedule. This solves the core problem: "I can't test the bootstrap on my dev box because everything is already installed."

### Why GitHub Actions Is the Answer (Not Local VMs)

| Approach | Clean State | Cost | Maintenance | Platforms |
|----------|-------------|------|-------------|-----------|
| **GitHub Actions runners** | Guaranteed fresh every run | Free (2,000 min/month) | Zero — GitHub maintains the VMs | Windows, Ubuntu, macOS |
| Vagrant/VirtualBox | Must destroy/recreate manually | Free but slow | High — manage box images | Windows, Ubuntu |
| Cloud VMs (AWS/Azure) | Clean if scripted | Paid | High — provisioning scripts | All |
| Docker containers | Clean but not true OS test | Free | Medium | Linux only |

**Recommendation**: GitHub Actions runners are guaranteed **clean machines** with only the OS and basic tools (git, curl). They're the perfect test bed for "does our bootstrap work from scratch?" and they're free.

---

## Phase 1: Bootstrap Smoke Test Workflow

### Substep 1.1: Create `.github/workflows/bootstrap-test.yml`

**File**: `.github/workflows/bootstrap-test.yml`

```yaml
name: Bootstrap Smoke Test

on:
    pull_request:
        # Only run on PRs targeting master — this is the repo owner's QA tool, not new-user CI
        branches: [master]
        paths:
            - 'scripts/**'
            - '.devcontainer/**'
            - 'package.json'
            - 'docker-compose.yml'
            - 'docker-compose.override.yml'
    schedule:
        # Weekly on Sunday at 2am UTC — catch upstream dependency breakage
        - cron: '0 2 * * 0'
    workflow_dispatch:

permissions:
    contents: read

concurrency:
    group: bootstrap-${{ github.ref }}
    cancel-in-progress: true

jobs:
    bootstrap-ubuntu:
        name: Bootstrap (Ubuntu)
        runs-on: ubuntu-latest
        timeout-minutes: 30

        steps:
            - name: Checkout
              uses: actions/checkout@v4

            - name: Run bootstrap (non-interactive)
              run: |
                  chmod +x scripts/bootstrap.sh
                  SEVENTYSIX_ADMIN_EMAIL="${{ secrets.CI_ADMIN_EMAIL }}" \
                  SEVENTYSIX_ADMIN_PASSWORD="${{ secrets.CI_ADMIN_PASSWORD }}" \
                  SEVENTYSIX_DB_PASSWORD="${{ secrets.CI_DB_PASSWORD }}" \
                  bash scripts/bootstrap.sh -SkipTests -SkipStart

            - name: Verify tools installed
              run: |
                  echo "--- Verifying all prerequisites ---"
                  pwsh --version
                  dotnet --version
                  node --version
                  npm --version
                  docker --version
                  echo "[PASS] All tools available"

            - name: Verify builds succeeded
              run: |
                  echo "--- Verifying project builds ---"
                  cd SeventySix.Server && dotnet build --configuration Release --no-restore
                  cd ../SeventySix.Client && npx ng build --configuration development
                  echo "[PASS] Both projects build successfully"

            - name: Verify secrets were configured
              run: |
                  cd SeventySix.Server/SeventySix.Api
                  SECRETS_COUNT=$(dotnet user-secrets list 2>/dev/null | wc -l)
                  if [ "$SECRETS_COUNT" -lt 5 ]; then
                      echo "[FAIL] Expected at least 5 secrets, got $SECRETS_COUNT"
                      exit 1
                  fi
                  echo "[PASS] $SECRETS_COUNT secrets configured"

            - name: Verify certificates generated
              run: |
                  test -f SeventySix.Client/ssl/dev-certificate.crt || { echo "[FAIL] SSL cert missing"; exit 1; }
                  test -f SeventySix.Server/SeventySix.Api/keys/dataprotection.pfx || { echo "[FAIL] DataProtection cert missing"; exit 1; }
                  echo "[PASS] Certificates generated"

    bootstrap-windows:
        name: Bootstrap (Windows)
        runs-on: windows-latest
        timeout-minutes: 45

        steps:
            - name: Checkout
              uses: actions/checkout@v4

            - name: Run bootstrap (non-interactive)
              shell: cmd
              env:
                  SEVENTYSIX_ADMIN_EMAIL: ${{ secrets.CI_ADMIN_EMAIL }}
                  SEVENTYSIX_ADMIN_PASSWORD: ${{ secrets.CI_ADMIN_PASSWORD }}
                  SEVENTYSIX_DB_PASSWORD: ${{ secrets.CI_DB_PASSWORD }}
              run: scripts\bootstrap.cmd -SkipTests -SkipStart

            - name: Verify tools installed
              shell: pwsh
              run: |
                  Write-Host "--- Verifying all prerequisites ---"
                  pwsh --version
                  dotnet --version
                  node --version
                  npm --version
                  docker --version
                  Write-Host "[PASS] All tools available"

            - name: Verify builds succeeded
              shell: pwsh
              run: |
                  Push-Location SeventySix.Server
                  dotnet build --configuration Release --no-restore
                  Pop-Location
                  Push-Location SeventySix.Client
                  npx ng build --configuration development
                  Pop-Location
                  Write-Host "[PASS] Both projects build successfully"

            - name: Verify secrets configured
              shell: pwsh
              run: |
                  Push-Location SeventySix.Server/SeventySix.Api
                  $output = dotnet user-secrets list 2>$null
                  $count = ($output | Measure-Object).Count
                  if ($count -lt 5) { Write-Error "[FAIL] Expected 5+ secrets, got $count"; exit 1 }
                  Write-Host "[PASS] $count secrets configured"
                  Pop-Location

            - name: Verify certificates generated
              shell: pwsh
              run: |
                  if (-not (Test-Path "SeventySix.Client/ssl/dev-certificate.crt")) { Write-Error "[FAIL] SSL cert missing"; exit 1 }
                  if (-not (Test-Path "SeventySix.Server/SeventySix.Api/keys/dataprotection.pfx")) { Write-Error "[FAIL] DataProtection cert missing"; exit 1 }
                  Write-Host "[PASS] Certificates generated"

    bootstrap-macos:
        name: Bootstrap (macOS)
        runs-on: macos-latest
        timeout-minutes: 45

        steps:
            - name: Checkout
              uses: actions/checkout@v4

            # macOS CI runners do not support Docker Desktop (GUI required, headless boot fails).
            # We validate everything except Docker-dependent steps: prereq install, npm/dotnet
            # restore, cert generation, and build. Docker is tested on ubuntu-latest instead.
            - name: Run bootstrap (non-interactive, skip Docker requirements)
              run: |
                  chmod +x scripts/bootstrap.sh
                  SEVENTYSIX_ADMIN_EMAIL="${{ secrets.CI_ADMIN_EMAIL }}" \
                  SEVENTYSIX_ADMIN_PASSWORD="${{ secrets.CI_ADMIN_PASSWORD }}" \
                  SEVENTYSIX_DB_PASSWORD="${{ secrets.CI_DB_PASSWORD }}" \
                  SKIP_DOCKER_CHECK=true \
                  bash scripts/bootstrap.sh -SkipTests -SkipStart

            - name: Verify tools installed
              run: |
                  pwsh --version
                  dotnet --version
                  node --version
                  npm --version
                  echo "[PASS] All tools available"

            - name: Verify builds succeeded
              run: |
                  cd SeventySix.Server && dotnet build --configuration Release --no-restore
                  cd ../SeventySix.Client && npx ng build --configuration development
                  echo "[PASS] Both projects build successfully"

            - name: Verify certificates generated
              run: |
                  test -f SeventySix.Client/ssl/dev-certificate.crt || { echo "[FAIL] SSL cert missing"; exit 1; }
                  test -f SeventySix.Server/SeventySix.Api/keys/dataprotection.pfx || { echo "[FAIL] DataProtection cert missing"; exit 1; }
                  echo "[PASS] Certificates generated"

        # NOTE: Add SKIP_DOCKER_CHECK env var support to check-prerequisites.ps1 so it skips
        # the Docker daemon liveness check when set — this means macOS CI won't hang waiting
        # for Docker Desktop. Docker validation is fully covered by the ubuntu-latest job.

    bootstrap-devcontainer:
        name: Dev Container Build
        runs-on: ubuntu-latest
        timeout-minutes: 20

        steps:
            - name: Checkout
              uses: actions/checkout@v4

            - name: Build Dev Container image
              run: |
                  docker build -f .devcontainer/Dockerfile -t seventysix-devcontainer .devcontainer/
                  echo "[PASS] Dev Container image builds successfully"

            - name: Verify tools in container
              run: |
                  docker run --rm seventysix-devcontainer bash -c "
                      dotnet --version &&
                      node --version &&
                      npm --version &&
                      pwsh --version &&
                      echo '[PASS] All tools available in dev container'
                  "
```

### Substep 1.2: Create GitHub Repository Secrets

The workflow references `secrets.CI_ADMIN_EMAIL`, `secrets.CI_ADMIN_PASSWORD`, and `secrets.CI_DB_PASSWORD`.
These must be created in the repo **before** the workflow runs (one-time setup by the repo owner).

**Setup (GitHub UI)**:
1. Go to `https://github.com/actionjacksonthegoat-debug/SeventySix/settings/secrets/actions`
2. Click **New repository secret** for each value:

| Secret Name | Suggested Value | Notes |
|-------------|----------------|-------|
| `CI_ADMIN_EMAIL` | `ci@seventysix.local` | Fake address — no email actually sent in CI |
| `CI_ADMIN_PASSWORD` | A 12+ char strong password | Not a real account — ephemeral CI VM |
| `CI_DB_PASSWORD` | A 8+ char strong password | Local PostgreSQL container — destroyed after run |

**Alternative (GitHub CLI)**:
```bash
gh secret set CI_ADMIN_EMAIL --body "ci@seventysix.local"
gh secret set CI_ADMIN_PASSWORD --body "YourCiPassword123!"
gh secret set CI_DB_PASSWORD --body "YourCiDbPass123!"
```

These values are held in GitHub's encrypted secret store and masked from all logs. They are never committed to the repo.

> **Note**: Also add `SKIP_DOCKER_CHECK` support to `check-prerequisites.ps1`: when `$env:SKIP_DOCKER_CHECK -eq 'true'`, skip the Docker daemon liveness check. This prevents the macOS CI job from hanging waiting for a Docker daemon that cannot run headlessly.

### Deliverables
- `.github/workflows/bootstrap-test.yml` — 4-job matrix workflow scoped to master PRs
- GitHub repository secrets `CI_ADMIN_EMAIL`, `CI_ADMIN_PASSWORD`, `CI_DB_PASSWORD` created by repo owner
- `check-prerequisites.ps1` respects `SKIP_DOCKER_CHECK` env var

### Verification
- Workflow YAML lints cleanly (`actionlint` or GitHub's built-in validation)
- Runs automatically on PRs targeting `master` that touch `scripts/` or `.devcontainer/`
- Manual trigger via `workflow_dispatch`
- No plaintext credentials appear in any log output

---

## Phase 2: Non-Interactive Bootstrap Support

### Substep 2.1: Add `-NonInteractive` pass-through to `bootstrap.ps1`

**Modify**: `scripts/bootstrap.ps1`

The `-NonInteractive` flag must flow through to child scripts so the entire bootstrap runs without any `Read-Host` prompts.

```powershell
# Add to param block
param(
    [switch]$SkipTests,
    [switch]$SkipStart,
    [switch]$NonInteractive  # <-- NEW: CI/Codespace mode, no prompts
)

# Detect Codespace environment automatically
if ($env:CODESPACES -eq 'true' -or $env:CI -eq 'true') {
    $NonInteractive = $true
}
```

Pass the flag to child scripts:

```powershell
# Phase 1: Prerequisites (pass NonInteractive)
if ($NonInteractive) {
    & "$PSScriptRoot\internal\check-prerequisites.ps1" -NonInteractive
} else {
    & "$PSScriptRoot\internal\check-prerequisites.ps1"
}

# Phase 2: Secrets collection (pass NonInteractive)
if ($NonInteractive) {
    & "$PSScriptRoot\internal\collect-secrets.ps1" -NonInteractive
} else {
    & "$PSScriptRoot\internal\collect-secrets.ps1"
}
```

Skip the "Start now?" prompt in non-interactive mode:

```powershell
# Phase 9: Offer to start (skip in non-interactive mode)
if (-not $SkipStart -and -not $NonInteractive) {
    $startNow = Read-Host "Start the development environment now? (y/N)"
    if ($startNow -match '^[yY]') {
        & "$PSScriptRoot\start-dev.ps1"
    }
}
```

### Substep 2.2: Add `-NonInteractive` to `check-prerequisites.ps1`

**Modify**: `scripts/internal/check-prerequisites.ps1`

```powershell
# Add param block
param(
    [switch]$NonInteractive
)

# In Assert-Tool function, auto-install instead of prompting:
if ($NonInteractive) {
    Write-Host "  [AUTO] Installing $($tool.Name)..."
    Install-ViaWingetOrUrl -WingetId $tool.WingetId -DownloadUrl $tool.DownloadUrl -ToolName $tool.Name
} else {
    $install = Read-Host "  Install $($tool.Name)? (y/N)"
    # ... existing interactive flow
}
```

### Substep 2.3: Enhance `collect-secrets.ps1` for non-interactive mode

**Modify**: `scripts/internal/collect-secrets.ps1`

Add environment variable detection and auto-generation (see implementation-1.md Phase 3 for the full pattern).

### Substep 2.4: Pass `-NonInteractive` through `bootstrap.sh` and `bootstrap.cmd`

**Modify**: `scripts/bootstrap.sh` — forward all args including `-NonInteractive`:

```bash
# Already forwards via "$@" — works as-is if env vars CI=true or CODESPACES=true
exec pwsh -ExecutionPolicy Bypass -File "$(dirname "$0")/bootstrap.ps1" "$@"
```

**Modify**: `scripts/bootstrap.cmd` — forward all args:

```bat
:: Already forwards via %* — works as-is
"%PWSH_EXE%" -ExecutionPolicy Bypass -File "%~dp0bootstrap.ps1" %*
```

### Deliverables
- `bootstrap.ps1` accepts `-NonInteractive`
- `check-prerequisites.ps1` accepts `-NonInteractive`
- `collect-secrets.ps1` accepts `-NonInteractive`
- Auto-detection of CI/Codespace environments

### Verification
- Full bootstrap completes on CI without hanging on prompts
- Generated secrets meet minimum length requirements
- No secrets appear in CI logs

---

## Phase 3: Bootstrap Health Report

### Substep 3.1: Add summary output for CI

At the end of `bootstrap.ps1`, when in non-interactive mode, output a structured summary suitable for CI log parsing:

```powershell
if ($NonInteractive) {
    Write-Host ""
    Write-Host "::group::Bootstrap Health Report"
    Write-Host "STATUS: SUCCESS"
    Write-Host "TOOLS_VERIFIED: pwsh, dotnet, node, npm, docker"
    Write-Host "SECRETS_CONFIGURED: $(& dotnet user-secrets list --project $apiProjectPath 2>$null | Measure-Object | Select-Object -ExpandProperty Count)"
    Write-Host "SSL_CERT: $(if (Test-Path $sslCertPath) { 'PRESENT' } else { 'MISSING' })"
    Write-Host "DP_CERT: $(if (Test-Path $dpCertPath) { 'PRESENT' } else { 'MISSING' })"
    Write-Host "SERVER_BUILD: PASSED"
    Write-Host "CLIENT_BUILD: PASSED"
    Write-Host "::endgroup::"
}
```

### Deliverables
- Structured CI output using GitHub Actions `::group::` annotations
- Machine-parseable health report

### Verification
- Report appears in GitHub Actions log
- All fields show SUCCESS/PRESENT/PASSED

---

## Phase 4: Testing the CI Workflow Locally

### Substep 4.1: Document local testing approach

For developers who want to test the CI workflow locally before pushing:

```bash
# Test non-interactive bootstrap in a clean Docker container
docker run --rm -it -v $(pwd):/workspace -w /workspace ubuntu:latest bash -c "
    apt-get update && apt-get install -y curl git sudo
    useradd -m testuser && echo 'testuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
    su - testuser -c 'cd /workspace && \
        SEVENTYSIX_ADMIN_EMAIL=test@test.local \
        SEVENTYSIX_ADMIN_PASSWORD=TestPassword123! \
        SEVENTYSIX_DB_PASSWORD=TestDb12345! \
        bash scripts/bootstrap.sh -SkipTests -SkipStart'
"
```

This simulates a clean Ubuntu environment without needing a full VM.

### Deliverables
- Docker-based local testing command documented in README or scripts/README.md

### Verification
- Command runs successfully in a clean Docker container
- Bootstrap completes without errors

---

> **CRITICAL — NO SKIPPING (REPEATED)**: All required test suites MUST run and pass before this implementation file is marked complete. NO EXCEPTIONS.