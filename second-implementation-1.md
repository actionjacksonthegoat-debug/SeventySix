# Implementation 1: Dev Container (Owner Testing Tool) & Non-Interactive Bootstrap

> **CRITICAL — NO SKIPPING**: All required test suites MUST run and pass before this implementation file is marked complete. NO EXCEPTIONS.

---

## Overview

Create a Dev Container configuration **for the repo owner's use only** to simulate a clean Ubuntu new-user install without setting up a local VM. This is a QA tool to verify the bootstrap script works on a fresh machine, not a recommended path for developers.

**The required developer path is and always will be:**
> Local VS Code + Docker Desktop + `scripts\bootstrap.cmd` (Windows) or `./scripts/bootstrap.sh` (Linux/macOS)

GitHub Codespaces is NOT recommended to contributors. It is a potential cost item and a cloud dependency that developers should not need. No Codespaces badge or recommendation will appear in README.md or Startup-Instructions.md.

### How the Owner Uses This for Clean-Environment Testing

Testing the bootstrap on a "clean machine" requires an OS environment with nothing pre-installed. There are three tools for this, one per platform:

| Platform | Tool | How Clean | Cost | Notes |
|----------|------|-----------|------|-------|
| **Ubuntu** | GitHub Codespace | Guaranteed fresh Ubuntu VM | Free tier: 120 core-hours/month | Owner creates a Codespace on demand, runs bootstrap, deletes it |
| **Windows** | GitHub Actions `windows-latest` runner | Guaranteed fresh Windows Server VM | Free for public repo (unlimited minutes) | Automated via `bootstrap-test.yml` workflow |
| **macOS** | GitHub Actions `macos-latest` runner | Guaranteed fresh macOS VM | Free for public repo (unlimited minutes) | Automated via `bootstrap-test.yml` workflow |

The Dev Container in this file powers the **Ubuntu Codespace path only**. Windows and macOS are handled by implementation-2.md.

### How to Set Up a Codespace for Ubuntu Testing

This is a step-by-step walkthrough for the **repo owner** to simulate a brand-new Ubuntu user:

1. Go to `https://github.com/actionjacksonthegoat-debug/SeventySix`
2. Click the green **`< > Code`** button
3. Click the **Codespaces** tab
4. Click **"Create codespace on [branch]"** (use `master` or the branch being tested)
5. GitHub provisions a fresh Ubuntu VM, clones the repo, and opens VS Code in your browser
6. Wait for the Dev Container to build (≈2–5 minutes on first run; cached on subsequent runs)
7. When the terminal is ready, set your test secrets as environment variables:
   ```bash
   export SEVENTYSIX_ADMIN_EMAIL="owner-test@example.com"
   export SEVENTYSIX_ADMIN_PASSWORD="TestPassword123!"
   export SEVENTYSIX_DB_PASSWORD="TestDb123!"
   ```
8. Run the bootstrap as a new user would:
   ```bash
   bash scripts/bootstrap.sh -SkipTests -SkipStart
   ```
9. Observe the output — verify each phase completes, all tools install, certs generate
10. **When done testing, delete the Codespace** to avoid consuming free-tier hours:
    - Go to `https://github.com/codespaces`
    - Find your SeventySix Codespace
    - Click `⋯` → **Delete**

> **Cost awareness**: The free tier gives 120 core-hours/month (2-core machines). A single bootstrap test takes ≈5 minutes, so you can run ≈1,400 tests/month on the free tier before any charges. Delete Codespaces promptly after testing to preserve hours.

### Why NOT GitHub Codespaces for Developers

- Costs money beyond the free tier if usage grows
- Requires a stable internet connection to develop
- Docker-in-Docker inside Codespaces is slower than native Docker Desktop
- The app uses HTTPS with self-signed certs — browser trust issues compound in a cloud-hosted environment
- Local VS Code + Docker Desktop is a superior development experience

---

## Phase 1: Dev Container Dockerfile

### Substep 1.1: Create `.devcontainer/Dockerfile`

Build a multi-tool image based on Microsoft's universal dev container image, adding the project-specific prerequisites.

**File**: `.devcontainer/Dockerfile`

```dockerfile
# Dev container for SeventySix — all prerequisites pre-installed
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Versions (match project requirements)
ARG DOTNET_VERSION=10.0
ARG NODE_VERSION=22

# Install .NET SDK
RUN wget https://dot.net/v1/dotnet-install.sh -O /tmp/dotnet-install.sh \
    && chmod +x /tmp/dotnet-install.sh \
    && /tmp/dotnet-install.sh --channel ${DOTNET_VERSION} --install-dir /usr/share/dotnet \
    && ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet \
    && rm /tmp/dotnet-install.sh

ENV DOTNET_ROOT=/usr/share/dotnet
ENV PATH="${PATH}:/usr/share/dotnet"

# Install Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Install PowerShell (needed for project scripts)
# Must add Microsoft's package repository first — apt-get install powershell alone silently fails
RUN apt-get update \
    && apt-get install -y wget apt-transport-https software-properties-common \
    && wget -q https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y powershell \
    && rm -rf /var/lib/apt/lists/*

# Docker-in-Docker is provided by the devcontainer feature — no manual install needed

ENV DOTNET_CLI_TELEMETRY_OPTOUT=1
ENV DOTNET_NOLOGO=1
```

### Substep 1.2: Create `.devcontainer/devcontainer.json`

**File**: `.devcontainer/devcontainer.json`

```jsonc
{
    "name": "SeventySix Development",
    "build": {
        "dockerfile": "Dockerfile"
    },
    "features": {
        // Docker-in-Docker so we can run docker compose inside the container
        "ghcr.io/devcontainers/features/docker-in-docker:2": {
            "dockerDashComposeVersion": "v2"
        }
    },
    "forwardPorts": [4200, 5433, 7074, 3443, 16687, 5051],
    "portsAttributes": {
        "4200": { "label": "Angular Client", "onAutoForward": "openBrowser" },
        "7074": { "label": "API (HTTPS)" },
        "5433": { "label": "PostgreSQL" },
        "3443": { "label": "Grafana" },
        "16687": { "label": "Jaeger" },
        "5051": { "label": "pgAdmin" }
    },
    "postCreateCommand": "bash .devcontainer/post-create.sh",
    "postStartCommand": "bash .devcontainer/post-start.sh",
    "customizations": {
        "vscode": {
            "extensions": [
                "ms-dotnettools.csdevkit",
                "Angular.ng-template",
                "dbaeumer.vscode-eslint",
                "GitHub.copilot",
                "GitHub.copilot-chat",
                "ms-azuretools.vscode-docker"
            ],
            "settings": {
                "terminal.integrated.defaultProfile.linux": "pwsh",
                "files.insertFinalNewline": false
            }
        }
    },
    "remoteUser": "vscode"
}
```

### Deliverables
- `.devcontainer/Dockerfile` builds successfully
- `.devcontainer/devcontainer.json` is valid JSON

### Verification
- `docker build -f .devcontainer/Dockerfile .devcontainer/` succeeds
- JSON lints cleanly

---

## Phase 2: Lifecycle Scripts

### Substep 2.1: Post-Create Script (runs once after container creation)

**File**: `.devcontainer/post-create.sh`

This runs ONCE when the container is first created (Codespace or local). It installs dependencies and generates default secrets.

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  SeventySix Dev Container Setup"
echo "  Installing dependencies..."
echo "========================================"

# Use GITHUB_WORKSPACE in Codespaces, fall back to the script's own directory tree
# This works for both Codespaces (/workspaces/<repo>) and local dev containers (any path)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Install all npm dependencies (root + client + load-testing)
npm install

# Restore .NET packages
cd SeventySix.Server
dotnet restore SeventySix.Server.slnx
cd ..

# Generate certificates (non-interactive — uses defaults)
pwsh -ExecutionPolicy Bypass -File scripts/generate-dev-ssl-cert.ps1
pwsh -ExecutionPolicy Bypass -File scripts/generate-dataprotection-cert.ps1

echo ""
echo "========================================"
echo "  Dependencies installed!"
echo "  Run the secrets setup next:"
echo "    pwsh scripts/bootstrap.ps1 -SkipTests"
echo "  Or for a zero-config start:"
echo "    npm start"
echo "========================================"
```

### Substep 2.2: Post-Start Script (runs on every container start)

**File**: `.devcontainer/post-start.sh`

This runs on every container start — just a lightweight check.

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "SeventySix Dev Container ready."
echo ""
echo "Quick commands:"
echo "  npm start          — Start full dev stack"
echo "  npm test           — Run all unit tests"
echo "  npm run test:e2e   — Run E2E tests (isolated Docker)"
echo "  npm run bootstrap  — Full setup with secrets collection"
echo ""

# Verify Docker is available (Docker-in-Docker feature)
if docker info &>/dev/null; then
    echo "[OK] Docker is available inside the container."
else
    echo "[WARN] Docker is not available. Some features may not work."
fi
```

### Deliverables
- `.devcontainer/post-create.sh` — dependency installation
- `.devcontainer/post-start.sh` — lightweight startup message

### Verification
- Scripts are executable (`chmod +x`)
- No hardcoded secrets or paths

---

## Phase 3: Non-Interactive Secrets (CI and Owner Testing)

The non-interactive mode is used by two audiences:
- **The CI workflow** (implementation-2.md) — `bootstrap-test.yml` on GitHub Actions runners
- **The repo owner's Codespace** — testing a clean Ubuntu install

Neither of these should ever block on `Read-Host` prompts.

### Substep 3.1: Support Non-Interactive Secret Generation

**Modify**: `scripts/internal/collect-secrets.ps1`

Add Codespace environment variable detection at the top of the script, before interactive prompts:

```powershell
# Detect Codespace environment — use env vars instead of prompts
if ($env:CODESPACES -eq 'true' -or $NonInteractive) {
    Write-Host "[INFO] Non-interactive mode detected. Using environment variables or defaults." -ForegroundColor Yellow

    $adminEmail = if ($env:SEVENTYSIX_ADMIN_EMAIL) { $env:SEVENTYSIX_ADMIN_EMAIL } else { "admin@seventysix.local" }
    $adminPassword = if ($env:SEVENTYSIX_ADMIN_PASSWORD) { $env:SEVENTYSIX_ADMIN_PASSWORD } else { New-RandomString -Length 16 }
    $dbPassword = if ($env:SEVENTYSIX_DB_PASSWORD) { $env:SEVENTYSIX_DB_PASSWORD } else { New-RandomString -Length 16 }
    $smtpUsername = "PLACEHOLDER_USE_USER_SECRETS"
    $smtpPassword = "PLACEHOLDER_USE_USER_SECRETS"
    $fromAddress = "PLACEHOLDER_USE_USER_SECRETS"
    $githubClientId = "PLACEHOLDER_USE_USER_SECRETS"
    $githubClientSecret = "PLACEHOLDER_USE_USER_SECRETS"
    $dataProtectionPassword = New-RandomString -Length 16
    # Skip to writing secrets — bypass ALL interactive prompts including the overwrite guard below
    $skipInteractive = $true
}

# IMPORTANT: The existing-secrets overwrite prompt (Read-Host "Overwrite with new values? (y/N)") must
# be short-circuited when $skipInteractive is set, or it will hang CI and Codespace runs.
# Pattern: wrap the prompt block in `if (-not $skipInteractive) { ... } else { <skip/overwrite> }`
```

### Substep 3.2: Owner Testing Environment Variables

When the owner runs a Codespace test, these environment variables feed the non-interactive bootstrap. They can also be set as Codespace secrets in the repo for convenience (GitHub → Settings → Secrets → Codespaces):

| Variable | Purpose | Required? |
|----------|---------|----------|
| `SEVENTYSIX_ADMIN_EMAIL` | Admin account email for the test run | No (defaults to `admin@seventysix.local`) |
| `SEVENTYSIX_ADMIN_PASSWORD` | Admin account password | No (auto-generated 16-char random) |
| `SEVENTYSIX_DB_PASSWORD` | PostgreSQL password | No (auto-generated 16-char random) |

These are ephemeral test values. The Codespace VM is discarded after testing.

### Deliverables
- `collect-secrets.ps1` detects `$env:CODESPACES` and `$env:CI` to skip prompts
- `collect-secrets.ps1` supports `-NonInteractive` flag with secure random defaults
- Overwrite guard is bypassed in non-interactive mode (does not hang)

### Verification
- Running `collect-secrets.ps1 -NonInteractive` completes without any `Read-Host` calls
- Generated passwords meet minimum length requirements
- No secrets are printed to stdout

---

## Phase 4: Owner Testing Verification

This phase documents how the repo owner verifies the Dev Container config works as a clean-install test environment. This is NOT about developer onboarding.

### Substep 4.1: Verify Dev Container builds

```bash
# From repo root — ensures the image builds cleanly before creating a Codespace
docker build -f .devcontainer/Dockerfile -t seventysix-devcontainer-test .devcontainer/
docker run --rm seventysix-devcontainer-test bash -c "
    dotnet --version && \
    node --version && \
    npm --version && \
    pwsh --version && \
    echo '[PASS] All tools present in clean container'
"
```

### Substep 4.2: Verify non-interactive bootstrap completes in container

```bash
# Simulates what the Codespace post-create script does
docker run --rm -v $(pwd):/workspace -w /workspace seventysix-devcontainer-test bash -c "
    export SEVENTYSIX_ADMIN_EMAIL='owner-test@example.com' && \
    export SEVENTYSIX_ADMIN_PASSWORD='TestPassword123!' && \
    export SEVENTYSIX_DB_PASSWORD='TestDb123!' && \
    bash scripts/bootstrap.sh -SkipTests -SkipStart
"
# Should complete without any prompts, all phases PASS
```

### Substep 4.3: README.md — no Codespaces content

**VERIFY** that README.md Quick Start section:
- Has NO `Open in GitHub Codespaces` badge or link
- Presents exactly two paths: Windows bootstrap and Linux/macOS bootstrap
- Refers to local VS Code + Docker Desktop as the expected environment

### Deliverables
- Dev Container image builds and contains all required tools
- Non-interactive bootstrap completes end-to-end inside the container
- README.md has NO Codespaces badge or recommendation

### Verification
- `docker build` exits 0
- Bootstrap inside container exits 0 with no prompts
- `grep -r 'codespaces.new\|Codespaces badge' README.md` returns nothing

---

## Phase 5: Full Verification Checklist

### Substep 5.1: Dev Container tool verification

```bash
# Confirm all tools are present at the required versions
dotnet --version   # must show 10.x
node --version     # must show v22.x
npm --version      # must show 10.x
pwsh --version     # must show 7.4+
docker --version   # must be available (Docker-in-Docker feature)
```

### Substep 5.2: Non-interactive bootstrap round-trip

```bash
# Run as if CI or owner testing
pwsh scripts/bootstrap.ps1 -SkipTests -SkipStart -NonInteractive
# Must complete with zero prompts and exit code 0
```

### Substep 5.3: Confirm documentation is clean

```bash
# These greps must return NOTHING — no Codespaces recommendations in user-facing docs
grep -r 'codespaces.new' README.md
grep -r 'Codespaces badge' README.md
grep -r 'Zero Install.*Browser' README.md
grep -r 'Option 0.*Codespace' docs/Startup-Instructions.md
```

### Substep 5.4: Confirm Appendix A file count

Only these files should exist in `.devcontainer/` — no `post-start.sh` (that was only needed for the developer-path Codespace, which we are NOT building):

- `.devcontainer/Dockerfile` — image definition
- `.devcontainer/devcontainer.json` — container config
- `.devcontainer/post-create.sh` — installs deps on creation

---

> **CRITICAL — NO SKIPPING (REPEATED)**: All required test suites MUST run and pass before this implementation file is marked complete. NO EXCEPTIONS.