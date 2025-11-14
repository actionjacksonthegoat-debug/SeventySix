// <copyright file="UserController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.BusinessLogic.DTOs;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Api.Controllers;

/// <summary>
/// User API endpoints.
/// Provides RESTful operations for managing user data.
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
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
	private readonly IUserService UserService;
	private readonly ILogger<UserController> Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="UserController"/> class.
	/// </summary>
	/// <param name="userService">The user service for business logic operations.</param>
	/// <param name="logger">The logger instance for recording controller operations.</param>
	/// <exception cref="ArgumentNullException">Thrown when userService or logger is null.</exception>
	public UserController(
		IUserService userService,
		ILogger<UserController> logger)
	{
		UserService = userService ?? throw new ArgumentNullException(nameof(userService));
		Logger = logger ?? throw new ArgumentNullException(nameof(logger));
	}

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
		Logger.LogInformation("Getting all users");
		var users = await UserService.GetAllUsersAsync(cancellationToken);
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
	///     GET /api/user/1
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
		Logger.LogInformation("Getting user with ID: {UserId}", id);
		var user = await UserService.GetUserByIdAsync(id, cancellationToken);

		if (user is null)
		{
			Logger.LogWarning("User with ID {UserId} not found", id);
			return NotFound();
		}

		return Ok(user);
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
		Logger.LogInformation("Creating new user with username: {Username}", request.Username);
		var user = await UserService.CreateUserAsync(request, cancellationToken);
		return CreatedAtRoute("GetUserById", new { id = user.Id }, user);
	}
}