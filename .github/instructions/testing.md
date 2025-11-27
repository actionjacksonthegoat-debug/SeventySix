# Testing Quick Reference

> **Full documentation**: See `.claude/CLAUDE.md` for comprehensive testing guidelines.

---

## Critical Rules

-   ❌ **NEVER** skip failing tests - fix immediately
-   ❌ **NEVER** proceed if tests are failing
-   ✅ **ALWAYS** run tests after each code change
-   ✅ **ALWAYS** suffix async test methods with `Async`

---

## Commands

| Platform | Command            | Notes                        |
| -------- | ------------------ | ---------------------------- |
| Angular  | `npm test`         | Headless, no-watch           |
| .NET     | `dotnet test`      | Docker Desktop required      |
| E2E      | `npm run test:e2e` | Playwright (not in test:all) |

**Prerequisites**: Docker Desktop must be running for .NET integration tests.

> ⚠️ **E2E Tests**: E2E tests cover admin-dashboard and home-page only. Run manually with `npm run test:e2e`. Not included in `test:all` - functionality incomplete for other views.

---

## Angular Test Pattern (Zoneless)

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

// ❌ FORBIDDEN: fakeAsync(), tick(), flush()
```

---

## .NET Test Pattern

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

## Error Checklist

| Issue               | Solution                               |
| ------------------- | -------------------------------------- |
| Zone.js errors      | Add `provideZonelessChangeDetection()` |
| Testcontainers fail | Start Docker Desktop                   |
| Async test hangs    | Use `await fixture.whenStable()`       |
| Missing Async       | Add `Async` to method name             |
| Tests failing       | **Fix immediately - never skip**       |
