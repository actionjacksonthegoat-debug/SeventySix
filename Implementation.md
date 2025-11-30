# Permission Request Feature - Implementation Plan

> **Created**: November 2025
> **Status**: Ready for TDD Execution
> **Principles**: KISS, DRY, YAGNI
> **Testing**: TDD with 80/20 rule - focus on high-value tests
> **Logging**: Warnings and Errors ONLY - no Debug/Information level

---

## Overview

Enable users to request elevated permissions (Developer, Admin roles) from their profile page. Requests are stored and displayed in an admin management page for future approval workflows.

### User Flow

1. User logs in → navigates to Profile
2. Profile shows "Request Permissions" link
3. Opens page with dynamically loaded available roles
4. User selects roles (at least one) + optional message
5. Submit stores request in `PermissionRequest` table
6. Admins view requests at `/admin/permission-requests`

---

## TDD Execution Order

> Write tests FIRST, then implement. Each step is atomic.

### Server-Side TDD Order

1. **Entity + Configuration** → No tests needed (EF verified via integration)
2. **Service Tests** → Write `PermissionRequestServiceTests` first
3. **Service Implementation** → Make tests pass
4. **Integration Tests** → Controller endpoint tests (80/20: happy path + auth)

### Client-Side TDD Order

1. **Models** → No tests (interfaces only)
2. **Component Tests** → Write spec files first
3. **Components** → Make tests pass

---

## Phase 1: Server-Side Implementation

### 1.1 Entity: `PermissionRequest`

**File**: `SeventySix.Server/SeventySix/Identity/Entities/PermissionRequest.cs`

```csharp
// <copyright file="PermissionRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>Represents a user's request for elevated permissions.</summary>
public class PermissionRequest : ICreatableEntity
{
	/// <summary>Gets or sets the unique identifier.</summary>
	public int Id { get; set; }

	/// <summary>Gets or sets the requesting user's ID.</summary>
	public int UserId { get; set; }

	/// <summary>Gets or sets the requested role name.</summary>
	public string RequestedRole { get; set; } = string.Empty;

	/// <summary>Gets or sets the optional request message.</summary>
	public string? RequestMessage { get; set; }

	/// <summary>Gets or sets who created this request (username).</summary>
	public string CreatedBy { get; set; } = string.Empty;

	/// <summary>Gets or sets the creation timestamp.</summary>
	public DateTime CreateDate { get; set; }
}
```

**Design Decisions**:

-   Implements `ICreatableEntity` for automatic `CreateDate` via `AuditInterceptor`
-   **One row per role** (normalized) - supports multiple role requests via multiple rows
-   `CreatedBy` stores username (same pattern as `IAuditableEntity` but without modify tracking)
-   `RequestedRole` is a string matching existing `UserRole.Role` pattern ("Admin", "Developer")
-   FK to `User` table via `UserId`

### 1.2 Entity Configuration

**File**: `SeventySix.Server/SeventySix/Identity/Configurations/PermissionRequestConfiguration.cs`

```csharp
// <copyright file="PermissionRequestConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>EF Core configuration for <see cref="PermissionRequest"/> entity.</summary>
public class PermissionRequestConfiguration : IEntityTypeConfiguration<PermissionRequest>
{
	/// <inheritdoc/>
	public void Configure(EntityTypeBuilder<PermissionRequest> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("PermissionRequests");
		builder.HasKey(request => request.Id);

		builder
			.Property(request => request.Id)
			.UseIdentityColumn()
			.IsRequired();

		builder
			.Property(request => request.UserId)
			.IsRequired();

		builder
			.Property(request => request.RequestedRole)
			.IsRequired()
			.HasMaxLength(50);

		builder
			.Property(request => request.RequestMessage)
			.HasMaxLength(500);

		builder
			.Property(request => request.CreatedBy)
			.IsRequired()
			.HasMaxLength(50);

		builder
			.Property(request => request.CreateDate)
			.IsRequired()
			.HasColumnType("timestamp with time zone");

		// Composite unique: one pending request per user per role
		builder
			.HasIndex(request => new { request.UserId, request.RequestedRole })
			.IsUnique()
			.HasDatabaseName("IX_PermissionRequests_UserId_Role");

		// FK to User - cascade delete when user is deleted
		builder
			.HasOne<User>()
			.WithMany()
			.HasForeignKey(request => request.UserId)
			.OnDelete(DeleteBehavior.Cascade);
	}
}
```

### 1.3 Update IdentityDbContext

**File**: `SeventySix.Server/SeventySix/Identity/Infrastructure/IdentityDbContext.cs`

Add DbSet:

```csharp
public DbSet<PermissionRequest> PermissionRequests => Set<PermissionRequest>();
```

### 1.4 DTOs

**File**: `SeventySix.Server/SeventySix/Identity/DTOs/PermissionRequestDto.cs`

```csharp
// <copyright file="PermissionRequestDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Read DTO for permission requests.</summary>
public record PermissionRequestDto(
	int Id,
	int UserId,
	string Username,
	string RequestedRole,
	string? RequestMessage,
	string CreatedBy,
	DateTime CreateDate);
```

**File**: `SeventySix.Server/SeventySix/Identity/DTOs/CreatePermissionRequestDto.cs`

```csharp
// <copyright file="CreatePermissionRequestDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Request DTO for creating permission requests.</summary>
public record CreatePermissionRequestDto(
	IReadOnlyList<string> RequestedRoles,
	string? RequestMessage = null);
```

**File**: `SeventySix.Server/SeventySix/Identity/DTOs/AvailableRoleDto.cs`

```csharp
// <copyright file="AvailableRoleDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>DTO for available requestable roles.</summary>
public record AvailableRoleDto(
	string Name,
	string Description);
```

### 1.5 Extension Methods

**File**: `SeventySix.Server/SeventySix/Identity/Extensions/PermissionRequestExtensions.cs`

> **KISS Decision**: Skip complex projection expression - direct mapping in repository is simpler and equally performant for this use case.

```csharp
// <copyright file="PermissionRequestExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Extension methods for <see cref="PermissionRequest"/>.</summary>
public static class PermissionRequestExtensions
{
	/// <summary>Maps entity to DTO.</summary>
	/// <param name="request">The permission request entity.</param>
	/// <param name="username">The username of the requester.</param>
	/// <returns>The mapped DTO.</returns>
	public static PermissionRequestDto ToDto(
		this PermissionRequest request,
		string username)
	{
		return new PermissionRequestDto(
			request.Id,
			request.UserId,
			username,
			request.RequestedRole,
			request.RequestMessage,
			request.CreatedBy,
			request.CreateDate);
	}
}
```

### 1.6 Repository

**File**: `SeventySix.Server/SeventySix/Identity/Interfaces/IPermissionRequestRepository.cs`

```csharp
// <copyright file="IPermissionRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Repository interface for permission request data access.</summary>
public interface IPermissionRequestRepository
{
	/// <summary>Gets all permission requests with user info.</summary>
	Task<IEnumerable<PermissionRequestDto>> GetAllAsync(CancellationToken cancellationToken = default);

	/// <summary>Gets permission requests for a specific user.</summary>
	Task<IEnumerable<PermissionRequest>> GetByUserIdAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Gets existing roles the user already has (from UserRoles).</summary>
	/// <remarks>Used to hide roles user already has from available roles list.</remarks>
	Task<IEnumerable<string>> GetUserExistingRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates a new permission request.</summary>
	Task CreateAsync(
		PermissionRequest request,
		CancellationToken cancellationToken = default);
}
```

> **DRY/YAGNI Decision**: Removed `ExistsAsync` and `DeleteAsync` - not needed for MVP. Add when approval workflow is implemented.

**File**: `SeventySix.Server/SeventySix/Identity/Repositories/PermissionRequestRepository.cs`

```csharp
// <copyright file="PermissionRequestRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.Identity;

/// <summary>EF Core implementation for permission request data access.</summary>
internal class PermissionRequestRepository(
	IdentityDbContext context,
	ILogger<PermissionRequestRepository> logger)
	: BaseRepository<PermissionRequest, IdentityDbContext>(context, logger), IPermissionRequestRepository
{
	/// <inheritdoc/>
	protected override string GetEntityIdentifier(PermissionRequest entity) =>
		$"Id={entity.Id}, UserId={entity.UserId}, Role={entity.RequestedRole}";

	/// <inheritdoc/>
	public async Task<IEnumerable<PermissionRequestDto>> GetAllAsync(
		CancellationToken cancellationToken = default)
	{
		return await context.PermissionRequests
			.AsNoTracking()
			.Join(
				context.Users,
				request => request.UserId,
				user => user.Id,
				(request, user) => new PermissionRequestDto(
					request.Id,
					request.UserId,
					user.Username,
					request.RequestedRole,
					request.RequestMessage,
					request.CreatedBy,
					request.CreateDate))
			.OrderByDescending(request => request.CreateDate)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<PermissionRequest>> GetByUserIdAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		return await GetQueryable()
			.Where(request => request.UserId == userId)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<string>> GetUserExistingRolesAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		return await context.UserRoles
			.AsNoTracking()
			.Where(userRole => userRole.UserId == userId)
			.Select(userRole => userRole.Role)
			.ToListAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task CreateAsync(
		PermissionRequest request,
		CancellationToken cancellationToken = default)
	{
		await ExecuteWithErrorHandlingAsync(
			async () =>
			{
				context.PermissionRequests.Add(request);
				await context.SaveChangesAsync(cancellationToken);
				return request;
			},
			"Create",
			GetEntityIdentifier(request));
	}
}
```

### 1.7 Service

**File**: `SeventySix.Server/SeventySix/Identity/Interfaces/IPermissionRequestService.cs`

```csharp
// <copyright file="IPermissionRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Service interface for permission request operations.</summary>
public interface IPermissionRequestService
{
	/// <summary>Gets all permission requests (admin only).</summary>
	Task<IEnumerable<PermissionRequestDto>> GetAllRequestsAsync(
		CancellationToken cancellationToken = default);

	/// <summary>Gets roles available for the user to request.</summary>
	Task<IEnumerable<AvailableRoleDto>> GetAvailableRolesAsync(
		int userId,
		CancellationToken cancellationToken = default);

	/// <summary>Creates permission requests for the specified roles.</summary>
	Task CreateRequestsAsync(
		int userId,
		string username,
		CreatePermissionRequestDto request,
		CancellationToken cancellationToken = default);
}
```

**File**: `SeventySix.Server/SeventySix/Identity/Services/PermissionRequestService.cs`

```csharp
// <copyright file="PermissionRequestService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>Service for permission request business logic.</summary>
internal class PermissionRequestService(
	IPermissionRequestRepository repository) : IPermissionRequestService
{
	/// <summary>All requestable roles in the system.</summary>
	/// <remarks>
	/// KISS: Hardcoded list is simpler than database/config management.
	/// Easy to extend when new roles are added to the system.
	/// </remarks>
	private static readonly IReadOnlyList<AvailableRoleDto> AllRequestableRoles =
	[
		new AvailableRoleDto(
			"Developer",
			"Access to developer tools and APIs"),
		new AvailableRoleDto(
			"Admin",
			"Full administrative access")
	];

	private static readonly HashSet<string> ValidRoleNames =
		AllRequestableRoles
			.Select(role => role.Name)
			.ToHashSet(StringComparer.OrdinalIgnoreCase);

	/// <inheritdoc/>
	public async Task<IEnumerable<PermissionRequestDto>> GetAllRequestsAsync(
		CancellationToken cancellationToken = default)
	{
		return await repository.GetAllAsync(cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<AvailableRoleDto>> GetAvailableRolesAsync(
		int userId,
		CancellationToken cancellationToken = default)
	{
		// Get roles user already has (from UserRoles table)
		IEnumerable<string> existingRoles =
			await repository.GetUserExistingRolesAsync(
				userId,
				cancellationToken);

		// Get pending permission requests
		IEnumerable<PermissionRequest> pendingRequests =
			await repository.GetByUserIdAsync(
				userId,
				cancellationToken);

		// Combine: exclude roles user already has AND already requested
		HashSet<string> excludedRoles =
			existingRoles
				.Concat(pendingRequests.Select(request => request.RequestedRole))
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

		return AllRequestableRoles
			.Where(role => !excludedRoles.Contains(role.Name))
			.ToList();
	}

	/// <inheritdoc/>
	public async Task CreateRequestsAsync(
		int userId,
		string username,
		CreatePermissionRequestDto request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		if (request.RequestedRoles.Count == 0)
		{
			throw new ArgumentException(
				"At least one role must be selected.",
				nameof(request));
		}

		// Get existing roles and pending requests to skip duplicates (idempotent)
		IEnumerable<string> existingRoles =
			await repository.GetUserExistingRolesAsync(
				userId,
				cancellationToken);

		IEnumerable<PermissionRequest> pendingRequests =
			await repository.GetByUserIdAsync(
				userId,
				cancellationToken);

		HashSet<string> alreadyHasOrRequested =
			existingRoles
				.Concat(pendingRequests.Select(request => request.RequestedRole))
				.ToHashSet(StringComparer.OrdinalIgnoreCase);

		foreach (string role in request.RequestedRoles)
		{
			if (!ValidRoleNames.Contains(role))
			{
				throw new ArgumentException(
					$"Invalid role: {role}",
					nameof(request));
			}

			// Skip if user already has role or has pending request (idempotent)
			if (alreadyHasOrRequested.Contains(role))
			{
				continue;
			}

			PermissionRequest entity =
				new()
				{
					UserId = userId,
					RequestedRole = role,
					RequestMessage = request.RequestMessage,
					CreatedBy = username
				};

			await repository.CreateAsync(
				entity,
				cancellationToken);
		}
	}
}
```

### 1.8 Validator

**File**: `SeventySix.Server/SeventySix/Identity/Validators/CreatePermissionRequestValidator.cs`

```csharp
// <copyright file="CreatePermissionRequestValidator.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;

namespace SeventySix.Identity;

/// <summary>Validator for <see cref="CreatePermissionRequestDto"/>.</summary>
public class CreatePermissionRequestValidator : AbstractValidator<CreatePermissionRequestDto>
{
	/// <summary>Initializes a new instance of the validator.</summary>
	public CreatePermissionRequestValidator()
	{
		RuleFor(x => x.RequestedRoles)
			.NotEmpty()
			.WithMessage("At least one role must be selected.");

		RuleFor(x => x.RequestMessage)
			.MaximumLength(500)
			.WithMessage("Message cannot exceed 500 characters.");
	}
}
```

### 1.9 Controller Endpoints

**File**: `SeventySix.Server/SeventySix.Api/Controllers/V1/UsersController.cs`

**Step 1**: Add private helper methods (copy pattern from AuthController):

```csharp
/// <summary>Gets the current user ID from claims.</summary>
private int GetCurrentUserId()
{
	string? userIdClaim =
		User.FindFirstValue(ClaimTypes.NameIdentifier);

	return int.TryParse(userIdClaim, out int userId)
		? userId
		: throw new UnauthorizedAccessException("User ID not found in claims.");
}

/// <summary>Gets the current username from claims.</summary>
private string GetCurrentUsername()
{
	return User.FindFirstValue(ClaimTypes.Name)
		?? throw new UnauthorizedAccessException("Username not found in claims.");
}
```

**Step 2**: Add `IPermissionRequestService` to constructor:

```csharp
public class UsersController(
	IUserService userService,
	IAuthService authService,
	IPermissionRequestService permissionRequestService,  // Add this
	ILogger<UsersController> logger) : ControllerBase
```

**Step 3**: Add endpoints:

```csharp
/// <summary>Gets available roles for permission requests.</summary>
/// <param name="cancellationToken">Cancellation token.</param>
/// <returns>List of available roles.</returns>
[HttpGet("me/available-roles")]
[Authorize]
[ProducesResponseType(typeof(IEnumerable<AvailableRoleDto>), StatusCodes.Status200OK)]
public async Task<ActionResult<IEnumerable<AvailableRoleDto>>> GetAvailableRolesAsync(
	CancellationToken cancellationToken)
{
	int userId =
		GetCurrentUserId();
	IEnumerable<AvailableRoleDto> roles =
		await permissionRequestService.GetAvailableRolesAsync(
			userId,
			cancellationToken);
	return Ok(roles);
}

/// <summary>Creates permission requests for current user.</summary>
/// <param name="request">The request containing roles and message.</param>
/// <param name="cancellationToken">Cancellation token.</param>
/// <returns>Created result.</returns>
[HttpPost("me/permission-requests")]
[Authorize]
[ProducesResponseType(StatusCodes.Status201Created)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
public async Task<ActionResult> CreatePermissionRequestsAsync(
	[FromBody] CreatePermissionRequestDto request,
	CancellationToken cancellationToken)
{
	int userId =
		GetCurrentUserId();
	string username =
		GetCurrentUsername();
	await permissionRequestService.CreateRequestsAsync(
		userId,
		username,
		request,
		cancellationToken);
	return Created();
}

/// <summary>Gets all permission requests (admin only).</summary>
/// <param name="cancellationToken">Cancellation token.</param>
/// <returns>List of all permission requests.</returns>
[HttpGet("permission-requests")]
[Authorize(Policy = "AdminOnly")]
[ProducesResponseType(typeof(IEnumerable<PermissionRequestDto>), StatusCodes.Status200OK)]
public async Task<ActionResult<IEnumerable<PermissionRequestDto>>> GetAllPermissionRequestsAsync(
	CancellationToken cancellationToken)
{
	IEnumerable<PermissionRequestDto> requests =
		await permissionRequestService.GetAllRequestsAsync(cancellationToken);
	return Ok(requests);
}
```

> **Note**: Add `using System.Security.Claims;` to imports.
> {

    int userId = GetCurrentUserId();
    string username = GetCurrentUsername();
    await permissionRequestService.CreateRequestsAsync(userId, username, request, cancellationToken);
    return Created();

}

/// <summary>Gets all permission requests (admin only).</summary>
[HttpGet("permission-requests")]
[Authorize(Policy = "AdminOnly")]
[ProducesResponseType(typeof(IEnumerable<PermissionRequestDto>), StatusCodes.Status200OK)]
public async Task<ActionResult<IEnumerable<PermissionRequestDto>>> GetAllPermissionRequestsAsync(
CancellationToken cancellationToken)
{
IEnumerable<PermissionRequestDto> requests =
await permissionRequestService.GetAllRequestsAsync(cancellationToken);
return Ok(requests);
}

````

### 1.10 DI Registration

**File**: `SeventySix.Server/SeventySix/Identity/Extensions/IdentityServiceExtensions.cs`

Add to existing registration:
```csharp
services.AddScoped<IPermissionRequestRepository, PermissionRequestRepository>();
services.AddScoped<IPermissionRequestService, PermissionRequestService>();
````

### 1.11 Migration

Run after entity/config creation:

```powershell
cd SeventySix.Server/SeventySix.Api
dotnet ef migrations add AddPermissionRequests --context IdentityDbContext --project ../SeventySix
dotnet ef database update --context IdentityDbContext
```

### 1.12 Update TestTables Constant

**File**: `SeventySix.Server/Tests/SeventySix.TestUtilities/Constants/TestTables.cs`

Add to `All` array:

```csharp
"\"Identity\".\"PermissionRequests\"",
```

---

## Phase 2: Client-Side Implementation

### 2.1 Models

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/models/permission-request.model.ts`

```typescript
/** Permission request from API. Matches backend PermissionRequestDto. */
export interface PermissionRequest {
	id: number;
	userId: number;
	username: string;
	requestedRole: string;
	requestMessage?: string;
	createdBy: string;
	createDate: string;
}

/** Available role for request. Matches backend AvailableRoleDto. */
export interface AvailableRole {
	name: string;
	description: string;
}

/** Create permission request DTO. Matches backend CreatePermissionRequestDto. */
export interface CreatePermissionRequestDto {
	requestedRoles: string[];
	requestMessage?: string;
}
```

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/models/index.ts`

```typescript
export * from "./permission-request.model";
```

### 2.2 Repository

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/repositories/permission-request.repository.ts`

```typescript
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import { PermissionRequest, AvailableRole, CreatePermissionRequestDto } from "@admin/permission-requests/models";

/**
 * Repository for permission request API operations.
 * Provided at route level for proper garbage collection.
 */
@Injectable()
export class PermissionRequestRepository {
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "users";

	/** Gets all permission requests (admin only). */
	getAll(): Observable<PermissionRequest[]> {
		return this.apiService.get<PermissionRequest[]>(`${this.endpoint}/permission-requests`);
	}

	/** Gets available roles for current user. */
	getAvailableRoles(): Observable<AvailableRole[]> {
		return this.apiService.get<AvailableRole[]>(`${this.endpoint}/me/available-roles`);
	}

	/** Creates permission requests. */
	create(request: CreatePermissionRequestDto): Observable<void> {
		return this.apiService.post<void, CreatePermissionRequestDto>(`${this.endpoint}/me/permission-requests`, request);
	}
}
```

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/repositories/index.ts`

```typescript
export { PermissionRequestRepository } from "./permission-request.repository";
```

### 2.3 Service

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/services/permission-request.service.ts`

```typescript
import { inject, Injectable } from "@angular/core";
import { injectQuery, injectMutation, QueryClient } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { PermissionRequestRepository } from "@admin/permission-requests/repositories";
import { CreatePermissionRequestDto } from "@admin/permission-requests/models";
import { getQueryConfig } from "@infrastructure/utils/query-config";

/**
 * Service for permission request business logic.
 * Uses TanStack Query for caching and state management.
 * Provided at route level for proper garbage collection.
 */
@Injectable()
export class PermissionRequestService {
	private readonly repository: PermissionRequestRepository = inject(PermissionRequestRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> = getQueryConfig("permission-requests");

	/** Query for all permission requests (admin). */
	getAllRequests() {
		return injectQuery(() => ({
			queryKey: ["permission-requests", "all"],
			queryFn: () => lastValueFrom(this.repository.getAll()),
			...this.queryConfig,
		}));
	}

	/** Query for available roles (current user). */
	getAvailableRoles() {
		return injectQuery(() => ({
			queryKey: ["permission-requests", "available-roles"],
			queryFn: () => lastValueFrom(this.repository.getAvailableRoles()),
			...this.queryConfig,
		}));
	}

	/** Mutation for creating permission requests. */
	createRequest() {
		return injectMutation(() => ({
			mutationFn: (request: CreatePermissionRequestDto) => lastValueFrom(this.repository.create(request)),
			onSuccess: () => {
				this.queryClient.invalidateQueries({
					queryKey: ["permission-requests"],
				});
			},
		}));
	}
}
```

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/services/index.ts`

```typescript
export { PermissionRequestService } from "./permission-request.service";
```

### 2.4 Admin Permission Requests Page (List)

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/permission-requests.component.ts`

```typescript
import { Component, inject, ChangeDetectionStrategy, Signal, computed } from "@angular/core";
import { DatePipe } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequest } from "@admin/permission-requests/models";

/**
 * Admin page for viewing all permission requests.
 * Displays requests in a table sorted by date.
 */
@Component({
	selector: "app-permission-requests",
	imports: [DatePipe, MatTableModule, MatCardModule, MatProgressSpinnerModule],
	templateUrl: "./permission-requests.component.html",
	styleUrls: ["./permission-requests.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionRequestsComponent {
	private readonly service: PermissionRequestService = inject(PermissionRequestService);

	readonly requestsQuery: ReturnType<PermissionRequestService["getAllRequests"]> = this.service.getAllRequests();

	readonly requests: Signal<PermissionRequest[]> = computed(() => this.requestsQuery.data() ?? []);

	readonly isLoading: Signal<boolean> = computed(() => this.requestsQuery.isLoading());

	readonly error: Signal<string | null> = computed(() => (this.requestsQuery.error() ? "Failed to load permission requests." : null));

	readonly displayedColumns: string[] = ["username", "requestedRole", "requestMessage", "createdBy", "createDate"];
}
```

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/permission-requests.component.html`

```html
<section class="permission-requests-page">
	<header class="page-header">
		<h1>Permission Requests</h1>
	</header>

	@if (isLoading()) {
	<mat-spinner diameter="48"></mat-spinner>
	} @else if (error()) {
	<mat-card appearance="outlined" class="error-card">
		<mat-card-content>{{ error() }}</mat-card-content>
	</mat-card>
	} @else {
	<mat-card>
		<mat-card-content>
			<table mat-table [dataSource]="requests()">
				<ng-container matColumnDef="username">
					<th mat-header-cell *matHeaderCellDef>User</th>
					<td mat-cell *matCellDef="let request">{{ request.username }}</td>
				</ng-container>

				<ng-container matColumnDef="requestedRole">
					<th mat-header-cell *matHeaderCellDef>Role</th>
					<td mat-cell *matCellDef="let request">{{ request.requestedRole }}</td>
				</ng-container>

				<ng-container matColumnDef="requestMessage">
					<th mat-header-cell *matHeaderCellDef>Message</th>
					<td mat-cell *matCellDef="let request">{{ request.requestMessage ?? "-" }}</td>
				</ng-container>

				<ng-container matColumnDef="createdBy">
					<th mat-header-cell *matHeaderCellDef>Requested By</th>
					<td mat-cell *matCellDef="let request">{{ request.createdBy }}</td>
				</ng-container>

				<ng-container matColumnDef="createDate">
					<th mat-header-cell *matHeaderCellDef>Date</th>
					<td mat-cell *matCellDef="let request">{{ request.createDate | date:"short" }}</td>
				</ng-container>

				<tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
				<tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
			</table>

			@if (requests().length === 0) {
			<p class="empty-message">No permission requests found.</p>
			}
		</mat-card-content>
	</mat-card>
	}
</section>
```

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/permission-requests.component.scss`

```scss
@use "variables" as vars;

.permission-requests-page {
	padding: vars.$spacing-lg;
}

.page-header {
	margin-bottom: vars.$spacing-lg;

	h1 {
		margin: 0;
	}
}

.empty-message {
	padding: vars.$spacing-lg;
	text-align: center;
	color: var(--color-text-secondary);
}

.error-card {
	background-color: var(--color-error-container);
	color: var(--color-on-error-container);
}
```

### 2.5 Request Permissions Page (User-facing)

**File**: `SeventySix.Client/src/app/features/admin/users/subpages/request-permissions/request-permissions.component.ts`

```typescript
import { Component, inject, ChangeDetectionStrategy, Signal, computed, signal, WritableSignal } from "@angular/core";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { AvailableRole } from "@admin/permission-requests/models";

/**
 * Page for users to request elevated permissions.
 * Shows available roles and allows submission with optional message.
 */
@Component({
	selector: "app-request-permissions",
	imports: [ReactiveFormsModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
	templateUrl: "./request-permissions.component.html",
	styleUrls: ["./request-permissions.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestPermissionsComponent {
	private readonly service: PermissionRequestService = inject(PermissionRequestService);
	private readonly router: Router = inject(Router);
	private readonly fb: FormBuilder = inject(FormBuilder);
	private readonly snackBar: MatSnackBar = inject(MatSnackBar);

	readonly rolesQuery: ReturnType<PermissionRequestService["getAvailableRoles"]> = this.service.getAvailableRoles();

	readonly createMutation: ReturnType<PermissionRequestService["createRequest"]> = this.service.createRequest();

	readonly availableRoles: Signal<AvailableRole[]> = computed(() => this.rolesQuery.data() ?? []);

	readonly isLoading: Signal<boolean> = computed(() => this.rolesQuery.isLoading());

	readonly isSaving: Signal<boolean> = computed(() => this.createMutation.isPending());

	readonly selectedRoles: WritableSignal<Set<string>> = signal(new Set());

	readonly form: FormGroup = this.fb.group({
		requestMessage: ["", [Validators.maxLength(500)]],
	});

	readonly hasSelectedRoles: Signal<boolean> = computed(() => this.selectedRoles().size > 0);

	readonly noRolesAvailable: Signal<boolean> = computed(() => !this.isLoading() && this.availableRoles().length === 0);

	toggleRole(roleName: string): void {
		const current: Set<string> = new Set(this.selectedRoles());
		if (current.has(roleName)) {
			current.delete(roleName);
		} else {
			current.add(roleName);
		}
		this.selectedRoles.set(current);
	}

	isRoleSelected(roleName: string): boolean {
		return this.selectedRoles().has(roleName);
	}

	submit(): void {
		if (!this.hasSelectedRoles()) {
			return;
		}

		const requestMessage: string | undefined = this.form.value.requestMessage || undefined;

		this.createMutation.mutate(
			{
				requestedRoles: Array.from(this.selectedRoles()),
				requestMessage,
			},
			{
				onSuccess: () => {
					this.snackBar.open("Permission request submitted successfully", "Close", { duration: 3000 });
					this.router.navigate(["/admin/users"]);
				},
				onError: () => {
					this.snackBar.open("Failed to submit request. Please try again.", "Close", { duration: 5000 });
				},
			}
		);
	}
}
```

**File**: `SeventySix.Client/src/app/features/admin/users/subpages/request-permissions/request-permissions.component.html`

```html
<section class="request-permissions-page">
	<header class="page-header">
		<h1>Request Permissions</h1>
	</header>

	@if (isLoading()) {
	<mat-spinner diameter="48"></mat-spinner>
	} @else if (noRolesAvailable()) {
	<mat-card>
		<mat-card-content>
			<p class="info-message">There are no additional roles available to request. You either already have all roles or have pending requests for them.</p>
		</mat-card-content>
	</mat-card>
	} @else {
	<mat-card>
		<mat-card-content>
			<form [formGroup]="form" (ngSubmit)="submit()">
				<h3>Select Roles</h3>
				<div class="roles-list">
					@for (role of availableRoles(); track role.name) {
					<mat-checkbox [checked]="isRoleSelected(role.name)" (change)="toggleRole(role.name)">
						<strong>{{ role.name }}</strong>
						<span class="role-description">{{ role.description }}</span>
					</mat-checkbox>
					}
				</div>

				<mat-form-field appearance="outline" class="message-field">
					<mat-label>Message (optional)</mat-label>
					<textarea matInput formControlName="requestMessage" rows="3" placeholder="Explain why you need these permissions..."> </textarea>
					<mat-hint>Max 500 characters</mat-hint>
				</mat-form-field>

				<div class="actions">
					<button mat-raised-button color="primary" type="submit" [disabled]="!hasSelectedRoles() || isSaving()">
						@if (isSaving()) {
						<mat-spinner diameter="20"></mat-spinner>
						} @else { Submit Request }
					</button>
				</div>
			</form>
		</mat-card-content>
	</mat-card>
	}
</section>
```

**File**: `SeventySix.Client/src/app/features/admin/users/subpages/request-permissions/request-permissions.component.scss`

```scss
@use "variables" as vars;

.request-permissions-page {
	padding: vars.$spacing-lg;
	max-width: 40rem;
}

.page-header {
	margin-bottom: vars.$spacing-lg;

	h1 {
		margin: 0;
	}
}

.roles-list {
	display: flex;
	flex-direction: column;
	gap: vars.$spacing-md;
	margin-bottom: vars.$spacing-lg;

	mat-checkbox {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.role-description {
		display: block;
		font-size: vars.$font-size-sm;
		color: var(--color-text-secondary);
		margin-top: vars.$spacing-xs;
	}
}

.message-field {
	width: 100%;
	margin-bottom: vars.$spacing-lg;
}

.actions {
	display: flex;
	justify-content: flex-end;
}
```

### 2.6 Update Routes

**File**: `SeventySix.Client/src/app/features/admin/admin.routes.ts`

Add imports at top:

```typescript
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequestRepository } from "@admin/permission-requests/repositories";
```

Add to `ADMIN_ROUTES` array (before `not-found`):

```typescript
{
	path: "permission-requests",
	providers: [PermissionRequestService, PermissionRequestRepository],
	loadComponent: () =>
		import("./permission-requests/permission-requests.component").then(
			(m) => m.PermissionRequestsComponent),
	title: "Permission Requests - SeventySix"
},
```

Add to `users` children array:

```typescript
{
	path: "request-permissions",
	providers: [PermissionRequestService, PermissionRequestRepository],
	loadComponent: () =>
		import("./users/subpages/request-permissions/request-permissions.component").then(
			(m) => m.RequestPermissionsComponent),
	title: "Request Permissions - SeventySix"
},
```

> **Note**: The `request-permissions` route has its own `providers` array for `PermissionRequestService` and `PermissionRequestRepository` (route-scoped per guidelines).

### 2.7 Add Path Alias

**File**: `SeventySix.Client/tsconfig.json`

Ensure `@admin/*` path alias exists (likely already present).

### 2.8 Profile Navigation Link

**File**: `SeventySix.Client/src/app/features/admin/users/subpages/user/user-page.html`

Add "Request Permissions" link to user profile page.

---

## Phase 3: Testing (TDD - 80/20 Rule)

> Focus on high-value tests that catch real bugs. Skip low-value boilerplate tests.

### 3.1 Server Tests - Service Layer (HIGH VALUE)

**File**: `SeventySix.Server/Tests/SeventySix.Tests/Identity/Services/PermissionRequestServiceTests.cs`

Write FIRST, then implement service:

```csharp
// <copyright file="PermissionRequestServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Tests.Identity.Services;

/// <summary>
/// Unit tests for PermissionRequestService.
/// Focus: Business logic validation (80/20 - high value tests only).
/// </summary>
public class PermissionRequestServiceTests
{
	private readonly IPermissionRequestRepository Repository =
		Substitute.For<IPermissionRequestRepository>();
	private readonly PermissionRequestService Service;

	public PermissionRequestServiceTests()
	{
		Service =
			new PermissionRequestService(Repository);
	}

	#region GetAvailableRolesAsync

	[Fact]
	public async Task GetAvailableRolesAsync_ReturnsAllRoles_WhenNoExistingRolesOrRequestsAsync()
	{
		// Arrange
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await Service.GetAvailableRolesAsync(1);

		// Assert
		List<AvailableRoleDto> roles = result.ToList();
		roles.Count.ShouldBe(2);
		roles.ShouldContain(role => role.Name == "Developer");
		roles.ShouldContain(role => role.Name == "Admin");
	}

	[Fact]
	public async Task GetAvailableRolesAsync_ExcludesRolesUserAlreadyHasAsync()
	{
		// Arrange - user already has Developer role
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns(["Developer"]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await Service.GetAvailableRolesAsync(1);

		// Assert - only Admin should be available
		List<AvailableRoleDto> roles = result.ToList();
		roles.Count.ShouldBe(1);
		roles[0].Name.ShouldBe("Admin");
	}

	[Fact]
	public async Task GetAvailableRolesAsync_ExcludesAlreadyRequestedRolesAsync()
	{
		// Arrange - user has pending request for Developer
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([new PermissionRequest { RequestedRole = "Developer" }]);

		// Act
		IEnumerable<AvailableRoleDto> result =
			await Service.GetAvailableRolesAsync(1);

		// Assert
		List<AvailableRoleDto> roles = result.ToList();
		roles.Count.ShouldBe(1);
		roles[0].Name.ShouldBe("Admin");
	}

	#endregion

	#region CreateRequestsAsync

	[Fact]
	public async Task CreateRequestsAsync_ThrowsArgumentException_WhenNoRolesSelectedAsync()
	{
		// Arrange
		CreatePermissionRequestDto request =
			new([]);

		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(
				() => Service.CreateRequestsAsync(
					1,
					"testuser",
					request));

		exception.Message.ShouldContain("At least one role");
	}

	[Fact]
	public async Task CreateRequestsAsync_ThrowsArgumentException_WhenInvalidRoleAsync()
	{
		// Arrange
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		CreatePermissionRequestDto request =
			new(["InvalidRole"]);

		// Act & Assert
		ArgumentException exception =
			await Should.ThrowAsync<ArgumentException>(
				() => Service.CreateRequestsAsync(
					1,
					"testuser",
					request));

		exception.Message.ShouldContain("Invalid role");
	}

	[Fact]
	public async Task CreateRequestsAsync_CreatesOneRequestPerRoleAsync()
	{
		// Arrange
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		CreatePermissionRequestDto request =
			new()
			{
				RequestedRoles = ["Developer", "Admin"],
				RequestMessage = "Need access"
			};

		// Act
		await Service.CreateRequestsAsync(
			1,
			"testuser",
			request);

		// Assert - verify CreateAsync called twice
		await Repository
			.Received(2)
			.CreateAsync(
				Arg.Any<PermissionRequest>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateRequestsAsync_SkipsRolesUserAlreadyHas_IdempotentAsync()
	{
		// Arrange - user already has Developer role
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns(["Developer"]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);

		CreatePermissionRequestDto request =
			new(
				["Developer", "Admin"],
				"Need access");

		// Act
		await Service.CreateRequestsAsync(
			1,
			"testuser",
			request);

		// Assert - only Admin should be created (Developer skipped)
		await Repository
			.Received(1)
			.CreateAsync(
				Arg.Is<PermissionRequest>(request => request.RequestedRole == "Admin"),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task CreateRequestsAsync_SkipsPendingRequests_IdempotentAsync()
	{
		// Arrange - user has pending request for Developer
		Repository
			.GetUserExistingRolesAsync(1, Arg.Any<CancellationToken>())
			.Returns([]);
		Repository
			.GetByUserIdAsync(1, Arg.Any<CancellationToken>())
			.Returns([new PermissionRequest { RequestedRole = "Developer" }]);

		CreatePermissionRequestDto request =
			new(
				["Developer", "Admin"],
				"Need access");

		// Act
		await Service.CreateRequestsAsync(
			1,
			"testuser",
			request);

		// Assert - only Admin should be created (Developer already requested)
		await Repository
			.Received(1)
			.CreateAsync(
				Arg.Is<PermissionRequest>(request => request.RequestedRole == "Admin"),
				Arg.Any<CancellationToken>());
	}

	#endregion
}
```

> **80/20 Decision**: Skip repository tests (EF Core integration is tested via DbContext). Skip validator tests (FluentValidation is well-tested).

### 3.2 Server Tests - Integration (MEDIUM VALUE)

**File**: `SeventySix.Server/Tests/SeventySix.Api.Tests/Controllers/UsersController.PermissionRequests.Tests.cs`

> **80/20 Decision**: Test authorization boundary only. Skip detailed endpoint tests - they duplicate service tests.

```csharp
// <copyright file="UsersController.PermissionRequests.Tests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Integration tests for permission request endpoints.
/// Focus: Authorization boundaries only (80/20).
/// </summary>
[Collection("IntegrationTests")]
public class UsersControllerPermissionRequestsTests(CustomWebApplicationFactory<Program> factory)
	: ApiIntegrationTestBase(factory)
{
	[Fact]
	public async Task GetPermissionRequests_Returns401_WhenNotAuthenticatedAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client.GetAsync("/api/v1/users/permission-requests");

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
	}

	[Fact]
	public async Task GetPermissionRequests_Returns403_WhenNotAdminAsync()
	{
		// Arrange - authenticate as regular user
		await AuthenticateAsUserAsync();

		// Act
		HttpResponseMessage response =
			await Client.GetAsync("/api/v1/users/permission-requests");

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
	}

	[Fact]
	public async Task GetAvailableRoles_Returns200_WhenAuthenticatedAsync()
	{
		// Arrange
		await AuthenticateAsUserAsync();

		// Act
		HttpResponseMessage response =
			await Client.GetAsync("/api/v1/users/me/available-roles");

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);
	}
}
```

### 3.3 Client Tests (MINIMAL - 80/20)

> **80/20 Decision**: Component rendering tests only. Skip service/repository tests (TanStack Query handles caching correctly).

**File**: `SeventySix.Client/src/app/features/admin/permission-requests/permission-requests.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { QueryClient, provideAngularQuery } from "@tanstack/angular-query-experimental";
import { PermissionRequestsComponent } from "./permission-requests.component";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequestRepository } from "@admin/permission-requests/repositories";

describe("PermissionRequestsComponent", () => {
	let fixture: ComponentFixture<PermissionRequestsComponent>;
	let component: PermissionRequestsComponent;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [PermissionRequestsComponent],
			providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideAngularQuery(new QueryClient()), PermissionRequestService, PermissionRequestRepository],
		}).compileComponents();

		fixture = TestBed.createComponent(PermissionRequestsComponent);
		component = fixture.componentInstance;
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should have loading state initially", async () => {
		await fixture.whenStable();
		expect(component.isLoading()).toBe(true);
	});
});
```

> **Skip**: Request permissions component tests - form logic is straightforward, manual testing sufficient.

---

## File Checklist

### Server (Create) - In Order

| #   | File                                                        | Description          |
| --- | ----------------------------------------------------------- | -------------------- |
| 1   | `Identity/Entities/PermissionRequest.cs`                    | Entity class         |
| 2   | `Identity/Configurations/PermissionRequestConfiguration.cs` | EF Fluent API config |
| 3   | `Identity/DTOs/PermissionRequestDto.cs`                     | Read DTO             |
| 4   | `Identity/DTOs/CreatePermissionRequestDto.cs`               | Create request DTO   |
| 5   | `Identity/DTOs/AvailableRoleDto.cs`                         | Available role DTO   |
| 6   | `Identity/Extensions/PermissionRequestExtensions.cs`        | ToDto mapping        |
| 7   | `Identity/Interfaces/IPermissionRequestRepository.cs`       | Repository interface |
| 8   | `Identity/Interfaces/IPermissionRequestService.cs`          | Service interface    |
| 9   | `Identity/Repositories/PermissionRequestRepository.cs`      | Repository impl      |
| 10  | `Identity/Services/PermissionRequestService.cs`             | Service impl         |
| 11  | `Identity/Validators/CreatePermissionRequestValidator.cs`   | FluentValidation     |

### Server (Modify)

| File                                                     | Change                           |
| -------------------------------------------------------- | -------------------------------- |
| `Identity/Infrastructure/IdentityDbContext.cs`           | Add `PermissionRequests` DbSet   |
| `Identity/Extensions/IdentityServiceExtensions.cs`       | Register DI                      |
| `SeventySix.Api/Controllers/V1/UsersController.cs`       | Add 3 endpoints + inject service |
| `Tests/SeventySix.TestUtilities/Constants/TestTables.cs` | Add table name                   |

### Server (Tests - TDD First)

| File                                                                                 | Priority            |
| ------------------------------------------------------------------------------------ | ------------------- |
| `Tests/SeventySix.Tests/Identity/Services/PermissionRequestServiceTests.cs`          | HIGH - Write first  |
| `Tests/SeventySix.Api.Tests/Controllers/UsersController.PermissionRequests.Tests.cs` | MEDIUM - Auth tests |

### Client (Create) - In Order

| #   | File                                                                    | Description     |
| --- | ----------------------------------------------------------------------- | --------------- |
| 1   | `permission-requests/models/permission-request.model.ts`                | Interfaces      |
| 2   | `permission-requests/models/index.ts`                                   | Barrel export   |
| 3   | `permission-requests/repositories/permission-request.repository.ts`     | API calls       |
| 4   | `permission-requests/repositories/index.ts`                             | Barrel export   |
| 5   | `permission-requests/services/permission-request.service.ts`            | TanStack Query  |
| 6   | `permission-requests/services/index.ts`                                 | Barrel export   |
| 7   | `permission-requests/permission-requests.component.ts`                  | Admin list page |
| 8   | `permission-requests/permission-requests.component.html`                | Template        |
| 9   | `permission-requests/permission-requests.component.scss`                | Styles          |
| 10  | `users/subpages/request-permissions/request-permissions.component.ts`   | User form page  |
| 11  | `users/subpages/request-permissions/request-permissions.component.html` | Template        |
| 12  | `users/subpages/request-permissions/request-permissions.component.scss` | Styles          |

### Client (Modify)

| File                                       | Change                         |
| ------------------------------------------ | ------------------------------ |
| `admin/admin.routes.ts`                    | Add routes + providers         |
| `admin/users/subpages/user/user-page.html` | Add "Request Permissions" link |

### Client (Tests)

| File                                                        | Priority               |
| ----------------------------------------------------------- | ---------------------- |
| `permission-requests/permission-requests.component.spec.ts` | LOW - Basic smoke test |

---

## Future Enhancements (Out of Scope - YAGNI)

1. **Approval Workflow** - Admin can approve/reject requests
2. **Status Field** - Track Pending/Approved/Rejected states
3. **Notifications** - Email/in-app notifications on status change
4. **Request History** - Track all historical requests including resolved ones

---

## Design Decisions Summary

| Decision            | Choice                        | Rationale                                                    |
| ------------------- | ----------------------------- | ------------------------------------------------------------ |
| Entity interface    | `ICreatableEntity`            | Auto `CreateDate` via interceptor, no modify tracking needed |
| DB design           | One row per role              | Normalized, supports future individual approval              |
| Unique constraint   | `(UserId, RequestedRole)`     | Prevents duplicate pending requests in DB                    |
| Cascade delete      | `ON DELETE CASCADE` from User | Clean up requests when user is deleted                       |
| Idempotent create   | Skip existing roles/requests  | No errors on duplicate submissions - silently skipped        |
| Conditional display | Exclude existing + pending    | Hide roles user already has OR has pending requests for      |
| Role list           | Hardcoded in service          | KISS - avoids config complexity                              |
| Validation location | FluentValidation + Service    | Validator for shape, service for business rules              |
| DTOs                | Positional records            | Per guidelines - cleaner, immutable                          |
| Logging             | Warnings/Errors only          | Per guidelines - no debug/info logging                       |
| Repository methods  | Minimal                       | YAGNI - only what's needed for MVP                           |
| Test coverage       | 80/20                         | High-value service tests, skip boilerplate                   |

---

## Execution Commands

### Server

```powershell
# 1. Run tests first (TDD)
cd SeventySix.Server
dotnet test --filter "PermissionRequest"

# 2. Create migration
cd SeventySix.Api
dotnet ef migrations add AddPermissionRequests --context IdentityDbContext --project ../SeventySix

# 3. Apply migration
dotnet ef database update --context IdentityDbContext

# 4. Run all server tests
dotnet test
```

### Client

```powershell
# 1. Run tests
cd SeventySix.Client
npm test

# 2. Build to verify
npm run build
```

---

## Notes

-   Roles are hardcoded in service (`AllRequestableRoles`) - simple and maintainable
-   One row per role in DB allows individual approval later
-   `ICreatableEntity` handles `CreateDate` automatically via `AuditInterceptor`
-   `CreatedBy` manually set in service (not automatic like `IAuditableEntity`)
-   **Unique constraint** on `(UserId, RequestedRole)` prevents duplicate pending requests in DB
-   **Cascade delete** from User - when user is deleted, their permission requests are auto-removed
-   **Idempotent create** - duplicate submissions silently skipped (no logging per guidelines)
-   **Conditional display** - available roles excludes both existing roles AND pending requests
-   **No logging** - service has no logger (only log warnings/errors per guidelines)
-   **Positional records** for DTOs - cleaner, immutable per guidelines
-   Service validation uses static `ValidRoleNames` HashSet for O(1) lookup
-   Profile navigation: `/admin/users/request-permissions` route
-   Admin list: `/admin/permission-requests` route (separate feature folder)
