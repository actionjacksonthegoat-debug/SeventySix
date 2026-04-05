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
#   GITHUB_CLIENT_ID / CLIENT_SECRET     → GitHub OAuth (docker-compose.yml) [optional — set Auth:OAuth:Providers:0:Enabled=false to disable]
#   EMAIL_API_KEY                        → Brevo HTTP API (docker-compose.yml) [optional — Email:Enabled controls use]
#   EMAIL_FROM_ADDRESS                   → Sender address (docker-compose.yml) [optional — Email:Enabled controls use]
#   SITE_EMAIL                           → Public contact email for legal pages (docker-compose.yml)
#   ALTCHA_HMAC_KEY                      → ALTCHA HMAC (docker-compose.yml)
#   ADMIN_EMAIL / ADMIN_PASSWORD         → Admin seeding (docker-compose.yml)
#   GRAFANA_ADMIN_USER / PASSWORD        → Grafana dashboard (docker-compose.yml)
#   PGADMIN_DEFAULT_EMAIL / PASSWORD     → pgAdmin web UI (docker-compose.yml)
#   DATA_PROTECTION_USE_CERTIFICATE       → DataProtection flag (docker-compose.yml)
#   DATA_PROTECTION_CERTIFICATE_*        → DataProtection cert (docker-compose.yml)
#   DB_NAME                              → PostgreSQL database name (docker-compose.yml)
#   DB_USER                              → PostgreSQL username (docker-compose.yml)
#
#   SSXC_SVELTE_DATABASE_URL / POSTGRES_PASSWORD / MOCK_SERVICES etc. → SvelteKit commerce [optional]
#   SSXC_TANSTACK_DATABASE_URL / POSTGRES_PASSWORD / MOCK_SERVICES etc. → TanStack commerce [optional]
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
	"Email:ApiKey"                        = "EMAIL_API_KEY"
	"Email:FromAddress"                   = "EMAIL_FROM_ADDRESS"
	"Site:Email"                          = "SITE_EMAIL"
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

	# Commerce — SvelteKit
	"Commerce:Sveltekit:DatabaseUrl"                  = "SSXC_SVELTE_DATABASE_URL"
	"Commerce:Sveltekit:PostgresPassword"             = "SSXC_SVELTE_POSTGRES_PASSWORD"
	"Commerce:Sveltekit:MockServices"                 = "SSXC_SVELTE_MOCK_SERVICES"
	"Commerce:Sveltekit:BaseUrl"                      = "SSXC_SVELTE_BASE_URL"
	"Commerce:Sveltekit:StripeSecretKey"              = "SSXC_SVELTE_STRIPE_SECRET_KEY"
	"Commerce:Sveltekit:StripeWebhookSecret"          = "SSXC_SVELTE_STRIPE_WEBHOOK_SECRET"
	"Commerce:Sveltekit:PrintfulApiKey"               = "SSXC_SVELTE_PRINTFUL_API_KEY"
	"Commerce:Sveltekit:PrintfulWebhookSecret"        = "SSXC_SVELTE_PRINTFUL_WEBHOOK_SECRET"
	"Commerce:Sveltekit:BrevoApiKey"                  = "SSXC_SVELTE_BREVO_API_KEY"
	"Commerce:Sveltekit:SeventySixApiUrl"             = "SSXC_SVELTE_SEVENTYSIX_API_URL"
	"Commerce:Sveltekit:OtelEndpoint"                 = "SSXC_SVELTE_OTEL_ENDPOINT"
	"Commerce:Sveltekit:PublicOtelEndpoint"            = "SSXC_SVELTE_PUBLIC_OTEL_ENDPOINT"
	"Commerce:Sveltekit:PublicGa4MeasurementId"       = "SSXC_SVELTE_PUBLIC_GA4_MEASUREMENT_ID"
	"Commerce:Sveltekit:PublicGoogleSiteVerification" = "SSXC_SVELTE_PUBLIC_GOOGLE_SITE_VERIFICATION"
	"Commerce:Sveltekit:PublicBingSiteVerification"   = "SSXC_SVELTE_PUBLIC_BING_SITE_VERIFICATION"

	# Commerce — TanStack
	"Commerce:Tanstack:DatabaseUrl"                   = "SSXC_TANSTACK_DATABASE_URL"
	"Commerce:Tanstack:PostgresPassword"              = "SSXC_TANSTACK_POSTGRES_PASSWORD"
	"Commerce:Tanstack:MockServices"                  = "SSXC_TANSTACK_MOCK_SERVICES"
	"Commerce:Tanstack:BaseUrl"                       = "SSXC_TANSTACK_BASE_URL"
	"Commerce:Tanstack:StripeSecretKey"               = "SSXC_TANSTACK_STRIPE_SECRET_KEY"
	"Commerce:Tanstack:StripeWebhookSecret"           = "SSXC_TANSTACK_STRIPE_WEBHOOK_SECRET"
	"Commerce:Tanstack:PrintfulApiKey"                = "SSXC_TANSTACK_PRINTFUL_API_KEY"
	"Commerce:Tanstack:PrintfulWebhookSecret"         = "SSXC_TANSTACK_PRINTFUL_WEBHOOK_SECRET"
	"Commerce:Tanstack:BrevoApiKey"                   = "SSXC_TANSTACK_BREVO_API_KEY"
	"Commerce:Tanstack:SeventySixApiUrl"              = "SSXC_TANSTACK_SEVENTYSIX_API_URL"
	"Commerce:Tanstack:OtelEndpoint"                  = "SSXC_TANSTACK_OTEL_ENDPOINT"
	"Commerce:Tanstack:PublicOtelEndpoint"             = "SSXC_TANSTACK_PUBLIC_OTEL_ENDPOINT"
	"Commerce:Tanstack:PublicGa4MeasurementId"        = "SSXC_TANSTACK_PUBLIC_GA4_MEASUREMENT_ID"
	"Commerce:Tanstack:PublicGoogleSiteVerification"  = "SSXC_TANSTACK_PUBLIC_GOOGLE_SITE_VERIFICATION"
	"Commerce:Tanstack:PublicBingSiteVerification"    = "SSXC_TANSTACK_PUBLIC_BING_SITE_VERIFICATION"
}

# Optional secrets — missing keys are silently set to "" (mirroring docker-compose.yml ${VAR:-} defaults).
# These features are disabled via their own Enabled flag in appsettings.json when the key is absent.
$optionalSecretKeys =
[System.Collections.Generic.HashSet[string]]@(
	"Email:ApiKey"
	"Email:FromAddress"
	"Auth:OAuth:Providers:0:ClientId"
	"Auth:OAuth:Providers:0:ClientSecret"

	# Commerce — SvelteKit (all optional; commerce apps may not be configured)
	"Commerce:Sveltekit:DatabaseUrl"
	"Commerce:Sveltekit:PostgresPassword"
	"Commerce:Sveltekit:MockServices"
	"Commerce:Sveltekit:BaseUrl"
	"Commerce:Sveltekit:StripeSecretKey"
	"Commerce:Sveltekit:StripeWebhookSecret"
	"Commerce:Sveltekit:PrintfulApiKey"
	"Commerce:Sveltekit:PrintfulWebhookSecret"
	"Commerce:Sveltekit:BrevoApiKey"
	"Commerce:Sveltekit:SeventySixApiUrl"
	"Commerce:Sveltekit:OtelEndpoint"
	"Commerce:Sveltekit:PublicOtelEndpoint"
	"Commerce:Sveltekit:PublicGa4MeasurementId"
	"Commerce:Sveltekit:PublicGoogleSiteVerification"
	"Commerce:Sveltekit:PublicBingSiteVerification"

	# Commerce — TanStack (all optional; commerce apps may not be configured)
	"Commerce:Tanstack:DatabaseUrl"
	"Commerce:Tanstack:PostgresPassword"
	"Commerce:Tanstack:MockServices"
	"Commerce:Tanstack:BaseUrl"
	"Commerce:Tanstack:StripeSecretKey"
	"Commerce:Tanstack:StripeWebhookSecret"
	"Commerce:Tanstack:PrintfulApiKey"
	"Commerce:Tanstack:PrintfulWebhookSecret"
	"Commerce:Tanstack:BrevoApiKey"
	"Commerce:Tanstack:SeventySixApiUrl"
	"Commerce:Tanstack:OtelEndpoint"
	"Commerce:Tanstack:PublicOtelEndpoint"
	"Commerce:Tanstack:PublicGa4MeasurementId"
	"Commerce:Tanstack:PublicGoogleSiteVerification"
	"Commerce:Tanstack:PublicBingSiteVerification"
)

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
	elseif ($optionalSecretKeys.Contains($secretKey)) {
		[System.Environment]::SetEnvironmentVariable($envVarName, "", "Process")
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
