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

## Logging Standards

> **CRITICAL**: Only log **Warning** and **Error** levels.

| Level               | When to Use                                       | Example                    |
| ------------------- | ------------------------------------------------- | -------------------------- |
| ❌ `LogDebug`       | **NEVER**                                         | -                          |
| ❌ `LogInformation` | **NEVER**                                         | -                          |
| ⚠️ `LogWarning`     | Recoverable issues, unexpected but handled states | Duplicate username attempt |
| 🔴 `LogError`       | Unrecoverable failures, exceptions                | Database save failure      |

## Database Transactions

| Scenario                              | Pattern                             | Example                          |
| ------------------------------------- | ----------------------------------- | -------------------------------- |
| Create single entity                  | Direct `SaveChangesAsync`           | `BaseRepository.CreateAsync`     |
| Create multiple related entities      | **Consolidated `SaveChangesAsync`** | `AuthService.RegisterAsync`      |
| Read-then-write with uniqueness check | `TransactionManager`                | `UserService.CreateUserAsync`    |
| Bulk update with `ExecuteUpdateAsync` | None needed (already atomic)        | `TokenService.RevokeFamilyAsync` |

```csharp
// ❌ WRONG - Multiple SaveChanges = NOT atomic
context.Users.Add(user);
await context.SaveChangesAsync(cancellationToken);  // Save 1

context.UserCredentials.Add(credential);
await context.SaveChangesAsync(cancellationToken);  // Save 2 - orphan risk!

// ✅ CORRECT - Single SaveChanges = fully atomic
context.Users.Add(user);
context.UserCredentials.Add(credential);
context.UserRoles.Add(userRole);
await context.SaveChangesAsync(cancellationToken);  // All or nothing
```

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

	public async Task CreateAsync(User user) =>
		await repo.AddAsync(user);
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

## Entity & Database Conventions

### Foreign Key Properties

-   **ALWAYS** suffix FK properties with `Id`: `UserId`, `RoleId`, `ParentId`
-   FK column names match property names in database

```csharp
// ✅ CORRECT - FK properties end with Id
public int UserId { get; set; }
public int RoleId { get; set; }
public int ParentCommentId { get; set; }

// ❌ WRONG - Missing Id suffix for FK
public int User { get; set; }
```

### Audit Fields (NOT Foreign Keys)

-   `CreatedBy`, `ModifiedBy`, `DeletedBy` store **username strings**
-   These track WHO performed action, not FK relationships
-   Do NOT suffix with `Id` - they are NOT foreign keys

```csharp
// ✅ CORRECT - Audit fields store username strings
public string CreatedBy { get; set; }
public string ModifiedBy { get; set; }
public string DeletedBy { get; set; }

// ❌ WRONG - Adding Id suffix to audit field
public int CreatedById { get; set; }
```

### Cascade Delete Policy

-   Use `CASCADE` for dependent children (tokens, credentials)
-   Use `RESTRICT` for lookup tables (roles, categories)
-   Document behavior in entity configuration comments

```csharp
// Dependent children - CASCADE (delete tokens when user deleted)
.OnDelete(DeleteBehavior.Cascade)

// Lookup tables - RESTRICT (prevent deleting role if users have it)
.OnDelete(DeleteBehavior.Restrict)
```
