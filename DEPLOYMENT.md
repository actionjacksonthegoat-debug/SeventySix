# SeventySix Deployment Guide

## Table of Contents

-   [Local Development](#local-development)
-   [Docker Deployment](#docker-deployment)
-   [Production Deployment](#production-deployment)
-   [Environment Variables](#environment-variables)
-   [Health Checks](#health-checks)
-   [Monitoring](#monitoring)

## Local Development

### Prerequisites

-   Docker Desktop
-   Node.js 20+
-   .NET 10 SDK

### Running Locally (Without Docker)

#### Client

```bash
cd SeventySix.Client
npm install
npm start
# Access at http://localhost:4200
```

#### Server

```bash
cd SeventySix.Server
dotnet restore SeventySix.Server.slnx
dotnet run --project SeventySix.Api
# Access at https://localhost:7074
```

## Docker Deployment

### Development (Current docker-compose.yml)

```bash
cd SeventySix.Server
docker-compose up -d
```

### Production (Multi-container)

```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop all services
docker-compose -f docker-compose.production.yml down
```

### Individual Service Builds

#### Build API Only

```bash
cd SeventySix.Server
docker build -f Dockerfile.production -t seventysix-api:latest .
docker run -p 8080:8080 seventysix-api:latest
```

#### Build Client Only

```bash
cd SeventySix.Client
docker build -f Dockerfile.production -t seventysix-client:latest .
docker run -p 8080:8080 seventysix-client:latest
```

## Production Deployment

### AWS ECS Deployment

#### 1. Push Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push API
docker tag seventysix-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/seventysix-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/seventysix-api:latest

# Tag and push Client
docker tag seventysix-client:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/seventysix-client:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/seventysix-client:latest
```

#### 2. Create ECS Task Definition

See `ecs-task-definition.json` for complete configuration.

#### 3. Deploy with ECS Service

```bash
aws ecs update-service --cluster seventysix-cluster --service seventysix-api --force-new-deployment
```

### Azure Container Apps

```bash
# Create resource group
az group create --name seventysix-rg --location eastus

# Deploy API
az containerapp create \
  --name seventysix-api \
  --resource-group seventysix-rg \
  --environment seventysix-env \
  --image <registry>/seventysix-api:latest \
  --target-port 8080 \
  --ingress external

# Deploy Client
az containerapp create \
  --name seventysix-client \
  --resource-group seventysix-rg \
  --environment seventysix-env \
  --image <registry>/seventysix-client:latest \
  --target-port 8080 \
  --ingress external
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/client-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n seventysix
kubectl get services -n seventysix
```

## Environment Variables

### API (.NET)

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
ConnectionStrings__DefaultConnection=<database-connection-string>
Cors__AllowedOrigins__0=https://yourdomain.com
Serilog__MinimumLevel__Default=Information
```

### Client (Angular)

Built-time environment configuration in `src/environments/`:

-   `environment.ts` - Development
-   `environment.production.ts` - Production

```typescript
export const environment = {
	production: true,
	apiUrl: "https://api.yourdomain.com",
};
```

## Health Checks

### API Health Endpoint

```bash
curl http://localhost:8080/health
# Expected: HTTP 200 OK
```

### Client Health Endpoint

```bash
curl http://localhost:8080/health
# Expected: HTTP 200 "healthy"
```

### Docker Health Checks

```bash
# Check container health
docker ps
# Look for "healthy" status

# View health check logs
docker inspect --format='{{json .State.Health}}' seventysix-api
```

## Monitoring

### Logging

#### API Logs (Serilog)

Logs are written to:

-   Console (structured JSON in production)
-   File: `/app/logs/seventysix-{Date}.txt`

View logs:

```bash
docker logs seventysix-api -f
```

#### Client Logs (Nginx)

```bash
docker logs seventysix-client -f
```

### Metrics

#### Prometheus Integration

Add to `docker-compose.production.yml`:

```yaml
prometheus:
    image: prom/prometheus
    ports:
        - "9090:9090"
    volumes:
        - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

#### Application Insights (Azure)

Add to API configuration:

```json
{
	"ApplicationInsights": {
		"InstrumentationKey": "your-key-here"
	}
}
```

### Performance Monitoring

#### Response Times

-   API: Response caching enabled (60s)
-   Client: Static assets cached (1 year)
-   Nginx: Gzip compression enabled

#### Resource Limits

-   API: 512MB RAM, 1 CPU
-   Client: 256MB RAM, 0.5 CPU
-   Database: Configurable based on load

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check ports in use
netstat -ano | findstr :8080

# Stop conflicting services
docker-compose down
```

#### Database Connection Issues

```bash
# Check database health
docker exec seventysix-db pg_isready -U seventysix

# View database logs
docker logs seventysix-db
```

#### Build Failures

```bash
# Clean Docker build cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## Security Checklist

-   [ ] Use HTTPS in production
-   [ ] Set strong database passwords
-   [ ] Configure CORS properly
-   [ ] Enable security headers
-   [ ] Use secrets management (Azure Key Vault, AWS Secrets Manager)
-   [ ] Run containers as non-root user
-   [ ] Keep base images updated
-   [ ] Scan images for vulnerabilities
-   [ ] Enable firewall rules
-   [ ] Set up logging and monitoring

## Backup and Recovery

### Database Backup

```bash
# Backup
docker exec seventysix-db pg_dump -U seventysix seventysix > backup.sql

# Restore
docker exec -i seventysix-db psql -U seventysix seventysix < backup.sql
```

### Volume Backup

```bash
# Backup volume
docker run --rm -v seventysix_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v seventysix_postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-data-backup.tar.gz -C /data
```

## Rolling Updates

### Zero-Downtime Deployment

```bash
# Update API with rolling update
docker-compose -f docker-compose.production.yml up -d --no-deps --build api

# Update client
docker-compose -f docker-compose.production.yml up -d --no-deps --build client
```

## Scaling

### Horizontal Scaling

```bash
# Scale API to 3 replicas
docker-compose -f docker-compose.production.yml up -d --scale api=3

# Load balancer required for proper distribution
```

For more information, see:

-   [Docker Documentation](https://docs.docker.com)
-   [.NET Deployment](https://docs.microsoft.com/aspnet/core/host-and-deploy/)
-   [Angular Deployment](https://angular.io/guide/deployment)
