# SeventySix Caching Strategy

> **Last Updated**: January 29, 2026

## Overview

SeventySix uses a two-tier caching architecture combining FusionCache (L1 in-memory + L2 distributed) with Valkey/Redis for scalable, multi-node cache synchronization.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Application Nodes                          │
├───────────────────────┬─────────────────────────────────────────────┤
│       Node 1          │                Node 2                       │
│  ┌─────────────────┐  │  ┌─────────────────┐                        │
│  │  L1 Memory Cache│  │  │  L1 Memory Cache│                        │
│  │  (In-Process)   │  │  │  (In-Process)   │                        │
│  └────────┬────────┘  │  └────────┬────────┘                        │
│           │           │           │                                  │
│           ▼           │           ▼                                  │
│  ┌─────────────────────────────────────────┐                        │
│  │      FusionCache Backplane (Pub/Sub)    │◄──── Cache Invalidation│
│  └───────────────────┬─────────────────────┘                        │
│                      │                                               │
│                      ▼                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │    L2 Distributed Cache (Valkey/Redis)  │                        │
│  │    MemoryPack Serialization             │                        │
│  │    Instance: seventysix:                │                        │
│  └───────────────────┬─────────────────────┘                        │
│                      │                                               │
│                      ▼                                               │
│  ┌─────────────────────────────────────────┐                        │
│  │           PostgreSQL Database           │                        │
│  └─────────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Named Caches

| Cache Name  | Purpose                      | Default TTL  | Use Case                 |
| ----------- | ---------------------------- | ------------ | ------------------------ |
| Default     | General application cache    | Configurable | Miscellaneous data       |
| Identity    | User and authentication data | 1 minute     | Users, profiles, roles   |
| Logging     | Log data                     | 5 minutes    | Read-heavy log queries   |
| ApiTracking | API statistics               | 5 minutes    | Analytics and monitoring |

## Cache Key Patterns

All cache keys follow the pattern: `{domain}:{entity}:{identifier}`

### Identity Domain

| Key Pattern                          | Description                       |
| ------------------------------------ | --------------------------------- |
| `identity:user:{id}`                 | User by ID                        |
| `identity:profile:{id}`              | User profile                      |
| `identity:user-roles:{id}`           | User's assigned roles             |
| `identity:available-roles:{id}`      | Roles available to assign to user |
| `identity:user:email:{sanitized}`    | User by email (lowercase)         |
| `identity:user:username:{sanitized}` | User by username (lowercase)      |
| `identity:permission-requests`       | All pending permission requests   |
| `identity:all-users`                 | All users list                    |

### ApiTracking Domain

| Key Pattern                | Description          |
| -------------------------- | -------------------- |
| `apitracking:stats:{date}` | Daily API statistics |

## Cache Invalidation Strategy

### ICacheInvalidationService Methods

| Method                                   | Keys Invalidated                             | Triggered By              |
| ---------------------------------------- | -------------------------------------------- | ------------------------- |
| `InvalidateUserCacheAsync`               | User by ID, profile, email, username         | User updates, deletes     |
| `InvalidateUserRolesCacheAsync`          | User roles, available roles                  | Role add/remove           |
| `InvalidateUserProfileCacheAsync`        | User profile only                            | Profile-only updates      |
| `InvalidateUserPasswordCacheAsync`       | User profile, user by ID                     | Password changes          |
| `InvalidateBulkUsersCacheAsync`          | All keys for multiple users + all users list | Bulk operations           |
| `InvalidateAllUsersCacheAsync`           | All users list                               | User create/update/delete |
| `InvalidatePermissionRequestsCacheAsync` | Permission requests list                     | Approve/reject/cancel     |
| `InvalidateApiStatisticsCacheAsync`      | Daily statistics                             | Statistics update         |

### Command Handler → Cache Invalidation Mapping

| Command Handler                               | Invalidation Method(s)                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `UpdateUserCommandHandler`                    | `InvalidateUserCacheAsync`, `InvalidateAllUsersCacheAsync`                                  |
| `DeleteUserCommandHandler`                    | `InvalidateUserCacheAsync`, `InvalidateUserRolesCacheAsync`, `InvalidateAllUsersCacheAsync` |
| `CreateUserCommandHandler`                    | `InvalidateAllUsersCacheAsync`                                                              |
| `UpdateProfileCommandHandler`                 | `InvalidateUserCacheAsync`                                                                  |
| `AddUserRoleCommandHandler`                   | `InvalidateUserRolesCacheAsync`, `InvalidateUserProfileCacheAsync`                          |
| `RemoveUserRoleCommandHandler`                | `InvalidateUserRolesCacheAsync`                                                             |
| `ChangePasswordCommandHandler`                | `InvalidateUserPasswordCacheAsync`                                                          |
| `SetPasswordCommandHandler`                   | `InvalidateUserPasswordCacheAsync`                                                          |
| `RestoreUserCommandHandler`                   | `InvalidateUserCacheAsync`, `InvalidateAllUsersCacheAsync`                                  |
| `ApprovePermissionRequestCommandHandler`      | `InvalidateUserRolesCacheAsync`, `InvalidatePermissionRequestsCacheAsync`                   |
| `BulkApprovePermissionRequestsCommandHandler` | `InvalidateUserRolesCacheAsync` (each), `InvalidatePermissionRequestsCacheAsync`            |
| `RejectPermissionRequestCommandHandler`       | `InvalidatePermissionRequestsCacheAsync`                                                    |
| `BulkRejectPermissionRequestsCommandHandler`  | `InvalidatePermissionRequestsCacheAsync`                                                    |
| `BulkUpdateActiveStatusCommandHandler`        | `InvalidateBulkUsersCacheAsync`                                                             |

## Configuration

### Valkey Connection Settings

```json
{
	"Cache": {
		"Valkey": {
			"ConnectionString": "localhost:6379",
			"InstanceName": "seventysix:",
			"ConnectTimeoutMs": 5000,
			"SyncTimeoutMs": 1000,
			"AsyncTimeoutMs": 5000,
			"ConnectRetry": 3,
			"KeepAliveSeconds": 60,
			"RetryBaseMs": 1000,
			"UseSsl": false
		}
	}
}
```

### FusionCache Entry Options

| Setting           | Value  | Purpose                                    |
| ----------------- | ------ | ------------------------------------------ |
| Fail-Safe Enabled | `true` | Serve stale data on backend failures       |
| Eager Refresh     | 80%    | Refresh cache before expiration            |
| Jitter Max Delay  | 10%    | Prevent thundering herd on mass expiration |

## Best Practices

### DO

- ✅ Use `ICacheInvalidationService` for all cache invalidations
- ✅ Use named caches (`CacheNames.Identity`, etc.)
- ✅ Use cache key helpers (`IdentityCacheKeys.UserById(id)`)
- ✅ Invalidate related caches together (user + profile + all-users)
- ✅ Keep cache TTLs short for security-sensitive data (1 min for Identity)

### DON'T

- ❌ Construct cache keys manually with string concatenation
- ❌ Use default cache for domain-specific data
- ❌ Forget to invalidate cache after mutations
- ❌ Cache health-check or real-time validation queries

## Handlers Intentionally NOT Cached

| Handler                              | Reason                                      |
| ------------------------------------ | ------------------------------------------- |
| `GetAdminCountQueryHandler`          | Security-critical for last-admin protection |
| `CheckUsernameExistsQueryHandler`    | Real-time validation for registration       |
| `CheckEmailExistsQueryHandler`       | Real-time validation for registration       |
| `CheckApiTrackingHealthQueryHandler` | Health check must reflect real-time state   |
| `CheckLoggingHealthQueryHandler`     | Health check must reflect real-time state   |
| `CheckIdentityHealthQueryHandler`    | Health check must reflect real-time state   |
| `GetLogsPagedQueryHandler`           | Constantly changing, complex pagination     |
| `GetAllApiRequestsQueryHandler`      | Paginated with dynamic filters              |
| `GetPendingLogsQueryHandler`         | Background job needs real-time data         |
| `GetPagedUsersQueryHandler`          | Complex pagination with filters             |

## Testing

### Test Environment

In Test environment, FusionCache uses memory-only mode (no Valkey connection) to avoid timeout issues and ensure fast test execution.

### Test Utilities

```csharp
// Use TestCacheFactory for in-memory test caches
IFusionCache testCache = TestCacheFactory.CreateIdentityCache();
```

## Monitoring

FusionCache metrics are exported via OpenTelemetry. Monitor:

- Cache hit/miss ratios
- Backplane sync latency
- Connection pool health
- Memory usage per cache

## Revision History

| Date       | Version | Changes               |
| ---------- | ------- | --------------------- |
| 2026-01-29 | 1.0     | Initial documentation |

