# load-user-secrets.ps1
# Reads dotnet user-secrets and exports them as shell environment variables
# for Docker Compose to consume via ${VAR} substitution.
#
# This mirrors production where the hosting platform injects env vars.
# User secrets remain the single source of truth for all environments.
#
# Mapped environment variables:
#   DB_PASSWORD                          → PostgreSQL (docker-compose.yml)
#   JWT_SECRET_KEY                       → API authentication (docker-compose.yml)
#   GITHUB_CLIENT_ID / CLIENT_SECRET     → GitHub OAuth (docker-compose.yml)
#   EMAIL_SMTP_USERNAME / PASSWORD        → Brevo SMTP (docker-compose.yml)
#   EMAIL_FROM_ADDRESS                   → Sender address (docker-compose.yml)
#   ALTCHA_HMAC_KEY                      → ALTCHA HMAC (docker-compose.yml)
#   ADMIN_EMAIL / ADMIN_PASSWORD         → Admin seeding (docker-compose.yml)
#   GRAFANA_ADMIN_USER / PASSWORD        → Grafana dashboard (docker-compose.yml)
#   PGADMIN_DEFAULT_EMAIL / PASSWORD     → pgAdmin web UI (docker-compose.yml)
#   DATA_PROTECTION_USE_CERTIFICATE       → DataProtection flag (docker-compose.yml)
#   DATA_PROTECTION_CERTIFICATE_*        → DataProtection cert (docker-compose.yml)
#   DB_NAME                              → PostgreSQL database name (docker-compose.yml)
#   DB_USER                              → PostgreSQL username (docker-compose.yml)
#
# Called by: start-dev.ps1, start-infrastructure.ps1

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$projectPath =
[System.IO.Path]::Combine($repoRoot, "SeventySix.Server", "SeventySix.Api", "SeventySix.Api.csproj")

if (-not (Test-Path $projectPath)) {
	Write-Host "Project file not found at: $projectPath" -ForegroundColor Red
	exit 1
}

# Mapping: user-secret key -> Docker Compose env var name
$secretToEnvMapping =
@{
	"Database:Password"                   = "DB_PASSWORD"
	"Jwt:SecretKey"                       = "JWT_SECRET_KEY"
	"Auth:OAuth:Providers:0:ClientId"     = "GITHUB_CLIENT_ID"
	"Auth:OAuth:Providers:0:ClientSecret" = "GITHUB_CLIENT_SECRET"
	"Email:SmtpUsername"                  = "EMAIL_SMTP_USERNAME"
	"Email:SmtpPassword"                  = "EMAIL_SMTP_PASSWORD"
	"Email:FromAddress"                   = "EMAIL_FROM_ADDRESS"
	"Altcha:HmacKeyBase64"                = "ALTCHA_HMAC_KEY"
	"AdminSeeder:Email"                   = "ADMIN_EMAIL"
	"AdminSeeder:InitialPassword"         = "ADMIN_PASSWORD"
	"Grafana:AdminUser"                   = "GRAFANA_ADMIN_USER"
	"Grafana:AdminPassword"               = "GRAFANA_ADMIN_PASSWORD"
	"PgAdmin:DefaultEmail"                = "PGADMIN_DEFAULT_EMAIL"
	"PgAdmin:DefaultPassword"             = "PGADMIN_DEFAULT_PASSWORD"
	"DataProtection:UseCertificate"       = "DATA_PROTECTION_USE_CERTIFICATE"
	"DataProtection:CertificatePath"      = "DATA_PROTECTION_CERTIFICATE_PATH"
	"DataProtection:CertificatePassword"  = "DATA_PROTECTION_CERTIFICATE_PASSWORD"
	"Database:Name"                       = "DB_NAME"
	"Database:User"                       = "DB_USER"
}

# Read all user secrets
$secretsOutput =
dotnet user-secrets list --project $projectPath 2>&1

if ($LASTEXITCODE -ne 0) {
	Write-Host "Failed to read user secrets. Run 'npm run secrets:init' first." -ForegroundColor Red
	exit 1
}

# Parse secrets into a hashtable
$secrets = @{}
$secretsOutput | ForEach-Object {
	$line = $_.ToString().Trim()
	if ($line -match "^(.+?)\s*=\s*(.+)$") {
		$secrets[$Matches[1]] = $Matches[2]
	}
}

if ($secrets.Count -eq 0) {
	Write-Host "No user secrets found. Run 'npm run secrets:init' first." -ForegroundColor Red
	exit 1
}

# Export mapped secrets as environment variables
$missingSecrets = @()

foreach ($mapping in $secretToEnvMapping.GetEnumerator()) {
	$secretKey = $mapping.Key
	$envVarName = $mapping.Value

	if ($secrets.ContainsKey($secretKey)) {
		[System.Environment]::SetEnvironmentVariable($envVarName, $secrets[$secretKey], "Process")
	}
	else {
		$missingSecrets += $secretKey
	}
}

if ($missingSecrets.Count -gt 0) {
	Write-Host ""
	Write-Host "Missing required user secrets:" -ForegroundColor Red
	foreach ($missingSecret in $missingSecrets) {
		Write-Host "  - $missingSecret" -ForegroundColor Red
	}
	Write-Host ""
	Write-Host "Run 'npm run secrets:init' to set all required secrets." -ForegroundColor Yellow
	exit 1
}

$exportedCount = $secretToEnvMapping.Count
Write-Host "  Loaded $exportedCount secrets into environment" -ForegroundColor Green
