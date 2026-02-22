// <copyright file="UserRolesController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeventySix.Api.Configuration;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Constants;
using SeventySix.Shared.POCOs;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// User roles API endpoints.
/// Provides RESTful operations for managing user role assignments.
/// </summary>
/// <param name="messageBus">
/// The Wolverine message bus for dispatching commands and queries.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/users")]
public sealed class UserRolesController(
	IMessageBus messageBus,
	ILogger<UserRolesController> logger) : ControllerBase
{
	/// <summary>Gets roles for a user.</summary>
	/// <param name="id">
	/// The user ID.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// A list of role names.
	/// </returns>
	/// <response code="200">Returns the list of roles.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("{id}/roles", Name = "GetUserRoles")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<IEnumerable<string>>> GetUserRolesAsync(
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

		IEnumerable<string> roles =
			await messageBus.InvokeAsync<
				IEnumerable<string>>(
					new GetUserRolesQuery(id),
					cancellationToken);

		return Ok(roles);
	}

	/// <summary>Adds a role to a user.</summary>
	/// <param name="id">
	/// The user ID.
	/// </param>
	/// <param name="role">
	/// The role name to add.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// No content if successful; 404 if user not found; 409 if user already has role.
	/// </returns>
	/// <response code="204">Role added successfully.</response>
	/// <response code="400">If the role name is invalid.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="409">If the user already has this role.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("{id}/roles/{role}", Name = "AddUserRole")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status409Conflict)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> AddUserRoleAsync(
		long id,
		string role,
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

		try
		{
			Result added =
				await messageBus.InvokeAsync<Result>(
					new AddUserRoleCommand(id, role),
					cancellationToken);

			if (!added.IsSuccess)
			{
				return Conflict(
					new ProblemDetails
					{
						Title = "Role Already Assigned",
						Detail = "User already has this role",
						Status = StatusCodes.Status409Conflict,
					});
			}

			return NoContent();
		}
		catch (ArgumentException argumentException)
		{
			logger.LogWarning(
				argumentException,
				"Role assignment failed for user {UserId}: {Error}",
				id,
				argumentException.Message);

			return BadRequest(
				new ProblemDetails
				{
					Title = "Invalid Role",
					Detail = ProblemDetailConstants.Details.RoleAssignmentFailed,
					Status = StatusCodes.Status400BadRequest,
				});
		}
	}

	/// <summary>Removes a role from a user.</summary>
	/// <param name="id">
	/// The user ID.
	/// </param>
	/// <param name="role">
	/// The role name to remove.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// No content if successful; 404 if user or role not found; 409 if last admin.
	/// </returns>
	/// <response code="204">Role removed successfully.</response>
	/// <response code="404">If the user or role is not found.</response>
	/// <response code="409">If attempting to remove Admin role from last admin.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpDelete("{id}/roles/{role}", Name = "RemoveUserRole")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status409Conflict)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> RemoveUserRoleAsync(
		long id,
		string role,
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

		Result removed =
			await messageBus.InvokeAsync<Result>(
				new RemoveUserRoleCommand(id, role),
				cancellationToken);

		if (!removed.IsSuccess)
		{
			return NotFound(
				new ProblemDetails
				{
					Title = "Role Not Found",
					Detail = "Role not found on user",
					Status = StatusCodes.Status404NotFound,
				});
		}

		return NoContent();
	}
}