# cleanup-ports.ps1
# Kills any processes (node, dotnet, cmd) holding local development ports
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
#   4200  - Angular dev server (ng serve, spawned by start-dev.ps1)
#   5086  - Legacy API HTTP (no longer used, kept for safety)

param(
	[switch]$Quiet
)

$ErrorActionPreference = "Continue"

# Ports used by local dev processes (NOT Docker containers)
# - 4200: Angular dev server (ng serve, spawned by start-dev.ps1)
# - 5086: Legacy API HTTP (no longer used, kept for safety)
# NEVER add E2E (4201) or LoadTest (4202) — those are Docker containers
$portsToClean = @(4200, 5086)

# Process names we're allowed to kill (safety - don't kill system processes)
# Include 'cmd' since Angular is launched via `cmd /k npm start`
$allowedProcessNames = @("node", "dotnet", "ng", "cmd")

if (-not $Quiet) {
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Cyan
	Write-Host "  Port Cleanup" -ForegroundColor Cyan
	Write-Host "========================================" -ForegroundColor Cyan
	Write-Host ""
}

$killedAny = $false

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

					# Safety check - only kill known development processes
					$isAllowed = $allowedProcessNames | Where-Object { $procName -like "*$_*" }

					if ($isAllowed) {
						if (-not $Quiet) {
							Write-Host "Killing $($proc.ProcessName) (PID: $($proc.Id)) on port $port" -ForegroundColor Yellow
						}
						Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
						$killedAny = $true
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
			# Use lsof to find PIDs listening on the port, then kill them
			$pids = & lsof -ti ":$port" 2>/dev/null
			foreach ($pid in ($pids -split "`n" | Where-Object { $_ -match '^\d+$' })) {
				if (-not $Quiet) {
					Write-Host "Killing process PID $pid on port $port" -ForegroundColor Yellow
				}
				& kill -9 $pid 2>/dev/null
				$killedAny = $true
			}
		}
	}
	catch {
		# Port not in use or access denied - that's fine
	}
}

# Kill orphaned PowerShell/cmd windows running Angular client (Windows only)
# On Linux, Angular processes are caught by the lsof port cleanup above
if ($IsWindows) {
	$angularTerminals =
	Get-Process powershell -ErrorAction SilentlyContinue |
	Where-Object {
		$commandLine =
		(Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
		$commandLine -and ($commandLine -match "npm\s+start" -or $commandLine -match "ng\s+serve")
	}

	foreach ($terminal in $angularTerminals) {
		if (-not $Quiet) {
			Write-Host "Killing Angular PowerShell terminal (PID: $($terminal.Id))" -ForegroundColor Yellow
		}
		Stop-Process -Id $terminal.Id -Force -ErrorAction SilentlyContinue
		$killedAny = $true
	}

	# Kill orphaned cmd.exe windows running Angular client (spawned by start-dev.ps1)
	# The script uses `cmd /k npm start` which creates a cmd.exe process
	# Only match `npm start` — DO NOT match "SeventySix.Client" alone, as that
	# would also kill the cmd.exe wrapper npm uses for E2E test scripts.
	$angularCmdTerminals =
	Get-Process cmd -ErrorAction SilentlyContinue |
	Where-Object {
		$commandLine =
		(Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
		$commandLine -and ($commandLine -match "npm\s+start" -or $commandLine -match "ng\s+serve")
	}

	foreach ($cmdTerminal in $angularCmdTerminals) {
		if (-not $Quiet) {
			Write-Host "Killing Angular cmd terminal (PID: $($cmdTerminal.Id))" -ForegroundColor Yellow
		}
		Stop-Process -Id $cmdTerminal.Id -Force -ErrorAction SilentlyContinue
		$killedAny = $true
	}
}

if (-not $Quiet) {
	if ($killedAny) {
		Write-Host ""
		Write-Host "Port cleanup complete" -ForegroundColor Green
	}
	else {
		Write-Host "No processes to clean up" -ForegroundColor DarkGray
	}
	Write-Host ""
}
