# C# / .NET 10+ Quick Reference

> Full documentation: `.claude/CLAUDE.md`

## Critical Rules

| Rule         | ✅ Do                    | ❌ Don't                        |
| ------------ | ------------------------ | ------------------------------- |
| Types        | `string x = ""`          | `var x = ""`                    |
| Constructors | `class Svc(IRepo r)`     | Traditional with fields         |
| Collections  | `[1, 2, 3]`              | `new List<int>{...}`            |
| Async        | `GetUserAsync()`         | `GetUser()` for async           |
| Nulls        | `return user?.ToDto();`  | `if (user == null) { return..}` |
| DTOs         | `record UserDto(int Id)` | class with properties           |
| EF Config    | Fluent API               | Data annotations                |
| Queries      | `AsNoTracking()`         | Tracked for reads               |
| Repository   | Domain-specific          | Generic `IRepository<T>`        |

## Code Formatting (CRITICAL)

| Rule             | ✅ Do                      | ❌ Don't                          |
| ---------------- | -------------------------- | --------------------------------- |
| 2+ Parameters    | Each on new line           | Multiple on same line             |
| Binary Operators | `\|\|` on LEFT of new line | `\|\|` on right of line           |
| Assignment       | New line AFTER `=`         | Value on same line as `=`         |
| Method Chains    | New line BEFORE each `.`   | All on one line                   |
| Closing Paren    | `)` with last param        | `)` alone on line                 |
| Null Checks      | `return x?.ToDto();`       | `if (x == null) { return null; }` |

## Service Pattern

```csharp
public class UserService(
	IUserRepository repo,
	ILogger<UserService> logger)
{
	public async Task<User?> GetByIdAsync(int id) =>
		await repo.GetByIdAsync(id);

	public async Task CreateAsync(User user)
	{
		logger.LogInformation(
			"Creating user {Username}",
			user.Username);
		await repo.AddAsync(user);
	}
}
```

## Repository Pattern

```csharp
public class UserRepository(IdentityDbContext db)
{
	public async Task<User?> GetByIdAsync(int id) =>
		await db.Users
			.AsNoTracking()
			.FirstOrDefaultAsync(user => user.Id == id);

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
		builder.ToTable(
			"users",
			"identity");
		builder.HasKey(user => user.Id);
		builder
			.Property(user => user.Username)
			.HasMaxLength(100)
			.IsRequired();
		builder
			.HasIndex(user => user.Username)
			.IsUnique();
	}
}
```

## Null Check Simplification

```csharp
// ✅ CORRECT - Use null-conditional operator
public UserDto? GetUserDto(int id)
{
	User? user =
		await repo.GetByIdAsync(id);
	return user?.ToDto();
}

// ❌ WRONG - Verbose null check (FORBIDDEN)
public UserDto? GetUserDto(int id)
{
	User? user = await repo.GetByIdAsync(id);
	if (user == null)
	{
		return null;
	}
	return user.ToDto();
}
```

## Test Pattern

```csharp
public class UserServiceTests
{
	private readonly IUserRepository UserRepository =
		Substitute.For<IUserRepository>();
	private readonly UserService UserService;

	public UserServiceTests() =>
		UserService =
			new(UserRepository);

	[Fact]
	public async Task GetByIdAsync_ReturnsUser_WhenExistsAsync()
	{
		// Arrange
		User user =
			new() { Id = 1, Username = "Test" };
		UserRepository
			.GetByIdAsync(1)
			.Returns(user);

		// Act
		User? result =
			await UserService.GetByIdAsync(1);

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
	private readonly ApiSettings settings =
		options.Value;
}
```
