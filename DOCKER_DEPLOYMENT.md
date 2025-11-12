# SeventySix Docker Deployment Guide

Simple, effective Docker deployment for SeventySix with PostgreSQL persistence.

## 🚀 Quick Start

### Development (with local PostgreSQL)

```powershell
# Start PostgreSQL only
cd SeventySix.Server
docker-compose up postgres -d

# Run API locally (uses localhost PostgreSQL)
dotnet run --project SeventySix.Api
```

### Development (fully containerized)

```powershell
# Start all services
cd SeventySix.Server
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services (keeps data)
docker-compose down
```

### Production Deployment

```powershell
# Create .env file with secrets
cp .env.example .env
# Edit .env with your values

# Deploy all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f api
```

## 📁 Data Persistence

### Named Volumes

-   **Development**: `seventysix_postgres_data`
-   **Production**: `seventysix_postgres_prod_data`

Data persists across:

-   ✅ Container restarts
-   ✅ `docker-compose down` / `docker-compose up`
-   ✅ Container recreation

Data is lost only when:

-   ❌ `docker-compose down -v` (removes volumes)
-   ❌ `docker volume rm <volume_name>`

### View Volume Data

```powershell
# List volumes
docker volume ls

# Inspect volume
docker volume inspect seventysix_postgres_prod_data

# Backup volume
docker run --rm -v seventysix_postgres_prod_data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## 🔄 Migration Handling

### Automatic Migrations (Production)

The production Dockerfile automatically runs migrations on startup:

1. Container starts
2. Waits for PostgreSQL to be ready
3. Runs `dotnet ef database update`
4. Starts the API

**Works for:**

-   ✅ Clean deployments (new database)
-   ✅ Existing databases (applies pending migrations)
-   ✅ No migrations pending (no-op)

### Manual Migrations (Development)

```powershell
# Create migration
cd SeventySix.Server
dotnet ef migrations add MigrationName --project SeventySix.DataAccess --startup-project SeventySix.Api

# Apply migration to localhost
dotnet ef database update --project SeventySix.DataAccess --startup-project SeventySix.Api

# Apply to specific database
dotnet ef database update --project SeventySix.DataAccess --startup-project SeventySix.Api --connection "Host=localhost;Port=5432;Database=seventysix;Username=postgres;Password=TestPassword"
```

## 🧪 Testing Integration

### Integration Tests (API Tests)

Use **localhost PostgreSQL** for fast execution:

```powershell
# Ensure test database exists
dotnet ef database update --project SeventySix.DataAccess --startup-project SeventySix.Api --connection "Host=localhost;Port=5432;Database=seventysix_test;Username=postgres;Password=TestPassword"

# Run integration tests
cd SeventySix.Server
dotnet test SeventySix.Api.Tests
```

### Unit Tests (DataAccess Tests)

Use **Testcontainers** for isolation:

```powershell
# Runs automatically with Docker
dotnet test SeventySix.DataAccess.Tests
```

## 🔧 Troubleshooting

### Check if PostgreSQL is running

```powershell
docker ps | Select-String postgres
```

### Connect to PostgreSQL

```powershell
# Development
docker exec -it seventysix-postgres-dev psql -U postgres -d seventysix

# Production
docker exec -it seventysix-postgres-prod psql -U postgres -d seventysix
```

### View PostgreSQL logs

```powershell
docker logs seventysix-postgres-prod -f
```

### Rebuild containers

```powershell
# Development
docker-compose build --no-cache
docker-compose up -d

# Production
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

### Reset everything (⚠️ Deletes all data)

```powershell
docker-compose down -v
docker volume rm seventysix_postgres_prod_data
docker-compose up -d
```

## 📊 Health Checks

All services have health checks:

```powershell
# Check health status
docker ps

# API health endpoint
curl http://localhost:5085/health

# PostgreSQL health
docker exec seventysix-postgres-prod pg_isready -U postgres
```

## 🔐 Security Notes

### Development

-   Default password: `TestPassword`
-   Exposed ports: 5432, 5085
-   ⚠️ Not for production use

### Production

1. **Change default password**:

    ```bash
    # In .env file
    DB_PASSWORD=your_strong_password_here
    ```

2. **Use secrets management**:

    - Docker Secrets
    - Azure Key Vault
    - AWS Secrets Manager
    - Environment variables from CI/CD

3. **Limit exposed ports**:

    - Remove PostgreSQL port exposure (5432)
    - Use internal Docker network only

4. **Enable HTTPS**:
    - Configure SSL certificates
    - Update ASPNETCORE_URLS

## 🚢 Deployment Scenarios

### Scenario 1: Clean Deployment

```powershell
# No existing data
docker-compose -f docker-compose.production.yml up -d
```

**Result**:

1. PostgreSQL starts with empty database
2. API runs migrations, creates schema
3. Application starts successfully

### Scenario 2: Update Deployment (Existing Data)

```powershell
# Existing data in volume
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

**Result**:

1. PostgreSQL starts with existing data
2. API runs migrations, applies any new changes
3. Data is preserved
4. Application starts successfully

### Scenario 3: Rollback

```powershell
# Rollback to previous image
docker-compose -f docker-compose.production.yml down
# Change image version in docker-compose.production.yml
docker-compose -f docker-compose.production.yml up -d
```

## 📈 Monitoring

### Resource Usage

```powershell
docker stats
```

### Logs

```powershell
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f database
```

## 🎯 Best Practices

1. **Always use named volumes** for data persistence
2. **Run migrations automatically** in production
3. **Health checks** for all services
4. **Resource limits** to prevent resource exhaustion
5. **Restart policies** for high availability
6. **Backup volumes regularly**
7. **Test migrations** on staging before production
8. **Monitor logs** for errors
9. **Use environment variables** for configuration
10. **Never commit secrets** to source control

## 📝 Connection Strings

### Development (Local PostgreSQL)

```
Host=localhost;Port=5432;Database=seventysix;Username=postgres;Password=TestPassword;Pooling=true
```

### Development (Docker PostgreSQL)

```
Host=postgres;Port=5432;Database=seventysix;Username=postgres;Password=TestPassword;Pooling=true
```

### Production (Docker)

```
Host=database;Port=5432;Database=seventysix;Username=postgres;Password=${DB_PASSWORD};Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100
```

### Integration Tests

```
Host=localhost;Port=5432;Database=seventysix_test;Username=postgres;Password=TestPassword;Pooling=true
```

---

**Ready to deploy! 🚀**

For issues or questions, check the logs first:

```powershell
docker-compose logs -f
```
