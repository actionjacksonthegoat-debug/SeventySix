# Implementation 3: Bootstrap UX Hardening

> **CRITICAL — NO SKIPPING**: All required test suites MUST run and pass before this implementation file is marked complete. NO EXCEPTIONS.

---

## Overview

Improve the interactive bootstrap experience for local users — better progress indicators, clearer error messages, graceful recovery from partial failures, and a prerequisite health dashboard. These changes make the existing script-based flow feel more like a polished installer without the trust/maintenance problems of an actual EXE.

---

## Phase 1: Structured Progress Output

### Substep 1.1: Add phase progress indicator to `bootstrap.ps1`

Replace the ad-hoc phase headers with a consistent progress format:

```powershell
function Write-Phase {
    param(
        [int]$Number,
        [int]$Total,
        [string]$Title
    )
    $bar = "█" * $Number + "░" * ($Total - $Number)
    Write-Host ""
    Write-Host "  [$bar] Phase $Number/$Total — $Title" -ForegroundColor Cyan
    Write-Host ""
}

# Usage:
$totalPhases = if ($SkipTests) { 6 } else { 8 }
Write-Phase -Number 1 -Total $totalPhases -Title "Checking Prerequisites"
# ... existing phase 1 code

Write-Phase -Number 2 -Total $totalPhases -Title "Collecting Secrets"
# ... existing phase 2 code
```

### Substep 1.2: Add elapsed time tracking

```powershell
$bootstrapStart = Get-Date

# At end of each phase:
$elapsed = (Get-Date) - $bootstrapStart
Write-Host "  Elapsed: $($elapsed.ToString('mm\:ss'))" -ForegroundColor DarkGray

# At final summary:
$totalTime = (Get-Date) - $bootstrapStart
Write-Host "  Total time: $($totalTime.ToString('mm\:ss'))" -ForegroundColor Green
```

### Deliverables
- Consistent phase progress indicator in `bootstrap.ps1`
- Elapsed time displayed after each phase

### Verification
- Run `bootstrap.ps1` and confirm visual progress bar renders correctly
- Times are accurate

---

## Phase 2: Prerequisite Health Dashboard

### Substep 2.1: Add summary table to `check-prerequisites.ps1`

After all tool checks, display a summary table instead of just individual OK/FAIL lines:

```powershell
# After all Assert-Tool calls, display a summary
Write-Host ""
Write-Host "  ┌──────────────────────┬──────────┬────────────┬────────────┐"
Write-Host "  │ Tool                 │ Status   │ Version    │ Required   │"
Write-Host "  ├──────────────────────┼──────────┼────────────┼────────────┤"
foreach ($result in $results) {
    $statusColor = if ($result.Status -eq 'OK') { 'Green' } elseif ($result.Status -eq 'WARN') { 'Yellow' } else { 'Red' }
    $line = "  │ {0,-20} │ {1,-8} │ {2,-10} │ {3,-10} │" -f $result.Name, $result.Status, $result.Version, $result.MinVersion
    Write-Host $line -ForegroundColor $statusColor
}
Write-Host "  └──────────────────────┴──────────┴────────────┴────────────┘"
```

### Substep 2.2: Collect results for summary

Modify `Assert-Tool` to return a result object instead of just printing:

```powershell
function Assert-Tool {
    param($tool)
    $result = @{ Name = $tool.Name; MinVersion = $tool.MinVersion.ToString(); Status = 'OK'; Version = 'unknown' }

    $current = Get-ToolVersion $tool
    if ($null -eq $current) {
        $result.Status = 'MISSING'
        # ... install logic
    } elseif ($current -lt $tool.MinVersion) {
        $result.Status = 'OUTDATED'
        $result.Version = $current.ToString()
        # ... upgrade logic
    } else {
        $result.Version = $current.ToString()
    }

    return $result
}

$results = foreach ($tool in $tools) { Assert-Tool $tool }
```

### Deliverables
- Pretty-printed summary table of all prerequisites
- Results collected as objects for summary display

### Verification
- Table renders correctly on Windows, Linux, macOS terminals
- All statuses (OK, MISSING, OUTDATED) display with correct colors

---

## Phase 3: Graceful Error Recovery

### Substep 3.1: Add retry logic to `bootstrap.ps1` for transient failures

Network operations (npm install, dotnet restore, winget install) can fail transiently. Add a retry helper:

```powershell
function Invoke-WithRetry {
    param(
        [scriptblock]$Command,
        [string]$Description,
        [int]$MaxRetries = 3,
        [int]$DelaySeconds = 5
    )
    for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
        try {
            & $Command
            if ($LASTEXITCODE -eq 0) { return }
        } catch { }

        if ($attempt -lt $MaxRetries) {
            Write-Host "  [RETRY] $Description failed (attempt $attempt/$MaxRetries). Retrying in $DelaySeconds seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
        }
    }
    Write-Error "$Description failed after $MaxRetries attempts."
    exit 1
}

# Usage:
Invoke-WithRetry -Description "npm install" -Command {
    Push-Location $repoRoot
    npm install
    Pop-Location
}
```

### Substep 3.2: Add partial-state detection

If bootstrap fails mid-way, detect what was already completed on re-run:

```powershell
function Get-BootstrapState {
    $state = @{
        SecretsConfigured = $false
        SslCertExists = $false
        DpCertExists = $false
        NpmInstalled = $false
        DotnetRestored = $false
    }

    # Check secrets
    try {
        Push-Location $apiProjectPath
        $secretOutput = & dotnet user-secrets list 2>$null
        $state.SecretsConfigured = ($secretOutput | Measure-Object).Count -ge 5
        Pop-Location
    } catch { try { Pop-Location } catch { } }

    # Check certs
    $state.SslCertExists = Test-Path (Join-Path $repoRoot "SeventySix.Client" "ssl" "dev-certificate.crt")
    $state.DpCertExists = Test-Path (Join-Path $repoRoot "SeventySix.Server" "SeventySix.Api" "keys" "dataprotection.pfx")

    # Check deps
    $state.NpmInstalled = Test-Path (Join-Path $repoRoot "node_modules")
    $state.DotnetRestored = Test-Path (Join-Path $repoRoot "SeventySix.Server" "SeventySix.Api" "obj")

    return $state
}

# On re-run, report what's already done
$state = Get-BootstrapState
if ($state.SecretsConfigured -or $state.SslCertExists) {
    Write-Host ""
    Write-Host "--- Previous Bootstrap State Detected ---" -ForegroundColor Yellow
    Write-Host "  Secrets:         $(if ($state.SecretsConfigured) { '[DONE]' } else { '[PENDING]' })"
    Write-Host "  SSL Certificate: $(if ($state.SslCertExists) { '[DONE]' } else { '[PENDING]' })"
    Write-Host "  DP Certificate:  $(if ($state.DpCertExists) { '[DONE]' } else { '[PENDING]' })"
    Write-Host "  NPM Packages:    $(if ($state.NpmInstalled) { '[DONE]' } else { '[PENDING]' })"
    Write-Host "  .NET Packages:   $(if ($state.DotnetRestored) { '[DONE]' } else { '[PENDING]' })"
    Write-Host ""
}
```

### Deliverables
- Retry logic for network operations (3 attempts with 5s delay)
- Partial-state detection and reporting on re-run

### Verification
- Simulate a network failure and confirm retry works
- Run bootstrap twice — second run shows previous state

---

## Phase 4: Improved Error Messages

### Substep 4.1: Error context helper

Replace generic "X failed" messages with actionable diagnostics:

> **Note**: The parameter name `$Error` is a **PowerShell automatic variable** — using it as a parameter name shadows the built-in and causes subtle bugs. Use `$ErrorMessage` instead.

```powershell
function Write-ErrorWithContext {
    param(
        [string]$Phase,
        [string]$ErrorMessage,
        [string]$Fix
    )
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║  BOOTSTRAP ERROR                            ║" -ForegroundColor Red
    Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Phase:  $Phase" -ForegroundColor Red
    Write-Host "  Error:  $ErrorMessage" -ForegroundColor Red
    Write-Host "  Fix:    $Fix" -ForegroundColor Yellow
    Write-Host ""
}

# Usage:
if ($LASTEXITCODE -ne 0) {
    Write-ErrorWithContext `
        -Phase "npm install" `
        -ErrorMessage "Package installation failed. This is usually a network issue." `
        -Fix "Check your internet connection and run: npm run bootstrap"
    exit 1
}
```

### Substep 4.2: Common failure patterns

Add specific error handling for known failure modes:

| Failure | Detection | Fix Message |
|---------|-----------|-------------|
| npm install fails | Exit code != 0 | "Check internet connection. Try: `npm cache clean --force` then re-run" |
| dotnet restore fails | Exit code != 0 | "Check internet connection. Verify .NET SDK: `dotnet --version`" |
| Docker not running | `docker info` fails | "Start Docker Desktop and wait for the whale icon to stop animating" |
| Port conflict | Specific error string | "Run `npm stop` to clean up, then retry" |
| SSL cert generation fails | Exit code != 0 | "Try manually: `npm run generate:ssl-cert`" |
| Winget not available | `where winget` fails | "Install tools manually — links provided above" |

### Deliverables
- `Write-ErrorWithContext` helper function
- Error-specific fix suggestions for all known failure modes

### Verification
- Error messages are actionable and tell the user exactly what to do
- No raw error dumps without context

---

## Phase 5: Enhanced Version Summary

### Substep 5.1: Update version summary with port map

Add a port reference table to the completion summary so users know where to go:

```powershell
Write-Host ""
Write-Host "  ┌────────────────────┬────────────────────────────────────────┐"
Write-Host "  │ Service            │ URL                                    │"
Write-Host "  ├────────────────────┼────────────────────────────────────────┤"
Write-Host "  │ Application        │ https://localhost:4200                 │"
Write-Host "  │ API Health         │ https://localhost:7074/health          │"
Write-Host "  │ API Docs           │ https://localhost:7074/scalar/v1       │"
Write-Host "  │ Grafana            │ https://localhost:3443                 │"
Write-Host "  │ Jaeger Tracing     │ https://localhost:16687                │"
Write-Host "  │ pgAdmin            │ https://localhost:5051                 │"
Write-Host "  └────────────────────┴────────────────────────────────────────┘"
```

### Deliverables
- Service URL table in completion summary

### Verification
- URLs match actual service ports in `docker-compose.yml`

---

## Phase 6: Documentation Updates

### Substep 6.1: Update README.md Quick Start

Restructure the Quick Start section to present a local-only two-option layout. There is **no Codespaces badge** — GitHub Codespaces is a repo-owner testing tool, not a developer recommendation.

```markdown
## Quick Start

**Prerequisites**: [VS Code](https://code.visualstudio.com/), [Docker Desktop](https://www.docker.com/products/docker-desktop/), [Git](https://git-scm.com/)

### Option 1: One Command (Recommended)
**Windows** (Command Prompt or PowerShell):
```cmd
scripts\bootstrap.cmd
```
**Linux/macOS** (Terminal):
```bash
./scripts/bootstrap.sh
```
The script installs all required tools, generates certificates, and configures the application.

### Option 2: Manual Setup
See [Startup Instructions](docs/Startup-Instructions.md) for step-by-step manual configuration.
```

### Substep 6.2: Add bootstrap testing documentation

Document how contributors can test bootstrap changes:

```markdown
## Testing Bootstrap Changes

Bootstrap changes are automatically tested on clean VMs via the
`Bootstrap Smoke Test` GitHub Actions workflow. This runs on every PR
that touches `scripts/` or `.devcontainer/`.

To test locally in a clean container:
\`\`\`bash
docker run --rm -it -v $(pwd):/workspace -w /workspace ubuntu:latest \
    bash -c "apt-get update && apt-get install -y curl git sudo && \
    bash scripts/bootstrap.sh -SkipTests -SkipStart"
\`\`\`
```

### Deliverables
- README.md with tiered Quick Start
- Bootstrap testing documentation

### Verification
- All links and commands are accurate
- Tiers are clearly differentiated

---

> **CRITICAL — NO SKIPPING (REPEATED)**: All required test suites MUST run and pass before this implementation file is marked complete. NO EXCEPTIONS.