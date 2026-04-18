// <copyright file="UsersQueryController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Configuration;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Shared.POCOs;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Read-only user query endpoints.
/// Handles all GET operations for user resources.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="UsersQueryController"/> class.
/// </remarks>
/// <param name="messageBus">
/// The Wolverine message bus for dispatching queries.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/users")]
public sealed class UsersQueryController(
	IMessageBus messageBus) : ControllerBase
{
	/// <summary>
	/// Gets the count of users with the Admin role.
	/// Used by clients to determine if Admin role removal should be disabled.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The count of admin users.
	/// </returns>
	/// <response code="200">Returns the admin count.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("admin-count", Name = "GetAdminCount")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[OutputCache(PolicyName = CachePolicyConstants.Users)]
	public async Task<ActionResult<int>> GetAdminCountAsync(
		CancellationToken cancellationToken)
	{
		int adminCount =
			await messageBus.InvokeAsync<int>(
				new GetAdminCountQuery(),
				cancellationToken);

		return Ok(adminCount);
	}

	/// <summary>
	/// Gets a user by their identifier.
	/// </summary>
	/// <param name="id">
	/// The unique identifier of the user.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The user if found; otherwise, 404 Not Found.
	/// </returns>
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
	[OutputCache(PolicyName = CachePolicyConstants.Users)]
	public async Task<ActionResult<UserDto>> GetByIdAsync(
		long id,
		CancellationToken cancellationToken)
	{
		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByIdQuery(id),
				cancellationToken);

		if (user is null)
		{
			return NotFound();
		}

		return Ok(user);
	}

	/// <summary>
	/// Gets users with pagination and filtering.
	/// </summary>
	/// <param name="request">
	/// The query request containing pagination and filter parameters.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// A paged result containing users and metadata.
	/// </returns>
	/// <response code="200">Returns the paged result.</response>
	/// <response code="400">If the request is invalid.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("paged", Name = "GetPagedUsers")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(
		typeof(PagedResult<UserDto>),
		StatusCodes.Status200OK
	)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[OutputCache(PolicyName = CachePolicyConstants.Users)]
	public async Task<ActionResult<PagedResult<UserDto>>> GetPagedAsync(
		[FromQuery] UserQueryRequest request,
		CancellationToken cancellationToken)
	{
		PagedResult<UserDto> result =
			await messageBus.InvokeAsync<
				PagedResult<UserDto>>(
					new GetPagedUsersQuery(request),
					cancellationToken);

		return Ok(result);
	}

	/// <summary>
	/// Gets a user by their username.
	/// </summary>
	/// <param name="username">
	/// The username of the user.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The user if found; otherwise, 404 Not Found.
	/// </returns>
	/// <response code="200">Returns the user.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("username/{username}", Name = "GetUserByUsername")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[OutputCache(PolicyName = CachePolicyConstants.Users)]
	public async Task<ActionResult<UserDto>> GetByUsernameAsync(
		string username,
		CancellationToken cancellationToken)
	{
		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByUsernameQuery(username),
				cancellationToken);

		if (user is null)
		{
			return NotFound();
		}

		return Ok(user);
	}

	/// <summary>
	/// Checks if a username already exists.
	/// </summary>
	/// <param name="username">
	/// The username to check.
	/// </param>
	/// <param name="excludeId">
	/// Optional user ID to exclude from the check (for updates).
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// True if the username exists; otherwise, false.
	/// </returns>
	/// <response code="200">Returns whether the username exists.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("check/username/{username}", Name = "CheckUsername")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[OutputCache(PolicyName = CachePolicyConstants.Users)]
	public async Task<ActionResult<bool>> CheckUsernameAsync(
		string username,
		[FromQuery] long? excludeId,
		CancellationToken cancellationToken)
	{
		bool exists =
			await messageBus.InvokeAsync<bool>(
				new CheckUsernameExistsQuery(username, excludeId),
				cancellationToken);
		return Ok(exists);
	}
}