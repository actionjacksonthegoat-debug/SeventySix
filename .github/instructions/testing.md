# Testing Quick Reference

> Full documentation: `.claude/CLAUDE.md`

## Critical Rules

-   ❌ **NEVER** skip failing tests - fix immediately
-   ✅ **ALWAYS** follow **80/20 rule** - test critical paths only, no exhaustive edge case testing
-   ✅ **ALWAYS** use **TDD** for fixes - write failing test first, then implement
-   ✅ **ALWAYS** run tests after code changes
-   ✅ **ALWAYS** suffix async test methods with `Async`

## Commands

| Platform | Command            | Notes                   |
| -------- | ------------------ | ----------------------- |
| Angular  | `npm test`         | Headless, no-watch      |
| .NET     | `dotnet test`      | Docker Desktop required |
| E2E      | `npm run test:e2e` | Playwright, manual only |

## 80/20 Rule

Test the critical happy path. The fix itself guarantees correctness - don't over-test.

```csharp
// ✅ CORRECT - Single focused test for critical path
[Fact]
public async Task RegisterAsync_SavesAllEntitiesAtomically_WhenSuccessfulAsync()
{
	// Arrange, Act, Assert atomicity
}

// ❌ WRONG - Exhaustive edge cases (YAGNI)
[Fact]
public async Task RegisterAsync_ThrowsWhenUsernameNullAsync() { }
[Fact]
public async Task RegisterAsync_ThrowsWhenUsernameTooLongAsync() { }
[Fact]
public async Task RegisterAsync_ThrowsWhenUsernameContainsSpacesAsync() { }
```

## Angular Test Pattern

```typescript
describe("UserComponent", () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UserComponent],
			providers: [
				provideZonelessChangeDetection(), // REQUIRED
				provideHttpClientTesting(),
			],
		}).compileComponents();
	});

	it("should display user name", async () => {
		const fixture: ComponentFixture<UserComponent> = TestBed.createComponent(UserComponent);

		fixture.componentRef.setInput("user", { name: "Test" });
		await fixture.whenStable();
		fixture.detectChanges();

		expect(fixture.nativeElement.textContent).toContain("Test");
	});
});

// ❌ FORBIDDEN: fakeAsync(), tick(), flush(), Zone.js
```

## .NET Test Pattern

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

	[Fact]
	public async Task CreateAsync_CallsRepository_WithCorrectDataAsync()
	{
		// Arrange
		CreateUserRequest request =
			new(
				"TestUser",
				"test@example.com");
		UserRepository
			.CreateAsync(Arg.Any<User>())
			.Returns(Task.CompletedTask);

		// Act
		await UserService.CreateAsync(request);

		// Assert
		await UserRepository
			.Received(1)
			.CreateAsync(Arg.Is<User>(user => user.Username == "TestUser"));
	}
}

// Libraries: NSubstitute (mocking), Shouldly (assertions), xUnit (framework)
// ❌ NEVER use: Moq, FluentAssertions (license issues)
```

## NSubstitute Quick Reference

```csharp
// Setup returns
MockService
	.Method(Arg.Any<int>())
	.Returns(value);
MockService
	.MethodAsync(1)
	.Returns(Task.FromResult(value));

// Verify calls
MockService
	.Received(1)
	.Method(Arg.Any<int>());
await MockService
	.Received()
	.MethodAsync(Arg.Is<User>(user => user.Id == 1));
MockService
	.DidNotReceive()
	.Method(Arg.Any<int>());

// Argument matchers
Arg.Any<T>()                    // Any value of type T
Arg.Is<T>(value => value > 0)   // Predicate matching
```

## Shouldly Quick Reference

```csharp
result.ShouldBe(expected);
result.ShouldNotBeNull();
result.ShouldBeEmpty();
result.ShouldContain(item);
result.ShouldBeGreaterThan(5);
await Should.ThrowAsync<InvalidOperationException>(async () => await action());
```

## Troubleshooting

| Issue                | Solution                               |
| -------------------- | -------------------------------------- |
| Zone.js errors       | Add `provideZonelessChangeDetection()` |
| Testcontainers fail  | Start Docker Desktop                   |
| Async test hangs     | Use `await fixture.whenStable()`       |
| Missing Async suffix | Add `Async` to method name             |
