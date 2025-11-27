# Testing Quick Reference

> Full documentation: `.claude/CLAUDE.md`

## Critical Rules

-   ❌ **NEVER** skip failing tests - fix immediately
-   ✅ **ALWAYS** run tests after code changes
-   ✅ **ALWAYS** suffix async test methods with `Async`

## Commands

| Platform | Command            | Notes                   |
| -------- | ------------------ | ----------------------- |
| Angular  | `npm test`         | Headless, no-watch      |
| .NET     | `dotnet test`      | Docker Desktop required |
| E2E      | `npm run test:e2e` | Playwright, manual only |

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
    private readonly Mock<IUserRepository> _mockRepo = new();
    private readonly UserService _sut;

    public UserServiceTests() => _sut = new(_mockRepo.Object);

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

## Troubleshooting

| Issue                | Solution                               |
| -------------------- | -------------------------------------- |
| Zone.js errors       | Add `provideZonelessChangeDetection()` |
| Testcontainers fail  | Start Docker Desktop                   |
| Async test hangs     | Use `await fixture.whenStable()`       |
| Missing Async suffix | Add `Async` to method name             |
