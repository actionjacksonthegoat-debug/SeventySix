# C# / .NET 10+ Quick Reference

> Full documentation: `.claude/CLAUDE.md`

## Critical Rules

| Rule         | ✅ Do                    | ❌ Don't                         |
| ------------ | ------------------------ | -------------------------------- |
| Types        | `string x = ""`          | `var x = ""`                     |
| Constructors | `class Svc(IRepo r)`     | Traditional with fields          |
| Collections  | `[1, 2, 3]`              | `new List<int>{...}`             |
| Async        | `GetUserAsync()`         | `GetUser()` for async            |
| Nulls        | Let it fail naturally    | `?? throw ArgumentNullException` |
| DTOs         | `record UserDto(int Id)` | class with properties            |
| EF Config    | Fluent API               | Data annotations                 |
| Queries      | `AsNoTracking()`         | Tracked for reads                |
| Repository   | Domain-specific          | Generic `IRepository<T>`         |

## Service Pattern

```csharp
public class UserService(IUserRepository repo, ILogger<UserService> logger)
{
    public async Task<User?> GetByIdAsync(int id) =>
        await repo.GetByIdAsync(id);

    public async Task CreateAsync(User user)
    {
        logger.LogInformation("Creating user {Username}", user.Username);
        await repo.AddAsync(user);
    }
}
```

## Repository Pattern

```csharp
public class UserRepository(IdentityDbContext db)
{
    public async Task<User?> GetByIdAsync(int id) =>
        await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);

    public async Task AddAsync(User user)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync();
    }
}
```

## Entity Configuration

```csharp
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users", "identity");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Username).HasMaxLength(100).IsRequired();
        builder.HasIndex(u => u.Username).IsUnique();
    }
}
```

## Test Pattern

```csharp
public class UserServiceTests
{
    private readonly IUserRepository UserRepository = Substitute.For<IUserRepository>();
    private readonly UserService UserService;

    public UserServiceTests() => UserService = new(UserRepository);

    [Fact]
    public async Task GetByIdAsync_ReturnsUser_WhenExistsAsync()
    {
        // Arrange
        User user = new() { Id = 1, Username = "Test" };
        UserRepository.GetByIdAsync(1).Returns(user);

        // Act
        User? result = await UserService.GetByIdAsync(1);

        // Assert
        result.ShouldNotBeNull();
        result.Username.ShouldBe("Test");
    }
}

// Libraries: NSubstitute (mocking), Shouldly (assertions), xUnit (framework)
// ❌ NEVER use: Moq, FluentAssertions (license issues)
```

## Options Pattern

```csharp
public class ApiSettings
{
    public string BaseUrl { get; init; } = "";
    public int TimeoutSeconds { get; init; } = 30;
}

public class ApiService(IOptions<ApiSettings> options)
{
    private readonly ApiSettings settings = options.Value;
}
```
