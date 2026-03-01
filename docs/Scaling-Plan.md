# SeventySix — Scaling Roadmap

> **This document is scope and traffic driven — not game-specific.**
> It covers infrastructure growth from a single-server launch to a multi-node cluster, at each step describing what changes, what it costs, and what information you need to generate a migration plan.
>
> **The application code, Docker images, and CI/CD pipeline are unchanged at every phase.** Only the infrastructure running those images changes.
>
> **Location:** All pricing below is for **Hetzner US West — Hillsboro, Oregon (`hil`)**. US locations offer the **CPX series (AMD shared Regular Performance)** and **CCX series (AMD dedicated General Purpose)** — the CX/CAX Intel series is EU-only.
> Traffic included varies by tier: CCX13=1 TB, CCX23=2 TB, CCX33=3 TB, CCX43=4 TB; overage is $1.00/TB. (CPX at US is also 1–5 TB depending on tier.)
>
> **Why CCX over CPX for production:** The dedicated CCX series is actually *cheaper* than the equivalent shared CPX tier at US West while guaranteeing CPU resources. CCX23 ($28.99/mo, 4 dedicated AMD vCPU / 16 GB) beats CPX41 ($33.49/mo, 8 shared AMD vCPU / 16 GB) on both price and reliability. The full scaling path uses CCX.
>
> **⚠️ CX31 users:** The CX31 is deprecated hardware (2 vCPU / 8 GB RAM). Running the full SeventySix stack (API, PostgreSQL, Valkey, full observability) on 8 GB will cause OOM pressure. Migrate to CCX23 immediately — it is cheaper per month and provides dedicated CPUs.

---

## Overview

| Phase | Infrastructure | Monthly Cost | Traffic Target | Trigger |
|---|---|---|---|---|
| **A — Launch** | CCX23 + Cloudflare | ~$35 | < 500 concurrent users | You are here |
| **B — Scale Up** | CCX33 + Cloudflare | ~$67 | < 2,000 concurrent users | CPU/RAM consistently > 70% |
| **C — More Dedicated** | CCX43 + Cloudflare | ~$133 | < 10,000 concurrent users | Need more vCPU / RAM headroom |
| **D — Separated DB** | CCX43 + Hetzner DBaaS | ~$180–220 | < 25,000 concurrent users | DB I/O saturating disk or needing HA |
| **E — K3s Cluster** | 3-node K3s + DBaaS | ~$190–230 | 25,000+ concurrent users | Zero-downtime deploys + horizontal scale |

> **Rule of thumb:** Move to the next phase when the current phase's CPU or memory is consistently above 70% at peak, or when downtime during deploys becomes unacceptable.

---

## Phase A — Launch

**Target:** Single CCX23, all services on one host, deployed via Docker Compose.

### Specs
- **Server:** Hetzner CCX23 (US West `hil`) — 4 vCPU AMD (**dedicated**), 16 GB RAM, 160 GB SSD, 2 TB traffic — **$28.99/mo** + ~$5.80 backups = **~$35/mo**

> **Why CCX23 instead of CPX41?** CCX23 costs $4.50/mo *less* than CPX41 while providing dedicated (not shared) CPU. The CCX General Purpose series is Hetzner's recommendation for production workloads. Yearly savings over CPX41: ~$54 on server + ~$11 on backups = **~$65/year**.
- **CDN/TLS:** Cloudflare free tier + Caddy (Let's Encrypt)
- **Services running on this server:** API, Client, PostgreSQL, Valkey, Grafana, Prometheus, Jaeger, OTel Collector, Fail2Ban, GeoIPUpdate
- **Backups:** Daily pg_dump → Cloudflare R2 via `scripts/backup.sh`
- **CD:** GitHub Actions → SSH → `docker compose pull + up -d`

### Deployment Steps

Phase A is fully documented in [Deployment.md](Deployment.md). The condensed path:

1. Provision CCX23 at `hil` via `hcloud server create --type ccx23 --location hil` (§2)
2. Harden server: Docker, deploy user, SSH hardening, kernel tuning, 4 GB swap (§3)
3. Install Caddy reverse proxy (§4)
4. Configure Cloudflare DNS + SSL/TLS Full Strict (§5)
5. Generate fresh Data Protection certificate (§6)
6. Configure all GitHub Secrets and Variables per [Deployment.md §7](Deployment.md#7-configure-github-secrets) — no `.env` file on server
7. Trigger first deploy via CD pipeline (`gh workflow run deploy.yml`) (§8)
8. Log in as admin, change password, set `ADMIN_SEEDER_ENABLED=false` to `false` in GitHub Variables (§8)
9. Verify `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY` secrets are set for CD (§9)
10. Configure rclone + R2, schedule cron backup (§10)
11. Add UptimeRobot monitors (§11)
12. Run 20-item post-deploy checklist (§12)

### Capacity

At this tier:
- Angular SPA is served statically from nginx in the `client` container, cached by Cloudflare. Virtually unlimited static capacity.
- API request throughput: ~500–1,000 req/s (4 dedicated AMD vCPU, .NET Kestrel — dedicated CPUs give more consistent throughput than shared)
- Concurrent WebSocket connections: not applicable (no WS in current stack)
- PostgreSQL: single writer, single reader, no connection pooling (EF Core default pool)
- Valkey cache reduces DB load for hot paths

### Monitoring for Phase A → B trigger

Watch these Grafana metrics (Prometheus queries):
```
# CPU usage across all containers
rate(container_cpu_usage_seconds_total[5m])

# API memory
container_memory_usage_bytes{name="seventysix-api-prod"}

# API p95 latency
histogram_quantile(0.95, rate(http_server_request_duration_seconds_bucket[5m]))

# PostgreSQL connections
pg_stat_activity_count
```

**Move to Phase B when:** CPU consistently > 70% at peak OR API p95 latency climbs above 500ms at normal load.

---

## Phase B — Scale Up (CCX23 → CCX33)

**Trigger:** Phase A CPU/RAM consistently over 70% at peak. No architectural change needed.

### What Changes

| Item | Phase A | Phase B |
|---|---|---|
| Server type | CCX23 — 4 dedicated AMD vCPU / 16 GB / 160 GB | CCX33 — 8 dedicated AMD vCPU / 32 GB / 160 GB |
| Monthly cost | $28.99 + ~$5.80 backups ≈ **$35** | $55.49 + ~$11.10 backups ≈ **$67** |
| Downtime | — | ~10 minutes (server reboot) |
| Code changes | None | None |
| Docker Compose | Unchanged | Unchanged |
| CD pipeline | Unchanged | Unchanged |

> **vs. CPX51:** CCX33 ($55.49) is **$11.50/mo cheaper** than CPX51 ($66.99) and provides dedicated CPUs. Yearly savings: ~$138.

### What Stays the Same

Everything: same Docker images, same Compose file, same GitHub Secrets, same Caddy config, same GitHub Actions. **Zero code changes.**

### Migration Steps (for plan generation)

```bash
# Run from local machine — requires hcloud CLI authenticated
hcloud server change-type seventysix-prod ccx33

# The server reboots automatically (~5 min)
# All containers restart via restart: unless-stopped
# Monitor recovery:
ssh deploy@$SERVER_IP
docker compose -f docker-compose.production.yml ps
curl http://localhost:5085/health
```

**Required information to generate a migration plan:**
- Current server name in hcloud: `seventysix-prod`
- Current type: `ccx23`
- Target type: `ccx33`
- Estimated downtime tolerance (default: 10 min for a type change)
- Whether to notify users (UptimeRobot will detect downtime unless a maintenance window notification is set)

### Capacity at Phase B

- API throughput: ~1,500–3,000 req/s (8 dedicated AMD vCPU)
- The doubling of RAM allows larger Valkey cache and more EF Core connection pool headroom

---

## Phase C — More Headroom (CCX33 → CCX43)

**Trigger:** 8 vCPU / 32 GB on CCX33 is consistently at 70%+ under peak, OR you need more RAM for PostgreSQL tuning or Valkey cache expansion.

> **All phases use dedicated AMD CPUs.** From Phase A onward you already have dedicated CPUs — Phase C simply adds more vCPU and RAM.

### What Changes

| Item | Phase B | Phase C |
|---|---|---|
| Server type | CCX33 — 8 dedicated AMD vCPU / 32 GB / 160 GB | CCX43 — 16 dedicated AMD vCPU / 64 GB / 160 GB |
| Monthly cost | $55.49 + ~$11.10 backups ≈ **$67** | $110.99 + ~$22.20 backups ≈ **$133** |
| Downtime | — | ~10 minutes (server reboot via type change) |
| Code changes | None | None |
| Architecture | Single server | Single server (same Docker Compose) |

> CCX43's 64 GB RAM allows substantial PostgreSQL tuning (`shared_buffers = 16 GB`) and a large Valkey cache, substantially deferring the need to separate the database tier.

### What Stays the Same

Same Docker images, same Compose file, same GitHub Secrets, same Caddy config, same GitHub Actions pipeline. Zero code changes.

### Migration Steps (for plan generation)

This is a **new server provisioning + data migration**, not a type change. ~2 hours total.

**High-level procedure:**
1. Provision CCX43 server at `hil` via `hcloud server change-type seventysix-prod ccx43` (in-place reboot, ~10 min) — or provision a new server and migrate data if preferred
2. Run server hardening steps from [Deployment.md §3](Deployment.md#3-server-hardening) on the new server
3. Install Caddy, clone repo (all secrets stay in GitHub — no `.env` file needed)
4. Restore database from latest backup (R2 → pg_restore)
5. Restore Data Protection volume from latest backup
6. Update `PROD_HOST` GitHub Secret to the new server IP, then trigger CD: `gh workflow run deploy.yml`
7. Smoke test on the new server IP before DNS switch
8. Update Cloudflare DNS A records to new IP
9. Wait for TTL propagation (set TTL to 60s before the migration, revert after)
10. Verify production, then terminate the old CCX23/CCX33 (if you chose new-server migration over type change)

**Required information to generate a migration plan:**
- Current server name in hcloud: `seventysix-prod`
- Current type: `ccx33`
- Target type: `ccx43`
- If doing a new-server migration instead of a type change: new CCX43 IP, DNS TTL + Cloudflare records to update (A: @, www, api, grafana, jaeger)

### PostgreSQL Tuning for CCX43

With 64 GB RAM, tune PostgreSQL for better performance by setting env vars or a mounted `postgresql.conf`:

```
shared_buffers = 16GB          # 25% of RAM
effective_cache_size = 48GB    # 75% of RAM
wal_buffers = 64MB
work_mem = 64MB
maintenance_work_mem = 2GB
max_connections = 200
```

> Add these as environment overrides to the `database` service in `docker-compose.production.yml`, or mount a custom `postgresql.conf`.

---

## Phase D — Separated Database Tier

**Trigger:** PostgreSQL I/O is saturating the NVMe (check `iowait` / `pg_stat_bgwriter`), OR you need high availability (automatic failover), OR backup/restore window is too long for your RTO.

### What Changes

| Item | Phase C | Phase D |
|---|---|---|
| Database location | Docker container on CCX43 | Separate server or managed DBaaS |
| PostgreSQL HA | None (single container) | Optional: streaming replication or managed failover |
| Monthly cost | ~$130–160 | ~$180–220 (CCX43 + Hetzner managed PostgreSQL ~$50–60) |
| Code changes | None (just connection string) | None |
| Downtime for migration | ~30–60 min | — |

### Option 1: Hetzner Managed PostgreSQL (Recommended)

Hetzner offers fully managed PostgreSQL (based on PgBouncer + replication). No operational overhead.

Update these GitHub Secrets to point to the managed DB (then trigger `gh workflow run deploy.yml`):

```
DB_HOST=<managed-pg-hostname>          # or add a new secret if separating DB_HOST
DB_USER=seventysix_prod
DB_PASSWORD=<managed-pg-password>
```

> The `Database__Host` environment variable in `docker-compose.production.yml` is currently
> hardcoded to `database` (same-host container). If separating the DB, update the compose file
> to use `${DB_HOST}` and add `DB_HOST` as a GitHub Secret.

### Option 2: Dedicated DB Server (Self-Managed)

Provision a second Hetzner server (CCX13 $14.49 or CCX23 $28.99) at `hil` dedicated to PostgreSQL. Run PostgreSQL directly (not in Docker) for maximum I/O efficiency.

### Migration Steps (for plan generation)

1. Provision the new DB (managed or self-hosted)
2. Run final pg_dump on the old server during a maintenance window
3. pg_restore to the new DB
4. Update `DB_HOST`, `DB_USER`, `DB_PASSWORD` GitHub Secrets to point to the new DB
5. Trigger redeploy via CD to pick up the new DB secrets: `gh workflow run deploy.yml`
6. Verify health: `curl http://localhost:5085/health`
7. Remove the `database` service from `docker-compose.production.yml` (or keep it stopped)

**Required information to generate a migration plan:**
- New DB hostname/port
- Current DB size (from `pg_database_size('seventysix')`)
- Acceptable downtime window (for the migration cutover)
- Whether to keep the old container DB as a standby/replica initially
- RTO and RPO requirements (determines whether streaming replication is needed before cutover)

---

## Phase E — K3s Cluster (Horizontal Scale)

**Trigger:** Single server can no longer handle peak traffic, OR zero-downtime rolling deploys are required, OR you need pod-level auto-scaling.

### What Changes

| Item | Phase D | Phase E |
|---|---|---|
| Orchestration | Docker Compose (single server) | K3s (3-node cluster) |
| Monthly cost | ~$180–220 | ~$175–220 (3× CCX23 + managed DB) |
| Zero-downtime deploys | No (container restart = brief downtime) | Yes (rolling update) |
| Horizontal scaling | No | Yes (HPA) |
| Code changes | None | None (same Docker images) |
| CD pipeline | SSH + docker compose | kubectl rollout (minor deploy.yml change) |

### Architecture at Phase E

```
Internet → Cloudflare → Caddy (on each node OR LoadBalancer)
                           ↓
              K3s cluster (3 × CCX23, hil)
              ┌─────────────────────────┐
              │  API Deployment (3 pods) │
              │  Client Deployment (3 pods) │
              │  Valkey StatefulSet (1 pod) │
              └─────────────────────────┘
                           ↓
              Hetzner Managed PostgreSQL (external)
```

### What Stays the Same

- Same Docker images (`ghcr.io/actionjacksonthegoat-debug/seventysix-api:latest`, `...-client:latest`)
- Same application code
- Same secrets (migrated to Kubernetes Secrets or an external secrets manager)
- Same CI pipeline (publish job is identical; only the deploy step changes)

### K3s Setup Overview

**Node provisioning (3× CCX23 at `hil`):**
1. Provision `seventysix-k3s-master`, `seventysix-k3s-worker-1`, `seventysix-k3s-worker-2`
2. Install K3s on master: `curl -sfL https://get.k3s.io | sh -`
3. Join workers with the node token
4. Install Helm, configure kubectl access locally
5. Install cert-manager (for Let's Encrypt) + Ingress NGINX (or Caddy Ingress)

**Application deployment:**
- Convert `docker-compose.production.yml` into Kubernetes manifests (Deployment, Service, Ingress, ConfigMap, Secret)
- Or use Helm chart (can be generated from Compose via Kompose)
- Secrets migrate from GitHub Secrets/Variables to Kubernetes Secrets (or Hetzner Secrets Manager) — same values, different injection point

**CD pipeline change:**
- Replace SSH + `docker compose` in `deploy.yml` with:
  ```yaml
  - name: Deploy to K3s
    run: |
      kubectl set image deployment/seventysix-api api=${{ env.API_IMAGE }}
      kubectl set image deployment/seventysix-client client=${{ env.CLIENT_IMAGE }}
      kubectl rollout status deployment/seventysix-api
      kubectl rollout status deployment/seventysix-client
  ```

### Required Information to Generate a Migration Plan

- Number of nodes and server types (default: 3× CCX23 at `hil`)
- Whether to self-manage Ingress (Caddy/NGINX) or use Cloudflare tunnel
- Whether to use Kubernetes Secrets or an external secrets manager (Vault, sealed-secrets)
- Whether Valkey should stay in-cluster or move to a managed Redis-compatible service
- CI/CD kubeconfig distribution strategy (GitHub Secret vs. OIDC)
- Observability: whether Grafana/Prometheus stays in-cluster or moves to LGTM Stack / Grafana Cloud

---

## Decision Tree

```
Start: "Is my server consistently above 70% CPU or RAM at peak?"
│
├── No → Stay at Phase A (CCX23) — monitor
│
└── Yes → "Do I need zero-downtime deploys?"
    │
    ├── No → Move to Phase B (CCX33 — type change, 10 min downtime)
    │   └── Still maxed? → Move to Phase C (CCX43 — type change, 10 min downtime)
    │
    └── Yes → Evaluate Phase E (K3s) — jump straight if load is very high

Separately:
"Is PostgreSQL the bottleneck (high iowait, slow queries, long backup windows)?"
└── Yes → Phase D (separate DB tier) — can be done at any phase A–E

Note: All phases A–C use dedicated AMD CPUs (CCX series).
The old "shared CPU throttling" branch is eliminated — there are no shared CPUs in this path.
```

---

## Cost Summary

> All prices are for **Hetzner US West — Hillsboro, OR (`hil`)**, in USD, excluding VAT, as of March 2026. Confirm current rates in the [Hetzner Cloud Console](https://console.hetzner.com/) (select US West location).

| Phase | Infrastructure | Server/mo | Backup (+20%)/mo | Est. Total/mo | Yearly | When |
|---|---|---|---|---|---|---|
| A | CCX23 + Cloudflare | $28.99 | ~$5.80 | **~$35** | **~$420** | Launch |
| B | CCX33 + Cloudflare | $55.49 | ~$11.10 | **~$67** | **~$804** | 500–2,000 concurrent |
| C | CCX43 + Cloudflare | $110.99 | ~$22.20 | **~$133** | **~$1,596** | 2,000–10,000 concurrent |
| D | CCX43 + Hetzner Managed PG | $110.99 + ~$50–60 | ~$22.20 | **~$183–203** | — | DB bottleneck or HA needed |
| E | 3× CCX23 K3s + Managed PG | 3× $28.99 + ~$55 | — | **~$175–220** | — | 25,000+ concurrent, zero-downtime needed |

> **All prices confirmed from Hetzner Cloud Console, US West (`hil`), March 2026.** Dedicated AMD pricing is not shown on the public pricing page — check the console directly.
> **Traffic**: CCX23 includes 2 TB/mo, CCX33 includes 3 TB/mo, CCX43 includes 4 TB/mo. Additional traffic: $1.00/TB. For reference, CPX41 was used previously with 4 TB included — CCX23's 2 TB is sufficient for most early-stage SaaS apps when Cloudflare caches static assets.
> **vs. CPX path**: CCX23 ($28.99) saves $4.50/mo vs CPX41 ($33.49). CCX33 ($55.49) saves $11.50/mo vs CPX51 ($66.99). Over two years at Phase A+B: **~$400 saved** — and with better dedicated CPU performance throughout.
