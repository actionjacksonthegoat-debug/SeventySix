# SeventySix — Production Deployment Guide

> **Target:** Hetzner CX43 (8 vCPU / 16 GB) + Cloudflare free tier
> **Cost:** ~€12/month (server: €9.49 + automated backups: ~€1.90 + Cloudflare: $0)
> **Domain:** SeventySixSandbox.com
> **Scaling:** This guide covers the "Launch" tier. The same setup vertically scales to CX53 (~€21/mo) via a single Hetzner API call, or migrates to dedicated metal (AX41 ~€43/mo) in ~2 hours. See [ScalingPlan.md](ScalingPlan.md) for all future paths.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Provision the Server](#2-provision-the-server)
3. [Server Hardening](#3-server-hardening)
4. [Install Caddy (TLS Termination)](#4-install-caddy-tls-termination)
5. [Configure Cloudflare](#5-configure-cloudflare)
6. [Generate Data Protection Certificate](#6-generate-data-protection-certificate)
7. [Configure GitHub Secrets](#7-configure-github-secrets)
8. [First Deploy](#8-first-deploy)
9. [Configure GitHub Secrets for CD](#9-configure-github-secrets-for-cd)
10. [Setup Backups](#10-setup-backups)
11. [Setup Monitoring](#11-setup-monitoring)
12. [Post-Deploy Verification](#12-post-deploy-verification)
13. [Day-2 Operations](#13-day-2-operations)

---

## 1. Prerequisites

Before starting, ensure you have:

- [ ] **Domain:** `seventysixsandbox.com` managed by Cloudflare (already purchased)
- [ ] A [Hetzner Cloud](https://console.hetzner.cloud/) account
- [ ] An SSH keypair: `ssh-keygen -t ed25519 -C "seventysix-prod"`
- [ ] A **production** [GitHub OAuth App](https://github.com/settings/developers) registered (**NOT the dev app**):
  - Homepage URL: `https://seventysixsandbox.com`
  - Authorization callback URL: `https://api.seventysixsandbox.com/api/v1/auth/oauth/github/callback`
- [ ] An SMTP provider account (e.g., [Brevo](https://www.brevo.com/) free: 300 emails/day)
- [ ] A [MaxMind GeoLite2](https://www.maxmind.com/en/geolite2/signup) account (free — for GeoIP/Fail2Ban)
- [ ] GitHub CI has run at least once on master with the `publish` job (images exist in GHCR)
- [ ] `hcloud` CLI installed locally: `brew install hcloud` or `apt install hcloud`

---

## 2. Provision the Server

```bash
# Create Hetzner Cloud context
hcloud context create seventysix

# Create CX43 server (8 vCPU / 16 GB / 160 GB SSD)
# Locations: nbg1 (Nuremberg), fsn1 (Falkenstein), hel1 (Helsinki), ash (Ashburn US), sin (Singapore)
hcloud server create \
  --name seventysix-prod \
  --type cx43 \
  --image ubuntu-24.04 \
  --location nbg1 \
  --ssh-key YOUR_KEY_NAME

# Note the IP address from the output
SERVER_IP=$(hcloud server ip seventysix-prod)
echo "Server IP: $SERVER_IP"

# Create firewall: SSH from your IP, 80+443 world-open
hcloud firewall create --name seventysix-fw
hcloud firewall add-rule seventysix-fw --direction in --port 22  --protocol tcp --source-ips YOUR.IP.HERE/32
hcloud firewall add-rule seventysix-fw --direction in --port 80  --protocol tcp --source-ips 0.0.0.0/0
hcloud firewall add-rule seventysix-fw --direction in --port 443 --protocol tcp --source-ips 0.0.0.0/0
hcloud firewall apply-to-server seventysix-fw --server seventysix-prod

# Enable automated backups (+20% = ~€1.90/mo — server snapshot every night)
hcloud server enable-backup seventysix-prod
```

---

## 3. Server Hardening

SSH into the server and run these commands as root:

```bash
ssh root@$SERVER_IP
```

### 3.1 System Updates + Docker

```bash
apt-get update && apt-get upgrade -y

# Install Docker Engine
curl -fsSL https://get.docker.com | sh

# Configure Docker log rotation BEFORE starting any containers
cat > /etc/docker/daemon.json << 'DEOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
DEOF
systemctl restart docker
```

### 3.2 Create Deploy User

```bash
useradd -m -s /bin/bash deploy
usermod -aG sudo,docker deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys

# Install rclone for offsite backups
apt-get install -y docker-compose-plugin rclone
```

### 3.3 Harden SSH

```bash
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd
```

### 3.4 Kernel Tuning

```bash
cat >> /etc/sysctl.conf << 'SEOF'
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
vm.overcommit_memory = 1
vm.swappiness = 10
SEOF
sysctl -p
```

### 3.5 Swap (4 GB safety net)

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 3.6 Verify and Logout

```bash
# Verify Docker works
docker run --rm hello-world

# Verify log rotation
cat /etc/docker/daemon.json

# Logout from root
exit
```

Test that you can SSH as the deploy user:
```bash
ssh deploy@$SERVER_IP
```

---

## 4. Install Caddy (TLS Termination)

Caddy automatically provisions **Let's Encrypt TLS certificates** and acts as a reverse proxy in front of the Docker containers. No manual certificate management is needed.

> **How TLS works with Cloudflare:**
> - Caddy requests certificates from Let's Encrypt using the **HTTP-01 ACME challenge** for all domains.
> - For Cloudflare-**proxied** records (root, www, api): Cloudflare forwards the HTTP-01 challenge request through to the server, so Caddy gets its certificates normally.
> - For Cloudflare-**DNS only** records (grafana, jaeger): Let's Encrypt talks directly to the server — no special handling needed.
> - You set Cloudflare **SSL/TLS mode to "Full (Strict)"** — this means Cloudflare validates the origin server's certificate. Caddy's Let's Encrypt certs satisfy this requirement.
> - **You do not purchase, generate, or upload any SSL certificates.** Caddy handles everything automatically and renews them before they expire.

SSH as deploy user:

```bash
ssh deploy@$SERVER_IP
sudo -i

# Install Caddy
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install -y caddy
```

Create the Caddyfile:

```bash
cat > /etc/caddy/Caddyfile << 'CEOF'
{
    email admin@seventysixsandbox.com
}

# Angular SPA — served from Docker container port 8080
seventysixsandbox.com {
    reverse_proxy localhost:8080
    @static {
        path *.js *.css *.woff2 *.woff *.ttf *.svg *.png *.ico *.webp
    }
    header @static Cache-Control "public, max-age=31536000, immutable"
}

# www redirect to apex
www.seventysixsandbox.com {
    redir https://seventysixsandbox.com{uri} permanent
}

# API — served from Docker container port 5085
api.seventysixsandbox.com {
    reverse_proxy localhost:5085
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}

# Grafana — IP-restricted to admin only (proxy OFF in Cloudflare)
grafana.seventysixsandbox.com {
    @allowed remote_ip YOUR.ADMIN.IP.HERE
    handle @allowed {
        reverse_proxy localhost:3000
    }
    respond "Access Denied" 403
}

# Jaeger — IP-restricted to admin only (proxy OFF in Cloudflare)
jaeger.seventysixsandbox.com {
    @allowed remote_ip YOUR.ADMIN.IP.HERE
    handle @allowed {
        reverse_proxy localhost:16686
    }
    respond "Access Denied" 403
}
CEOF
```

> **Replace `YOUR.ADMIN.IP.HERE` with your actual admin IP.** Find it: `curl ifconfig.me`

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl enable --now caddy
exit  # Back to deploy user
```

---

## 5. Configure Cloudflare

In the Cloudflare dashboard for your domain:

### 5.1 DNS Records

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` (root) | `SERVER_IP` | **Proxied** (orange cloud) |
| A | `www` | `SERVER_IP` | **Proxied** (orange cloud) |
| A | `api` | `SERVER_IP` | **Proxied** (orange cloud) |
| A | `grafana` | `SERVER_IP` | **DNS only** (grey cloud) |
| A | `jaeger` | `SERVER_IP` | **DNS only** (grey cloud) |

> **TLS Note:** Cloudflare terminates TLS towards the end user. Set **SSL/TLS encryption mode to "Full (Strict)"** so Cloudflare also validates the origin server's certificate (provided by Caddy/Let's Encrypt). "Flexible" mode skips origin TLS entirely — never use it.

### 5.2 SSL/TLS

- **Encryption mode:** Full (Strict)
- **Always Use HTTPS:** ON
- **Minimum TLS Version:** 1.2

### 5.3 Caching

Create a Cache Rule:
- **If matching:** `URI Path contains .js` OR `.css` OR `.woff2` OR `.png` OR `.svg` OR `.ico` OR `.webp`
- **Then:** Cache Everything, Edge TTL = 1 month

### 5.4 Security

- **Under Attack Mode:** OFF (turn ON if under DDoS — Cloudflare adds JS challenge)
- **Bot Fight Mode:** ON
- **Browser Integrity Check:** ON

---

## 6. Generate Data Protection Certificate

The Data Protection certificate encrypts ASP.NET Core session tokens, 2FA state, and anti-forgery tokens. **It must exist before the first `docker compose up`.**

> **⚠️ SECURITY: Generate a FRESH certificate for production. NEVER use the development certificate** (`SeventySix.Server/SeventySix.Api/keys/dataprotection.pfx` from your dev machine). The dev cert was generated with a dev password that may be known. A new cert means new keys that have never been exposed.

On your **local development machine** (NOT the server):

```bash
# Generate the certificate (will prompt for or use env var password)
npm run generate:dataprotection-cert
# Output: SeventySix.Server/SeventySix.Api/keys/dataprotection.pfx
```

Upload to the server:

```bash
# Upload the cert to a temp location
scp SeventySix.Server/SeventySix.Api/keys/dataprotection.pfx deploy@$SERVER_IP:/tmp/

# On the server: create the Docker volume directory and copy the cert
ssh deploy@$SERVER_IP
sudo mkdir -p /var/lib/docker/volumes/seventysix_dataprotection_prod_keys/_data
sudo cp /tmp/dataprotection.pfx /var/lib/docker/volumes/seventysix_dataprotection_prod_keys/_data/
sudo chown root:root /var/lib/docker/volumes/seventysix_dataprotection_prod_keys/_data/dataprotection.pfx
sudo chmod 644 /var/lib/docker/volumes/seventysix_dataprotection_prod_keys/_data/dataprotection.pfx
rm /tmp/dataprotection.pfx
```

> **CRITICAL:** The `DATA_PROTECTION_CERTIFICATE_PASSWORD` GitHub Secret (next step) must match the password used when generating this cert.

---

## 7. Configure GitHub Secrets

> **⚠️ CRITICAL: All production secrets are stored EXCLUSIVELY in GitHub repository Secrets and Variables.**
> There is no `.env` file on the server. The CD pipeline (`deploy.yml`) injects all secrets
> into the SSH session via `appleboy/ssh-action`'s `envs:` parameter. Docker Compose reads
> them from the shell environment.

> **⚠️ CRITICAL: Regenerate ALL of these fresh — never reuse dev values:**
>
> | Secret | Why it must be new |
> |---|---|
> | `DB_PASSWORD` | Dev PostgreSQL password is in user secrets / well-known |
> | `JWT_SECRET_KEY` | Dev placeholder value is in `appsettings.json`; regenerate: `openssl rand -base64 64` |
> | `VALKEY_PASSWORD` | Dev password is in user secrets; regenerate: `openssl rand -base64 32` |
> | `ALTCHA_HMAC_KEY` | Dev key is in user secrets; regenerate: `openssl rand -base64 32` |
> | `DATA_PROTECTION_CERTIFICATE_PASSWORD` | Must match the newly generated production cert (not the dev cert) |
> | `ADMIN_PASSWORD` | One-time seed password — generate random: `openssl rand -base64 24` |
> | `GRAFANA_ADMIN_PASSWORD` | Dev password is in user secrets; regenerate: `openssl rand -base64 20` |
> | `GITHUB_CLIENT_ID/SECRET` | **Register a NEW production OAuth App** — dev app has localhost callback URLs |
> | `EMAIL_SMTP_USERNAME/PASSWORD` | Use production-specific SMTP credentials if possible |

In your GitHub repository → **Settings → Secrets and variables → Actions**, add:

### Secrets (sensitive — hidden in logs)

| Secret Name | Value | Generate with |
|---|---|---|
| `PROD_HOST` | Server IP address | — |
| `PROD_USER` | `deploy` | — |
| `PROD_SSH_KEY` | Ed25519 private key (see Section 9) | `ssh-keygen -t ed25519` |
| `DB_PASSWORD` | Database password | `openssl rand -base64 32` |
| `JWT_SECRET_KEY` | JWT signing key (64+ chars) | `openssl rand -base64 64` |
| `GITHUB_CLIENT_ID` | Production GitHub OAuth App client ID | [github.com/settings/developers](https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET` | Production GitHub OAuth App client secret | Same OAuth App |
| `EMAIL_SMTP_USERNAME` | SMTP username (e.g., Brevo) | Your SMTP provider |
| `EMAIL_SMTP_PASSWORD` | SMTP password | Your SMTP provider |
| `EMAIL_FROM_ADDRESS` | Sender address (e.g., `noreply@seventysixsandbox.com`) | — |
| `SITE_EMAIL` | Public contact email shown on Privacy Policy and Terms of Service pages (e.g., `hello@yourdomain.com`) | — |
| `ALTCHA_HMAC_KEY` | ALTCHA PoW key (base64) | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | Admin account email | — |
| `ADMIN_PASSWORD` | Admin account initial password (one-time) | `openssl rand -base64 24` |
| `ADMIN_USERNAME` | Admin account username (**not** `admin`) | — |
| `DATA_PROTECTION_CERTIFICATE_PASSWORD` | PFX cert password (matches Section 6) | `openssl rand -base64 32` |
| `CORS_ORIGIN_0` | `https://seventysixsandbox.com` | — |
| `VALKEY_PASSWORD` | Valkey/Redis password | `openssl rand -base64 32` |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | `openssl rand -base64 20` |
| `MAXMIND_ACCOUNT_ID` | MaxMind GeoLite2 account ID | [maxmind.com](https://www.maxmind.com) |
| `MAXMIND_LICENSE_KEY` | MaxMind GeoLite2 license key | [maxmind.com](https://www.maxmind.com) |
| `ALLOWED_HOSTS` | `seventysixsandbox.com;www.seventysixsandbox.com;api.seventysixsandbox.com` | — |
| `CLIENT_BASE_URL` | `https://seventysixsandbox.com` | — |
| `OAUTH_CALLBACK_URL` | `https://seventysixsandbox.com/auth/callback` | — |
| `OAUTH_REDIRECT_URI` | `https://api.seventysixsandbox.com/api/v1/auth/oauth/github/callback` | — |

### Variables (non-sensitive — visible in logs/settings)

| Variable Name | Default | Notes |
|---|---|---|
| `DB_NAME` | `seventysix` | Database name |
| `DB_USER` | `postgres` | Database user |
| `ADMIN_FULLNAME` | `System Administrator` | Admin display name |
| `ADMIN_SEEDER_ENABLED` | `true` | **Set to `false` after first deploy + password change** |
| `CORS_ORIGIN_1` | *(empty)* | Optional www variant: `https://www.seventysixsandbox.com` |
| `GRAFANA_ADMIN_USER` | `admin` | Grafana login username |

> **Setting `ADMIN_SEEDER_ENABLED` to `false`:** After the first successful deploy and admin password change, update this Variable to `false` and trigger a re-deploy via `gh workflow run deploy.yml` or push any commit to master.

### Clone the Repository on the Server

The server needs the repo for `docker-compose.production.yml` and the `observability/` configs:

```bash
ssh deploy@$SERVER_IP

# Clone the repository (no .env needed)
git clone https://github.com/actionjacksonthegoat-debug/SeventySix.git /srv/seventysix
cd /srv/seventysix
```

### GHCR Authentication on the Server

The server needs to pull images from GHCR. Create a GitHub Personal Access Token (PAT) with `read:packages` scope:

```bash
# On the server — log in to GHCR
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

> This stores the token in `/home/deploy/.docker/config.json`. It persists across reboots.

---

## 8. First Deploy

The **first deploy is triggered by pushing to master** after GitHub Secrets are configured. The CD pipeline handles image pulling and container startup automatically — no manual commands on the server are needed for normal operation.

```bash
# Verify GitHub Secrets are all set (from your local machine)
gh secret list --repo actionjacksonthegoat-debug/SeventySix
gh variable list --repo actionjacksonthegoat-debug/SeventySix

# Trigger the first deploy — push to master OR run manually:
gh workflow run deploy.yml --repo actionjacksonthegoat-debug/SeventySix
```

Watch the deploy in GitHub Actions → Actions → Deploy to Production.

```bash
# After the deploy workflow completes, verify on the server:
ssh deploy@$SERVER_IP

# Verify all containers are running
docker compose -f /srv/seventysix/docker-compose.production.yml ps

# Watch API logs — migrations run automatically on first start
docker compose -f /srv/seventysix/docker-compose.production.yml logs -f api
# Wait for "Application started" message, then Ctrl+C

# Verify health endpoints
curl -f http://localhost:5085/health   # API
curl -f http://localhost:8080          # Client (Angular SPA)
```

> **First start takes 1–3 minutes** due to database migrations (creating all schemas from scratch).
> Subsequent deploys take ~30 seconds (image pull + container restart).

### Disable Admin Seeder After First Deploy

> **⚠️ SECURITY — Do this immediately after the app starts successfully:**
>
> 1. The seeder creates the admin account with `RequiresPasswordChange = false`. **There is no forced password change.** You MUST change the password manually.
> 2. Log in with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` values you set in GitHub Secrets.
> 3. Navigate to account settings and **change the password to a strong, unique value NOT derived from the initial password**.
> 4. Verify the login works with the new password.
> 5. Then disable the seeder:

```bash
# Update the ADMIN_SEEDER_ENABLED Variable in GitHub to 'false'
gh variable set ADMIN_SEEDER_ENABLED --body 'false' --repo actionjacksonthegoat-debug/SeventySix

# Trigger a re-deploy so the API restarts with the updated value
gh workflow run deploy.yml --repo actionjacksonthegoat-debug/SeventySix

# After deploy, verify seeder is disabled (should see NO 'admin user created' log line)
ssh deploy@$SERVER_IP docker compose \
  -f /srv/seventysix/docker-compose.production.yml \
  logs --tail=50 api | grep -i seeder
```

---

## 9. Generate SSH Deploy Key

The deploy workflow needs to SSH into the production server. Generate a dedicated deploy key:

```bash
# On your local machine — generate a dedicated deploy key (separate from your personal key)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/seventysix-deploy -N ""

# Copy public key to the production server
ssh-copy-id -i ~/.ssh/seventysix-deploy.pub deploy@$SERVER_IP

# Add the private key as a GitHub Secret
gh secret set PROD_SSH_KEY --body "$(cat ~/.ssh/seventysix-deploy)" --repo actionjacksonthegoat-debug/SeventySix

# Add the remaining infra secrets that weren't set in Section 7
# (PROD_HOST and PROD_USER — if not already set)
gh secret set PROD_HOST --body "$SERVER_IP" --repo actionjacksonthegoat-debug/SeventySix
gh secret set PROD_USER --body "deploy" --repo actionjacksonthegoat-debug/SeventySix
```

### Verify CD Pipeline

Push a commit to master. The pipeline should:
1. CI runs (lint → build → test → e2e → load-test → quality-gate)
2. `publish` job (`.github/workflows/ci.yml`) builds and pushes Docker images to GHCR
3. `deploy` workflow (`.github/workflows/deploy.yml`) SSHs to the server, passes all secrets as env vars, pulls images, restarts containers, checks health

---

## 10. Setup Backups

### 10.1 Configure Cloudflare R2 (Free 10 GB)

1. Cloudflare Dashboard → R2 Object Storage → Create bucket: `seventysix-backups`
2. Create R2 API token: R2 → Manage R2 API Tokens → Create token → Object Read & Write
3. Note the Access Key ID, Secret Access Key, and Account ID

### 10.2 Configure rclone on the Server

```bash
ssh deploy@$SERVER_IP
rclone config
# Choose: n (new remote)
# Name: r2
# Storage: 5 (Amazon S3 Compliant)
# Provider: Cloudflare
# access_key_id: YOUR_R2_ACCESS_KEY
# secret_access_key: YOUR_R2_SECRET_KEY
# endpoint: https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
# Leave everything else as default

# Test the connection
rclone ls r2:seventysix-backups
# Should return empty (no backups yet)
```

### 10.3 Run First Backup

```bash
/srv/seventysix/scripts/backup.sh
# Should output:
# [timestamp] === Starting backup ===
# [timestamp] Backing up PostgreSQL...
# [timestamp] Database backup complete: XXK
# [timestamp] Backing up Data Protection keys...
# [timestamp] Data Protection backup complete: XXK
# [timestamp] Syncing to Cloudflare R2...
# [timestamp] R2 sync complete
# [timestamp] === Backup complete ===

# Verify R2 has the backup
rclone ls r2:seventysix-backups
```

### 10.4 Schedule Daily Backups

```bash
# Add crontab entry — daily at 3 AM server time
(crontab -l 2>/dev/null; echo "0 3 * * * /srv/seventysix/scripts/backup.sh >> /var/log/seventysix-backup.log 2>&1") | crontab -

# Verify crontab
crontab -l
```

---

## 11. Setup Monitoring

### 11.1 UptimeRobot (Free)

Create a free account at [uptimerobot.com](https://uptimerobot.com):

| Monitor | Type | URL | Interval |
|---|---|---|---|
| SeventySix SPA | HTTPS | `https://seventysixsandbox.com` | 5 min |
| SeventySix API | HTTPS | `https://api.seventysixsandbox.com/health` | 5 min |

Set up alerts: Email + Discord/Slack webhook.

### 11.2 Grafana Access

Open `https://grafana.seventysixsandbox.com` from your admin IP. Log in with the `GRAFANA_ADMIN_USER` (Variable) and `GRAFANA_ADMIN_PASSWORD` (Secret) values you set in GitHub.

Useful Prometheus queries:
- API request rate: `rate(http_server_request_duration_seconds_count[5m])`
- API error rate: `rate(http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[5m])`
- Container memory: `container_memory_usage_bytes`

### 11.3 Jaeger Access

Open `https://jaeger.seventysixsandbox.com` from your admin IP. Select the `SeventySix.Api` service to view distributed traces.

### 11.4 Prometheus Access (SSH Tunnel / Server Only)

Prometheus has **no Caddy subdomain** and is not accessible via a public browser URL.
It is accessible only:

- **From the server itself** (for ad-hoc queries):
  ```bash
  ssh deploy@PROD_HOST
  curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {scrapePool, health}'
  ```
- **Via SSH tunnel** (for browser access):
  ```bash
  ssh -N -L 9090:127.0.0.1:9090 deploy@PROD_HOST
  # Then open: http://localhost:9090
  ```

Do not add a Prometheus Caddy subdomain. Grafana already provides all required dashboards over Prometheus data.

### 11.5 Observability Security Model

All observability services are protected by two independent layers:

| Layer | Mechanism | Protects |
|-------|-----------|----------|
| 1 | Hetzner Cloud Firewall: only ports 22, 80, 443 inbound | External network |
| 2 | Docker `127.0.0.1` host binding on all observability ports | Host network stack |
| 3 | Caddy `remote_ip` restriction (Grafana + Jaeger only) | Application layer |

pgAdmin and RedisInsight are **not deployed in production** — they are dev-environment-only tools.

---

## 12. Post-Deploy Verification

Run through this checklist after the first deploy:

- [ ] `https://seventysixsandbox.com` loads the Angular app over HTTPS
- [ ] Valid TLS certificate shown in browser (padlock) — issued by Let's Encrypt via Caddy
- [ ] `https://api.seventysixsandbox.com/health` returns `200 OK`
- [ ] Registration flow works (email → verification code → login)
- [ ] MFA code arrives via email
- [ ] GitHub OAuth login completes (callback URL is correct)
- [ ] Admin login works with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` values from GitHub Secrets
- [ ] **Admin password changed** via account settings (before disabling the seeder)
- [ ] `ADMIN_SEEDER_ENABLED` Variable set to `false` and re-deploy triggered
- [ ] Grafana accessible from admin IP: `https://grafana.seventysixsandbox.com`
- [ ] Grafana shows request rate and latency graphs
- [ ] Jaeger accessible from admin IP: `https://jaeger.seventysixsandbox.com`
- [ ] Jaeger shows traces from API calls
- [ ] Prometheus targets all healthy: `curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {scrapePool, health}'`
- [ ] Prometheus NOT accessible from a public URL (verify: `curl -sf https://prometheus.seventysixsandbox.com` should fail)
- [ ] Grafana returns 403 from a non-admin IP (verify from a different browser/IP)
- [ ] Fail2Ban running: `docker exec seventysix-fail2ban-prod fail2ban-client status`
- [ ] GeoIP database downloaded: `docker logs seventysix-geoipupdate-prod`
- [ ] Backup runs successfully: `/srv/seventysix/scripts/backup.sh`
- [ ] R2 has backup files: `rclone ls r2:seventysix-backups`
- [ ] Data Protection key backup exists in R2
- [ ] Docker log rotation active: `docker inspect seventysix-api-prod | grep -A5 LogConfig`
- [ ] CD pipeline deploys on push to master (check GitHub Actions)
- [ ] Cloudflare Analytics shows cache hits for static assets
- [ ] UptimeRobot shows green for both monitors

---

## 13. Day-2 Operations

### Manual Deploy (if CD is disabled)

Prefer triggering the CD pipeline via GitHub CLI — it handles all secret injection automatically:

```bash
gh workflow run deploy.yml --repo actionjacksonthegoat-debug/SeventySix
```

If GitHub Actions is unavailable (e.g., server migration, emergency), export secrets from your password manager and run manually:

```bash
ssh deploy@$SERVER_IP
cd /srv/seventysix
git pull origin master --ff-only

# Export all required env vars (retrieve values from your password manager)
export DB_PASSWORD="..." JWT_SECRET_KEY="..." VALKEY_PASSWORD="..."
export DB_NAME=seventysix DB_USER=postgres
export GITHUB_CLIENT_ID="..." GITHUB_CLIENT_SECRET="..."
export EMAIL_SMTP_USERNAME="..." EMAIL_SMTP_PASSWORD="..." EMAIL_FROM_ADDRESS="..."
export SITE_EMAIL="..."
export ALTCHA_HMAC_KEY="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." ADMIN_USERNAME="..."
export ADMIN_SEEDER_ENABLED=false DATA_PROTECTION_CERTIFICATE_PASSWORD="..."
export CORS_ORIGIN_0="https://seventysixsandbox.com" CORS_ORIGIN_1="https://www.seventysixsandbox.com"
export GRAFANA_ADMIN_USER=admin GRAFANA_ADMIN_PASSWORD="..."
export MAXMIND_ACCOUNT_ID="..." MAXMIND_LICENSE_KEY="..."
export ALLOWED_HOSTS="seventysixsandbox.com;www.seventysixsandbox.com;api.seventysixsandbox.com"
export CLIENT_BASE_URL="https://seventysixsandbox.com"
export OAUTH_CALLBACK_URL="https://seventysixsandbox.com/auth/callback"
export OAUTH_REDIRECT_URI="https://api.seventysixsandbox.com/api/v1/auth/oauth/github/callback"

docker compose -f docker-compose.production.yml pull api client
docker compose -f docker-compose.production.yml up -d --remove-orphans
docker image prune -f
```

### View Logs

```bash
# All containers
docker compose -f docker-compose.production.yml logs --tail=100

# Specific container
docker compose -f docker-compose.production.yml logs -f api

# API errors only
docker compose -f docker-compose.production.yml logs api 2>&1 | grep -i error
```

### Restart a Single Service

```bash
# restart does not recreate the container — env vars already baked in, no secrets needed
docker compose -f docker-compose.production.yml restart api
```

### Vertical Scale (CX43 → CX53)

```bash
# From your local machine — ~10 minutes downtime
hcloud server change-type seventysix-prod cx53

# The server reboots automatically. All containers restart via restart: unless-stopped.
# Verify: ssh deploy@$SERVER_IP && docker compose ps
```

### Rollback to Previous Image

```bash
# Find the previous image SHA (on the server)
ssh deploy@$SERVER_IP \
  docker images ghcr.io/actionjacksonthegoat-debug/seventysix-api \
  --format "{{.Tag}}\t{{.CreatedAt}}" | head -5

# Pin the API_IMAGE variable to a specific tag, then trigger CD
gh variable set API_IMAGE \
  --body "ghcr.io/actionjacksonthegoat-debug/seventysix-api:PREVIOUS_TAG" \
  --repo actionjacksonthegoat-debug/SeventySix
gh workflow run deploy.yml --repo actionjacksonthegoat-debug/SeventySix

# After verifying the rollback, restore latest:
gh variable delete API_IMAGE --repo actionjacksonthegoat-debug/SeventySix
```

### Restore from Backup

```bash
# Download backup from R2
rclone copy r2:seventysix-backups/db_YYYYMMDD_HHMMSS.sql.gz /tmp/

# Restore
gunzip -c /tmp/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i seventysix-postgres-prod \
  psql -U "$DB_USER" "$DB_NAME"

# Restart API to pick up restored data (restart does not need env vars)
docker compose -f docker-compose.production.yml restart api
```

### Server Migration (to different provider or server)

Total time: ~30–60 minutes. Zero code changes.

```bash
# 1. On OLD server: full backup (reads DB creds from running container — no .env needed)
/srv/seventysix/scripts/backup.sh

# 2. Copy backups to NEW server
scp /srv/seventysix/backups/db_latest.sql.gz deploy@NEW_IP:/tmp/
scp /srv/seventysix/backups/dataprotection_latest.tar.gz deploy@NEW_IP:/tmp/

# 3. On NEW server: run steps 2–8 of this guide (GitHub Secrets are already set),
#                   then restore data
sudo tar xzf /tmp/dataprotection_latest.tar.gz \
  -C /var/lib/docker/volumes/seventysix_dataprotection_prod_keys/_data

# Trigger first deploy via CD (secrets already in GitHub)
gh workflow run deploy.yml --repo actionjacksonthegoat-debug/SeventySix
sleep 60  # Wait for containers to start

# Restore database
DB_CONTAINER=$(docker ps -qf "name=seventysix-postgres-prod")
gunzip -c /tmp/db_latest.sql.gz | docker exec -i "$DB_CONTAINER" psql -U postgres seventysix

# 4. Update PROD_HOST GitHub Secret to the new server IP, then update DNS in Cloudflare
gh secret set PROD_HOST --body "NEW_IP" --repo actionjacksonthegoat-debug/SeventySix
# 5. Wait 24h, verify, terminate old server
```
