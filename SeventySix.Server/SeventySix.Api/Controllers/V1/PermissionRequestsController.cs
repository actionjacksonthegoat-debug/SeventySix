// <copyright file="PermissionRequestsController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Identity;
using SeventySix.Identity.Commands.ApprovePermissionRequest;
using SeventySix.Identity.Commands.BulkApprovePermissionRequests;
using SeventySix.Identity.Commands.BulkRejectPermissionRequests;
using SeventySix.Identity.Commands.CreatePermissionRequest;
using SeventySix.Identity.Commands.RejectPermissionRequest;
using SeventySix.Identity.Constants;
using SeventySix.Identity.Queries.GetAllPermissionRequests;
using SeventySix.Identity.Queries.GetAvailableRoles;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Permission requests API endpoints.
/// Provides RESTful operations for managing user permission/role requests.
/// </summary>
/// <param name="messageBus">The Wolverine message bus.</param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/users")]
public class PermissionRequestsController(IMessageBus messageBus)
	: ControllerBase
{
	/// <summary>
	/// Gets all pending permission requests (Admin only).
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>A list of all pending permission requests.</returns>
	/// <response code="200">Returns the list of permission requests.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpGet("permission-requests", Name = "GetPermissionRequests")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(
		typeof(IEnumerable<PermissionRequestDto>),
		StatusCodes.Status200OK
	)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<
		ActionResult<IEnumerable<PermissionRequestDto>>
	> GetPermissionRequestsAsync(CancellationToken cancellationToken)
	{
		IEnumerable<PermissionRequestDto> requests =
			await messageBus.InvokeAsync<IEnumerable<PermissionRequestDto>>(
				new GetAllPermissionRequestsQuery(),
				cancellationToken);

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
	[ProducesResponseType(
		typeof(IEnumerable<AvailableRoleDto>),
		StatusCodes.Status200OK
	)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<
		ActionResult<IEnumerable<AvailableRoleDto>>
	> GetAvailableRolesAsync(CancellationToken cancellationToken)
	{
		int userId = User.GetRequiredUserId();

		IEnumerable<AvailableRoleDto> roles =
			await messageBus.InvokeAsync<
				IEnumerable<AvailableRoleDto>
		>(new GetAvailableRolesQuery(userId), cancellationToken);

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
		int userId = User.GetRequiredUserId();

		string username = User.GetRequiredUsername();

		CreatePermissionRequestCommand command =
			new(userId, username, request);

		await messageBus.InvokeAsync(command, cancellationToken);

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
		Name = "ApprovePermissionRequest"
	)]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> ApprovePermissionRequestAsync(
		int id,
		CancellationToken cancellationToken)
	{
		bool result =
			await messageBus.InvokeAsync<bool>(
				new ApprovePermissionRequestCommand(id),
				cancellationToken);

		if (!result)
		{
			return NotFound();
		}

		return NoContent();
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
		Name = "RejectPermissionRequest"
	)]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> RejectPermissionRequestAsync(
		int id,
		CancellationToken cancellationToken)
	{
		bool result =
			await messageBus.InvokeAsync<bool>(
				new RejectPermissionRequestCommand(id),
				cancellationToken);

		if (!result)
		{
			return NotFound();
		}

		return NoContent();
	}

	/// <summary>Bulk approves permission requests.</summary>
	/// <param name="ids">The IDs of permission requests to approve.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The count of approved requests.</returns>
	/// <response code="200">Returns the count of approved requests.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost(
		"permission-requests/bulk/approve",
		Name = "BulkApprovePermissionRequests"
	)]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkApprovePermissionRequestsAsync(
		[FromBody] IEnumerable<int> ids,
		CancellationToken cancellationToken)
	{
		int count =
			await messageBus.InvokeAsync<int>(
				new BulkApprovePermissionRequestsCommand(ids),
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
		Name = "BulkRejectPermissionRequests"
	)]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkRejectPermissionRequestsAsync(
		[FromBody] IEnumerable<int> ids,
		CancellationToken cancellationToken)
	{
		int count =
			await messageBus.InvokeAsync<int>(
				new BulkRejectPermissionRequestsCommand(ids),
				cancellationToken);

		return Ok(count);
	}
}