// <copyright file="UsersController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Configuration;
using SeventySix.Identity;
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
	ILogger<UsersController> logger) : ControllerBase
{
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
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> DeleteAsync(
		int id,
		CancellationToken cancellationToken)
	{
		bool result = await userService.DeleteUserAsync(id, "System", cancellationToken);
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
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkActivateAsync(
		[FromBody] IEnumerable<int> ids,
		CancellationToken cancellationToken)
	{
		int count = await userService.BulkUpdateActiveStatusAsync(ids, true, "System", cancellationToken);
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
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkDeactivateAsync(
		[FromBody] IEnumerable<int> ids,
		CancellationToken cancellationToken)
	{
		int count = await userService.BulkUpdateActiveStatusAsync(ids, false, "System", cancellationToken);
		return Ok(count);
	}
}