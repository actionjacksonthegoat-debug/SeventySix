# cleanup-ports.ps1
# Kills any processes (node, dotnet, cmd) holding development/test ports
# This ensures clean state before starting servers or running E2E tests
#
# Usage:
#   .\scripts\cleanup-ports.ps1
#   .\scripts\cleanup-ports.ps1 -Quiet
#
# Ports cleaned:
#   4200  - Angular client (dev server)
#   7074  - API HTTPS (development)
#   5086  - API HTTP (E2E only)

param(
	[switch]$Quiet
)

$ErrorActionPreference = "Continue"

# Ports used by our development and E2E environments
$portsToClean = @(4200, 7074, 5086)

# Process names we're allowed to kill (safety - don't kill system processes)
# Include 'cmd' since Angular is launched via `cmd /k npm start`
$allowedProcessNames = @("node", "dotnet", "ng", "cmd")

if (-not $Quiet)
{
	Write-Host ""
	Write-Host "========================================" -ForegroundColor Cyan
	Write-Host "  Port Cleanup" -ForegroundColor Cyan
	Write-Host "========================================" -ForegroundColor Cyan
	Write-Host ""
}

$killedAny = $false

foreach ($port in $portsToClean)
{
	try
	{
		# Find processes listening on this port (exclude Docker - those are handled separately)
		$connections =
			Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
			Where-Object {
				$proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
				$proc -and $proc.ProcessName -notmatch "docker|com\.docker"
			}

		foreach ($conn in $connections)
		{
			$proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
			if ($proc)
			{
				$procName = $proc.ProcessName.ToLower()

				# Safety check - only kill known development processes
				$isAllowed = $allowedProcessNames | Where-Object { $procName -like "*$_*" }

				if ($isAllowed)
				{
					if (-not $Quiet)
					{
						Write-Host "Killing $($proc.ProcessName) (PID: $($proc.Id)) on port $port" -ForegroundColor Yellow
					}
					Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
					$killedAny = $true
				}
				else
				{
					if (-not $Quiet)
					{
						Write-Host "Skipping $($proc.ProcessName) on port $port (not in allowed list)" -ForegroundColor DarkGray
					}
				}
			}
		}
	}
	catch
	{
		# Port not in use or access denied - that's fine
	}
}

# Kill orphaned PowerShell windows running Angular client
# These are spawned by start-dev.ps1 and may remain open after Node is killed
$angularTerminals =
	Get-Process powershell -ErrorAction SilentlyContinue |
	Where-Object {
		$commandLine =
			(Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
		$commandLine -and ($commandLine -match "npm\s+start" -or $commandLine -match "ng\s+serve")
	}

foreach ($terminal in $angularTerminals)
{
	if (-not $Quiet)
	{
		Write-Host "Killing Angular PowerShell terminal (PID: $($terminal.Id))" -ForegroundColor Yellow
	}
	Stop-Process -Id $terminal.Id -Force -ErrorAction SilentlyContinue
	$killedAny = $true
}

# Kill orphaned cmd.exe windows running Angular client (spawned by start-dev.ps1)
# The script uses `cmd /k npm start` which creates a cmd.exe process
$angularCmdTerminals =
	Get-Process cmd -ErrorAction SilentlyContinue |
	Where-Object {
		$commandLine =
			(Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
		$commandLine -and ($commandLine -match "npm\s+start" -or $commandLine -match "SeventySix\.Client")
	}

foreach ($cmdTerminal in $angularCmdTerminals)
{
	if (-not $Quiet)
	{
		Write-Host "Killing Angular cmd terminal (PID: $($cmdTerminal.Id))" -ForegroundColor Yellow
	}
	Stop-Process -Id $cmdTerminal.Id -Force -ErrorAction SilentlyContinue
	$killedAny = $true
}

if (-not $Quiet)
{
	if ($killedAny)
	{
		Write-Host ""
		Write-Host "Port cleanup complete" -ForegroundColor Green
	}
	else
	{
		Write-Host "No processes to clean up" -ForegroundColor DarkGray
	}
	Write-Host ""
}
