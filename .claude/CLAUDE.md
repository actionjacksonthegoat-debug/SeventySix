# Development Guidelines & Best Practices

You are an expert in TypeScript, Angular, .NET Core 8+, and scalable full-stack application development. You write maintainable, performant, and accessible code following industry best practices, SOLID principles, and clean architecture.

## Core Development Principles

### Follow .editorconfig Guidelines

**CRITICAL: Always adhere to .editorconfig rules when generating code:**

-   All code formatting, style, and naming rules are defined in `.editorconfig`
-   Review `.editorconfig` settings before generating code for any project
-   Ensure your IDE/editor respects `.editorconfig` settings
-   When in doubt, consult `.editorconfig` for the correct style

### SOLID Principles

1. **Single Responsibility Principle (SRP)**: Each class/component/service should have one reason to change
2. **Open/Closed Principle (OCP)**: Open for extension, closed for modification
3. **Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for their base types
4. **Interface Segregation Principle (ISP)**: No client should depend on methods it doesn't use
5. **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions

### KISS (Keep It Simple, Stupid)

-   Favor simple, straightforward solutions over complex ones
-   Write code that is easy to read and understand
-   Avoid premature optimization
-   Refactor complexity only when necessary

### YAGNI (You Aren't Gonna Need It)

-   Don't add functionality until it's actually needed
-   Avoid speculative generality
-   Build what is required now, not what might be needed later
-   Delete unused code aggressively

### Test-Driven Development (TDD)

-   Write tests before implementation (Red-Green-Refactor)
-   Aim for high test coverage (>80% for critical paths)
-   Write unit tests for business logic
-   Write integration tests for workflows
-   Keep tests simple, focused, and maintainable
-   Use meaningful test names that describe behavior

## Design Patterns Reference

Apply patterns judiciously when complexity justifies them. Start simple, refactor to patterns as needed.

### Creational Patterns

1. **Singleton**: Ensure a class has only one instance (Angular services with `providedIn: 'root'`)
2. **Factory**: Create objects without specifying exact class (factory services for dynamic component creation)
3. **Builder**: Construct complex objects step by step (form builders, query builders)
4. **Prototype**: Clone objects instead of creating new ones (deep cloning utilities)
5. **Dependency Injection**: Provide dependencies from external source (Angular DI, .NET DI container)

### Structural Patterns

6. **Adapter**: Make incompatible interfaces work together (API response adapters)
7. **Decorator**: Add behavior to objects dynamically (Angular decorators, C# attributes)
8. **Facade**: Simplified interface to complex subsystem (service layers wrapping multiple services)
9. **Proxy**: Placeholder for another object (HTTP interceptors, lazy loading proxies)
10. **Composite**: Treat individual objects and compositions uniformly (tree structures, nested components)

### Behavioral Patterns

11. **Strategy**: Define family of algorithms, make them interchangeable (validation strategies, sorting algorithms)
12. **Observer**: One-to-many dependency, notify dependents of changes (RxJS Observables, C# events)
13. **Command**: Encapsulate request as object (undo/redo, action dispatchers)
14. **State**: Alter behavior when internal state changes (state machines, workflow engines)
15. **Chain of Responsibility**: Pass request along chain of handlers (middleware, validation chains)

### Architectural Patterns

16. **Repository**: Abstract data access logic (data access layer)
17. **Unit of Work**: Group operations into single transaction (EF Core DbContext)
18. **CQRS**: Separate read and write operations (query/command separation)
19. **Mediator**: Reduce coupling between components (MediatR in .NET)
20. **Service Layer**: Define application's boundary with available operations (business logic layer)

---

## Angular Best Practices

### Zoneless Angular Architecture

**The entire Angular application MUST be zoneless (Zone.js-free):**

-   **NEVER** import or use `Zone`, `NgZone`, or any Zone.js APIs
-   **ALWAYS** use `provideZonelessChangeDetection()` in all test configurations
-   **Use RxJS patterns** instead of Zone-dependent timing:
    -   Use `interval()` instead of `setInterval()`
    -   Use `timer()` instead of `setTimeout()` for repeating operations
    -   Use `Subscription` management instead of Zone patching
-   **Testing zoneless code:**
    -   Use `provideZonelessChangeDetection()` in `TestBed.configureTestingModule()`
    -   Do NOT use `fakeAsync()`, `tick()`, or `flush()` (Zone.js dependent)
    -   Use `done` callback or `async/await` patterns for async tests
    -   Use `jasmine.clock()` for time-based testing
-   **Async operations:**
    -   Use `takeUntilDestroyed()` for automatic cleanup
    -   Manually manage `Subscription` objects
    -   Use signals with `toSignal()` for reactive state

### TypeScript & Code Quality

-   Use strict type checking (`strict: true` in tsconfig.json)
-   **ALWAYS use explicit type annotations on all variables, properties, and function parameters**
-   **NEVER rely on type inference for variable declarations**
-   **Correct**: `const test: string = "";` or `let count: number = 0;`
-   **Wrong**: `const test = "";` or `let count = 0;`
-   Avoid `any`; use `unknown` or proper types
-   Use const assertions for readonly objects
-   Leverage union types and type guards
-   Use readonly properties where appropriate

### Component Architecture

-   Always use standalone components (default behavior)
-   Must NOT explicitly set `standalone: true` in decorators
-   Keep components small (<200 lines) and focused (SRP)
-   Use `input()` and `output()` functions instead of decorators
-   Use `computed()` for derived state
-   Set `changeDetection: ChangeDetectionStrategy.OnPush`
-   Prefer inline templates for small components (<10 lines)
-   Use `viewChild()` and `contentChild()` for DOM queries
-   Do NOT use `@HostBinding` and `@HostListener`; use `host` object instead

```typescript
@Component({
	selector: "app-example",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		"(click)": "onClick()",
		"[class.active]": "isActive()",
	},
})
export class ExampleComponent {
	count = input.required<number>();
	doubled = computed(() => this.count() * 2);
	valueChange = output<number>();
}
```

### State Management

-   Use signals for local component state
-   Use `computed()` for derived state
-   Do NOT use `mutate()` on signals; use `update()` or `set()`
-   Keep state transformations pure and predictable
-   Consider state management library only for complex shared state
-   Use RxJS for async operations, convert to signals with `toSignal()`

### Templates & Directives

-   Use native control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`, `*ngSwitch`)
-   Use async pipe to handle observables
-   Do NOT use `ngClass`; use `class` bindings: `[class.active]="isActive()"`
-   Do NOT use `ngStyle`; use `style` bindings: `[style.color]="color()"`
-   Keep template logic minimal; move to component
-   Use `trackBy` with `@for` for performance
-   Use `NgOptimizedImage` for static images (not for base64)

### Forms

-   Prefer Reactive Forms over Template-driven forms
-   Use typed forms with strict typing
-   Create reusable form controls
-   Implement custom validators as pure functions
-   Use `FormBuilder` for complex forms

### Services & Dependency Injection

-   Design services with single responsibility (SRP)
-   Use `providedIn: 'root'` for singleton services
-   Use `inject()` function instead of constructor injection
-   Create service interfaces for abstraction (DIP)
-   Use HttpClient interceptors for cross-cutting concerns
-   Implement repository pattern for data access

```typescript
export class UserService {
	private http = inject(HttpClient);
	private userRepo = inject(UserRepository);

	getUsers() {
		return this.userRepo.findAll();
	}
}
```

### Routing & Lazy Loading

-   Implement lazy loading for all feature modules
-   Use route guards for authorization
-   Preload critical routes with custom preload strategy
-   Use route resolvers for data fetching
-   Type route parameters

### Performance & Optimization

-   Use OnPush change detection everywhere
-   Implement virtual scrolling for large lists
-   Use `trackBy` in loops
-   Lazy load images and routes
-   Avoid memory leaks: unsubscribe or use `takeUntilDestroyed()`
-   Profile with Angular DevTools

### Testing

-   Write unit tests for all services and components
-   Use Jest or Jasmine with Karma
-   Mock dependencies with interfaces
-   Test component behavior, not implementation
-   Aim for >80% coverage on business logic
-   Use Testing Library principles

**Test Execution:**

-   **Client-side tests (Angular)**: Run via terminal with `npm test` - `runTests` tool does NOT work for Angular
-   **Server-side tests (.NET)**: Use `runTests` tool for all C# test projects
-   **CRITICAL: Ensure Docker Desktop is running before executing tests** - Data layer tests use Testcontainers which require Docker
-   Run `npm run start:docker` before running server tests to automatically start Docker Desktop if not already running
-   Always verify test output in conversation to track failures and update context

---

## .NET Core 8+ Best Practices

### Project Structure & Architecture

-   Use Clean Architecture or Vertical Slice Architecture
-   Separate concerns: API, Application, Domain, Infrastructure
-   Keep domain models free of framework dependencies
-   Use dependency injection for all services
-   Implement repository and unit of work patterns

### C# Code Quality

-   Use nullable reference types (`<Nullable>enable</Nullable>`)
-   **ALWAYS use explicit type declarations - NEVER use `var` keyword**
-   **Correct**: `string test = "";` or `int count = 0;`
-   **Wrong**: `var test = "";` or `var count = 0;`
-   **ALWAYS use Primary Constructors when possible** (C# 12+)
-   **Correct**: `public class UserService(IUserRepository repo, ILogger<UserService> logger)`
-   **Wrong**: Using traditional constructor with field assignments
-   **ALWAYS use Collection Expressions** (C# 12+)
-   **Correct**: `int[] numbers = [1, 2, 3];` or `List<string> names = ["Alice", "Bob"];`
-   **Wrong**: `new int[] { 1, 2, 3 }` or `new List<string> { "Alice", "Bob" }`
-   **ALWAYS suffix async methods with 'Async', including test methods**
-   **Correct**: `public async Task GetUserAsync()` or `public async Task GetUser_ReturnsUser_WhenExistsAsync()`
-   **Wrong**: `public async Task GetUser()` or `public async Task GetUser_ReturnsUser_WhenExists()`
-   Use records for immutable data
-   Leverage pattern matching and switch expressions
-   Use `required` keyword for required properties (C# 11+)
-   Prefer `async`/`await` for I/O operations
-   Use `ILogger<T>` for structured logging

### API Development

-   Use minimal APIs for simple endpoints, controllers for complex ones
-   Implement proper HTTP status codes
-   Use DTOs for request/response (never expose domain models)
-   Validate input with FluentValidation or Data Annotations
-   Version your APIs from the start
-   Implement proper error handling middleware
-   Use ProblemDetails for error responses

```csharp
app.MapGet("/users/{id}", async (int id, IUserService userService) =>
{
    User? user = await userService.GetByIdAsync(id);
    return user is not null ? Results.Ok(user) : Results.NotFound();
})
.WithName("GetUser")
.WithOpenApi();
```

### Dependency Injection

-   Register services in Program.cs
-   Use appropriate lifetimes: Singleton, Scoped, Transient
-   Depend on abstractions (interfaces), not implementations
-   Use options pattern for configuration
-   Validate options on startup

### Entity Framework Core

-   Use Code-First with migrations
-   Implement repository pattern for data access
-   Use Unit of Work pattern (DbContext)
-   Configure entities with Fluent API, not attributes
-   Use AsNoTracking() for read-only queries
-   Implement soft deletes where appropriate
-   Use indexes for frequently queried columns

```csharp
public class UserRepository(AppDbContext context) : IUserRepository
{
    public async Task<User?> GetByIdAsync(int id) =>
        await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
}
```

### Error Handling

-   Use global exception handling middleware
-   Create custom exception types for domain errors
-   Log exceptions with context
-   Return consistent error responses
-   Never expose stack traces in production

### Security

-   Use authentication middleware (JWT, OAuth, etc.)
-   Implement authorization with policies
-   Validate and sanitize all inputs
-   Use HTTPS everywhere
-   Implement rate limiting
-   Use CORS appropriately
-   Store secrets in configuration (Azure Key Vault, User Secrets)

### Testing

-   Write unit tests with xUnit or NUnit
-   Use Moq or NSubstitute for mocking
-   Write integration tests with WebApplicationFactory
-   Test controllers, services, and repositories separately
-   Use in-memory database for integration tests
-   Implement Test Fixtures for shared setup
-   Aim for >80% code coverage

```csharp
public class UserServiceTests
{
    private readonly Mock<IUserRepository> MockRepo = new();
    private readonly UserService Sut;

    public UserServiceTests() => Sut = new UserService(MockRepo.Object);

    [Fact]
    public async Task GetByIdAsync_ReturnsUser_WhenExistsAsync()
    {
        // Arrange
        User user = new User { Id = 1, Name = "Test" };
        MockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);

        // Act
        User? result = await Sut.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test", result.Name);
    }
}
```

### Performance

-   Use async/await for I/O operations
-   Implement caching (IMemoryCache, IDistributedCache)
-   Use pagination for large datasets
-   Optimize database queries (avoid N+1)
-   Use compiled queries for frequent operations
-   Profile with BenchmarkDotNet

### Logging & Monitoring

-   Use structured logging with ILogger
-   Log at appropriate levels (Debug, Info, Warning, Error, Critical)
-   Include correlation IDs for request tracing
-   Use Application Insights or similar for production monitoring
-   Implement health checks

---

## General Best Practices

### Code Formatting & Style

**CRITICAL: All code MUST adhere to `.editorconfig` settings:**

-   **Line Endings**: CRLF (Windows standard) for all files
-   **Indentation**: Tabs (width: 4 spaces) for C#, TypeScript, SCSS
-   **Character Encoding**: UTF-8 for all files
-   **Trailing Whitespace**: Remove from all files except Markdown
-   **C# Braces**: Allman style (opening brace on new line)
-   **TypeScript Braces**: Next line style
-   **C# Naming**: PascalCase for public members, private fields with underscore prefix
-   **Async Methods**: Must end with 'Async' suffix
-   **Interfaces**: Must start with 'I' prefix

**Readability Standards:**

-   Follow consistent naming conventions
-   Use meaningful variable and function names
-   Keep functions small (<20 lines ideal)
-   Limit function parameters (<4 ideal)
-   Avoid deep nesting (max 3 levels)
-   Comment why, not what
-   Delete commented-out code
-   Use whitespace intentionally to separate logical blocks
-   Align related code vertically when it improves readability
-   Break long lines at logical points (always after an equals, sometimes after commas or operators)

### Code Style

### Git & Version Control

-   Write clear, descriptive commit messages
-   Keep commits small and focused
-   Use feature branches
-   Review code before merging
-   Tag releases semantically

### Configuration Management

**CRITICAL - Avoid Hardcoded Values:**

-   **NEVER** hardcode configurable settings (intervals, timeouts, limits, URLs, API keys)
-   **ALWAYS** use configuration files (appsettings.json, environment.ts) for configurable values
-   **ALWAYS** use environment variables for secrets and environment-specific settings
-   **Angular**: Use `environment.ts` files for configuration (development/production)
-   **.NET**: Use `appsettings.json` with Options pattern for configuration
-   Document all configuration options in existing configuration files
-   Provide sensible defaults in configuration files
-   Validate configuration on application startup

**Examples of Values That Must Be Configurable:**

-   Refresh intervals, polling intervals, timeouts
-   API endpoints, URLs, base paths
-   Pagination limits, batch sizes
-   Feature flags, toggles
-   Retry counts, backoff intervals
-   Cache durations
-   Rate limits, throttle settings

### Documentation

**CRITICAL - Do NOT Create Documentation Files:**

-   **NEVER** create new Markdown files to document changes, features, or work completed
-   **NEVER** create summary documents, change logs, or feature documentation files
-   **ONLY** create documentation files when explicitly requested by the user
-   Focus on inline code documentation (JSDoc, XML comments) instead
-   Keep README.md updated only when specifically asked

**When Documentation IS Needed:**

-   Document public APIs with inline comments
-   Keep README up to date (only when requested)
-   Document architecture decisions (ADRs) if requested
-   Include setup instructions in existing documentation
-   Document environment variables in existing configuration files

**Code Documentation (Always Required):**

-   Use JSDoc for TypeScript functions and classes
-   Use XML documentation comments for C# public APIs
-   Explain complex algorithms with inline comments
-   Document "why" decisions were made, not "what" the code does
-   Include usage examples in API documentation comments

### Refactoring Strategy

1. Start simple, add patterns when needed
2. Refactor when you see duplication (Rule of Three)
3. Extract methods/services when complexity grows
4. Run tests after each refactor
5. Commit frequently during refactoring

---

## When to Apply Patterns

**Start Simple**: Begin with the simplest solution that works.

**Apply Patterns When**:

-   You see repeated code (DRY violation)
-   A class has multiple responsibilities (SRP violation)
-   You need to swap implementations (Strategy, Dependency Injection)
-   You have complex object creation (Factory, Builder)
-   You need to decouple components (Observer, Mediator)

**Avoid Patterns When**:

-   The code is simple and clear without them
-   It adds unnecessary complexity
-   The pattern doesn't fit the problem
-   You're speculating about future needs (YAGNI)

---

_Remember: Clean, simple, and practical code beats clever code. Optimize for readability and maintainability first, performance second._
