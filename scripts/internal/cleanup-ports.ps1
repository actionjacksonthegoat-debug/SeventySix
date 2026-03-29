# cleanup-ports.ps1

# Terminates any processes (node, dotnet, cmd) holding local development ports
# This ensures clean state before starting dev servers
#
# SCOPE: Dev-only. E2E (4201) and LoadTest (4202) ports are Docker containers
#        managed by their respective compose files — never cleaned here.
#
# Usage:
#   .\scripts\internal\cleanup-ports.ps1
#   .\scripts\internal\cleanup-ports.ps1 -Quiet
#
# Ports cleaned:
#   3001  - SeventySixCommerce SvelteKit dev server (Vite)
#   3002  - SeventySixCommerce TanStack dev server (Vite)
#   4200  - Angular dev server (ng serve, spawned by start-dev.ps1)
#   5086  - Legacy API HTTP (no longer used, kept for safety)

param(
	[switch]$Quiet
)

$ErrorActionPreference = "Continue"

# Ports used by local dev processes (NOT Docker containers)
# - 3001: SeventySixCommerce SvelteKit dev server (Vite)
# - 3002: SeventySixCommerce TanStack dev server (Vite)
# - 4200: Angular dev server (ng serve, spawned by start-dev.ps1)
# - 5086: Legacy API HTTP (no longer used, kept for safety)
# NEVER add E2E (4201) or LoadTest (4202) — those are Docker containers
$portsToClean = @(3001, 3002, 4200, 5086)

# Process names we're allowed to terminate (safety - do not terminate system processes)
$allowedProcessNames = @("node", "dotnet", "ng", "cmd", "powershell", "pwsh")

if (-not $Quiet) {
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Cyan
	Write-Host "  Port Cleanup" -ForegroundColor Cyan
	Write-Host "========================================" -ForegroundColor Cyan
	Write-Host ""
}

$terminatedAny = $false

foreach ($port in $portsToClean) {
	try {
		if ($IsWindows) {
			# Find processes listening on this port (exclude Docker - those are handled separately)
			$connections =
			Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
			Where-Object {
				$proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
				$proc -and $proc.ProcessName -notmatch "docker|com\.docker"
			}

			foreach ($conn in $connections) {
				$proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
				if ($proc) {
					$procName = $proc.ProcessName.ToLower()

					# Safety check - only terminate known development processes
					$isAllowed = $allowedProcessNames | Where-Object { $procName -like "*$_*" }

					if ($isAllowed) {
						if (-not $Quiet) {
							Write-Host "Terminating $($proc.ProcessName) (ProcessId: $($proc.Id)) on port $port" -ForegroundColor Yellow
						}
						Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
						$terminatedAny = $true
					}
					else {
						if (-not $Quiet) {
							Write-Host "Skipping $($proc.ProcessName) on port $port (not in allowed list)" -ForegroundColor DarkGray
						}
					}
				}
			}
		}
		elseif ($IsLinux -or $IsMacOS) {
			# Use lsof via shell to find listener process IDs and terminate them.
			$listenerIdLines =
			@(& bash -lc "lsof -ti :$port 2>/dev/null")

			foreach ($listenerIdLine in $listenerIdLines) {
				if ($listenerIdLine -notmatch '^\d+$') {
					continue
				}

				$listenerProcessId = [int]$listenerIdLine

				if (-not $Quiet) {
					Write-Host "Terminating process ID $listenerProcessId on port $port" -ForegroundColor Yellow
				}

				Stop-Process -Id $listenerProcessId -Force -ErrorAction SilentlyContinue
				$terminatedAny = $true
			}
		}
	}
	catch {
		# Port not in use or access denied - that's fine
	}
}

# Terminate orphaned shell windows running Angular client (Windows only)
# On Linux, Angular processes are caught by the lsof port cleanup above
if ($IsWindows) {
	$angularPowerShellTerminals =
	Get-Process -Name @("powershell", "pwsh") -ErrorAction SilentlyContinue |
	Where-Object {
		$commandLine =
		(Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
		$commandLine -and ($commandLine -match "npm\s+start" -or $commandLine -match "ng\s+serve")
	}

	foreach ($terminal in $angularPowerShellTerminals) {
		if (-not $Quiet) {
			Write-Host "Terminating Angular PowerShell terminal ($($terminal.ProcessName), ProcessId: $($terminal.Id))" -ForegroundColor Yellow
		}
		Stop-Process -Id $terminal.Id -Force -ErrorAction SilentlyContinue
		$terminatedAny = $true
	}

	# Terminate orphaned cmd.exe windows that may be hosting Angular client processes.
	# start-dev.ps1 currently launches via pwsh, but npm tooling can still spawn cmd wrappers.
	# Only match `npm start` — DO NOT match "SeventySix.Client" alone, as that
	# would also terminate the cmd.exe wrapper npm uses for E2E test scripts.
	$angularCmdTerminals =
	Get-Process cmd -ErrorAction SilentlyContinue |
	Where-Object {
		$commandLine =
		(Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
		$commandLine -and ($commandLine -match "npm\s+start" -or $commandLine -match "ng\s+serve")
	}

	foreach ($cmdTerminal in $angularCmdTerminals) {
		if (-not $Quiet) {
			Write-Host "Terminating Angular cmd terminal (ProcessId: $($cmdTerminal.Id))" -ForegroundColor Yellow
		}
		Stop-Process -Id $cmdTerminal.Id -Force -ErrorAction SilentlyContinue
		$terminatedAny = $true
	}
}

if (-not $Quiet) {
	if ($terminatedAny) {
		Write-Host ""
		Write-Host "Port cleanup complete" -ForegroundColor Green
	}
	else {
		Write-Host "No processes to clean up" -ForegroundColor DarkGray
	}
	Write-Host ""
}
