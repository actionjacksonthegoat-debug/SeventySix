# SeventySix — Production Deployment Guide

> **Target:** Hetzner CCX23 (4 dedicated AMD vCPU / 16 GB) @ US West Hillsboro (`hil`) + Cloudflare free tier
> **Cost:** ~$35/month (server: $28.99 + automated backups: ~$5.80 + Cloudflare: $0 — 2 TB traffic included)
> **Domain:** SeventySixSandbox.com
> **Why CCX23 over CPX41:** CCX23 is $4.50/mo *cheaper* than CPX41 and provides **dedicated** AMD CPUs — no noisy neighbours, consistent performance. Scales vertically to CCX33 (~$67/mo) or CCX43 (~$133/mo) via a single `hcloud server change-type` call. See [Scaling-Plan.md](Scaling-Plan.md) for all future paths.

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
- [ ] A [Brevo](https://www.brevo.com/) account with API key (free tier: 300 emails/day)
- [ ] GitHub CI has run at least once on master with the `publish` job (images exist in GHCR)
- [ ] `hcloud` CLI installed locally: `brew install hcloud` (macOS) or `apt install hcloud` (Linux)
  - **Windows:** winget does not carry hcloud — download `hcloud-windows-amd64.zip` from [github.com/hetznercloud/cli/releases](https://github.com/hetznercloud/cli/releases) and copy `hcloud.exe` to `C:\Windows\System32\` (as Administrator)

---

## 2. Provision the Server

```bash
# Create Hetzner Cloud context
hcloud context create seventysix

# Create CCX23 server (4 dedicated AMD vCPU / 16 GB / 160 GB SSD) at US West Hillsboro
# CCX23 = $28.99/mo — cheaper than CPX41 ($33.49) with dedicated (not shared) CPUs
# Other US/global locations: ash (Ashburn US East), sin (Singapore), nbg1/fsn1/hel1 (EU)
hcloud server create \
  --name seventysix-prod \
  --type ccx23 \
  --image ubuntu-24.04 \
  --location hil \
  --ssh-key YOUR_KEY_NAME

# Note the IP address from the output
SERVER_IP=$(hcloud server ip seventysix-prod)
echo "Server IP: $SERVER_IP"

# Create firewall: SSH from your IP, 80+443 world-open
# Note: 80/443 are open at the Hetzner layer for simplicity (Hetzner API doesn't
# easily script Cloudflare IP updates). The actual origin protection (restricting
# 80/443 to Cloudflare IPs only) is enforced by UFW on the server — see Section 3.6.
hcloud firewall create --name seventysix-fw
hcloud firewall add-rule seventysix-fw --direction in --port 22  --protocol tcp --source-ips YOUR.IP.HERE/32
hcloud firewall add-rule seventysix-fw --direction in --port 80  --protocol tcp --source-ips 0.0.0.0/0
hcloud firewall add-rule seventysix-fw --direction in --port 443 --protocol tcp --source-ips 0.0.0.0/0
hcloud firewall apply-to-server seventysix-fw --server seventysix-prod

# Enable automated backups (+20% = ~$5.80/mo — server snapshot every night)
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
systemctl reload ssh
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

### 3.6 UFW Firewall

The Hetzner cloud firewall (Section 2) only applies at the network edge. UFW provides a second, independent layer of defense directly on the OS — if the cloud firewall is misconfigured or bypassed, UFW blocks direct access to internal services.

> **CRITICAL — Origin Protection:** Ports 80/443 are restricted to **Cloudflare IP ranges only**. This prevents attackers from bypassing Cloudflare by connecting directly to the origin server IP. Without this restriction, an attacker who discovers the server IP could send forged `CF-Connecting-IP` headers to Caddy, spoofing their IP address and bypassing all rate limiting. See Section 5.5 for the full security model.

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'

# Allow HTTP/HTTPS ONLY from Cloudflare IP ranges (origin protection)
# Source: https://www.cloudflare.com/ips/
# Cloudflare IPv4
for ip in 173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20 197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 104.24.0.0/14 172.64.0.0/13 131.0.72.0/22; do
  ufw allow from $ip to any port 80,443 proto tcp comment 'Cloudflare IPv4'
done

# Cloudflare IPv6
for ip in 2400:cb00::/32 2606:4700::/32 2803:f800::/32 2405:b500::/32 2405:8100::/32 2a06:98c0::/29 2c0f:f248::/32; do
  ufw allow from $ip to any port 80,443 proto tcp comment 'Cloudflare IPv6'
done

echo "y" | ufw enable
ufw status verbose
```

> **Important:** UFW does **not** intercept Docker's `iptables` rules. All Docker container ports in `docker-compose.production.yml` **must** be bound to `127.0.0.1` (e.g., `127.0.0.1:8080->8080/tcp`) — not `0.0.0.0`. A port published on `0.0.0.0` is accessible from the internet regardless of UFW.

> **Maintaining Cloudflare IPs:** Cloudflare publishes their IP ranges at [cloudflare.com/ips](https://www.cloudflare.com/ips/). They change rarely but do change. To update, SSH into the server and run:
>
> ```bash
> # Remove old Cloudflare rules
> ufw status numbered | grep 'Cloudflare' | awk '{print $2}' | sort -rn | while read num; do echo "y" | ufw delete $num; done
> # Re-run the for loops above with updated ranges
> ufw reload
> ```
>
> Check Cloudflare's IP page quarterly or subscribe to their changelog.

### 3.7 Verify and Logout

```bash
# Verify Docker works
docker run --rm hello-world

# Verify log rotation
cat /etc/docker/daemon.json

# Verify UFW is active
ufw status verbose

# Logout from root
exit
```

Test that you can SSH as the deploy user:

```bash
ssh deploy@$SERVER_IP
```

---

## 4. Install Caddy (TLS Termination)

Caddy acts as a reverse proxy in front of the Docker containers and uses Cloudflare Origin certificates referenced in `Caddyfile.production`.

> **How TLS works with Cloudflare:**
>
> - Generate Cloudflare Origin certificates (`origin.crt` + `origin.key`) and place them on the server at `/etc/caddy/certs/`.
> - `Caddyfile.production` uses explicit `tls /etc/caddy/certs/origin.crt /etc/caddy/certs/origin.key` directives for apex, `www`, and `api` hosts.
> - Set Cloudflare **SSL/TLS mode to "Full (Strict)"** so Cloudflare validates the origin certificate.
> - Rotate origin certificates before expiry and reload Caddy after replacing files.

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
# Recommended: copy the checked-in source-of-truth and adjust domain/cert paths if needed
cp Caddyfile.production /etc/caddy/Caddyfile


# Angular SPA — served from Docker container port 8080
# API calls (/api/*) are routed to the API container so the Angular client
# can use relative URLs (apiUrl: '/api/v1') without cross-origin issues.
# Cache and security headers are handled by nginx inside the client container,
# so no Caddy-level header overrides are needed here.
#
# IMPORTANT: Cloudflare proxies all traffic, so the API never sees the real
# client IP in the TCP connection. Cloudflare sets CF-Connecting-IP to the
# real client IP. We override X-Forwarded-For with this value so ASP.NET
# Core's ForwardedHeaders middleware resolves RemoteIpAddress correctly.
# This is critical for per-IP rate limiting to work (without it, all users
# share one rate-limit bucket keyed to 127.0.0.1).
seventysixsandbox.com {
    handle /api/* {
        reverse_proxy localhost:5085 {
            header_up X-Forwarded-For {header.CF-Connecting-IP}
        }
    }
    handle {
        reverse_proxy localhost:8080 {
            header_up X-Forwarded-For {header.CF-Connecting-IP}
        }
    }
}

# www redirect to apex
www.seventysixsandbox.com {
    redir https://seventysixsandbox.com{uri} permanent
}

# API — served from Docker container port 5085
# Security headers are handled by the API middleware (AttributeBasedSecurityHeadersMiddleware),
# so no Caddy-level header overrides are needed here.
api.seventysixsandbox.com {
    reverse_proxy localhost:5085 {
        header_up X-Forwarded-For {header.CF-Connecting-IP}
    }
}

# Observability tools (Grafana, Jaeger, Prometheus) are served via nginx
# reverse proxy routes at /grafana/, /jaeger/, /prometheus/ — protected by
# nginx auth_request that validates the admin session cookie (X-Refresh-Token)
# via the API before allowing access. No Caddy subdomain blocks needed.
CEOF
```

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

> **Observability access**: Grafana, Jaeger, and Prometheus are served via same-origin nginx proxy routes,
> protected by `auth_request` that validates the `X-Refresh-Token` cookie against the API (`/api/v1/auth/verify-admin`).
> Only authenticated Admin users can access them. Unauthenticated or non-admin users receive 401.
>
> - `https://seventysixsandbox.com/grafana/`
> - `https://seventysixsandbox.com/jaeger/`
> - `https://seventysixsandbox.com/prometheus/`
>
> No additional DNS records are needed for these services.

> **TLS Note:** Cloudflare terminates TLS towards the end user. Set **SSL/TLS encryption mode to "Full (Strict)"** so Cloudflare also validates the origin server's certificate (provided by Caddy/Let's Encrypt). "Flexible" mode skips origin TLS entirely — never use it.

### 5.2 SSL/TLS

- **Encryption mode:** Full (Strict)
- **Always Use HTTPS:** ON
- **Minimum TLS Version:** 1.2

### 5.3 Caching

Create **two** Cache Rules (Cloudflare Dashboard → Caching → Cache Rules → Create rule):

**Rule 1 — No-cache for API responses** *(create first — evaluated in order)*

1. Rule name: `No-cache for API responses`
2. Click **"Edit expression"** and paste:

   ```
   (http.host eq "seventysixsandbox.com") and (starts_with(http.request.uri.path, "/api/"))
   ```

3. Cache eligibility: **Bypass cache**
4. Place at: **First**
5. Deploy

**Rule 2 — Cache Angular static files (1 month)**

1. Rule name: `Cache Angular static files`
2. Click **"Edit expression"** and paste:

   ```
   (http.host eq "seventysixsandbox.com") and (http.request.uri.path.extension in {"js" "css" "woff2" "woff" "ttf" "svg" "png" "ico" "webp"})
   ```

3. Cache eligibility: **Eligible for cache**
4. Edge TTL: Click **"+ Add setting"** → **Edge TTL** → select **"Ignore cache-control header and use this TTL"** → set to `1 month`
5. Place at: **Last**
6. Deploy

> **Note on "Origin Cache Control"**: This option only appears after selecting "Eligible for cache", then clicking "+ Add setting". It is not needed here because rule 2 sets the Edge TTL explicitly, and Caddy already sends `Cache-Control: public, max-age=31536000, immutable` for static assets.

> **Why "Edit expression" instead of the button rows?**: The simple filter builder has no "matches regex" operator (that requires Pro+). The `.extension` field in the custom expression is Cloudflare's built-in extension matcher — no regex needed and no false positives from paths like `/javascript/app`.

### 5.4 Security

- **Under Attack Mode:** OFF (turn ON if under DDoS — Cloudflare adds JS challenge)
- **Bot Fight Mode:** ON
- **Browser Integrity Check:** ON

### 5.5 WAF Custom Rules (Replaces Fail2Ban + GeoIP)

> **Context:** The application previously used Fail2Ban for login brute-force protection and GeoIP for country-level blocking. These have been removed because Cloudflare handles both at the edge — blocking malicious traffic before it reaches the origin server. This is more effective (blocks at the CDN edge, not at the server) and simpler (no log parsing, no iptables chains, no MaxMind DB updates).

> **Security Model — Defense in Depth (5 Layers):**
>
> The rate limiting and IP security model relies on multiple independent layers. Each layer is designed so that if one is bypassed, the others still protect the application:
>
> | # | Layer | What it does | Spoofing risk |
> |---|-------|-------------|---------------|
> | 1 | **Cloudflare WAF (edge)** | Blocks bots, geo-blocks countries, challenges leaked passwords, rate limits burst traffic (10-second windows), Free Managed Ruleset blocks common vulnerabilities | None — Cloudflare controls the edge |
> | 2 | **UFW (OS firewall)** | Restricts ports 80/443 to Cloudflare IPs only (Section 3.6) | None — kernel-level enforcement |
> | 3 | **Caddy (reverse proxy)** | Maps `CF-Connecting-IP` → `X-Forwarded-For` for real client IP | Protected by Layer 2 — only Cloudflare can connect, and Cloudflare always sets `CF-Connecting-IP` to the real client IP |
> | 4 | **ASP.NET ForwardedHeaders** | Trusts only `127.0.0.1` (Caddy) to set `X-Forwarded-For`, resolves `RemoteIpAddress` | Protected by Layer 2+3 — even if an attacker reached the API directly, ForwardedHeaders only trusts loopback |
> | 5 | **ASP.NET Rate Limiter** | Per-IP fixed-window limits: 15 login/min, 3 register/hr, 10 refresh/min, etc. Returns 429 + `Retry-After` | Correctly partitioned by real client IP thanks to Layers 2-4 |
>
> **Why Layer 2 (UFW) is critical:** Without it, an attacker who discovers the origin server IP (via DNS history, certificate transparency logs, or IP scanning) could bypass Cloudflare entirely and send forged `CF-Connecting-IP` headers. Caddy would blindly pass these to the API, allowing the attacker to spoof any IP — evading rate limits or causing legitimate users to be rate-limited.
>
> **How the server IP could leak:** DNS history (before Cloudflare was enabled), certificate transparency logs (`crt.sh`), or mass IPv4 scanning. UFW's Cloudflare-only restriction makes discovery of the IP irrelevant.

> **Cloudflare free tier limitation:** Rate limiting periods are limited to **10 seconds** on the free plan. Longer windows (1 minute, 10 minutes) require a paid plan. The 10-second window is still effective against automated attacks (bots fire tens of requests/second), and the server-side rate limiter handles longer windows.

Cloudflare free tier includes **5 WAF Custom Rules** and **1 Rate Limiting Rule**. Custom rules are created in: **Security → WAF → Custom rules → Create rule**. Rate limiting rules are created separately in: **Security → WAF → Rate limiting rules → Create rule**.

#### Rule 1 — Block Countries (replaces fail2ban GeoIP jail)

Blocks all traffic from high-risk countries that have no legitimate users.

1. Rule name: `Block high-risk countries`
2. Click **"Edit expression"** and paste:

   ```
   (ip.geoip.country in {"CN" "RU" "IR" "KP"})
   ```

3. Action: **Block**
4. Place at: **First**
5. Deploy

> **To add/remove countries:** Edit the rule expression and add/remove ISO 3166-1 alpha-2 country codes to the set. Common additions: `"IN"` (India). Remove a code if you gain legitimate users from that country.

#### Rule 2 — Block Leaked Passwords

Blocks login attempts using passwords known to be compromised (from the Have I Been Pwned dataset). Cloudflare's leaked credentials detection is enabled by default on all plans and scans incoming auth requests automatically. This rule uses the `Password Leaked` field (available on free plan) to block requests with known-compromised passwords.

1. Rule name: `Block leaked passwords`
2. Click **"Edit expression"** and paste:

   ```
   (cf.waf.credential_check.password_leaked)
   ```

3. Action: **Managed Challenge**
4. Deploy

> **Why Managed Challenge instead of Block?** A legitimate user may unknowingly reuse a leaked password. A challenge lets them prove they're human and proceed, while stopping automated credential stuffing attacks. Consider switching to Block if you see abuse in Security → Events.

#### Rule 3 — General API Rate Limit (1 of 1 rate limiting rules on free plan)

Catches any IP hammering the API overall at bot-like speeds. The free plan allows **1 rate limiting rule** — this is it. Use it wisely.

1. Navigate to: **Security → WAF → Rate limiting rules → Create rule**
2. Rule name: `General API rate limit`
3. Field: **URI Path** (only raw field available on free plan)
4. Operator: **starts with**
5. Value: `/api/`
6. Rate limit characteristics: **IP** (only option on free plan)
7. Requests: `50`
8. Period: `10 seconds` (only period available on free plan)
9. Action: **Block**
10. Duration: `10 seconds` (only duration available on free plan)
11. Deploy

> **Free plan available fields in rate limiting rules:** URI Path, Verified Bot, Verified Bot Category, and Password Leaked. Host, Method, Full URI, Query, and Source IP require Pro or higher.

### 5.6 Managed Rulesets

Deploy the **Cloudflare Free Managed Ruleset** — available on all plans at no cost, no custom rule slots consumed. It provides mitigation against high and wide-impacting vulnerabilities (zero-day exploits, common attack patterns).

1. Navigate to: **Security → Settings** (new dashboard) or **Security → WAF → Managed rules** (old dashboard)
2. Find **Cloudflare Free Managed Ruleset**
3. Click **Deploy** (or toggle it on)
4. Leave defaults — the ruleset is regularly updated by Cloudflare's security team

> **Note:** If you later upgrade to a paid plan, also deploy the **Cloudflare Managed Ruleset** and **OWASP Core Ruleset** — these are significantly more comprehensive but require Pro or higher.

### 5.7 Block AI Bots

Block AI scrapers/crawlers (GPTBot, ChatGPT-User, Google-Extended, etc.) from indexing your site. This is a separate toggle from Bot Fight Mode.

1. Navigate to: **Security → Settings** → filter by **Bot traffic**
2. Find **Block AI Scrapers and Crawlers**
3. Toggle **ON**

> You can view blocked AI bot traffic in **Security → Events**.

### 5.8 Manual IP Blocking

To manually block a specific IP address (e.g., after reviewing logs):

1. Navigate to: **Security → WAF → Tools → IP Access Rules**
2. Enter the IP address or CIDR range (e.g., `1.2.3.4` or `1.2.3.0/24`)
3. Action: **Block**
4. Notes: Add reason (e.g., "Brute force attempt 2025-06-04")
5. Click **Add**

> **Tip:** Review blocked IPs periodically in **Security → Events** to see what Cloudflare is catching. If a legitimate user gets rate-limited, you can add their IP to the **Allow** list in IP Access Rules.

### 5.9 Verification Checklist

After configuring all rules, verify:

- [ ] **Origin protection:** From a non-Cloudflare IP (e.g., your local machine), run `curl -v https://SERVER_IP` — should timeout or be refused (UFW blocks it)
- [ ] **Origin protection:** From your browser via the domain name — should load normally (traffic goes through Cloudflare)
- [ ] Visit the site from a non-blocked country — should load normally
- [ ] Send 51+ rapid requests to any `/api/` endpoint within 10 seconds — should get blocked by Cloudflare rate limit rule
- [ ] Send 16+ login requests over 1 minute — should get 429 from server after 15 (server-side limiter)
- [ ] Check **Security → Events** — Cloudflare-blocked requests should appear with the rule name
- [ ] Confirm **Bot Fight Mode** is ON (Security → Settings → Bot traffic)
- [ ] Confirm **Browser Integrity Check** is ON (Security → Settings)
- [ ] Confirm **Block AI Scrapers and Crawlers** is ON (Security → Settings → Bot traffic)
- [ ] Confirm **Cloudflare Free Managed Ruleset** is deployed (Security → Settings → Managed rules)
- [ ] Confirm **Leaked Credentials Detection** is enabled (Security → Settings → Detection tools — enabled by default on free plan)

---

### 5.10 Generate Internal CA and Service Certificates

Production inter-service communication uses mutual TLS (mTLS) with an internal Certificate Authority. The `generate-internal-ca.ps1` script creates a root CA (10-year lifetime) and service certificates (1-year lifetime) for PostgreSQL, Valkey, OTEL Collector, Jaeger, Prometheus, Grafana, and client certificates for the API and supporting services.

**These must exist before the first `docker compose up`.** Without them services will fail to start.

On the **production server**:

```bash
ssh deploy@$SERVER_IP
cd /srv/seventysix

# Generate all certificates (CA + service certs + client certs)
pwsh scripts/generate-internal-ca.ps1
```

This creates certificates in `docker/certs/` with proper directory structure. The `docker-compose.production.yml` mounts these into each service container.

PostgreSQL requires strict file permissions:

```bash
# PostgreSQL requires the key to be owned by UID 70 (postgres user inside the container)
sudo chown 70:70 docker/certs/postgres/server.key docker/certs/postgres/server.crt
sudo chmod 600 docker/certs/postgres/server.key docker/certs/postgres/server.crt
```

> **Certificate rotation:** Service certificates expire after 1 year. Re-run `generate-internal-ca.ps1` and restart services. The CA root (10-year) only needs regeneration if compromised. See [Certificate-Lifecycle.md](Certificate-Lifecycle.md) for full rotation procedures.

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
sudo chmod 600 /var/lib/docker/volumes/seventysix_dataprotection_prod_keys/_data/dataprotection.pfx
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
> | `ALTCHA_HMAC_KEY` | Dev key is in user secrets. **MUST be exactly `openssl rand -base64 64` (64 bytes / 256 bits minimum).** A shorter or malformed key throws `InvalidKeyException` during DI container startup — every endpoint returns 500 until the secret is rotated and the service re-deployed. See A.2. |
> | `DATA_PROTECTION_CERTIFICATE_PASSWORD` | Must match the newly generated production cert (not the dev cert) |
> | `ADMIN_PASSWORD` | One-time seed password — generate random: `openssl rand -base64 24` |
> | `GRAFANA_ADMIN_PASSWORD` | Dev password is in user secrets; regenerate: `openssl rand -base64 20` |
> | `OAUTH_CLIENT_ID/SECRET` | **Register a NEW production OAuth App** — dev app has localhost callback URLs. Note: GitHub reserves the `GITHUB_` prefix for its own secrets — use `OAUTH_` instead. |
> | `EMAIL_API_KEY` | Use a production-specific Brevo API key |

In your GitHub repository → **Settings → Secrets and variables → Actions**, add:

### Secrets (sensitive — hidden in logs)

| Secret Name | Value | Generate with |
|---|---|---|
| `PROD_HOST` | Server IP address | — |
| `PROD_USER` | `deploy` | — |
| `PROD_SSH_KEY` | Ed25519 private key (see Section 9) | `ssh-keygen -t ed25519` |
| `DB_PASSWORD` | Database password | `openssl rand -base64 32` |
| `JWT_SECRET_KEY` | JWT signing key (64+ chars) | `openssl rand -base64 64` |
| `OAUTH_CLIENT_ID` | Production GitHub OAuth App client ID (GitHub reserves the `GITHUB_` prefix) | [github.com/settings/developers](https://github.com/settings/developers) |
| `OAUTH_CLIENT_SECRET` | Production GitHub OAuth App client secret | Same OAuth App |
| `EMAIL_API_KEY` | Brevo API key | [Brevo dashboard](https://app.brevo.com/settings/keys/api) |
| `EMAIL_FROM_ADDRESS` | Sender address (e.g., `noreply@seventysixsandbox.com`) | — |
| `SITE_EMAIL` | Public contact email shown on Privacy Policy and Terms of Service pages (e.g., `hello@yourdomain.com`) | — |
| `ALTCHA_HMAC_KEY` | ALTCHA PoW key (base64, **must decode to exactly 64 bytes**) | `openssl rand -base64 64` |
| `ADMIN_EMAIL` | Admin account email | — |
| `ADMIN_PASSWORD` | Admin account initial password (one-time) | `openssl rand -base64 24` |
| `ADMIN_USERNAME` | Admin account username (**not** `admin`) | — |
| `DATA_PROTECTION_CERTIFICATE_PASSWORD` | PFX cert password (matches Section 6) | `openssl rand -base64 32` |
| `CORS_ORIGIN_0` | `https://seventysixsandbox.com` | — |
| `VALKEY_PASSWORD` | Valkey/Redis password | `openssl rand -base64 32` |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | `openssl rand -base64 20` |
| `ALLOWED_HOSTS` | `seventysixsandbox.com;www.seventysixsandbox.com;api.seventysixsandbox.com` | — |
| `CLIENT_BASE_URL` | `https://seventysixsandbox.com` | — |
| `OAUTH_CALLBACK_URL` | `https://seventysixsandbox.com/auth/callback` | — |
| `OAUTH_REDIRECT_URI` | `https://api.seventysixsandbox.com/api/v1/auth/oauth/github/callback` | — |

### Variables (non-sensitive — visible in logs/settings)

| Variable Name | Default | Notes |
|---|---|---|
| `DB_HOST` | `database` | Docker Compose service name for PostgreSQL |
| `DB_PORT` | `5432` | PostgreSQL port (internal to Docker network) |
| `DB_NAME` | `seventysix_db_name` | Database name (distinct from dev `seventysix`) |
| `DB_USER` | `seventysix_db_user_` | Database user (distinct from default `postgres`) |
| `ADMIN_FULLNAME` | `System Administrator` | Admin display name |
| `ADMIN_SEEDER_ENABLED` | `true` | **Set to `false` after first deploy + password change** |
| `CORS_ORIGIN_1` | *(empty)* | Optional www variant: `https://www.seventysixsandbox.com` |
| `GRAFANA_ADMIN_USER` | `seventysix_grafana_admin_user` | Grafana login username (distinct from default `admin`) |

> **Setting `ADMIN_SEEDER_ENABLED` to `false`:** After the first successful deploy and admin password change, update this Variable to `false` and trigger a re-deploy via `gh workflow run deploy.yml` or push any commit to master.

### Quick Setup via `gh` CLI

> **Copilot can set these for you.** In VS Code Agent mode, ask:
> *"Set all GitHub secrets and variables for SeventySix production deployment"*
> and provide your real values when prompted. The commands below are the same ones Copilot runs.
>
> **Where to find these after they're set:** GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
> Secrets tab shows all secret names (values are hidden). Variables tab shows names and values.

#### Set Secrets

```bash
REPO="actionjacksonthegoat-debug/SeventySix"

# ── Infrastructure (set after server provisioning — see Section 9) ──
gh secret set PROD_HOST --body "<SERVER_IP>" --repo $REPO
gh secret set PROD_USER --body "deploy" --repo $REPO
gh secret set PROD_SSH_KEY --body "$(cat ~/.ssh/seventysix-deploy)" --repo $REPO

# ── Database ──
gh secret set DB_PASSWORD --body "<GENERATED_DB_PASSWORD>" --repo $REPO

# ── Authentication ──
gh secret set JWT_SECRET_KEY --body "<GENERATED_JWT_KEY>" --repo $REPO
# Note: GitHub reserves the GITHUB_ prefix — use OAUTH_ for secret names
# deploy.yml maps these to GITHUB_CLIENT_ID/SECRET env vars for docker-compose
gh secret set OAUTH_CLIENT_ID --body "<YOUR_OAUTH_APP_CLIENT_ID>" --repo $REPO
gh secret set OAUTH_CLIENT_SECRET --body "<YOUR_OAUTH_APP_CLIENT_SECRET>" --repo $REPO

# ── Email (Brevo API key) ──
gh secret set EMAIL_API_KEY --body "<YOUR_BREVO_API_KEY>" --repo $REPO
gh secret set EMAIL_FROM_ADDRESS --body "<YOUR_FROM_ADDRESS>" --repo $REPO
gh secret set SITE_EMAIL --body "<YOUR_SITE_CONTACT_EMAIL>" --repo $REPO

# ── Security ──
# CRITICAL: Must decode to EXACTLY 64 bytes. Ixnas.AltchaNet rejects any other size.
# A wrong-size key causes InvalidKeyException at DI resolution → every endpoint returns 500.
ALTCHA_HMAC_KEY=$(openssl rand -base64 64)
gh secret set ALTCHA_HMAC_KEY --body "$ALTCHA_HMAC_KEY" --repo $REPO
unset ALTCHA_HMAC_KEY  # don't leave it in shell history
gh secret set DATA_PROTECTION_CERTIFICATE_PASSWORD --body "<GENERATED_CERT_PASSWORD>" --repo $REPO

# ── Admin Seeder (one-time bootstrap) ──
gh secret set ADMIN_EMAIL --body "<YOUR_ADMIN_EMAIL>" --repo $REPO
gh secret set ADMIN_PASSWORD --body "<GENERATED_ADMIN_PASSWORD>" --repo $REPO
gh secret set ADMIN_USERNAME --body "<YOUR_ADMIN_USERNAME>" --repo $REPO

# ── CORS / Hosts ──
gh secret set CORS_ORIGIN_0 --body "https://<YOUR_DOMAIN>" --repo $REPO
gh secret set ALLOWED_HOSTS --body "<YOUR_DOMAIN>;www.<YOUR_DOMAIN>;api.<YOUR_DOMAIN>" --repo $REPO
gh secret set CLIENT_BASE_URL --body "https://<YOUR_DOMAIN>" --repo $REPO
gh secret set OAUTH_CALLBACK_URL --body "https://<YOUR_DOMAIN>/auth/callback" --repo $REPO
gh secret set OAUTH_REDIRECT_URI --body "https://api.<YOUR_DOMAIN>/api/v1/auth/oauth/github/callback" --repo $REPO

# ── Cache ──
gh secret set VALKEY_PASSWORD --body "<GENERATED_VALKEY_PASSWORD>" --repo $REPO

# ── Observability ──
gh secret set GRAFANA_ADMIN_PASSWORD --body "<GENERATED_GRAFANA_PASSWORD>" --repo $REPO

```

> **Generating cryptographic values:** Use `openssl rand -base64 N` or PowerShell:
>
> ```powershell
> # PowerShell equivalent (no OpenSSL needed)
> function New-RandomBase64([int]$bytes) {
>     $buf = [byte[]]::new($bytes)
>     [System.Security.Cryptography.RandomNumberGenerator]::Fill($buf)
>     [Convert]::ToBase64String($buf)
> }
> New-RandomBase64 32  # DB_PASSWORD, ALTCHA, VALKEY, DATA_PROTECTION_CERT
> New-RandomBase64 64  # JWT_SECRET_KEY
> New-RandomBase64 24  # ADMIN_PASSWORD
> New-RandomBase64 20  # GRAFANA_ADMIN_PASSWORD
> ```

#### Set Variables

```bash
REPO="actionjacksonthegoat-debug/SeventySix"

gh variable set DB_HOST --body "database" --repo $REPO
gh variable set DB_PORT --body "5432" --repo $REPO
gh variable set DB_NAME --body "<YOUR_PROD_DB_NAME>" --repo $REPO
gh variable set DB_USER --body "<YOUR_PROD_DB_USER>" --repo $REPO
gh variable set ADMIN_FULLNAME --body "System Administrator" --repo $REPO
gh variable set ADMIN_SEEDER_ENABLED --body "true" --repo $REPO
gh variable set CORS_ORIGIN_1 --body "https://www.<YOUR_DOMAIN>" --repo $REPO
gh variable set GRAFANA_ADMIN_USER --body "<YOUR_GRAFANA_USERNAME>" --repo $REPO
```

> **IMPORTANT:** Save `ADMIN_PASSWORD` and `DATA_PROTECTION_CERTIFICATE_PASSWORD` to a password manager immediately — generated values are only shown once.

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
   > **Image architecture:** The CI publish job builds `linux/amd64` images only (Hetzner CPX41 is x86_64).
   > To add ARM support for Hetzner CAX servers, re-add `linux/arm64` to the `platforms:` field in
   > `.github/workflows/ci.yml` and add the `docker/setup-qemu-action@v3` step before the build step.
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

Open `https://seventysixsandbox.com/grafana/`. Access is protected by nginx `auth_request` — you must be logged into the Angular app as an Admin user (the `X-Refresh-Token` cookie is validated automatically). Grafana uses anonymous viewer access behind the auth gate, so no separate Grafana login is needed for read-only viewing. To make admin changes, log in to Grafana directly with `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`.

Useful Prometheus queries:

- API request rate: `rate(http_server_request_duration_seconds_count[5m])`
- API error rate: `rate(http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[5m])`
- Container memory: `container_memory_usage_bytes`

### 11.3 Jaeger Access

Open `https://seventysixsandbox.com/jaeger/` — select the `SeventySix.Api` service to view distributed traces. Requires admin login (same auth_request protection).

### 11.4 Prometheus Access

Open `https://seventysixsandbox.com/prometheus/`. Requires admin login (same auth_request protection).

### 11.5 Observability Security Model

All observability services are accessed via same-origin nginx reverse proxy routes, protected by `auth_request`.
Each request triggers a subrequest to `GET /api/v1/auth/verify-admin`, which validates the `X-Refresh-Token`
HttpOnly cookie and confirms the user has Admin role. Results are cached by nginx for 30s to avoid DB hits
on every static asset. Observability containers have **no host port bindings** — they are only reachable
via the Docker internal network through nginx.

| Layer | Mechanism | Protects |
|-------|-----------|----------|
| 1 | Hetzner Cloud Firewall: only ports 22, 80, 443 inbound | External network |
| 2 | Docker internal network (no host port bindings for observability) | Host network stack |
| 3 | nginx `auth_request` → API `verify-admin` (Admin role required) | Authentication + authorization |
| 4 | nginx `proxy_cache` on auth subrequest (30s TTL) | Performance |

pgAdmin and RedisInsight are **not deployed in production** — they are dev-environment-only tools.

---

## 11.6 Commerce Site Deployment

The SeventySixCommerce sandbox sites (SvelteKit and TanStack Start) run as separate Docker containers alongside the core platform.

### Subdomains

| Site | Subdomain | Container Port |
|------|-----------|---------------|
| TanStack (React) | `seventysixcommerce-react.seventysixsandbox.com` | 3000 |
| SvelteKit (Svelte) | `seventysixcommerce-svelte.seventysixsandbox.com` | 3001 |

### Cloudflare DNS

Add A records for both commerce subdomains pointing to the server IP, with Cloudflare proxy enabled (orange cloud):

```
seventysixcommerce-react  A  <SERVER_IP>  Proxied
seventysixcommerce-svelte A  <SERVER_IP>  Proxied
```

### Caddy Configuration

Commerce routing is defined in `Caddyfile.seventysixcommerce`, imported by the primary `Caddyfile.production`. Both subdomains use the same Cloudflare origin certificate for TLS termination.

### Commerce Database

Each commerce site uses its own PostgreSQL database (`seventysixcommerce`) within the shared PostgreSQL container. The Drizzle ORM schema auto-migrates on container startup.

### Environment Variables

Required environment variables for commerce containers:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string for the commerce database |
| `STRIPE_SECRET_KEY` | Stripe API key for payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `PRINTFUL_API_KEY` | Printful API key for order fulfillment |
| `PRINTFUL_WEBHOOK_SECRET` | Printful webhook signature verification |
| `BREVO_API_KEY` | Brevo API key for transactional email |
| `BASE_URL` | Public URL of the commerce site |
| `SEVENTYSIX_API_URL` | SeventySix API URL for log forwarding |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector endpoint |

Optional analytics/SEO variables:

| Variable | Purpose |
|----------|---------|
| `PUBLIC_GA4_MEASUREMENT_ID` / `VITE_GA4_MEASUREMENT_ID` | Google Analytics 4 tracking |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` / `VITE_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `PUBLIC_BING_SITE_VERIFICATION` / `VITE_BING_SITE_VERIFICATION` | Bing Webmaster Tools |

### Docker Compose

Commerce containers are defined in `docker-compose.seventysixcommerce.yml`. Deploy alongside the main stack:

```bash
docker compose -f docker-compose.production.yml -f docker-compose.seventysixcommerce.yml up -d
```

### Health Monitoring

Add UptimeRobot monitors for both commerce sites:

| Monitor | Type | URL | Interval |
|---|---|---|---|
| Commerce (React) | HTTPS | `https://seventysixcommerce-react.seventysixsandbox.com` | 5 min |
| Commerce (Svelte) | HTTPS | `https://seventysixcommerce-svelte.seventysixsandbox.com` | 5 min |

### Security Headers

Both commerce sites set security headers in their server middleware:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` — strict policy with GA4 sources allowed when analytics is enabled

HSTS is handled at the Caddy TLS termination layer.

---

## 11.7 Cloudflare Hardening

Configure these settings in the Cloudflare dashboard for all domains:

### WAF & Bot Protection

| Setting | Value | Purpose |
|---------|-------|---------|
| WAF Managed Rules | OWASP Core Ruleset enabled | Block common attack patterns |
| Bot Fight Mode | Enabled | Challenge suspected bots |
| Browser Integrity Check | Enabled | Block requests with suspicious user agents |
| Hotlink Protection | Enabled | Prevent product image hotlinking |
| Email Obfuscation | Enabled | Hide email addresses in HTML |

### SSL/TLS

| Setting | Value | Purpose |
|---------|-------|---------|
| SSL Mode | Full (Strict) | Caddy has valid origin certificate |
| Minimum TLS Version | 1.2 | Block TLS 1.0/1.1 |
| HTTP/3 (QUIC) | Enabled | Performance improvement |
| HSTS | Enabled (max-age 12 months, includeSubDomains) | Force HTTPS |
| Always Use HTTPS | Enabled | Redirect HTTP → HTTPS |

### Caching

| Setting | Value | Purpose |
|---------|-------|---------|
| Browser Cache TTL | Respect Existing Headers | Let app servers control caching |
| Cache Level | Standard | Cache static assets |
| Bypass cache for | `/api/*`, `/checkout/*` | Never cache dynamic content |

### Rate Limiting (optional, free tier limited)

| Rule | Threshold | Action |
|------|-----------|--------|
| API endpoints | 100 req/10s per IP | Challenge |
| Login page | 10 req/min per IP | Block |

### Hetzner UFW (Origin Protection)

Restrict ports 80/443 to Cloudflare IPs only:

```bash
# Download Cloudflare IP ranges
curl -s https://www.cloudflare.com/ips-v4 | while read ip; do
  ufw allow from "$ip" to any port 80,443 proto tcp
done

# Block all other 80/443 traffic
ufw default deny incoming
ufw allow 22/tcp  # SSH
ufw enable
```

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
- [ ] Grafana accessible: `https://seventysixsandbox.com/grafana/` (requires admin login)
- [ ] Grafana shows request rate and latency graphs
- [ ] Jaeger accessible: `https://seventysixsandbox.com/jaeger/` (requires admin login)
- [ ] Jaeger shows traces from API calls
- [ ] Prometheus accessible: `https://seventysixsandbox.com/prometheus/` (requires admin login)
- [ ] Prometheus targets all healthy
- [ ] Observability returns 401 when not logged in as admin
- [ ] Backup runs successfully: `/srv/seventysix/scripts/backup.sh`
- [ ] R2 has backup files: `rclone ls r2:seventysix-backups`
- [ ] Data Protection key backup exists in R2
- [ ] Docker log rotation active: `docker inspect seventysix-api-prod | grep -A5 LogConfig`
- [ ] CD pipeline deploys on push to master (check GitHub Actions)
- [ ] Cloudflare Analytics shows cache hits for static assets
- [ ] UptimeRobot shows green for both monitors
- [ ] Commerce (React): `https://seventysixcommerce-react.seventysixsandbox.com` loads over HTTPS
- [ ] Commerce (Svelte): `https://seventysixcommerce-svelte.seventysixsandbox.com` loads over HTTPS
- [ ] Commerce sites: product pages render with correct SEO meta tags
- [ ] Commerce sites: robots.txt accessible and contains correct Sitemap URL
- [ ] Commerce sites: security headers present (check via browser DevTools → Network → Response Headers)
- [ ] Commerce sites: OpenTelemetry traces appear in Jaeger under commerce service names
- [ ] Commerce sites: logs forwarded to SeventySix API (visible in admin log viewer)

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
export DB_NAME=seventysix_db_name DB_USER=seventysix_db_user
export GITHUB_CLIENT_ID="..." GITHUB_CLIENT_SECRET="..."
export EMAIL_API_KEY="..." EMAIL_FROM_ADDRESS="..."
export SITE_EMAIL="..."
export ALTCHA_HMAC_KEY="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." ADMIN_USERNAME="..."
export ADMIN_SEEDER_ENABLED=false DATA_PROTECTION_CERTIFICATE_PASSWORD="..."
export CORS_ORIGIN_0="https://seventysixsandbox.com" CORS_ORIGIN_1="https://www.seventysixsandbox.com"
export GRAFANA_ADMIN_USER=seventysix_grafana_admin_user GRAFANA_ADMIN_PASSWORD="..."
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

### Vertical Scale (CCX23 → CCX33)

```bash
# From your local machine — ~10 minutes downtime
hcloud server change-type seventysix-prod ccx33
# $55.49/mo — 8 dedicated AMD vCPU / 32 GB. Next: ccx43 ($110.99/mo, 16 vCPU / 64 GB)

# The server reboots automatically. All containers restart via restart: unless-stopped.
# Verify: ssh deploy@$SERVER_IP && docker compose ps
```

### Rollback to Previous Image

The deploy pipeline includes **automated rollback**. When post-deploy smoke tests fail:

1. The `rollback-staging` job runs automatically via `if: failure()`
2. It SSH-es to the server and resets to the previous Git commit (`HEAD@{1}`)
3. It pulls the prior images and restarts containers
4. If the rollback itself fails, a GitHub issue with the `incident` label is created

**Manual rollback** (if automated rollback is unavailable):

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

**Commerce rollback** follows the same automated pattern via `rollback-staging` in `seventysixcommerce-deploy.yml`.

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
gunzip -c /tmp/db_latest.sql.gz | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME"

# 4. Update PROD_HOST GitHub Secret to the new server IP, then update DNS in Cloudflare
gh secret set PROD_HOST --body "NEW_IP" --repo actionjacksonthegoat-debug/SeventySix
# 5. Wait 24h, verify, terminate old server
```

---

## E-Commerce Sites Deployment

The two e-commerce storefronts deploy via `docker-compose.seventysixcommerce.yml` on the same production server, using Caddy as a reverse proxy.

### Architecture

- **Docker Compose**: `docker-compose.seventysixcommerce.yml` defines three services: PostgreSQL 18, TanStack app (port 3000), and SvelteKit app (port 3001)
- **Database**: Single PostgreSQL instance with two databases — `SeventySixCommerce` (TanStack) and `SeventySixCommerce_sveltekit` (SvelteKit), separate from the main SeventySix database
- **Resource Limits**: Each commerce container limited to 1.0 CPU / 512MB memory

### Caddy Configuration

`Caddyfile.seventysixcommerce` configures two domain pairs:

| Domain | Target |
|--------|--------|
| `SeventySixCommerce-react.seventysixsandbox.com` | TanStack app → `localhost:3000` |
| `SeventySixCommerce-svelte.seventysixsandbox.com` | SvelteKit app → `localhost:3001` |

Both use the same Cloudflare origin TLS certificates as the main site.

### Health Checks

All commerce apps expose two probe types:

| Probe | Purpose | TanStack Endpoint | SvelteKit Endpoint |
|-------|---------|--------------------|--------------------|
| **Liveness** | Process is alive (no DB check) | `GET /api/healthz` | `GET /healthz` |
| **Readiness** | Process is alive **and** DB is reachable | `GET /api/health/ready` | `GET /health/ready` |

Docker Compose healthchecks use the **readiness** probe so containers are only marked healthy when they can serve traffic end-to-end. Orchestrators (Kubernetes, Nomad) should wire liveness → restart and readiness → traffic routing.

### Secrets

Environment variables set in `docker-compose.seventysixcommerce.yml`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `PRINTFUL_API_KEY` | Printful API key (optional — mock available) |
| `BREVO_API_KEY` | Brevo transactional email key (optional — mock available) |
| `BASE_URL` | Public URL for the application |
| `NODE_ENV` | `production` |

### Deploying Commerce Sites

```bash
ssh deploy@$SERVER_IP
cd /srv/seventysix

# Pull latest images and restart
docker compose -f docker-compose.seventysixcommerce.yml pull
docker compose -f docker-compose.seventysixcommerce.yml up -d

# Verify health (readiness probes)
curl -s http://localhost:3000/api/health/ready
curl -s http://localhost:3001/health/ready
```

---

## Appendix A — Deployment Notes & Gotchas

Lessons learned from the initial deployment. Intended for the deploying human **and** for Copilot so it knows what it can and cannot do.

### A.1 Who Does What

Most deployment phases require SSH, Cloudflare dashboard, or credential management that **only the user** can execute. Copilot's role is limited to:

| Copilot Can Do | User Must Do |
|---|---|
| Code changes (compose files, CI/CD workflows, nginx configs) | SSH into production server |
| Documentation updates | Cloudflare dashboard configuration |
| Generating `gh secret set` / `gh variable set` command lists | Running those commands (they contain secrets) |
| Diagnosing issues from pasted logs | Creating OAuth Apps, Brevo API keys, MaxMind accounts |
| Writing Caddyfile / firewall rules for user to paste | Uploading certs, configuring rclone, running backups |

### A.2 Critical Gotchas

**GitHub Secret naming — `GITHUB_` prefix is reserved.**
GitHub Actions silently refuses secrets named `GITHUB_*`. OAuth secrets must use the `OAUTH_` prefix (e.g., `OAUTH_CLIENT_ID`). The `deploy.yml` workflow then maps these to `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` env vars that `docker-compose.production.yml` expects.

**hcloud CLI on Windows — not in winget.**
Download the `hcloud-windows-amd64.zip` binary directly from [github.com/hetznercloud/cli/releases](https://github.com/hetznercloud/cli/releases) and place `hcloud.exe` on PATH. This is already noted in Prerequisites but is easy to miss.

**Ubuntu 24.04 SSH service name is `ssh`, not `sshd`.**
The hardening step uses `systemctl reload ssh` (not `sshd`). If you use `sshd`, the command silently fails and your SSH config changes don't apply.

**Cloudflare Cache Rules — no regex on Free tier.**
The simple filter builder has no "matches regex" operator (requires Pro+). Use "Edit expression" with Cloudflare's built-in `.extension` field in the wire filter expression — no regex needed.

**CSP blocks Cloudflare's auto-injected analytics beacon.**
Cloudflare injects `beacon.min.js` from `static.cloudflareinsights.com` when Browser Insights / Web Analytics is enabled. The production `Content-Security-Policy` blocks it unless you add `https://static.cloudflareinsights.com` to `script-src` and `https://cloudflareinsights.com` to `connect-src`. Alternatively, disable Browser Insights in the Cloudflare dashboard.

**`new URL("/api/v1")` throws in production.**
Client code using `new URL(environment.apiUrl)` works in dev (where `apiUrl` is a full URL) but throws `TypeError: Invalid URL` in production (where `apiUrl` is the relative path `"/api/v1"`). Guard with `environment.apiUrl.startsWith("http") ? new URL(environment.apiUrl).origin : window.location.origin`.

**Data Protection cert must be generated locally, not on the server.**
The `npm run generate:dataprotection-cert` script requires the .NET SDK. Generate on your dev machine, then `scp` the `.pfx` to the server. The password must match the `DATA_PROTECTION_CERTIFICATE_PASSWORD` GitHub Secret exactly.

**Internal CA certs must exist before first `docker compose up`.**
Without certificates in `docker/certs/`, services requiring mTLS fail to start. Run `pwsh scripts/generate-internal-ca.ps1` first. See Section 5.10.

**Server location matters for latency.**
Hetzner EU (Germany) adds ~180ms RTT for US West Coast users on every uncached API call. Hetzner US West (Hillsboro, Oregon) drops this to ~20-40ms. Cloudflare caches static assets at edge PoPs regardless, so the latency hit is API-only. Choose location based on where your users are.

**GHCR login on the server needs a PAT with `read:packages`.**
The `docker login ghcr.io` on the production server requires a GitHub Personal Access Token. This PAT is separate from `PROD_SSH_KEY` — it only needs the `read:packages` scope. The token is stored in `/home/deploy/.docker/config.json` and persists across reboots.

**`ALTCHA_HMAC_KEY` wrong size → entire API returns 500.**
`Ixnas.AltchaNet` requires the HMAC key to be **exactly 64 bytes** (512 bits) when decoded from base64. Any other size — including 32 bytes — throws `Ixnas.AltchaNet.Exceptions.InvalidKeyException` during DI resolution at request time. The result: **every single endpoint returns 500**, including `/api/v1/config/features`, which the Angular client calls immediately on load. The browser just shows 500s — the root cause only appears in `docker logs seventysix-api-prod`. The `AltchaSettingsValidator` also validates key length at startup and will fail fast with a clear message. To fix: generate a new 64-byte key with `openssl rand -base64 64`, update the GitHub Secret via `gh secret set ALTCHA_HMAC_KEY`, and re-deploy.

**OutputCache + Valkey cold start can cause 500s.**
If the first API request arrives before Valkey is healthy, `OutputCache` middleware throws 500 instead of falling back. Ensure the `api` service has `depends_on: valkey: condition: service_healthy` (not just `service_started`).

### A.3 Recommended Cloudflare Dashboard Settings

These are manual dashboard-only settings discovered during deployment — not automatable:

| Setting | Location | Value |
|---|---|---|
| SSL/TLS mode | SSL/TLS → Overview | Full (Strict) |
| Always Use HTTPS | SSL/TLS → Edge Certificates | ON |
| Minimum TLS Version | SSL/TLS → Edge Certificates | 1.2 |
| Bot Fight Mode | Security → Bots | ON |
| Browser Integrity Check | Security → Settings | ON |
| HTTP/3 (QUIC) | Network | ON |
| Brotli | Speed → Optimization | ON |
| Rocket Loader | Speed → Optimization | OFF (breaks Angular bootstrap) |

### A.4 Post-Deploy Console Errors to Expect

On a fresh deploy, you may see these errors in the browser console. They form a cascade — fix the root cause and downstream errors resolve:

```
GET /api/v1/config/features → 500                ← Root cause: check docker logs seventysix-api-prod
                                                     Most common cause: ALTCHA_HMAC_KEY not exactly 64 bytes
                                                     (InvalidKeyException during DI startup — see A.2)
                                                     Fix: rotate GitHub Secret, re-deploy
  └─► TypeError: Invalid URL (client init)        ← oauth-flow.service.ts cascades from the 500 above
        └─► POST /api/v1/logs/client/batch → 400  ← error batch exceeds validation limits
[Report Only] Permissions-Policy: picture-in-picture  ← Cloudflare beacon (expected, harmless)
```

### A.5 HSTS Preload — Hardcoding HTTPS in Browsers

The `Strict-Transport-Security` header (set by nginx and the API middleware) instructs browsers that have previously visited your site to always use HTTPS. The `preload` directive goes further: it allows your domain to be embedded in browsers' built-in HSTS lists, so HTTPS is enforced even on the **very first visit** — before any header has ever been seen.

This is already configured (`max-age=31536000; includeSubDomains; preload`) but submission to the preload list is a one-time manual step:

1. Verify your domain is live with the full HSTS header: `curl -sI https://seventysixsandbox.com | grep -i strict`
2. Submit at **[hstspreload.org](https://hstspreload.org)** — enter your domain and click "Check eligibility and submit".
3. Propagation takes weeks to months, but once listed, removal is difficult. Only submit when the domain is permanent.

> **Warning:** Including `includeSubDomains` means **all** subdomains (`api.`, `grafana.`, `jaeger.`, etc.) must also serve valid HTTPS. All current subdomains do — but any new subdomain must have TLS configured before it is reachable.

### A.6 File Security — Never Commit Plan Files

Implementation plan files (`implementation-*.md`, `deploy-*.md`, `my-next-up.md`) may contain real production secrets (OAuth credentials, API keys, PATs). **Always add them to `.gitignore` or delete them before committing.** If secrets were ever committed, rotate them immediately — Git history retains the values forever.
