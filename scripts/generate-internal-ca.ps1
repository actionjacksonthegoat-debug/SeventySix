#Requires -Version 7.4
<#
.SYNOPSIS
    Generates an internal CA and service certificates for Docker mTLS.

.DESCRIPTION
    Creates a self-signed root CA and issues server/client certificates for
    internal Docker service communication. Certificates are stored in docker/certs/.

    Services covered:
    - postgres   (server cert)
    - valkey     (server cert)
    - otel-collector (server cert)
    - jaeger     (server cert)
    - prometheus (server cert)
    - grafana    (server cert)
    - api        (client cert — connects to postgres, valkey, otel-collector)
    - otel-client (client cert — otel-collector connects to jaeger, prometheus)
    - nginx-proxy (client cert — connects to grafana, jaeger, prometheus)

.PARAMETER Force
    Regenerate all certificates even if they already exist.

.PARAMETER SkipClient
    Skip generating client certificates (server certs only).

.EXAMPLE
    scripts/generate-internal-ca.ps1
    scripts/generate-internal-ca.ps1 -Force
#>

[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$SkipClient
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptRoot = $PSScriptRoot
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $scriptRoot '..'))
$certsDir = Join-Path $repoRoot 'docker' 'certs'

# CA configuration
$caLifetimeDays = 3650  # 10 years
$certLifetimeDays = 365 # 1 year

# Services requiring server certificates (key = folder name, value = SANs)
$serverCerts = [ordered]@{
    'postgres'       = @('postgres', 'postgres-e2e', 'postgres-loadtest', 'postgres-dast', 'database', 'localhost')
    'valkey'         = @('valkey', 'valkey-e2e', 'valkey-loadtest', 'valkey-dast', 'localhost')
    'otel-collector' = @('otel-collector', 'localhost')
    'jaeger'         = @('jaeger', 'localhost')
    'prometheus'     = @('prometheus', 'localhost')
    'grafana'        = @('grafana', 'localhost')
}

# Services requiring client certificates
$clientCerts = [ordered]@{
    'api'           = @('api', 'api-e2e', 'api-loadtest', 'api-dast', 'localhost')
    'otel-client'   = @('otel-collector', 'localhost')
    'nginx-proxy'   = @('nginx-proxy', 'localhost')
}

function Find-OpenSslExecutable {
    $cmd = Get-Command openssl -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $gitCmd = Get-Command git -ErrorAction SilentlyContinue
    if ($gitCmd) {
        $gitDir = Split-Path (Split-Path $gitCmd.Source)
        $gitOpenSsl = Join-Path $gitDir 'usr' 'bin' 'openssl.exe'
        if (Test-Path $gitOpenSsl) { return $gitOpenSsl }
    }
    return $null
}

function New-CaCertificate {
    param([string]$OpenSsl, [string]$OutputDir)

    $caKey = Join-Path $OutputDir 'ca.key'
    $caCrt = Join-Path $OutputDir 'ca.crt'

    if ((Test-Path $caCrt) -and -not $Force) {
        Write-Host '  CA certificate already exists (use -Force to regenerate)' -ForegroundColor Yellow
        return
    }

    Write-Host '  Generating root CA...' -ForegroundColor Cyan

    & $OpenSsl genrsa -out $caKey 4096 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Failed to generate CA key' }

    & $OpenSsl req -new -x509 -key $caKey -sha256 -days $caLifetimeDays `
        -out $caCrt -subj '/CN=SeventySix Internal CA/O=SeventySix/OU=DevOps' 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Failed to generate CA certificate' }

    Write-Host '  [OK] Root CA created (valid for 10 years)' -ForegroundColor Green
}

function New-ServiceCertificate {
    param(
        [string]$OpenSsl,
        [string]$CertsRoot,
        [string]$ServiceName,
        [string[]]$SanNames,
        [string]$CertType  # 'server' or 'client'
    )

    $serviceDir = Join-Path $CertsRoot $ServiceName
    $keyFile = Join-Path $serviceDir "$CertType.key"
    $csrFile = Join-Path $serviceDir "$CertType.csr"
    $crtFile = Join-Path $serviceDir "$CertType.crt"
    $caKey = Join-Path $CertsRoot 'ca.key'
    $caCrt = Join-Path $CertsRoot 'ca.crt'

    if ((Test-Path $crtFile) -and -not $Force) {
        Write-Host "  $ServiceName ($CertType) already exists — skipping" -ForegroundColor Yellow
        return
    }

    if (-not (Test-Path $serviceDir)) {
        New-Item -ItemType Directory -Path $serviceDir -Force | Out-Null
    }

    # Build SAN config
    $tmpConf = [System.IO.Path]::GetTempFileName() + '.cnf'
    $sanEntries = ($SanNames | ForEach-Object -Begin { $i = 1 } -Process { "DNS.$i = $_"; $i++ }) -join "`n"

    $extKeyUsage = if ($CertType -eq 'server') {
        'extendedKeyUsage = serverAuth'
    }
    else {
        'extendedKeyUsage = clientAuth'
    }

    $confContent = @"
[req]
distinguished_name = req_dn
req_extensions = v3_req
prompt = no

[req_dn]
CN = $($SanNames[0])

[v3_req]
subjectAltName = @alt_names
$extKeyUsage

[alt_names]
$sanEntries
"@
    [System.IO.File]::WriteAllText($tmpConf, $confContent)

    try {
        # Generate key + CSR
        & $OpenSsl genrsa -out $keyFile 2048 2>$null
        if ($LASTEXITCODE -ne 0) { throw "Failed to generate key for $ServiceName" }

        & $OpenSsl req -new -key $keyFile -out $csrFile -config $tmpConf 2>$null
        if ($LASTEXITCODE -ne 0) { throw "Failed to generate CSR for $ServiceName" }

        # Sign with CA
        & $OpenSsl x509 -req -in $csrFile -CA $caCrt -CAkey $caKey `
            -CAcreateserial -out $crtFile -days $certLifetimeDays `
            -sha256 -extfile $tmpConf -extensions v3_req 2>$null
        if ($LASTEXITCODE -ne 0) { throw "Failed to sign certificate for $ServiceName" }

        # Remove CSR (no longer needed)
        Remove-Item -Path $csrFile -Force -ErrorAction SilentlyContinue

        # Set permissions on Linux
        if (-not $IsWindows) {
            chmod 644 $crtFile 2>$null
            chmod 600 $keyFile 2>$null
        }

        Write-Host "  [OK] $ServiceName ($CertType)" -ForegroundColor Green
    }
    finally {
        Remove-Item -Path $tmpConf -Force -ErrorAction SilentlyContinue
    }
}

# ============================================================================
# MAIN
# ============================================================================

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  Internal CA & Service Certificates' -ForegroundColor Cyan
Write-Host '  (Docker mTLS)' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

$openssl = Find-OpenSslExecutable
if (-not $openssl) {
    Write-Error 'OpenSSL not found. Install Git for Windows (includes openssl) or install openssl directly.'
    exit 1
}

# Create certs directory
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir -Force | Out-Null
}

# Generate CA
New-CaCertificate -OpenSsl $openssl -OutputDir $certsDir

# Generate server certificates
Write-Host ''
Write-Host 'Server certificates:' -ForegroundColor Cyan
foreach ($entry in $serverCerts.GetEnumerator()) {
    New-ServiceCertificate -OpenSsl $openssl -CertsRoot $certsDir `
        -ServiceName $entry.Key -SanNames $entry.Value -CertType 'server'
}

# Generate client certificates
if (-not $SkipClient) {
    Write-Host ''
    Write-Host 'Client certificates:' -ForegroundColor Cyan
    foreach ($entry in $clientCerts.GetEnumerator()) {
        New-ServiceCertificate -OpenSsl $openssl -CertsRoot $certsDir `
            -ServiceName $entry.Key -SanNames $entry.Value -CertType 'client'
    }
}

Write-Host ''
Write-Host '[DONE] All certificates generated in docker/certs/' -ForegroundColor Green
Write-Host "  CA valid for: $caLifetimeDays days ($('{0:N0}' -f ($caLifetimeDays / 365)) years)" -ForegroundColor Gray
Write-Host "  Service certs valid for: $certLifetimeDays days" -ForegroundColor Gray

# On Linux: apply fine-grained ACLs so private keys are 600 while granting read
# access only to the specific container UIDs that mount each key file.
# Expected UIDs are documented in scripts/verify-cert-uids.sh (canonical source).
if (-not $IsWindows) {
    $setfaclCmd = Get-Command setfacl -ErrorAction SilentlyContinue
    if ($setfaclCmd) {
        Write-Host ''
        Write-Host 'Applying file ACLs (setfacl)...' -ForegroundColor Cyan

        # PostgreSQL server key — owned by postgres UID 70, chmod 600
        $pgKey = Join-Path $certsDir 'postgres' 'server.key'
        if (Test-Path $pgKey) {
            chmod 600 $pgKey 2>$null
            chown 70:70 $pgKey 2>$null
            Write-Host '  [ok] postgres/server.key: chown 70:70 chmod 600' -ForegroundColor Green
        }

        # OTEL collector server key — UID 10001
        $otelKey = Join-Path $certsDir 'otel-collector' 'server.key'
        if (Test-Path $otelKey) {
            setfacl -m u:10001:r $otelKey 2>$null
            Write-Host '  [ok] otel-collector/server.key: ACL u:10001:r' -ForegroundColor Green
        }

        # OTEL client key — UID 10001 (used by otel-collector container)
        $otelClientKey = Join-Path $certsDir 'otel-client' 'client.key'
        if (Test-Path $otelClientKey) {
            setfacl -m u:10001:r $otelClientKey 2>$null
            Write-Host '  [ok] otel-client/client.key: ACL u:10001:r' -ForegroundColor Green
        }

        # Jaeger server key — UID 10001
        $jaegerKey = Join-Path $certsDir 'jaeger' 'server.key'
        if (Test-Path $jaegerKey) {
            setfacl -m u:10001:r $jaegerKey 2>$null
            Write-Host '  [ok] jaeger/server.key: ACL u:10001:r' -ForegroundColor Green
        }

        # API client key — UID 999 (appuser) + UID 59000 (redis-exporter)
        $apiKey = Join-Path $certsDir 'api' 'client.key'
        if (Test-Path $apiKey) {
            setfacl -m u:999:r,u:59000:r $apiKey 2>$null
            Write-Host '  [ok] api/client.key: ACL u:999:r (appuser), u:59000:r (redis-exporter)' -ForegroundColor Green
        }

        Write-Host '  Valkey/nginx run as root — no ACL needed' -ForegroundColor Gray
    }
    else {
        Write-Host ''
        Write-Host 'WARNING: setfacl not found. Private keys are 600 but no container ACLs applied.' -ForegroundColor Yellow
        Write-Host '         Install acl package (apt install acl) and re-run this script.' -ForegroundColor Yellow
        Write-Host '         Or manually run: setfacl -m u:10001:r <key> for OTEL/Jaeger keys,' -ForegroundColor Yellow
        Write-Host '                          setfacl -m u:999:r,u:59000:r docker/certs/api/client.key' -ForegroundColor Yellow
    }
}

Write-Host ''
