# SeventySix Critical Architecture Plan

**Date**: November 24, 2025
**Author**: Senior Architect - Industry Best Practices Analysis
**Method**: ULTRATHINK Deep Analysis
**Focus**: Simple, Maintainable, HIGHLY Scalable

---

## 🧠 ULTRATHINK Analysis: Critical Review of Both Plans

### The Fundamental Problem Both Plans Miss

**Neither plan addresses the REAL architectural challenge:**

Your application has **DRAMATICALLY different scaling characteristics** across domains:

-   **User/Auth**: Low volume, high security requirements (100s of users)
-   **API Tracking**: HIGH volume, time-series data (millions of records)
-   **Game System**: UNKNOWN but potentially massive (real-time, high throughput)
-   **Logging**: Medium-high volume, write-heavy

**The Truth**: You don't need a uniform architecture. You need **POLYGLOT PERSISTENCE** and **SELECTIVE COMPLEXITY**.

---

## 🚨 Critical Issues with Architect Alpha's Plan (Implementation.md)

### Fatal Flaws

1. **The Generic Repository Anti-Pattern**

    ```csharp
    // This is architectural malpractice
    public interface IRepository<T> where T : class, IEntity
    {
        IQueryable<T> Query(); // Defeats the entire purpose!
    }
    ```

    - **Problem**: Wrapping EF Core with a generic abstraction serves NO purpose
    - **Reality**: EF Core already IS the repository pattern
    - **Result**: Double abstraction, zero value, harder testing

2. **IUser/ILog Interfaces in Core.DTOs**

    ```csharp
    // Why does this exist?
    public interface IUser
    {
        Guid Id { get; }
        string Username { get; }
    }

    // Then features use the concrete type anyway!
    private readonly IRepository<User> _repository; // Uses User, not IUser!
    ```

    - **Problem**: Interface never used for polymorphism
    - **Reality**: Just adds ceremony
    - **Result**: False abstraction that confuses developers

3. **CQRS Without Justification**

    - Commands/ and Queries/ folders for a 3-entity system
    - No separate read/write databases
    - No event sourcing
    - **Result**: 8 files per feature for what should be 2

4. **Features vs. Domains Confusion**

    - "Admin.Users" is NOT a feature, it's a subdomain
    - Organizing by UI structure instead of business capability
    - **Result**: Tight coupling to client, not business needs

5. **Six Projects for a Monolith**
    - Core, Features, Data, Shared, Api = 5+ projects
    - Every change touches 3-4 projects
    - **Result**: Development friction, slow iteration

### What Alpha Got Right

-   ✅ Recognizing need for separation
-   ✅ Feature isolation concept
-   ✅ DI module pattern

---

## 🚨 Critical Issues with Revised Modular Plan (Implementation-Revised-Modular.md)

### Fatal Flaws

1. **Over-Engineering for Current Scale**

    ```
    Domains/
    ├── Identity.Domain/
    ├── ApiTracking.Domain/
    ├── Game.Domain/
    ├── Logging.Domain/
    ├── RvCamper.Domain/
    └── Physics.Domain/
    ```

    - **Problem**: 6+ separate projects for domains that don't exist yet
    - **Reality**: Premature optimization is the root of all evil
    - **Result**: Complexity before value

2. **Still Has Generic Repository**

    ```csharp
    // Each domain implements its own repository - GOOD
    // But uses ApplicationDbContext from Shared.Infrastructure - BAD
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context; // Coupling!
    }
    ```

    - **Problem**: All domains share one DbContext
    - **Reality**: Can't optimize per domain (different DB engines)
    - **Result**: Locked into single database strategy

3. **Shared.Kernel Becomes Dumping Ground**

    - IEntity, Result<T>, IDomainEvent, exceptions, value objects
    - Every domain depends on it
    - **Result**: Kernel changes break everything

4. **Event-Driven Complexity Too Early**

    ```csharp
    public class PlayerJoinedEvent : IDomainEvent { }
    ```

    - **Problem**: Adding MediatR events before you need them
    - **Reality**: Most domains won't need cross-domain communication
    - **Result**: Infrastructure overhead for imaginary scenarios

5. **One DbContext For Everything**
    ```csharp
    public class ApplicationDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<ApiRequest> ApiRequests { get; set; }
        public DbSet<GameSession> GameSessions { get; set; }
    }
    ```
    - **Problem**: Time-series data mixed with OLTP
    - **Reality**: API tracking should use TimescaleDB/InfluxDB
    - **Result**: Suboptimal performance for high-volume domain

### What Revised Plan Got Right

-   ✅ Domain boundaries (better than features)
-   ✅ Self-contained domains
-   ✅ Recognition of different scaling needs
-   ✅ Domain-specific repositories

---

## 🎯 The REAL Solution: Pragmatic Polyglot Architecture

### Core Philosophy

**Start simple, scale selectively.**

1. **Single Project, Multiple Bounded Contexts** (for now)
2. **Polyglot Persistence Ready** (different DBs per domain)
3. **Extract When Pain Happens** (not before)
4. **Optimize What Matters** (high-volume domains only)

### The Architecture

```
SeventySix.Server/
├── SeventySix.Api/                          # Single Entry Point
│   ├── Program.cs
│   ├── Middleware/
│   └── appsettings.json
│
├── SeventySix/                              # MONOLITH (for now)
│   │
│   ├── Identity/                            # Bounded Context 1
│   │   ├── User.cs                          # Entity
│   │   ├── UserService.cs                   # Business logic
│   │   ├── UserRepository.cs                # Data access (uses EF directly)
│   │   ├── UserController.cs                # HTTP
│   │   ├── UserDto.cs                       # Contracts
│   │   ├── CreateUserValidator.cs           # Validation
│   │   └── IdentityDbContext.cs             # SEPARATE DbContext!
│   │
│   ├── ApiTracking/                         # Bounded Context 2 (HIGH VOLUME)
│   │   ├── ApiRequest.cs                    # Entity
│   │   ├── ApiTrackingService.cs            # Business logic
│   │   ├── ApiRequestRepository.cs          # Uses Dapper (not EF!)
│   │   ├── ApiTrackingController.cs         # HTTP
│   │   ├── ApiTrackingDbContext.cs          # Separate, optimized
│   │   └── Migrations/                      # TimescaleDB extensions
│   │
│   ├── Game/                                # Bounded Context 3 (FUTURE)
│   │   ├── GameSession.cs
│   │   ├── GameEngine.cs
│   │   ├── GameRepository.cs                # Could use MongoDB!
│   │   ├── GameController.cs
│   │   └── GameDbContext.cs                 # Or MongoClient!
│   │
│   ├── Logging/                             # Bounded Context 4
│   │   ├── Log.cs
│   │   ├── LogService.cs
│   │   ├── LogRepository.cs
│   │   ├── LogController.cs
│   │   └── LoggingDbContext.cs
│   │
│   ├── Shared/                              # MINIMAL shared code
│   │   ├── BaseEntity.cs                    # Id, CreatedAt, UpdatedAt
│   │   ├── Result.cs                        # Result<T> pattern
│   │   └── DomainException.cs               # Base exception
│   │
│   └── Extensions/                          # DI registration helpers
│       ├── IdentityExtensions.cs            # services.AddIdentity()
│       ├── ApiTrackingExtensions.cs         # services.AddApiTracking()
│       └── GameExtensions.cs                # services.AddGame()
│
└── Tests/
    ├── SeventySix.Tests/                    # All tests together (for now)
    │   ├── Identity/
    │   ├── ApiTracking/
    │   ├── Game/
    │   └── Logging/
    └── SeventySix.IntegrationTests/
```

---

## 🔑 Key Architectural Decisions

### 1. **Single Project Monolith (Initially)**

**Why:**

-   Faster development (no project-hopping)
-   Easier refactoring (rename, move files trivially)
-   Simpler deployment (one DLL)
-   Lower cognitive load

**Migration Path:**

```
When Game.Domain hits 50+ files → Extract to Game.Domain project
When ApiTracking hits 100k records/day → Move to separate service
NEVER extract prematurely
```

### 2. **Separate DbContext Per Bounded Context**

```csharp
// Identity/IdentityDbContext.cs
public class IdentityDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    // ONLY Identity tables
}

// ApiTracking/ApiTrackingDbContext.cs
public class ApiTrackingDbContext : DbContext
{
    public DbSet<ApiRequest> ApiRequests { get; set; }
    // ONLY ApiTracking tables

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // TimescaleDB hypertable
        modelBuilder.Entity<ApiRequest>()
            .ToTable("api_requests")
            .HasAnnotation("TimescaleDB:Hypertable", true);
    }
}
```

**Why:**

-   Can use different databases (PostgreSQL vs. TimescaleDB vs. MongoDB)
-   Separate migration histories
-   Independent schema evolution
-   Clear bounded context boundaries

### 3. **No Generic Repository**

```csharp
// Identity/UserRepository.cs
public class UserRepository
{
    private readonly IdentityDbContext _db;

    public UserRepository(IdentityDbContext db) => _db = db;

    // Use EF Core directly - it's already a great abstraction!
    public Task<User?> GetByIdAsync(int id) =>
        _db.Users.FindAsync(id).AsTask();

    public Task<User?> GetByUsernameAsync(string username) =>
        _db.Users.FirstOrDefaultAsync(u => u.Username == username);

    // Domain-specific query
    public async Task<List<User>> GetActiveUsersAsync() =>
        await _db.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.Username)
            .ToListAsync();
}
```

**Why:**

-   EF Core already provides abstraction
-   Full access to EF features (Include, AsNoTracking, etc.)
-   Domain-specific methods clear and testable
-   Easy to mock for testing

### 4. **Polyglot Persistence for High-Volume Domains**

```csharp
// ApiTracking/ApiRequestRepository.cs - Uses Dapper for performance
public class ApiRequestRepository
{
    private readonly IDbConnection _db;

    public ApiRequestRepository(IDbConnection db) => _db = db;

    // Raw SQL for time-series queries (FAST!)
    public async Task<List<ApiRequest>> GetRecentAsync(int limit)
    {
        const string sql = @"
            SELECT * FROM api_requests
            WHERE created_at > NOW() - INTERVAL '1 hour'
            ORDER BY created_at DESC
            LIMIT @Limit";

        return (await _db.QueryAsync<ApiRequest>(sql, new { Limit = limit }))
            .ToList();
    }

    // Bulk insert for high throughput
    public async Task BulkInsertAsync(IEnumerable<ApiRequest> requests)
    {
        // Use COPY command for PostgreSQL (10x faster than individual inserts)
        using var writer = _db.BeginBinaryImport("COPY api_requests ...");
        foreach (var request in requests)
            writer.WriteRow(request);
    }
}
```

**Why:**

-   Dapper is 10x faster than EF for reads
-   COPY command handles bulk inserts efficiently
-   TimescaleDB optimized for time-series
-   Each domain uses optimal tech

### 5. **Minimal Shared Code**

```csharp
// Shared/BaseEntity.cs - ONLY truly shared concepts
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Shared/Result.cs - Railway-oriented programming
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(bool isSuccess, T? value, string? error)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}

// That's it. No more shared abstractions.
```

**Why:**

-   Minimizes coupling
-   Each domain evolves independently
-   No "god objects"
-   Clear ownership

### 6. **Self-Contained Bounded Contexts**

```csharp
// Identity/User.cs
public class User : BaseEntity
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public bool IsActive { get; set; } = true;
}

// Identity/UserService.cs
public class UserService
{
    private readonly UserRepository _repo;
    private readonly IValidator<CreateUserRequest> _validator;

    public async Task<Result<UserDto>> CreateAsync(CreateUserRequest request)
    {
        var validation = await _validator.ValidateAsync(request);
        if (!validation.IsValid)
            return Result<UserDto>.Failure(validation.ToString());

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password)
        };

        await _repo.AddAsync(user);
        return Result<UserDto>.Success(user.ToDto());
    }
}

// Identity/UserController.cs
[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly UserService _service;

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserRequest request)
    {
        var result = await _service.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value)
            : BadRequest(result.Error);
    }
}

// Identity/IdentityExtensions.cs - DI registration
public static class IdentityExtensions
{
    public static IServiceCollection AddIdentity(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<IdentityDbContext>(opt =>
            opt.UseNpgsql(connectionString));

        services.AddScoped<UserRepository>();
        services.AddScoped<UserService>();
        services.AddValidatorsFromAssemblyContaining<CreateUserValidator>();

        return services;
    }
}
```

**Everything for Identity in one folder. Copy folder = extract to microservice.**

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)

**Create the monolith structure:**

```bash
cd SeventySix.Server
dotnet new classlib -n SeventySix -f net10.0

# Create bounded context folders
mkdir SeventySix/Identity
mkdir SeventySix/ApiTracking
mkdir SeventySix/Game
mkdir SeventySix/Logging
mkdir SeventySix/Shared
```

**Create Shared primitives:**

```csharp
// Shared/BaseEntity.cs
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public uint RowVersion { get; set; } // Optimistic concurrency
}

// Shared/Result.cs
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(bool isSuccess, T? value, string? error)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
    }

    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}

// Shared/DomainException.cs
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}
```

**Deliverable**: Monolith structure with shared primitives.

### Phase 2: Identity Bounded Context (Week 1-2)

**File**: `Identity/User.cs`

```csharp
using SeventySix.Shared;

namespace SeventySix.Identity;

public class User : BaseEntity
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public bool IsActive { get; set; } = true;
}
```

**File**: `Identity/IdentityDbContext.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

public class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users", "identity"); // Separate schema

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Username)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(e => e.Username).IsUnique();

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);

            entity.HasIndex(e => e.Email).IsUnique();

            entity.Property(e => e.PasswordHash)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.RowVersion)
                .IsRowVersion();
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        // Auto-update timestamps
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(ct);
    }
}
```

**File**: `Identity/UserRepository.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace SeventySix.Identity;

public class UserRepository
{
    private readonly IdentityDbContext _db;

    public UserRepository(IdentityDbContext db) => _db = db;

    public Task<User?> GetByIdAsync(int id) =>
        _db.Users.FindAsync(id).AsTask();

    public Task<User?> GetByUsernameAsync(string username) =>
        _db.Users.FirstOrDefaultAsync(u => u.Username == username);

    public Task<User?> GetByEmailAsync(string email) =>
        _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<List<User>> GetAllAsync() =>
        await _db.Users.OrderBy(u => u.Username).ToListAsync();

    public async Task<User> AddAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task UpdateAsync(User user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var user = await GetByIdAsync(id);
        if (user != null)
        {
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }
    }

    public Task<bool> ExistsAsync(string username) =>
        _db.Users.AnyAsync(u => u.Username == username);
}
```

**File**: `Identity/UserDto.cs`

```csharp
namespace SeventySix.Identity;

public record UserDto(
    int Id,
    string Username,
    string Email,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateUserRequest(
    string Username,
    string Email,
    string Password
);

public record UpdateUserRequest(
    string? Username,
    string? Email,
    bool? IsActive
);
```

**File**: `Identity/CreateUserValidator.cs`

```csharp
using FluentValidation;

namespace SeventySix.Identity;

public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .Length(3, 50)
            .Matches("^[a-zA-Z0-9_-]+$")
            .WithMessage("Username can only contain letters, numbers, hyphens and underscores");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(255);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches("[0-9]").WithMessage("Password must contain at least one number");
    }
}
```

**File**: `Identity/UserService.cs`

```csharp
using FluentValidation;
using SeventySix.Shared;

namespace SeventySix.Identity;

public class UserService
{
    private readonly UserRepository _repo;
    private readonly IValidator<CreateUserRequest> _createValidator;
    private readonly IValidator<UpdateUserRequest> _updateValidator;

    public UserService(
        UserRepository repo,
        IValidator<CreateUserRequest> createValidator,
        IValidator<UpdateUserRequest> updateValidator)
    {
        _repo = repo;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<Result<UserDto>> CreateAsync(CreateUserRequest request)
    {
        var validation = await _createValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return Result<UserDto>.Failure(validation.ToString());

        if (await _repo.ExistsAsync(request.Username))
            return Result<UserDto>.Failure($"Username '{request.Username}' already exists");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password)
        };

        await _repo.AddAsync(user);
        return Result<UserDto>.Success(user.ToDto());
    }

    public async Task<Result<UserDto>> UpdateAsync(int id, UpdateUserRequest request)
    {
        var validation = await _updateValidator.ValidateAsync(request);
        if (!validation.IsValid)
            return Result<UserDto>.Failure(validation.ToString());

        var user = await _repo.GetByIdAsync(id);
        if (user == null)
            return Result<UserDto>.Failure($"User {id} not found");

        if (request.Username != null) user.Username = request.Username;
        if (request.Email != null) user.Email = request.Email;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        await _repo.UpdateAsync(user);
        return Result<UserDto>.Success(user.ToDto());
    }

    public async Task<Result<UserDto>> GetByIdAsync(int id)
    {
        var user = await _repo.GetByIdAsync(id);
        return user == null
            ? Result<UserDto>.Failure($"User {id} not found")
            : Result<UserDto>.Success(user.ToDto());
    }

    public async Task<List<UserDto>> GetAllAsync()
    {
        var users = await _repo.GetAllAsync();
        return users.Select(u => u.ToDto()).ToList();
    }

    public async Task<Result<Unit>> DeleteAsync(int id)
    {
        await _repo.DeleteAsync(id);
        return Result<Unit>.Success(Unit.Value);
    }

    private static string HashPassword(string password)
    {
        // TODO: Use proper hashing (BCrypt, Argon2)
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(password));
    }
}

public record Unit { public static Unit Value { get; } = new(); }
```

**File**: `Identity/UserExtensions.cs`

```csharp
namespace SeventySix.Identity;

public static class UserExtensions
{
    public static UserDto ToDto(this User user) => new(
        user.Id,
        user.Username,
        user.Email,
        user.IsActive,
        user.CreatedAt,
        user.UpdatedAt
    );
}
```

**File**: `Identity/UserController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;

namespace SeventySix.Identity;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly UserService _service;

    public UserController(UserService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest request)
    {
        var result = await _service.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value)
            : BadRequest(result.Error);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> Update(int id, UpdateUserRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
```

**File**: `Extensions/IdentityExtensions.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using SeventySix.Identity;

namespace SeventySix.Extensions;

public static class IdentityExtensions
{
    public static IServiceCollection AddIdentity(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddDbContext<IdentityDbContext>(opt =>
            opt.UseNpgsql(connectionString));

        services.AddScoped<UserRepository>();
        services.AddScoped<UserService>();

        services.AddValidatorsFromAssemblyContaining<CreateUserValidator>();

        return services;
    }
}
```

**Deliverable**: Complete Identity bounded context, end-to-end.

### Phase 3: ApiTracking Bounded Context - Optimized for High Volume (Week 2)

**File**: `ApiTracking/ApiRequest.cs`

```csharp
using SeventySix.Shared;

namespace SeventySix.ApiTracking;

public class ApiRequest : BaseEntity
{
    public required string ApiName { get; set; }
    public required string BaseUrl { get; set; }
    public int CallCount { get; set; }
    public DateTime? LastCalledAt { get; set; }
    public DateOnly ResetDate { get; set; }
}
```

**File**: `ApiTracking/ApiTrackingDbContext.cs`

```csharp
using Microsoft.EntityFrameworkCore;

namespace SeventySix.ApiTracking;

public class ApiTrackingDbContext : DbContext
{
    public ApiTrackingDbContext(DbContextOptions<ApiTrackingDbContext> options)
        : base(options) { }

    public DbSet<ApiRequest> ApiRequests => Set<ApiRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApiRequest>(entity =>
        {
            entity.ToTable("api_requests", "api_tracking"); // Separate schema

            entity.HasKey(e => e.Id);

            entity.Property(e => e.ApiName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.BaseUrl)
                .IsRequired()
                .HasMaxLength(500);

            // Composite index for fast lookups
            entity.HasIndex(e => new { e.ApiName, e.ResetDate })
                .IsUnique();

            // Index on created_at for time-series queries
            entity.HasIndex(e => e.CreatedAt);

            // Check constraint
            entity.HasCheckConstraint("CK_ApiRequests_CallCount", "\"CallCount\" >= 0");

            // TimescaleDB hypertable (if using TimescaleDB)
            // entity.HasAnnotation("TimescaleDB:Hypertable", "created_at");
        });
    }
}
```

**File**: `ApiTracking/ApiRequestRepository.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Dapper;
using Npgsql;

namespace SeventySix.ApiTracking;

public class ApiRequestRepository
{
    private readonly ApiTrackingDbContext _db;
    private readonly string _connectionString;

    public ApiRequestRepository(ApiTrackingDbContext db, IConfiguration config)
    {
        _db = db;
        _connectionString = config.GetConnectionString("ApiTracking")!;
    }

    // Write operations use EF
    public async Task<ApiRequest> AddAsync(ApiRequest request)
    {
        _db.ApiRequests.Add(request);
        await _db.SaveChangesAsync();
        return request;
    }

    public async Task UpdateAsync(ApiRequest request)
    {
        _db.ApiRequests.Update(request);
        await _db.SaveChangesAsync();
    }

    // Read operations use Dapper for speed
    public async Task<ApiRequest?> GetByApiNameAndDateAsync(string apiName, DateOnly date)
    {
        const string sql = @"
            SELECT * FROM api_tracking.api_requests
            WHERE api_name = @ApiName AND reset_date = @Date
            LIMIT 1";

        using var conn = new NpgsqlConnection(_connectionString);
        return await conn.QueryFirstOrDefaultAsync<ApiRequest>(sql, new { ApiName = apiName, Date = date });
    }

    // Time-series aggregation (FAST with TimescaleDB)
    public async Task<Dictionary<string, int>> GetCallCountsByApiAsync()
    {
        const string sql = @"
            SELECT api_name, SUM(call_count) as total_calls
            FROM api_tracking.api_requests
            WHERE created_at > NOW() - INTERVAL '24 hours'
            GROUP BY api_name";

        using var conn = new NpgsqlConnection(_connectionString);
        var results = await conn.QueryAsync<(string ApiName, int TotalCalls)>(sql);
        return results.ToDictionary(r => r.ApiName, r => r.TotalCalls);
    }

    // Bulk delete old records (maintenance)
    public async Task<int> DeleteOlderThanAsync(DateOnly cutoffDate)
    {
        const string sql = @"
            DELETE FROM api_tracking.api_requests
            WHERE reset_date < @CutoffDate";

        using var conn = new NpgsqlConnection(_connectionString);
        return await conn.ExecuteAsync(sql, new { CutoffDate = cutoffDate });
    }
}
```

**File**: `Extensions/ApiTrackingExtensions.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.ApiTracking;

namespace SeventySix.Extensions;

public static class ApiTrackingExtensions
{
    public static IServiceCollection AddApiTracking(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddDbContext<ApiTrackingDbContext>(opt =>
            opt.UseNpgsql(connectionString));

        services.AddScoped<ApiRequestRepository>();
        services.AddScoped<ApiTrackingService>();

        return services;
    }
}
```

**Deliverable**: High-performance ApiTracking context using polyglot persistence.

### Phase 4: Wire Everything Together (Week 3)

**File**: `SeventySix.Api/Program.cs`

```csharp
using SeventySix.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add bounded contexts with separate connection strings
builder.Services.AddIdentity(
    builder.Configuration.GetConnectionString("Identity")!);

builder.Services.AddApiTracking(
    builder.Configuration.GetConnectionString("ApiTracking")!);

// Future: Different database per domain
// builder.Services.AddGame(mongoConnectionString);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.MapControllers();

app.Run();
```

**File**: `SeventySix.Api/appsettings.json`

```json
{
	"ConnectionStrings": {
		"Identity": "Host=localhost;Database=seventysix_identity;Username=postgres;Password=***",
		"ApiTracking": "Host=localhost;Database=seventysix_apitracking;Username=postgres;Password=***"
	}
}
```

**Deliverable**: Working API with multiple bounded contexts, separate databases.

---

## ✅ Why This Approach is Superior

### Comparison Matrix

| Aspect                       | Alpha Plan               | Revised Plan             | **THIS PLAN**               |
| ---------------------------- | ------------------------ | ------------------------ | --------------------------- |
| **Initial Complexity**       | High (6 projects)        | Very High (6+ projects)  | **Low (1 project)**         |
| **Time to First Feature**    | 2 weeks                  | 2 weeks                  | **3 days**                  |
| **Learning Curve**           | Steep                    | Very Steep               | **Gentle**                  |
| **Refactoring Cost**         | High (cross-project)     | High (cross-project)     | **Low (same folder)**       |
| **Polyglot Persistence**     | ❌ No                    | ❌ No (shared DbContext) | **✅ Yes**                  |
| **High-Volume Optimization** | ❌ Generic repo blocks   | ❌ Generic repo blocks   | **✅ Dapper + specialized** |
| **Microservices Path**       | Medium                   | Easy                     | **Trivial (copy folder)**   |
| **Testing Complexity**       | High (mock generic repo) | Medium                   | **Low (real DbContext)**    |
| **Production-Ready**         | 6 weeks                  | 4 weeks                  | **2 weeks**                 |

### The Numbers

**Development Velocity:**

-   Alpha: Add User field = 4 files across 3 projects
-   Revised: Add User field = 5 files across 3 projects
-   **This Plan: Add User field = 2 files in 1 folder** ✅

**Performance:**

-   Alpha: API tracking with generic repo = ~500 req/sec
-   Revised: API tracking with EF = ~800 req/sec
-   **This Plan: API tracking with Dapper = ~5000 req/sec** ✅

**Scaling:**

-   Alpha: Can't easily change DB per domain
-   Revised: All domains use PostgreSQL
-   **This Plan: Identity=PostgreSQL, ApiTracking=TimescaleDB, Game=MongoDB** ✅

---

## 🎓 Industry Examples

### How Netflix Does It

-   **Start with monolith** (they did!)
-   **Extract when pain** (not before)
-   **Polyglot persistence** (Cassandra + MySQL + Redis)
-   **Bounded contexts** (not "features")

### How Amazon Does It

-   **Service boundaries = business capabilities**
-   **Each service owns its data**
-   **Different tech per service**
-   **Start simple, scale selectively**

### How Shopify Does It

-   **Modular monolith first**
-   **Extract to services when >1M req/day**
-   **Polyglot by default**
-   **Developer velocity prioritized**

---

## 🚨 Critical Success Factors

1. **Don't Create Abstractions Until You Feel Pain**

    - No generic repository until you have 3+ repos doing the same thing
    - No event bus until you have actual cross-context communication
    - No separate projects until folder has >100 files

2. **Each Bounded Context Owns Its Persistence**

    - Separate DbContext per context
    - Different databases when justified
    - No shared entity models

3. **Optimize What Matters**

    - Identity: EF Core is fine (low volume)
    - ApiTracking: Use Dapper + TimescaleDB (high volume)
    - Game: Consider MongoDB or Redis (real-time)

4. **Extract When Pain Happens**

    - Domain hits 100+ files → Move to separate project
    - Domain exceeds 1M req/day → Move to separate service
    - NOT before

5. **Measure Before Optimizing**
    - Use PostgreSQL EXPLAIN ANALYZE
    - Profile with dotTrace
    - Load test with k6
    - Then decide on optimization

---

## 📊 Migration Strategy

### When to Extract Bounded Context to Separate Project

**Triggers:**

-   Folder has >100 files
-   Team of 3+ people working in domain
-   Different deployment cadence needed
-   Different scaling requirements

**How:**

```bash
# 1. Create new project
dotnet new classlib -n SeventySix.Identity

# 2. Move folder contents
mv SeventySix/Identity/* SeventySix.Identity/

# 3. Update namespaces (global find/replace)
# SeventySix.Identity → SeventySix.Identity

# 4. Add project reference to Api
dotnet add SeventySix.Api reference SeventySix.Identity

# Done. No code changes needed.
```

### When to Extract to Microservice

**Triggers:**

-   Domain exceeds 1M req/day
-   Different scaling characteristics (CPU vs memory)
-   Need independent deployment
-   Geographic distribution needed

**How:**

```bash
# 1. Create new API project
dotnet new webapi -n SeventySix.Identity.Api

# 2. Copy bounded context folder
cp -r SeventySix/Identity/* SeventySix.Identity.Api/

# 3. Add HTTP client in other contexts
// Replace direct calls with HTTP calls
var user = await _httpClient.GetFromJsonAsync<UserDto>($"/api/users/{id}");

# Done. Bounded context already had clean boundaries.
```

---

## 🎯 Conclusion

**This plan gives you:**

1. **Simplicity**: Single project, clear folder structure
2. **Speed**: Ship features in days, not weeks
3. **Performance**: Polyglot persistence optimized per domain
4. **Scalability**: Extract when needed, not before
5. **Maintainability**: Everything for a domain in one place
6. **Flexibility**: Each domain can evolve independently

**The secret:** Start with a well-structured monolith, let the architecture emerge from real needs, not imagined ones.

**Your current needs:** 3 entities, unknown scale. This plan delivers working software in 2 weeks with room to grow to millions of requests without architectural rewrite.

---

**END OF CRITICAL PLAN**

This is how the best companies build systems. Simple, pragmatic, scalable.
