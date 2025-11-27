# C# / .NET 10+ Quick Reference

> **Full documentation**: See `.claude/CLAUDE.md` for comprehensive .NET guidelines.

---

## Critical Rules Summary

| Rule         | ✅ Do                    | ❌ Don't                                   |
| ------------ | ------------------------ | ------------------------------------------ |
| Types        | `string x = ""`          | `var x = ""`                               |
| Constructors | `class Svc(IRepo r)`     | `class Svc { private readonly IRepo _r; }` |
| Collections  | `int[] x = [1,2]`        | `new int[] {1,2}`                          |
| Async        | `GetUserAsync()`         | `GetUser()`                                |
| Nulls        | Let it fail              | `?? throw new ArgumentNullException`       |
| DTOs         | `record UserDto(int Id)` | `class UserDto { public int Id }`          |
| EF Config    | Fluent API               | Data annotations                           |
| Queries      | `AsNoTracking()`         | Tracked queries for reads                  |
| Repository   | Domain-specific          | Generic `IRepository<T>`                   |

---

## Service Pattern (Primary Constructor)

```csharp
public class UserService(IUserRepository repo, ILogger<UserService> logger)
{
    public async Task<User?> GetByIdAsync(int id) =>
        await repo.GetByIdAsync(id);  // Parameters ARE fields

    public async Task CreateAsync(User user)
    {
        logger.LogInformation("Creating user {Username}", user.Username);
        await repo.AddAsync(user);
    }
}
```

---

## Repository Pattern (Domain-Specific)

```csharp
public class UserRepository(IdentityDbContext db)
{
    public async Task<User?> GetByIdAsync(int id) =>
        await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User?> GetByUsernameAsync(string username) =>
        await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == username);

    public async Task AddAsync(User user)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync();
    }
}
```

---

## Entity Configuration (Fluent API)

```csharp
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users", "identity");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Username).HasMaxLength(100).IsRequired();
        builder.HasIndex(u => u.Username).IsUnique();
        builder.HasQueryFilter(u => !u.IsDeleted);
    }
}
```

---

## Test Pattern

```csharp
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepo = new();
    private readonly UserService _sut;

    public UserServiceTests() => _sut = new UserService(_mockRepo.Object);

    // Pattern: MethodName_ExpectedBehavior_WhenConditionAsync
    [Fact]
    public async Task GetByIdAsync_ReturnsUser_WhenExistsAsync()
    {
        User user = new() { Id = 1, Username = "Test" };
        _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);

        User? result = await _sut.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("Test", result.Username);
    }
}
```

---

## Configuration (Options Pattern)

```csharp
// appsettings.json values, NEVER hardcode
public class ApiSettings
{
    public string BaseUrl { get; init; } = "";
    public int TimeoutSeconds { get; init; } = 30;
}

public class ExternalApiService(IOptions<ApiSettings> options)
{
    private readonly ApiSettings settings = options.Value;
}
```

