# wait-for-api.ps1
# Waits for the seventysix-api container to become healthy or detect startup failure.
# Exits with error code if container fails to start (e.g., migration errors).

param(
	[int]$TimeoutSeconds = 120,
	[int]$PollIntervalSeconds = 3
)

$containerName = "seventysix-api-dev"
$startTime = Get-Date
$timeout = New-TimeSpan -Seconds $TimeoutSeconds

Write-Host "Waiting for $containerName to become healthy..." -ForegroundColor Cyan

while ((Get-Date) - $startTime -lt $timeout) {
	# Get container status
	$containerJson = docker inspect $containerName 2>$null | ConvertFrom-Json

	if (-not $containerJson) {
		Write-Host "  Container not found yet, waiting..." -ForegroundColor Yellow
		Start-Sleep -Seconds $PollIntervalSeconds
		continue
	}

	$state = $containerJson[0].State
	$status = $state.Status
	$exitCode = $state.ExitCode
	$running = $state.Running

	# Check if container has exited (startup failure)
	if ($status -eq "exited" -or (-not $running -and $exitCode -ne 0)) {
		Write-Host ""
		Write-Host "===================================================================" -ForegroundColor Red
		Write-Host "  CONTAINER STARTUP FAILED" -ForegroundColor Red
		Write-Host "===================================================================" -ForegroundColor Red
		Write-Host "  Status: $status | Exit Code: $exitCode" -ForegroundColor Red
		Write-Host ""
		Write-Host "  Container logs (last 50 lines):" -ForegroundColor Yellow
		Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
		docker logs --tail 50 $containerName 2>&1
		Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
		Write-Host ""
		Write-Host "  To view full logs: docker logs $containerName" -ForegroundColor Cyan
		Write-Host "===================================================================" -ForegroundColor Red
		exit 1
	}

	# Check if container is restarting (indicates repeated failures)
	if ($status -eq "restarting") {
		$restartCount = $containerJson[0].RestartCount
		if ($restartCount -gt 2) {
			Write-Host ""
			Write-Host "===================================================================" -ForegroundColor Red
			Write-Host "  CONTAINER STUCK IN RESTART LOOP (Restarted $restartCount times)" -ForegroundColor Red
			Write-Host "===================================================================" -ForegroundColor Red
			Write-Host ""
			Write-Host "  Container logs (last 50 lines):" -ForegroundColor Yellow
			Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
			docker logs --tail 50 $containerName 2>&1
			Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
			Write-Host ""
			Write-Host "  Stopping container to prevent infinite restarts..." -ForegroundColor Yellow
			docker stop $containerName 2>$null
			Write-Host "  To view full logs: docker logs $containerName" -ForegroundColor Cyan
			Write-Host "===================================================================" -ForegroundColor Red
			exit 1
		}
		Write-Host "  Container restarting (attempt $restartCount), waiting..." -ForegroundColor Yellow
		Start-Sleep -Seconds $PollIntervalSeconds
		continue
	}

	# Check health status if running
	if ($running) {
		$healthState = $containerJson[0].State.Health

		if ($healthState) {
			$healthStatus = $healthState.Status

			if ($healthStatus -eq "healthy") {
				Write-Host ""
				Write-Host "  API container is healthy" -ForegroundColor Green
				Write-Host ""
				exit 0
			}
			elseif ($healthStatus -eq "unhealthy") {
				Write-Host ""
				Write-Host "===================================================================" -ForegroundColor Red
				Write-Host "  CONTAINER HEALTH CHECK FAILED" -ForegroundColor Red
				Write-Host "===================================================================" -ForegroundColor Red
				Write-Host ""
				Write-Host "  Container logs (last 50 lines):" -ForegroundColor Yellow
				Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
				docker logs --tail 50 $containerName 2>&1
				Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
				exit 1
			}
			else {
				# starting or other health status
				$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
				Write-Host "  Health: $healthStatus (${elapsed}s elapsed)" -ForegroundColor Yellow
			}
		}
		else {
			# No health check defined, check if we can reach the health endpoint
			try {
				$response = Invoke-WebRequest -Uri "https://localhost:7074/health/live" -UseBasicParsing -TimeoutSec 5 -SkipCertificateCheck -ErrorAction SilentlyContinue
				if ($response.StatusCode -eq 200) {
					Write-Host ""
					Write-Host "  API is responding" -ForegroundColor Green
					Write-Host ""
					exit 0
				}
			}
			catch {
				$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
				Write-Host "  Waiting for API to respond (${elapsed}s elapsed)..." -ForegroundColor Yellow
			}
		}
	}

	Start-Sleep -Seconds $PollIntervalSeconds
}

# Timeout reached
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Red
Write-Host "  TIMEOUT: Container did not become healthy within $TimeoutSeconds seconds" -ForegroundColor Red
Write-Host "===================================================================" -ForegroundColor Red
Write-Host ""
Write-Host "  Container logs (last 50 lines):" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
docker logs --tail 50 $containerName 2>&1
Write-Host "-------------------------------------------------------------------" -ForegroundColor DarkGray
exit 1
