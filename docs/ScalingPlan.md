# SeventySix — Scaling Roadmap

> **This document is scope and traffic driven — not game-specific.**
> It covers infrastructure growth from a single-server launch to a multi-node cluster, at each step describing what changes, what it costs, and what information you need to generate a migration plan.
>
> **The application code, Docker images, and CI/CD pipeline are unchanged at every phase.** Only the infrastructure running those images changes.

---

## Overview

| Phase | Infrastructure | Monthly Cost | Traffic Target | Trigger |
|---|---|---|---|---|
| **A — Launch** | CX43 + Cloudflare | ~€12 | < 500 concurrent users | You are here |
| **B — Scale Up** | CX53 + Cloudflare | ~€21 | < 2,000 concurrent users | CPU/RAM consistently > 70% |
| **C — Dedicated Metal** | AX41 + Cloudflare | ~€43 | < 10,000 concurrent users | Shared vCPU becomes a bottleneck |
| **D — Separated DB** | AX41 + Hetzner DBaaS | ~€70–90 | < 25,000 concurrent users | DB I/O saturating disk or needing HA |
| **E — K3s Cluster** | 3-node K3s + DBaaS | ~€130–170 | 25,000+ concurrent users | Zero-downtime deploys + horizontal scale |

> **Rule of thumb:** Move to the next phase when the current phase's CPU or memory is consistently above 70% at peak, or when downtime during deploys becomes unacceptable.

---

## Phase A — Launch

**Target:** Single CX43, all services on one host, deployed via Docker Compose.

### Specs
- **Server:** Hetzner CX43 — 8 vCPU (shared), 16 GB RAM, 160 GB SSD
- **CDN/TLS:** Cloudflare free tier + Caddy (Let's Encrypt)
- **Services running on this server:** API, Client, PostgreSQL, Valkey, Grafana, Prometheus, Jaeger, OTel Collector, Fail2Ban, GeoIPUpdate
- **Backups:** Daily pg_dump → Cloudflare R2 via `scripts/backup.sh`
- **CD:** GitHub Actions → SSH → `docker compose pull + up -d`

### Deployment Steps

Phase A is fully documented in [Deployment.md](Deployment.md). The condensed path:

1. Provision CX43 via `hcloud server create` (§2)
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
- API request throughput: ~500–1,000 req/s (8 shared vCPU, .NET Kestrel)
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

## Phase B — Scale Up (CX43 → CX53)

**Trigger:** Phase A CPU/RAM consistently over 70% at peak. No architectural change needed.

### What Changes

| Item | Phase A | Phase B |
|---|---|---|
| Server type | CX43 — 8 vCPU / 16 GB / 160 GB | CX53 — 16 vCPU / 32 GB / 240 GB |
| Monthly cost | ~€9.49 + ~€1.90 backups | ~€19.79 + backups |
| Downtime | — | ~10 minutes (server reboot) |
| Code changes | None | None |
| Docker Compose | Unchanged | Unchanged |
| CD pipeline | Unchanged | Unchanged |

### What Stays the Same

Everything: same Docker images, same Compose file, same GitHub Secrets, same Caddy config, same GitHub Actions. **Zero code changes.**

### Migration Steps (for plan generation)

```bash
# Run from local machine — requires hcloud CLI authenticated
hcloud server change-type seventysix-prod cx53

# The server reboots automatically (~5 min)
# All containers restart via restart: unless-stopped
# Monitor recovery:
ssh deploy@$SERVER_IP
docker compose -f docker-compose.production.yml ps
curl http://localhost:5085/health
```

**Required information to generate a migration plan:**
- Current server name in hcloud: `seventysix-prod`
- Current type: `cx43`
- Target type: `cx53`
- Estimated downtime tolerance (default: 10 min for a type change)
- Whether to notify users (UptimeRobot will detect downtime unless a maintenance window notification is set)

### Capacity at Phase B

- API throughput: ~1,500–3,000 req/s (16 shared vCPU)
- The doubling of RAM allows larger Valkey cache and more EF Core connection pool headroom

---

## Phase C — Dedicated Metal (CX53 → AX41)

**Trigger:** Shared vCPU becomes a bottleneck (noisy neighbour effect), OR you need predictable latency at peak, OR you're approaching 5,000–10,000 concurrent users.

### What Changes

| Item | Phase B | Phase C |
|---|---|---|
| Server type | CX53 — 16 shared vCPU / 32 GB | AX41 — 6 dedicated Zen4 cores / 64 GB / 2×512 GB NVMe RAID |
| Monthly cost | ~€21 | ~€43 |
| Downtime | — | ~2 hours (data migration + DNS TTL) |
| Code changes | None | None |
| Architecture | Single server | Single server (same Docker Compose) |

> The AX41's 6 dedicated Zen4 cores outperform 16 shared cloud vCPUs at sustained load. The 64 GB RAM allows much larger Valkey cache and PostgreSQL `shared_buffers`.

### What Stays the Same

Same Docker images, same Compose file, same GitHub Secrets, same Caddy config, same GitHub Actions pipeline. Zero code changes.

### Migration Steps (for plan generation)

This is a **new server provisioning + data migration**, not a type change. ~2 hours total.

**High-level procedure:**
1. Provision AX41 dedicated server (from Hetzner Robot or Cloud Dedicated)
2. Run server hardening steps from [Deployment.md §3](Deployment.md#3-server-hardening) on the new server
3. Install Caddy, clone repo (all secrets stay in GitHub — no `.env` file needed)
4. Restore database from latest backup (R2 → pg_restore)
5. Restore Data Protection volume from latest backup
6. Update `PROD_HOST` GitHub Secret to the new server IP, then trigger CD: `gh workflow run deploy.yml`
7. Smoke test on the new server IP before DNS switch
8. Update Cloudflare DNS A records to new IP
9. Wait for TTL propagation (set TTL to 60s before the migration, revert after)
10. Verify production, then terminate the old CX43/CX53

**Required information to generate a migration plan:**
- New AX41 IP address (provisioned in advance) — will replace `PROD_HOST` GitHub Secret
- Current backup location in R2 (bucket: `seventysix-backups`)
- All secrets already live in GitHub Secrets/Variables — no `.env` file exists on the old server
- DNS TTL currently set in Cloudflare (adjust to 60s 24h before migration)
- List of Cloudflare records to update (A: @, www, api, grafana, jaeger)
- Caddy admin IP to update (if your admin IP has changed)

### PostgreSQL Tuning for AX41

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
| Database location | Docker container on AX41 | Separate server or managed DBaaS |
| PostgreSQL HA | None (single container) | Optional: streaming replication or managed failover |
| Monthly cost | ~€43 | ~€70–90 (AX41 + Hetzner managed PostgreSQL ~€25–45) |
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

Provision a second Hetzner server (CX21 or CX32) dedicated to PostgreSQL. Run PostgreSQL directly (not in Docker) for maximum I/O efficiency.

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
| Monthly cost | ~€90 | ~€130–170 (3× CX43 + managed DB) |
| Zero-downtime deploys | No (container restart = brief downtime) | Yes (rolling update) |
| Horizontal scaling | No | Yes (HPA) |
| Code changes | None | None (same Docker images) |
| CD pipeline | SSH + docker compose | kubectl rollout (minor deploy.yml change) |

### Architecture at Phase E

```
Internet → Cloudflare → Caddy (on each node OR LoadBalancer)
                           ↓
              K3s cluster (3 × CX43)
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

**Node provisioning (3× CX43):**
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

- Number of nodes and server types (default: 3× CX43)
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
├── No → Stay at Phase A (CX43) — monitor
│
└── Yes → "Is the cause shared CPU throttling or genuine load?"
    │
    ├── Shared CPU throttling → Move to Phase C (AX41 dedicated)
    │
    └── Genuine load → "Do I need zero-downtime deploys?"
        │
        ├── No → Move to Phase B (CX53) first, then Phase C if needed
        │
        └── Yes → Evaluate Phase E (K3s) — jump straight if load is very high

Separately:
"Is PostgreSQL the bottleneck (high iowait, slow queries, long backup windows)?"
└── Yes → Phase D (separate DB tier) — can be done at any phase A–E
```

---

## Cost Summary

| Phase | Infrastructure | Est. Monthly | When |
|---|---|---|---|
| A | Hetzner CX43 + Cloudflare | ~€12 | Launch |
| B | Hetzner CX53 + Cloudflare | ~€21 | 500–2,000 concurrent |
| C | Hetzner AX41 + Cloudflare | ~€43 | 2,000–10,000 concurrent |
| D | AX41 + Hetzner Managed PG | ~€70–90 | DB bottleneck or HA needed |
| E | 3× CX43 K3s + Managed PG | ~€130–170 | 25,000+ concurrent, zero-downtime needed |

> All prices are approximate Hetzner list prices as of 2025. Use [Hetzner Cloud Pricing](https://www.hetzner.com/cloud/) for current rates.
