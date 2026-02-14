---
description: Server-side testing rules and patterns for SeventySix.Server/Tests
applyTo: "**/SeventySix.Server/Tests/**/*.cs"
---

# Server Testing Instructions

## Test File Structure

```
Tests/
├── SeventySix.Api.Tests/        # API layer tests
│   └── Controllers/             # Authorization tests
├── SeventySix.Domains.Tests/    # Domain logic tests
│   └── {Domain}/
│       ├── Commands/            # Command handler tests
│       ├── Queries/             # Query handler tests
│       ├── Services/            # Service tests
│       └── Jobs/                # Job handler tests
└── SeventySix.Shared.Tests/     # Shared utility tests
```

## Naming Conventions (CRITICAL)

| Test Type     | File Suffix              | Example                                |
| ------------- | ------------------------ | -------------------------------------- |
| Integration   | `*Tests.cs`              | `TokenServiceTests.cs`                 |
| Unit          | `*UnitTests.cs`          | `PasswordValidatorUnitTests.cs`        |
| Authorization | `*AuthorizationTests.cs` | `UsersControllerAuthorizationTests.cs` |

**Method Naming**: `MethodName_Scenario_ExpectedResultAsync`

```csharp
// Examples
CreateAsync_ValidUser_ReturnsSuccessAsync
Handle_ExpiredToken_ReturnsUnauthorizedAsync
Validate_NullInput_ThrowsArgumentExceptionAsync
```

## Test Libraries (CRITICAL)

| Allowed     | Forbidden        |
| ----------- | ---------------- |
| xUnit       | MSTest           |
| NSubstitute | Moq              |
| Shouldly    | FluentAssertions |

## Test Categories

### Unit Tests (Mocks, No Database)

```csharp
public sealed class PasswordValidatorUnitTests
{
	[Fact]
	public void Validate_WeakPassword_ReturnsFalse()
	{
		// Arrange
		PasswordValidator validator =
			new();

		// Act
		bool result =
			validator.Validate("123");

		// Assert
		result.ShouldBeFalse();
	}
}
```

### Integration Tests (Real Database)

```csharp
[Collection(CollectionNames.PostgreSql)]
public sealed class TokenServiceTests(DataPostgreSqlTestFixture fixture)
	: DataPostgreSqlTestBase(fixture)
{
	[Fact]
	public async Task CreateAsync_ValidUser_ReturnsTokenAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		ApplicationUser user =
			new UserBuilder(TimeProvider)
				.WithUsername("testuser")
				.Build();

		// Act & Assert
	}
}
```

### Authorization Tests (HTTP Client)

```csharp
[Collection(CollectionNames.PostgreSql)]
public sealed class UsersControllerAuthorizationTests(ApiPostgreSqlTestFixture fixture)
	: ApiPostgreSqlTestBase(fixture)
{
	[Fact]
	public async Task GetAll_Anonymous_ReturnsUnauthorizedAsync()
	{
		// Arrange
		HttpClient client =
			CreateAnonymousClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Users.GetAll);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
	}

	[Fact]
	public async Task GetAll_AuthenticatedUser_ReturnsForbiddenAsync()
	{
		// Arrange
		HttpClient client =
			await CreateAuthenticatedClientAsync(TestRoleConstants.User);

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Users.GetAll);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
	}
}
```

## Fluent Builders (ALWAYS use for test data)

```csharp
// [ALWAYS] — Use builders
ApplicationUser user =
	new UserBuilder(TimeProvider)
		.WithUsername("admin")
		.WithRole(RoleConstants.Admin)
		.Build();

RefreshToken token =
	new RefreshTokenBuilder(TimeProvider)
		.WithUser(user)
		.WithExpiry(TimeProvider.GetUtcNow().AddDays(7))
		.Build();

// [NEVER] — Inline construction
ApplicationUser user = new() { Username = "admin" };
```

## Mock Factories (Use for mocked dependencies)

```csharp
// IdentityMockFactory, LoggingMockFactory, ApiTrackingMockFactory
ITokenService tokenService =
	IdentityMockFactory.CreateTokenService();

IUserRepository userRepo =
	IdentityMockFactory.CreateUserRepository(existingUser);
```

## Constants (NEVER magic strings)

```csharp
// [ALWAYS] — Use constants
await client.GetAsync(ApiEndpoints.Users.GetById(userId));
await CreateAuthenticatedClientAsync(TestRoleConstants.Admin);
[Collection(CollectionNames.PostgreSql)]

// [NEVER] — Magic strings
await client.GetAsync($"/api/users/{userId}");
[Collection("DatabaseTests")]
```

## Time-Based Testing (CRITICAL)

```csharp
// [ALWAYS] — Use FakeTimeProvider
timeProvider.Advance(TimeSpan.FromHours(1));

// [NEVER] — Real delays
await Task.Delay(1000);  // FORBIDDEN
Thread.Sleep(500);        // FORBIDDEN
```

## Collection Attribute (Required for DB tests)

```csharp
// [ALWAYS] — Use constant
[Collection(CollectionNames.PostgreSql)]

// [NEVER] — String literal
[Collection("DatabaseTests")]
```

## Test Method Structure (AAA Pattern)

```csharp
[Fact]
public async Task Handle_ValidInput_SucceedsAsync()
{
	// Arrange
	await using IdentityDbContext context =
		CreateIdentityDbContext();

	CreateUserCommandHandler handler =
		new(context, TimeProvider);

	CreateUserCommand command =
		new("username", "email@test.com");

	// Act
	Result result =
		await handler.HandleAsync(command, CancellationToken.None);

	// Assert
	result.IsSuccess.ShouldBeTrue();
}
```

## 80/20 Test Priority

Focus coverage on the **20% of code that carries 80% of risk**:

1. Command handlers with mutations and business rules
2. FluentValidation validators (edge cases, boundary values)
3. Services with conditional logic or external dependencies
4. Authorization policy enforcement
5. Query handlers ONLY if they contain transformations or joins

**Skip tests for:** Simple property-to-property mapping, DTOs, constants, entities with no behavior.

## Definition of Done Checklist

- [ ] Failing test written first (TDD)
- [ ] Implementation passes test
- [ ] No compiler warnings
- [ ] Code follows `.editorconfig` formatting
- [ ] All public members have XML documentation
- [ ] No magic strings (constants extracted)
- [ ] No single/two-letter variable names
- [ ] `dotnet test` passes all suites
