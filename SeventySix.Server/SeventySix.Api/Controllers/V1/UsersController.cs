// <copyright file="UsersController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Shared;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Users API endpoints.
/// Provides RESTful operations for managing user resources.
/// </summary>
/// <remarks>
/// This controller implements the Service Layer pattern, delegating business logic
/// to IUserService while handling HTTP concerns.
///
/// All endpoints return:
/// - Proper HTTP status codes (200, 201, 400, 404, 500)
/// - ProblemDetails for errors (RFC 7807)
/// - Appropriate response caching headers
///
/// Design Patterns:
/// - Dependency Injection: Services injected via constructor
/// - Repository Pattern: Data access abstracted through service layer
/// - DTO Pattern: Domain models never exposed directly
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="UsersController"/> class.
/// </remarks>
/// <param name="userService">The user service for business logic operations.</param>
/// <param name="logger">The logger instance for recording controller operations.</param>
/// <exception cref="ArgumentNullException">Thrown when userService or logger is null.</exception>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/users")]
public class UsersController(
	IUserService userService,
	IAuthService authService,
	IPermissionRequestService permissionRequestService,
	ILogger<UsersController> logger) : ControllerBase
{
	#region Current User (/me) Endpoints

	/// <summary>
	/// Updates the current authenticated user's profile.
	/// </summary>
	/// <param name="request">The profile update request.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The updated user profile.</returns>
	/// <response code="200">Returns the updated profile.</response>
	/// <response code="400">If the request is invalid.</response>
	/// <response code="401">If the user is not authenticated.</response>
	/// <response code="404">If the user is not found.</response>
	[HttpPut("me", Name = "UpdateCurrentUser")]
	[Authorize]
	[ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<ActionResult<UserProfileDto>> UpdateCurrentUserAsync(
		[FromBody] UpdateProfileRequest request,
		CancellationToken cancellationToken)
	{
		int? userId =
			User.GetUserId();

		if (userId == null)
		{
			return Unauthorized();
		}

		UserProfileDto? profile =
			await userService.UpdateProfileAsync(
				userId.Value,
				request,
				cancellationToken);

		return profile == null
			? NotFound()
			: Ok(profile);
	}

	#endregion

	#region Admin User Management Endpoints

	/// <summary>
	/// Gets all users.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>A list of all users.</returns>
	/// <response code="200">Returns the list of users.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/user
	///
	/// Response is cached for 60 seconds to improve performance.
	/// </remarks>
	[HttpGet(Name = "GetUsers")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[OutputCache(PolicyName = "users")]
	public async Task<ActionResult<IEnumerable<UserDto>>> GetAllAsync(CancellationToken cancellationToken)
	{
		logger.LogInformation("Getting all users");
		IEnumerable<UserDto> users = await userService.GetAllUsersAsync(cancellationToken);
		return Ok(users);
	}

	/// <summary>
	/// Gets a user by their identifier.
	/// </summary>
	/// <param name="id">The unique identifier of the user.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The user if found; otherwise, 404 Not Found.</returns>
	/// <response code="200">Returns the user.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/v1/users/1
	///
	/// Response is cached for 60 seconds to improve performance.
	/// </remarks>
	[HttpGet("{id}", Name = "GetUserById")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[OutputCache(PolicyName = "users")]
	public async Task<ActionResult<UserDto>> GetByIdAsync(int id, CancellationToken cancellationToken)
	{
		UserDto? user = await userService.GetUserByIdAsync(id, cancellationToken);

		return user is null ? (ActionResult<UserDto>)NotFound() : (ActionResult<UserDto>)Ok(user);
	}

	/// <summary>
	/// Creates a new user.
	/// </summary>
	/// <param name="request">The user creation request containing user data.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The created user with location header.</returns>
	/// <response code="201">Returns the newly created user.</response>
	/// <response code="400">If the request is invalid or validation fails.</response>
	/// <response code="422">If a business rule is violated.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	/// <remarks>
	/// Sample request:
	///
	///     POST /api/user
	///     {
	///        "username": "john_doe",
	///        "email": "john.doe@example.com",
	///        "fullName": "John Doe",
	///        "isActive": true
	///     }
	///
	/// FluentValidation automatically validates the request before processing.
	/// Returns 201 Created with Location header pointing to the new resource.
	/// </remarks>
	[HttpPost(Name = "CreateUser")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<UserDto>> CreateAsync(
		[FromBody] CreateUserRequest request,
		CancellationToken cancellationToken)
	{
		UserDto user = await userService.CreateUserAsync(request, cancellationToken);
		return CreatedAtRoute("GetUserById", new { id = user.Id }, user);
	}

	/// <summary>
	/// Updates an existing user.
	/// </summary>
	/// <param name="id">The unique identifier of the user to update.</param>
	/// <param name="request">The user update request containing updated user data.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The updated user.</returns>
	/// <response code="200">Returns the updated user.</response>
	/// <response code="400">If the request is invalid or ID mismatch.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="409">If a concurrency conflict occurs.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPut("{id}", Name = "UpdateUser")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status409Conflict)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<UserDto>> UpdateAsync(
		int id,
		[FromBody] UpdateUserRequest request,
		CancellationToken cancellationToken)
	{
		if (id != request.Id)
		{
			return BadRequest("ID in URL does not match ID in request body");
		}

		UserDto user = await userService.UpdateUserAsync(request, cancellationToken);
		return Ok(user);
	}

	/// <summary>
	/// Soft deletes a user by their identifier.
	/// </summary>
	/// <param name="id">The unique identifier of the user to delete.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content if successful.</returns>
	/// <response code="204">If the user was successfully deleted.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpDelete("{id}", Name = "DeleteUser")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> DeleteAsync(
		int id,
		CancellationToken cancellationToken)
	{
		bool result = await userService.DeleteUserAsync(id, AuditConstants.SystemUser, cancellationToken);
		return result ? NoContent() : NotFound();
	}

	/// <summary>
	/// Restores a previously soft-deleted user.
	/// </summary>
	/// <param name="id">The unique identifier of the user to restore.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content if successful.</returns>
	/// <response code="204">If the user was successfully restored.</response>
	/// <response code="404">If the user is not found or not deleted.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("{id}/restore", Name = "RestoreUser")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> RestoreAsync(
		int id,
		CancellationToken cancellationToken)
	{
		bool result = await userService.RestoreUserAsync(id, cancellationToken);
		return result ? NoContent() : NotFound();
	}

	/// <summary>
	/// Gets users with pagination and filtering.
	/// </summary>
	/// <param name="request">The query request containing pagination and filter parameters.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>A paged result containing users and metadata.</returns>
	/// <response code="200">Returns the paged result.</response>
	/// <response code="400">If the request is invalid.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("paged", Name = "GetPagedUsers")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(PagedResult<UserDto>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[OutputCache(PolicyName = "users")]
	public async Task<ActionResult<PagedResult<UserDto>>> GetPagedAsync(
		[FromQuery] UserQueryRequest request,
		CancellationToken cancellationToken)
	{
		PagedResult<UserDto> result = await userService.GetPagedUsersAsync(request, cancellationToken);
		return Ok(result);
	}

	/// <summary>
	/// Gets a user by their username.
	/// </summary>
	/// <param name="username">The username of the user.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The user if found; otherwise, 404 Not Found.</returns>
	/// <response code="200">Returns the user.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("username/{username}", Name = "GetUserByUsername")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[OutputCache(PolicyName = "users")]
	public async Task<ActionResult<UserDto>> GetByUsernameAsync(
		string username,
		CancellationToken cancellationToken)
	{
		UserDto? user = await userService.GetByUsernameAsync(username, cancellationToken);
		return user is null ? NotFound() : Ok(user);
	}

	/// <summary>
	/// Checks if a username already exists.
	/// </summary>
	/// <param name="username">The username to check.</param>
	/// <param name="excludeId">Optional user ID to exclude from the check (for updates).</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>True if the username exists; otherwise, false.</returns>
	/// <response code="200">Returns whether the username exists.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("check/username/{username}", Name = "CheckUsername")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[OutputCache(PolicyName = "users")]
	public async Task<ActionResult<bool>> CheckUsernameAsync(
		string username,
		[FromQuery] int? excludeId,
		CancellationToken cancellationToken)
	{
		bool exists = await userService.UsernameExistsAsync(username, excludeId, cancellationToken);
		return Ok(exists);
	}

	/// <summary>
	/// Bulk activates multiple users.
	/// </summary>
	/// <param name="ids">The collection of user IDs to activate.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The number of users activated.</returns>
	/// <response code="200">Returns the count of activated users.</response>
	/// <response code="400">If the request is invalid.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("bulk/activate", Name = "BulkActivateUsers")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkActivateAsync(
		[FromBody] IEnumerable<int> ids,
		CancellationToken cancellationToken)
	{
		int count = await userService.BulkUpdateActiveStatusAsync(ids, true, AuditConstants.SystemUser, cancellationToken);
		return Ok(count);
	}

	/// <summary>
	/// Bulk deactivates multiple users.
	/// </summary>
	/// <param name="ids">The collection of user IDs to deactivate.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The number of users deactivated.</returns>
	/// <response code="200">Returns the count of deactivated users.</response>
	/// <response code="400">If the request is invalid.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("bulk/deactivate", Name = "BulkDeactivateUsers")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkDeactivateAsync(
		[FromBody] IEnumerable<int> ids,
		CancellationToken cancellationToken)
	{
		int count = await userService.BulkUpdateActiveStatusAsync(ids, false, AuditConstants.SystemUser, cancellationToken);
		return Ok(count);
	}

	/// <summary>
	/// Initiates a password reset for a user (sends reset email).
	/// </summary>
	/// <remarks>
	/// Admin action to send a password reset email to a user.
	/// The user will receive an email with a link to set their new password.
	/// </remarks>
	/// <param name="id">The unique identifier of the user.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content if email sent successfully.</returns>
	/// <response code="204">Password reset email sent successfully.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("{id}/reset-password", Name = "ResetUserPassword")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> ResetPasswordAsync(
		int id,
		CancellationToken cancellationToken)
	{
		// Verify user exists
		UserDto? user =
			await userService.GetUserByIdAsync(
				id,
				cancellationToken);

		if (user == null)
		{
			return NotFound();
		}

		await authService.InitiatePasswordResetAsync(
			id,
			isNewUser: false,
			cancellationToken);

		logger.LogInformation(
			"Password reset initiated for user. UserId: {UserId}",
			id);

		return NoContent();
	}

	#endregion

	#region Permission Requests

	/// <summary>
	/// Gets all pending permission requests (Admin only).
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>A list of all pending permission requests.</returns>
	/// <response code="200">Returns the list of permission requests.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("permission-requests", Name = "GetPermissionRequests")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(IEnumerable<PermissionRequestDto>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<IEnumerable<PermissionRequestDto>>> GetPermissionRequestsAsync(
		CancellationToken cancellationToken)
	{
		IEnumerable<PermissionRequestDto> requests =
			await permissionRequestService.GetAllRequestsAsync(cancellationToken);
		return Ok(requests);
	}

	/// <summary>
	/// Gets available roles for the current user to request.
	/// </summary>
	/// <remarks>
	/// Excludes roles the user already has and roles with pending requests.
	/// Available to authenticated users (not just admins).
	/// </remarks>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>A list of available roles the user can request.</returns>
	/// <response code="200">Returns the list of available roles.</response>
	/// <response code="401">If the user is not authenticated.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("me/available-roles", Name = "GetAvailableRoles")]
	[Authorize]
	[ProducesResponseType(typeof(IEnumerable<AvailableRoleDto>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<IEnumerable<AvailableRoleDto>>> GetAvailableRolesAsync(
		CancellationToken cancellationToken)
	{
		int userId =
			User.GetRequiredUserId();

		IEnumerable<AvailableRoleDto> roles =
			await permissionRequestService.GetAvailableRolesAsync(
				userId,
				cancellationToken);

		return Ok(roles);
	}

	/// <summary>
	/// Creates permission requests for the current user.
	/// </summary>
	/// <remarks>
	/// Creates one request per requested role. Idempotent: skips roles
	/// the user already has or has already requested.
	/// </remarks>
	/// <param name="request">The permission request containing roles and optional message.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content if successful.</returns>
	/// <response code="204">Permission requests created successfully.</response>
	/// <response code="400">If the request is invalid.</response>
	/// <response code="401">If the user is not authenticated.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("me/permission-requests", Name = "CreatePermissionRequest")]
	[Authorize]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> CreatePermissionRequestAsync(
		[FromBody] CreatePermissionRequestDto request,
		CancellationToken cancellationToken)
	{
		int userId =
			User.GetRequiredUserId();

		string username =
			User.GetRequiredUsername();

		await permissionRequestService.CreateRequestsAsync(
			userId,
			username,
			request,
			cancellationToken);

		return NoContent();
	}

	/// <summary>Approves a permission request.</summary>
	/// <param name="id">The ID of the permission request to approve.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content if successful; 404 if request not found.</returns>
	/// <response code="204">Permission request approved successfully.</response>
	/// <response code="404">If the permission request is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost(
		"permission-requests/{id}/approve",
		Name = "ApprovePermissionRequest")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> ApprovePermissionRequestAsync(
		int id,
		CancellationToken cancellationToken)
	{
		bool result =
			await permissionRequestService.ApproveRequestAsync(
				id,
				cancellationToken);

		return result ? NoContent() : NotFound();
	}

	/// <summary>Rejects a permission request.</summary>
	/// <param name="id">The ID of the permission request to reject.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content if successful; 404 if request not found.</returns>
	/// <response code="204">Permission request rejected successfully.</response>
	/// <response code="404">If the permission request is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost(
		"permission-requests/{id}/reject",
		Name = "RejectPermissionRequest")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> RejectPermissionRequestAsync(
		int id,
		CancellationToken cancellationToken)
	{
		bool result =
			await permissionRequestService.RejectRequestAsync(
				id,
				cancellationToken);

		return result ? NoContent() : NotFound();
	}

	/// <summary>Bulk approves permission requests.</summary>
	/// <param name="ids">The IDs of permission requests to approve.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The count of approved requests.</returns>
	/// <response code="200">Returns the count of approved requests.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost(
		"permission-requests/bulk/approve",
		Name = "BulkApprovePermissionRequests")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkApprovePermissionRequestsAsync(
		[FromBody] IEnumerable<int> ids,
		CancellationToken cancellationToken)
	{
		int count =
			await permissionRequestService.ApproveRequestsAsync(
				ids,
				cancellationToken);

		return Ok(count);
	}

	/// <summary>Bulk rejects permission requests.</summary>
	/// <param name="ids">The IDs of permission requests to reject.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The count of rejected requests.</returns>
	/// <response code="200">Returns the count of rejected requests.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost(
		"permission-requests/bulk/reject",
		Name = "BulkRejectPermissionRequests")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkRejectPermissionRequestsAsync(
		[FromBody] IEnumerable<int> ids,
		CancellationToken cancellationToken)
	{
		int count =
			await permissionRequestService.RejectRequestsAsync(
				ids,
				cancellationToken);

		return Ok(count);
	}

	#endregion

	#region User Roles

	/// <summary>Gets roles for a user.</summary>
	/// <param name="id">The user ID.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>A list of role names.</returns>
	/// <response code="200">Returns the list of roles.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet(
		"{id}/roles",
		Name = "GetUserRoles")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<IEnumerable<string>>> GetUserRolesAsync(
		int id,
		CancellationToken cancellationToken)
	{
		UserDto? user =
			await userService.GetUserByIdAsync(
				id,
				cancellationToken);

		if (user == null)
		{
			return NotFound();
		}

		IEnumerable<string> roles =
			await userService.GetUserRolesAsync(
				id,
				cancellationToken);

		return Ok(roles);
	}

	/// <summary>Adds a role to a user.</summary>
	/// <param name="id">The user ID.</param>
	/// <param name="role">The role name to add.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content if successful; 404 if user not found; 409 if user already has role.</returns>
	/// <response code="204">Role added successfully.</response>
	/// <response code="400">If the role name is invalid.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="409">If the user already has this role.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost(
		"{id}/roles/{role}",
		Name = "AddUserRole")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status409Conflict)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> AddUserRoleAsync(
		int id,
		string role,
		CancellationToken cancellationToken)
	{
		UserDto? user =
			await userService.GetUserByIdAsync(
				id,
				cancellationToken);

		if (user == null)
		{
			return NotFound();
		}

		try
		{
			bool added =
				await userService.AddUserRoleAsync(
					id,
					role,
					cancellationToken);

			return added ? NoContent() : Conflict("User already has this role");
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
	}

	/// <summary>Removes a role from a user.</summary>
	/// <param name="id">The user ID.</param>
	/// <param name="role">The role name to remove.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>No content if successful; 404 if user or role not found.</returns>
	/// <response code="204">Role removed successfully.</response>
	/// <response code="404">If the user or role is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpDelete(
		"{id}/roles/{role}",
		Name = "RemoveUserRole")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> RemoveUserRoleAsync(
		int id,
		string role,
		CancellationToken cancellationToken)
	{
		UserDto? user =
			await userService.GetUserByIdAsync(
				id,
				cancellationToken);

		if (user == null)
		{
			return NotFound();
		}

		bool removed =
			await userService.RemoveUserRoleAsync(
				id,
				role,
				cancellationToken);

		return removed ? NoContent() : NotFound("Role not found on user");
	}

	#endregion

}