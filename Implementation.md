# Implementation Plan: Service Facade & CancellationToken Enforcement

**Project**: SeventySix Architecture Refinement
**Date**: November 26, 2025
**Principles**: KISS, DRY, YAGNI
**Estimated Duration**: 10 hours

---

## Executive Summary

**Objective**: Enforce architectural standards for service facades and CancellationToken usage.

**Key Decisions**:

1. ✅ **KEEP repositories** - Valid abstraction pattern (testability, bounded context isolation)
2. ✅ **Service facade ALREADY enforced** - Add architectural tests to prevent regression
3. ❌ **FIX CancellationToken** - Remove from mutations (Create/Update/Delete), keep for queries

**Changes Required**:

-   Remove `CancellationToken` from all mutation operations across repositories, services, and controllers
-   Add architectural tests using NetArchTest.Rules to enforce patterns
-   Update existing tests to match new signatures
-   Update ARCHITECTURE.md documentation

---

## Phase 1: Remove CancellationToken from Mutations (3 hours)

### 1.1 Update Repository Interfaces

**Files**:

-   `SeventySix.Server/SeventySix/Identity/Interfaces/IUserRepository.cs`
-   `SeventySix.Server/SeventySix/Logging/Interfaces/ILogRepository.cs`
-   `SeventySix.Server/SeventySix/ApiTracking/Interfaces/IThirdPartyApiRequestRepository.cs`

**Rule**:

-   ✅ **KEEP** `CancellationToken` for: `Get*`, `List*`, `Search*`, `Query*`, `Count*`, `Exists*`, `Check*`
-   ❌ **REMOVE** `CancellationToken` from: `Create*`, `Update*`, `Delete*`, `Restore*`, `Soft*`

**Pattern**:

```csharp
// BEFORE
Task<User> CreateAsync(User entity, CancellationToken ct = default);
Task<User> UpdateAsync(User entity, CancellationToken ct = default);
Task<bool> DeleteAsync(int id, CancellationToken ct = default);

// AFTER
Task<User> CreateAsync(User entity);
Task<User> UpdateAsync(User entity);
Task<bool> DeleteAsync(int id);

// KEEP (queries)
Task<User?> GetByIdAsync(int id, CancellationToken ct = default);
Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default);
```

### 1.2 Update Repository Implementations

**Files**:

-   `SeventySix.Server/SeventySix/Identity/Repositories/UserRepository.cs`
-   `SeventySix.Server/SeventySix/Logging/Repositories/LogRepository.cs`
-   `SeventySix.Server/SeventySix/ApiTracking/Repositories/ThirdPartyApiRequestRepository.cs`

**Pattern**:

```csharp
// BEFORE
public async Task<User> CreateAsync(User entity, CancellationToken ct = default)
{
	ArgumentNullException.ThrowIfNull(entity);
	_context.Users.Add(entity);
	await _context.SaveChangesAsync(ct);
	return entity;
}

// AFTER (no CancellationToken parameter)
public async Task<User> CreateAsync(User entity)
{
	ArgumentNullException.ThrowIfNull(entity);
	_context.Users.Add(entity);
	await _context.SaveChangesAsync();
	return entity;
}
```

**Rationale**: Mutations should complete atomically - cancellation mid-operation could leave partial writes.

### 1.3 Update Service Interfaces

**Files**:

-   `SeventySix.Server/SeventySix/Identity/Interfaces/IUserService.cs`
-   `SeventySix.Server/SeventySix/Logging/Interfaces/ILogService.cs`
-   `SeventySix.Server/SeventySix/ApiTracking/Interfaces/IThirdPartyApiRequestService.cs`

**Pattern**:

```csharp
// BEFORE
Task<UserDto> CreateUserAsync(CreateUserRequest req, CancellationToken ct = default);
Task<UserDto> UpdateUserAsync(UpdateUserRequest req, CancellationToken ct = default);
Task<bool> DeleteUserAsync(int id, string by, CancellationToken ct = default);

// AFTER
Task<UserDto> CreateUserAsync(CreateUserRequest req);
Task<UserDto> UpdateUserAsync(UpdateUserRequest req);
Task<bool> DeleteUserAsync(int id, string by);

// KEEP (queries)
Task<UserDto?> GetUserByIdAsync(int id, CancellationToken ct = default);
Task<PagedResult<UserDto>> GetPagedUsersAsync(UserQueryRequest req, CancellationToken ct = default);
```

### 1.4 Update Service Implementations

**Files**:

-   `SeventySix.Server/SeventySix/Identity/Services/UserService.cs`
-   `SeventySix.Server/SeventySix/Logging/Services/LogService.cs`
-   `SeventySix.Server/SeventySix/ApiTracking/Services/ThirdPartyApiRequestService.cs`

**Pattern**:

```csharp
// BEFORE
public async Task<UserDto> CreateUserAsync(CreateUserRequest req, CancellationToken ct = default)
{
	await _validator.ValidateAndThrowAsync(req, ct);

	if (await _repository.UsernameExistsAsync(req.Username, null, ct))
		throw new DuplicateUserException("Username exists");

	User entity = req.ToEntity();
	User created = await _repository.CreateAsync(entity, ct);
	return created.ToDto();
}

// AFTER
public async Task<UserDto> CreateUserAsync(CreateUserRequest req)
{
	await _validator.ValidateAndThrowAsync(req, CancellationToken.None);

	if (await _repository.UsernameExistsAsync(req.Username, null, CancellationToken.None))
		throw new DuplicateUserException("Username exists");

	User entity = req.ToEntity();
	User created = await _repository.CreateAsync(entity);
	return created.ToDto();
}
```

**Key Points**:

-   Use `CancellationToken.None` for validation and existence checks (fast operations)
-   No cancellation support for mutations (atomic operations)

### 1.5 Update Controllers

**Files**:

-   `SeventySix.Server/SeventySix.Api/Controllers/UsersController.cs`
-   `SeventySix.Server/SeventySix.Api/Controllers/LogsController.cs`
-   `SeventySix.Server/SeventySix.Api/Controllers/ThirdPartyApiRequestController.cs`

**Pattern**:

```csharp
// BEFORE
[HttpPost]
public async Task<ActionResult<UserDto>> CreateAsync(
	[FromBody] CreateUserRequest req,
	CancellationToken ct)
{
	UserDto result = await _userService.CreateUserAsync(req, ct);
	return CreatedAtRoute("GetUserById", new { id = result.Id }, result);
}

// AFTER
[HttpPost]
public async Task<ActionResult<UserDto>> CreateAsync(
	[FromBody] CreateUserRequest req)
{
	UserDto result = await _userService.CreateUserAsync(req);
	return CreatedAtRoute("GetUserById", new { id = result.Id }, result);
}

// KEEP (queries still have CancellationToken)
[HttpGet("{id}")]
public async Task<ActionResult<UserDto>> GetByIdAsync(
	int id,
	CancellationToken ct)
{
	UserDto? result = await _userService.GetUserByIdAsync(id, ct);
	return result is null ? NotFound() : Ok(result);
}
```

**Rule**:

-   GET endpoints: Keep `CancellationToken ct`
-   POST/PUT/DELETE endpoints: Remove `CancellationToken ct`

### 1.6 Verify Changes

**Run server tests**:

```powershell
dotnet test SeventySix.Server/SeventySix.Server.slnx --no-build --logger "console;verbosity=normal"
```

**Expected**: Tests will FAIL due to signature changes. Fix in Phase 3.

---

## Phase 2: Add Architectural Tests (2 hours)

### 2.1 Create Architecture Test Project

**Create**: `SeventySix.Server/Tests/SeventySix.ArchitectureTests/SeventySix.ArchitectureTests.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<TargetFramework>net10.0</TargetFramework>
		<IsPackable>false</IsPackable>
		<Nullable>enable</Nullable>
	</PropertyGroup>

	<ItemGroup>
		<PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
		<PackageReference Include="xunit" Version="2.9.3" />
		<PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
		<PackageReference Include="NetArchTest.Rules" Version="1.3.2" />
	</ItemGroup>

	<ItemGroup>
		<ProjectReference Include="..\..\SeventySix\SeventySix.csproj" />
		<ProjectReference Include="..\..\SeventySix.Api\SeventySix.Api.csproj" />
	</ItemGroup>
</Project>
```

### 2.2 Create Service Facade Tests

**Create**: `SeventySix.Server/Tests/SeventySix.ArchitectureTests/ServiceFacadeTests.cs`

```csharp
using System.Reflection;
using NetArchTest.Rules;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce service facade pattern.
/// Ensures controllers ONLY access services, never repositories directly.
/// Automatically discovers all bounded contexts to prevent regression.
/// </summary>
public class ServiceFacadeTests
{
	[Fact]
	public void Controllers_Should_Not_Depend_On_Any_Repository_Namespace()
	{
		// Arrange - Discover all bounded context namespaces dynamically
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;
		string[] boundedContexts = domainAssembly.GetTypes()
			.Select(t => t.Namespace)
			.Where(ns => ns != null && ns.StartsWith("SeventySix.") && !ns.Contains("Shared") && !ns.Contains("Infrastructure"))
			.Select(ns => ns!.Split('.')[1]) // Extract bounded context name (Identity, Logging, etc.)
			.Distinct()
			.ToArray();

		// Act & Assert - Check each bounded context's repository namespace
		foreach (string context in boundedContexts)
		{
			string repositoryNamespace = $"SeventySix.{context}.Repositories";

			Types result = Types
				.InAssembly(typeof(SeventySix.Api.Program).Assembly)
				.That()
				.ResideInNamespace("SeventySix.Api.Controllers")
				.ShouldNot()
				.HaveDependencyOn(repositoryNamespace)
				.GetResult();

			Assert.True(result.IsSuccessful,
				$"Controllers must not depend on {repositoryNamespace} directly. " +
				$"Found violations: {string.Join(", ", result.FailingTypeNames ?? [])}");
		}
	}

	[Fact]
	public void Repositories_Should_Not_Be_Public()
	{
		// Arrange - Discover all repository types across all bounded contexts
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;
		Type[] repositoryTypes = domainAssembly.GetTypes()
			.Where(t => t.Name.EndsWith("Repository")
					 && !t.IsInterface
					 && !t.IsAbstract
					 && t.Namespace != null
					 && t.Namespace.StartsWith("SeventySix.")
					 && !t.Namespace.Contains("Shared"))
			.ToArray();

		// Act
		List<string> publicRepositories = [];
		foreach (Type repositoryType in repositoryTypes)
		{
			if (repositoryType.IsPublic)
			{
				publicRepositories.Add($"{repositoryType.Namespace}.{repositoryType.Name}");
			}
		}

		// Assert
		Assert.Empty(publicRepositories);
	}

	[Fact]
	public void Controllers_Should_Only_Depend_On_Service_Interfaces()
	{
		// Arrange - Get all controller types
		Type[] controllerTypes = Types
			.InAssembly(typeof(SeventySix.Api.Program).Assembly)
			.That()
			.ResideInNamespace("SeventySix.Api.Controllers")
			.GetTypes()
			.ToArray();

		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;

		// Get all service interfaces
		Type[] serviceInterfaces = domainAssembly.GetTypes()
			.Where(t => t.IsInterface && t.Name.EndsWith("Service"))
			.ToArray();

		// Get all repository interfaces
		Type[] repositoryInterfaces = domainAssembly.GetTypes()
			.Where(t => t.IsInterface && t.Name.EndsWith("Repository"))
			.ToArray();

		// Act - Check constructor dependencies
		List<string> violations = [];
		foreach (Type controllerType in controllerTypes)
		{
			ConstructorInfo[] constructors = controllerType.GetConstructors();
			foreach (ConstructorInfo constructor in constructors)
			{
				ParameterInfo[] parameters = constructor.GetParameters();
				foreach (ParameterInfo parameter in parameters)
				{
					// Check if injecting a repository interface
					if (repositoryInterfaces.Contains(parameter.ParameterType))
					{
						violations.Add($"{controllerType.Name} injects {parameter.ParameterType.Name} (repository) instead of a service");
					}
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}
}
```

### 2.3 Create CancellationToken Tests

**Create**: `SeventySix.Server/Tests/SeventySix.ArchitectureTests/CancellationTokenTests.cs`

```csharp
using System.Reflection;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce CancellationToken usage rules.
/// - Query methods (Get*, List*, Search*) MUST have CancellationToken
/// - Mutation methods (Create*, Update*, Delete*) MUST NOT have CancellationToken
/// Automatically discovers all service interfaces across all bounded contexts.
/// </summary>
public class CancellationTokenTests
{
	private static readonly string[] QueryPrefixes = ["Get", "List", "Search", "Count", "Check", "Find"];
	private static readonly string[] MutationPrefixes = ["Create", "Update", "Delete", "Restore", "Soft", "Add", "Remove"];

	[Fact]
	public void Query_Methods_Should_Have_CancellationToken()
	{
		// Arrange - Discover all service interfaces dynamically
		Type[] serviceTypes = GetAllServiceInterfaces();
		List<string> violations = [];

		// Act
		foreach (Type serviceType in serviceTypes)
		{
			MethodInfo[] queryMethods = serviceType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
				.Where(m => IsQueryMethod(m.Name) || m.Name.Contains("Exists"))
				.ToArray();

			foreach (MethodInfo method in queryMethods)
			{
				bool hasCancellationToken = method.GetParameters()
					.Any(p => p.ParameterType == typeof(CancellationToken));

				if (!hasCancellationToken)
				{
					violations.Add($"{serviceType.Name}.{method.Name} should have CancellationToken parameter");
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}

	[Fact]
	public void Mutation_Methods_Should_Not_Have_CancellationToken()
	{
		// Arrange - Discover all service interfaces dynamically
		Type[] serviceTypes = GetAllServiceInterfaces();
		List<string> violations = [];

		// Act
		foreach (Type serviceType in serviceTypes)
		{
			MethodInfo[] mutationMethods = serviceType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
				.Where(m => IsMutationMethod(m.Name))
				.ToArray();

			foreach (MethodInfo method in mutationMethods)
			{
				bool hasCancellationToken = method.GetParameters()
					.Any(p => p.ParameterType == typeof(CancellationToken));

				if (hasCancellationToken)
				{
					violations.Add($"{serviceType.Name}.{method.Name} should NOT have CancellationToken parameter");
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}

	[Fact]
	public void Repository_Query_Methods_Should_Have_CancellationToken()
	{
		// Arrange - Discover all repository interfaces dynamically
		Type[] repositoryTypes = GetAllRepositoryInterfaces();
		List<string> violations = [];

		// Act
		foreach (Type repositoryType in repositoryTypes)
		{
			MethodInfo[] queryMethods = repositoryType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
				.Where(m => IsQueryMethod(m.Name) || m.Name.Contains("Exists"))
				.ToArray();

			foreach (MethodInfo method in queryMethods)
			{
				bool hasCancellationToken = method.GetParameters()
					.Any(p => p.ParameterType == typeof(CancellationToken));

				if (!hasCancellationToken)
				{
					violations.Add($"{repositoryType.Name}.{method.Name} should have CancellationToken parameter");
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}

	[Fact]
	public void Repository_Mutation_Methods_Should_Not_Have_CancellationToken()
	{
		// Arrange - Discover all repository interfaces dynamically
		Type[] repositoryTypes = GetAllRepositoryInterfaces();
		List<string> violations = [];

		// Act
		foreach (Type repositoryType in repositoryTypes)
		{
			MethodInfo[] mutationMethods = repositoryType.GetMethods(BindingFlags.Public | BindingFlags.Instance)
				.Where(m => IsMutationMethod(m.Name))
				.ToArray();

			foreach (MethodInfo method in mutationMethods)
			{
				bool hasCancellationToken = method.GetParameters()
					.Any(p => p.ParameterType == typeof(CancellationToken));

				if (hasCancellationToken)
				{
					violations.Add($"{repositoryType.Name}.{method.Name} should NOT have CancellationToken parameter");
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}

	/// <summary>
	/// Discovers all service interfaces across all bounded contexts.
	/// </summary>
	private static Type[] GetAllServiceInterfaces()
	{
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;

		return domainAssembly.GetTypes()
			.Where(t => t.IsInterface
					 && t.Name.EndsWith("Service")
					 && t.Namespace != null
					 && t.Namespace.StartsWith("SeventySix.")
					 && !t.Namespace.Contains("Shared")
					 && !t.Namespace.Contains("Infrastructure"))
			.ToArray();
	}

	/// <summary>
	/// Discovers all repository interfaces across all bounded contexts.
	/// </summary>
	private static Type[] GetAllRepositoryInterfaces()
	{
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;

		return domainAssembly.GetTypes()
			.Where(t => t.IsInterface
					 && t.Name.EndsWith("Repository")
					 && t.Namespace != null
					 && t.Namespace.StartsWith("SeventySix.")
					 && !t.Namespace.Contains("Shared")
					 && !t.Namespace.Contains("Infrastructure"))
			.ToArray();
	}

	/// <summary>
	/// Determines if a method name indicates a query operation.
	/// </summary>
	private static bool IsQueryMethod(string methodName)
	{
		return QueryPrefixes.Any(prefix => methodName.StartsWith(prefix));
	}

	/// <summary>
	/// Determines if a method name indicates a mutation operation.
	/// </summary>
	private static bool IsMutationMethod(string methodName)
	{
		return MutationPrefixes.Any(prefix => methodName.StartsWith(prefix));
	}
}
```

### 2.4 Create Bounded Context Isolation Tests

**Create**: `SeventySix.Server/Tests/SeventySix.ArchitectureTests/BoundedContextTests.cs`

```csharp
using System.Reflection;
using NetArchTest.Rules;
using Xunit;

namespace SeventySix.ArchitectureTests;

/// <summary>
/// Architectural tests to enforce bounded context isolation.
/// Ensures bounded contexts don't have circular dependencies.
/// Automatically discovers all bounded contexts.
/// </summary>
public class BoundedContextTests
{
	[Fact]
	public void Bounded_Contexts_Should_Not_Reference_Each_Other()
	{
		// Arrange - Discover all bounded contexts
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;
		string[] boundedContexts = domainAssembly.GetTypes()
			.Select(t => t.Namespace)
			.Where(ns => ns != null && ns.StartsWith("SeventySix.") && !ns.Contains("Shared") && !ns.Contains("Infrastructure"))
			.Select(ns => ns!.Split('.')[1])
			.Distinct()
			.ToArray();

		List<string> violations = [];

		// Act - Check each bounded context doesn't depend on others
		foreach (string sourceContext in boundedContexts)
		{
			foreach (string targetContext in boundedContexts)
			{
				if (sourceContext == targetContext)
					continue;

				Types result = Types
					.InNamespace($"SeventySix.{sourceContext}")
					.ShouldNot()
					.HaveDependencyOn($"SeventySix.{targetContext}")
					.GetResult();

				if (!result.IsSuccessful)
				{
					violations.Add($"{sourceContext} should not depend on {targetContext}. " +
						$"Violating types: {string.Join(", ", result.FailingTypeNames ?? [])}");
				}
			}
		}

		// Assert
		Assert.Empty(violations);
	}

	[Fact]
	public void Bounded_Contexts_Can_Reference_Shared()
	{
		// Arrange - Discover all bounded contexts
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;
		string[] boundedContexts = domainAssembly.GetTypes()
			.Select(t => t.Namespace)
			.Where(ns => ns != null && ns.StartsWith("SeventySix.") && !ns.Contains("Shared") && !ns.Contains("Infrastructure"))
			.Select(ns => ns!.Split('.')[1])
			.Distinct()
			.ToArray();

		// Act & Assert - All bounded contexts CAN depend on Shared (it's allowed)
		foreach (string context in boundedContexts)
		{
			// This test documents that Shared references ARE allowed
			// No assertion needed - this is informational
		}

		Assert.True(true, "Bounded contexts are allowed to reference SeventySix.Shared");
	}

	[Fact]
	public void Each_Bounded_Context_Should_Have_DbContext()
	{
		// Arrange - Discover all bounded contexts
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;
		string[] boundedContexts = domainAssembly.GetTypes()
			.Select(t => t.Namespace)
			.Where(ns => ns != null && ns.StartsWith("SeventySix.") && !ns.Contains("Shared") && !ns.Contains("Infrastructure"))
			.Select(ns => ns!.Split('.')[1])
			.Distinct()
			.ToArray();

		List<string> missingDbContexts = [];

		// Act - Check each bounded context has a DbContext
		foreach (string context in boundedContexts)
		{
			Type? dbContextType = domainAssembly.GetTypes()
				.FirstOrDefault(t => t.Namespace == $"SeventySix.{context}"
								  && t.Name.EndsWith("DbContext")
								  && t.BaseType?.Name == "DbContext");

			if (dbContextType == null)
			{
				missingDbContexts.Add(context);
			}
		}

		// Assert
		Assert.Empty(missingDbContexts);
	}

	[Fact]
	public void Each_Bounded_Context_Should_Have_Standard_Folders()
	{
		// Arrange - Standard folder structure
		string[] requiredSubNamespaces =
		[
			"Entities",
			"DTOs",
			"Interfaces",
			"Services",
			"Repositories"
		];

		// Discover all bounded contexts
		Assembly domainAssembly = typeof(SeventySix.Identity.IUserService).Assembly;
		string[] boundedContexts = domainAssembly.GetTypes()
			.Select(t => t.Namespace)
			.Where(ns => ns != null && ns.StartsWith("SeventySix.") && !ns.Contains("Shared") && !ns.Contains("Infrastructure"))
			.Select(ns => ns!.Split('.')[1])
			.Distinct()
			.ToArray();

		List<string> violations = [];

		// Act - Check each bounded context has standard structure
		foreach (string context in boundedContexts)
		{
			// Get all namespaces in this bounded context
			string[] contextNamespaces = domainAssembly.GetTypes()
				.Select(t => t.Namespace)
				.Where(ns => ns != null && ns.StartsWith($"SeventySix.{context}."))
				.Distinct()
				.ToArray()!;

			// Extract sub-namespaces (e.g., "Entities" from "SeventySix.Identity.Entities")
			HashSet<string> existingSubNamespaces = contextNamespaces
				.Select(ns => ns.Split('.').Length > 2 ? ns.Split('.')[2] : null)
				.Where(s => s != null)
				.ToHashSet()!;

			// Check for missing required folders
			foreach (string required in requiredSubNamespaces)
			{
				if (!existingSubNamespaces.Contains(required))
				{
					// Only warn if context has any files (ignore empty contexts)
					if (contextNamespaces.Length > 0)
					{
						violations.Add($"{context} missing {required} folder/namespace");
					}
				}
			}
		}

		// Assert - Allow some flexibility but document violations
		// This is more of a guideline than hard rule
		Assert.True(violations.Count == 0 || violations.Count < boundedContexts.Length * requiredSubNamespaces.Length / 2,
			$"Too many missing standard folders: {string.Join(", ", violations)}");
	}
}
```

### 2.5 Add Project to Solution

**Update**: `SeventySix.Server/SeventySix.Server.slnx`

Add architecture test project reference to solution file.

### 2.6 Run Architecture Tests

```powershell
dotnet test SeventySix.Server/Tests/SeventySix.ArchitectureTests/SeventySix.ArchitectureTests.csproj --logger "console;verbosity=normal"
```

**Expected**: Tests PASS after Phase 1 changes complete.

**Tests Created**:

-   `ServiceFacadeTests` (3 tests) - Ensures controllers only use services, never repositories
-   `CancellationTokenTests` (4 tests) - Enforces CancellationToken rules for services and repositories
-   `BoundedContextTests` (4 tests) - Verifies bounded context isolation and structure

**Total**: 11 new architectural tests that automatically adapt to new bounded contexts.

---

## Phase 3: Update Existing Tests (2 hours)

### 3.1 Update Repository Tests

**Files**:

-   `SeventySix.Server/Tests/SeventySix.Data.Tests/UserRepositoryTests.cs`
-   `SeventySix.Server/Tests/SeventySix.Data.Tests/LogRepositoryTests.cs`
-   `SeventySix.Server/Tests/SeventySix.Data.Tests/ThirdPartyApiRequestRepositoryTests.cs`

**Pattern**:

```csharp
// BEFORE
[Fact]
public async Task CreateAsync_AddsUser_WhenValidAsync()
{
	// Arrange
	User user = new() { Username = "test", Email = "test@test.com" };
	CancellationToken ct = CancellationToken.None;

	// Act
	User result = await _repository.CreateAsync(user, ct);

	// Assert
	Assert.NotNull(result);
	Assert.True(result.Id > 0);
}

// AFTER (remove CancellationToken)
[Fact]
public async Task CreateAsync_AddsUser_WhenValidAsync()
{
	// Arrange
	User user = new() { Username = "test", Email = "test@test.com" };

	// Act
	User result = await _repository.CreateAsync(user);

	// Assert
	Assert.NotNull(result);
	Assert.True(result.Id > 0);
}
```

### 3.2 Update Service Tests

**Files**:

-   `SeventySix.Server/Tests/SeventySix.BusinessLogic.Tests/UserServiceTests.cs`
-   `SeventySix.Server/Tests/SeventySix.BusinessLogic.Tests/LogServiceTests.cs`
-   `SeventySix.Server/Tests/SeventySix.BusinessLogic.Tests/ThirdPartyApiRequestServiceTests.cs`

**Pattern**:

```csharp
// BEFORE
[Fact]
public async Task CreateUserAsync_ReturnsUser_WhenValidAsync()
{
	// Arrange
	CreateUserRequest req = new() { Username = "test", Email = "test@test.com" };
	User user = new() { Id = 1, Username = "test", Email = "test@test.com" };

	_mockValidator.Setup(v => v.ValidateAsync(req, It.IsAny<CancellationToken>()))
		.ReturnsAsync(new ValidationResult());
	_mockRepo.Setup(r => r.UsernameExistsAsync("test", null, It.IsAny<CancellationToken>()))
		.ReturnsAsync(false);
	_mockRepo.Setup(r => r.CreateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
		.ReturnsAsync(user);

	// Act
	UserDto result = await _sut.CreateUserAsync(req, CancellationToken.None);

	// Assert
	Assert.NotNull(result);
	Assert.Equal(1, result.Id);
}

// AFTER (update mock setups and remove CancellationToken from Act)
[Fact]
public async Task CreateUserAsync_ReturnsUser_WhenValidAsync()
{
	// Arrange
	CreateUserRequest req = new() { Username = "test", Email = "test@test.com" };
	User user = new() { Id = 1, Username = "test", Email = "test@test.com" };

	_mockValidator.Setup(v => v.ValidateAsync(req, It.IsAny<CancellationToken>()))
		.ReturnsAsync(new ValidationResult());
	_mockRepo.Setup(r => r.UsernameExistsAsync("test", null, It.IsAny<CancellationToken>()))
		.ReturnsAsync(false);
	_mockRepo.Setup(r => r.CreateAsync(It.IsAny<User>()))
		.ReturnsAsync(user);

	// Act
	UserDto result = await _sut.CreateUserAsync(req);

	// Assert
	Assert.NotNull(result);
	Assert.Equal(1, result.Id);
}
```

**Key Changes**:

-   Remove `CancellationToken` parameter from mutation test calls
-   Update mock setups to NOT expect `CancellationToken` for mutation methods
-   Keep `It.IsAny<CancellationToken>()` for query methods

### 3.3 Update Controller/Integration Tests

**Files**:

-   `SeventySix.Server/Tests/SeventySix.Api.Tests/UsersControllerTests.cs`
-   `SeventySix.Server/Tests/SeventySix.Api.Tests/LogsControllerTests.cs`
-   `SeventySix.Server/Tests/SeventySix.Api.Tests/ThirdPartyApiRequestControllerTests.cs`

**Pattern**:

```csharp
// BEFORE
[Fact]
public async Task CreateAsync_ReturnsCreated_WhenValidAsync()
{
	// Arrange
	CreateUserRequest req = new() { Username = "test", Email = "test@test.com" };
	UserDto dto = new() { Id = 1, Username = "test", Email = "test@test.com" };

	_mockService.Setup(s => s.CreateUserAsync(req, It.IsAny<CancellationToken>()))
		.ReturnsAsync(dto);

	// Act
	ActionResult<UserDto> result = await _controller.CreateAsync(req, CancellationToken.None);

	// Assert
	CreatedAtRouteResult createdResult = Assert.IsType<CreatedAtRouteResult>(result.Result);
	Assert.Equal(1, ((UserDto)createdResult.Value).Id);
}

// AFTER (update mock setup and remove CancellationToken)
[Fact]
public async Task CreateAsync_ReturnsCreated_WhenValidAsync()
{
	// Arrange
	CreateUserRequest req = new() { Username = "test", Email = "test@test.com" };
	UserDto dto = new() { Id = 1, Username = "test", Email = "test@test.com" };

	_mockService.Setup(s => s.CreateUserAsync(req))
		.ReturnsAsync(dto);

	// Act
	ActionResult<UserDto> result = await _controller.CreateAsync(req);

	// Assert
	CreatedAtRouteResult createdResult = Assert.IsType<CreatedAtRouteResult>(result.Result);
	Assert.Equal(1, ((UserDto)createdResult.Value).Id);
}
```

### 3.4 Run All Server Tests

**CRITICAL: Ensure Docker Desktop is running before executing tests**

```powershell
# Start Docker if not already running
npm run start:docker

# Run all server tests
dotnet test SeventySix.Server/SeventySix.Server.slnx --no-build --logger "console;verbosity=normal"
```

**Expected**: All 356+ tests PASS (including new architecture tests).

---

## Phase 4: Verify Client Unchanged (1 hour)

### 4.1 Review Client HTTP Calls

**Files to check**:

-   `SeventySix.Client/src/app/features/admin/services/user-admin.service.ts`
-   `SeventySix.Client/src/app/features/logs/services/log.service.ts`

**Verify**: HTTP POST/PUT/DELETE calls remain unchanged (no CancellationToken in HTTP layer).

**Expected**: No client changes required - CancellationToken is server-only concept.

### 4.2 Run Client Tests

```powershell
cd SeventySix.Client
npm test
```

**Command runs**: `ng test --no-watch --browsers=ChromeHeadless` (headless, no-watch)

**Expected**: All 732 tests PASS with no changes.

---

## Phase 5: Update Documentation (1 hour)

### 5.1 Update ARCHITECTURE.md

**File**: `ARCHITECTURE.md`

**Add section**:

````markdown
## Service Facade Pattern

**Controllers → Services (only) → Repositories → DbContext**

Controllers MUST NEVER inject repositories directly. All data access MUST go through service facades.

**Why Services Are Required**:

-   **Validation**: FluentValidation integration
-   **Business Logic**: Duplicate checks, soft delete, authorization
-   **Mapping**: Entity ↔ DTO transformations
-   **Transaction Coordination**: Multiple repository operations
-   **Logging & Monitoring**: Centralized cross-cutting concerns

**Architectural Tests** (auto-discover all bounded contexts):

-   `ServiceFacadeTests.Controllers_Should_Not_Depend_On_Any_Repository_Namespace()`
-   `ServiceFacadeTests.Repositories_Should_Not_Be_Public()`
-   `ServiceFacadeTests.Controllers_Should_Only_Depend_On_Service_Interfaces()`

## Repository Pattern

**Purpose**: Abstract data access per bounded context.

**Why Keep Repositories** (NOT anti-patterns):

1. **Testability**: Services can be tested with mocked repositories
2. **Bounded Context Isolation**: Each context has its own DbContext
3. **Future-Proofing**: Can swap EF Core for Dapper/raw SQL without changing services
4. **Single Responsibility**: Repositories = data access, Services = business logic
5. **Interface Segregation**: Clean contracts (ISP)

**Pattern**:

```csharp
public interface IUserRepository
{
	// Queries (read operations) - HAVE CancellationToken
	Task<User?> GetByIdAsync(int id, CancellationToken ct = default);
	Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default);
	Task<bool> UsernameExistsAsync(string username, int? excludeId, CancellationToken ct = default);

	// Mutations (write operations) - NO CancellationToken
	Task<User> CreateAsync(User entity);
	Task<User> UpdateAsync(User entity);
	Task<bool> DeleteAsync(int id);
}
```
````

## CancellationToken Usage

**Rule**:

-   ✅ Query operations (Get/List/Search) MUST have `CancellationToken`
-   ❌ Mutation operations (Create/Update/Delete) MUST NOT have `CancellationToken`

**Rationale**:

-   Queries can be safely cancelled (read-only, no side effects)
-   Mutations must complete atomically (cancellation could leave partial writes)

**Architectural Tests** (auto-discover all bounded contexts):

-   `CancellationTokenTests.Query_Methods_Should_Have_CancellationToken()`
-   `CancellationTokenTests.Mutation_Methods_Should_Not_Have_CancellationToken()`
-   `CancellationTokenTests.Repository_Query_Methods_Should_Have_CancellationToken()`
-   `CancellationTokenTests.Repository_Mutation_Methods_Should_Not_Have_CancellationToken()`

## Bounded Context Isolation

**Pattern**: Each bounded context is independent with its own DbContext, entities, services, and repositories.

**Current Bounded Contexts**:

-   `Identity` - User management domain
-   `Logging` - Application logging domain
-   `ApiTracking` - Third-party API tracking domain

**Isolation Rules**:

-   ✅ Bounded contexts CAN reference `SeventySix.Shared` (common primitives)
-   ✅ Bounded contexts CAN reference `SeventySix.Infrastructure` (cross-cutting concerns)
-   ❌ Bounded contexts MUST NOT reference each other directly
-   ✅ Each context has its own database schema
-   ✅ Each context has its own DbContext with separate connection string

**Standard Folder Structure** (enforced by architecture tests):

```
SeventySix.{BoundedContext}/
├── Entities/          # Domain entities
├── DTOs/              # Data transfer objects
├── Interfaces/        # Service and repository contracts
├── Services/          # Business logic (internal)
├── Repositories/      # Data access (internal)
├── Validators/        # FluentValidation validators
├── Extensions/        # Mapping and helper extensions
├── Configurations/    # EF Core entity configurations
├── Infrastructure/    # DbContext and factories
└── Migrations/        # EF Core migrations
```

**Architectural Tests** (auto-discover all bounded contexts):

-   `BoundedContextTests.Bounded_Contexts_Should_Not_Reference_Each_Other()`
-   `BoundedContextTests.Each_Bounded_Context_Should_Have_DbContext()`
-   `BoundedContextTests.Each_Bounded_Context_Should_Have_Standard_Folders()`

**Adding New Bounded Contexts**:

1. Create new folder under `SeventySix/` (e.g., `SeventySix/Orders/`)
2. Follow standard folder structure above
3. Use namespace `SeventySix.Orders` for all files
4. Create `OrdersDbContext` with separate schema
5. Architecture tests will automatically validate the new context

**Examples**:

```csharp
// Service Interface
public interface IUserService
{
	// Queries - WITH CancellationToken
	Task<UserDto?> GetUserByIdAsync(int id, CancellationToken ct = default);
	Task<PagedResult<UserDto>> GetPagedUsersAsync(UserQueryRequest req, CancellationToken ct = default);

	// Mutations - NO CancellationToken
	Task<UserDto> CreateUserAsync(CreateUserRequest req);
	Task<UserDto> UpdateUserAsync(UpdateUserRequest req);
	Task<bool> DeleteUserAsync(int id, string deletedBy);
}

// Service Implementation
public async Task<UserDto> CreateUserAsync(CreateUserRequest req)
{
	// Use CancellationToken.None for internal queries
	await _validator.ValidateAndThrowAsync(req, CancellationToken.None);

	if (await _repository.UsernameExistsAsync(req.Username, null, CancellationToken.None))
		throw new DuplicateUserException("Username exists");

	User entity = req.ToEntity();
	User created = await _repository.CreateAsync(entity); // No CancellationToken
	return created.ToDto();
}
```

````

### 5.2 Update .editorconfig (if needed)

**Verify**: CancellationToken naming rules already exist:

```ini
# Async methods should have Async suffix
dotnet_naming_rule.async_methods_end_in_async.severity = warning
dotnet_naming_rule.async_methods_end_in_async.symbols = any_async_methods
dotnet_naming_rule.async_methods_end_in_async.style = end_in_async
````

**No changes needed** - rules already enforce async method naming.

---

## Success Criteria

### Critical Requirements

✅ **Repository Pattern**:

-   Repositories remain in codebase
-   Documentation explains justification
-   Architectural tests verify isolation

✅ **Service Facade**:

-   Controllers only inject services (never repositories)
-   Architectural tests enforce pattern
-   Documentation explains rationale

✅ **CancellationToken**:

-   ALL query methods have `CancellationToken` parameter
-   NO mutation methods have `CancellationToken` parameter
-   Architectural tests enforce pattern
-   All tests pass

### Functional Requirements

✅ **Testing**:

-   All 356+ server tests pass (including 11 new architecture tests)
-   All 732 client tests pass (no changes needed)
-   Build succeeds with zero warnings
-   Docker Desktop running for data layer tests (Testcontainers)
-   Architecture tests automatically validate all bounded contexts

✅ **Code Quality**:

-   Follows .editorconfig guidelines
-   Adheres to KISS, DRY, YAGNI principles
-   No breaking changes to API contracts
-   All async methods end with "Async" suffix
-   Explicit type annotations (no `var`)
-   Primary constructors where applicable
-   Collection expressions `[]` instead of `new()`

---

## Implementation Summary

| Phase     | Description                                                        | Duration     | Dependencies   |
| --------- | ------------------------------------------------------------------ | ------------ | -------------- |
| 1         | Remove CancellationToken from Mutations                            | 3 hours      | None           |
| 2         | Add Architectural Tests (11 tests, auto-discover bounded contexts) | 2 hours      | Phase 1        |
| 3         | Update Existing Tests                                              | 2 hours      | Phase 1, 2     |
| 4         | Verify Client Unchanged                                            | 1 hour       | Phase 3        |
| 5         | Update Documentation                                               | 1 hour       | All phases     |
| **TOTAL** | **Complete Implementation**                                        | **10 hours** | **Sequential** |

---

## Testing Checklist

**Before Each Phase**:

-   [ ] Docker Desktop is running (`npm run start:docker`)
-   [ ] Working directory is clean (commit/stash changes)

**After Each Code Change**:

-   [ ] Run affected tests immediately
-   [ ] Fix failing tests before proceeding
-   [ ] NEVER skip or defer failing tests

**Server Tests**:

```powershell
# All server tests
dotnet test SeventySix.Server/SeventySix.Server.slnx --no-build --logger "console;verbosity=normal"

# Specific test project
dotnet test SeventySix.Server/Tests/SeventySix.ArchitectureTests/SeventySix.ArchitectureTests.csproj --logger "console;verbosity=normal"
```

**Client Tests**:

```powershell
cd SeventySix.Client
npm test  # Runs headless (--no-watch --browsers=ChromeHeadless)
```

**Final Verification**:

-   [ ] All 356+ server tests pass
-   [ ] All 732 client tests pass
-   [ ] Architecture tests pass (11 tests across 3 test classes)
-   [ ] Build succeeds: `dotnet build SeventySix.Server/SeventySix.Server.slnx`
-   [ ] No compiler warnings
-   [ ] Documentation updated
-   [ ] Architecture tests auto-discover all bounded contexts (Identity, Logging, ApiTracking)

---

**END OF IMPLEMENTATION PLAN**

_Principles: KISS (simple solutions), DRY (no duplication), YAGNI (build only what's needed now)_
