// <copyright file="UsersCommandController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Shared.POCOs;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// User command endpoints for state-changing operations.
/// Handles all POST, PUT, and DELETE operations for user resources.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="UsersCommandController"/> class.
/// </remarks>
/// <param name="messageBus">
/// The Wolverine message bus for dispatching commands and queries.
/// </param>
/// <param name="logger">
/// The logger instance for recording controller operations.
/// </param>
/// <param name="outputCacheStore">
/// The output cache store for cache eviction after mutations.
/// </param>
/// <exception cref="ArgumentNullException">Thrown when messageBus, logger, or outputCacheStore is null.</exception>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/users")]
public sealed class UsersCommandController(
	IMessageBus messageBus,
	ILogger<UsersCommandController> logger,
	IOutputCacheStore outputCacheStore) : ControllerBase
{
	#region Current User (/me) Endpoints

	/// <summary>
	/// Updates the current authenticated user's profile.
	/// </summary>
	/// <param name="request">
	/// The profile update request.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The updated user profile.
	/// </returns>
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
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		UserProfileDto? profile =
			await messageBus.InvokeAsync<UserProfileDto?>(
				new UpdateProfileCommand(userId, request),
				cancellationToken);

		return profile is null ? NotFound() : Ok(profile);
	}

	#endregion

	#region Admin User Management Endpoints

	/// <summary>
	/// Creates a new user.
	/// </summary>
	/// <param name="request">
	/// The user creation request containing user data.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The created user with location header.
	/// </returns>
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
	///
	/// If email rate limit is exceeded, user is created and email will be sent within 24 hours.
	/// Returns 201 Created with Location header pointing to the new resource.
	/// </remarks>
	/// <response code="201">User created. Welcome email sent.</response>
	/// <response code="202">User created. Email pending due to rate limiting.</response>
	[HttpPost(Name = "CreateUser")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
	[ProducesResponseType(typeof(UserDto), StatusCodes.Status202Accepted)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<UserDto>> CreateAsync(
		[FromBody] CreateUserRequest request,
		CancellationToken cancellationToken)
	{
		try
		{
			UserDto user =
				await messageBus.InvokeAsync<UserDto>(
					request,
					cancellationToken);

			await outputCacheStore.EvictByTagAsync(
				CachePolicyConstants.Users,
				cancellationToken);

			return CreatedAtRoute(
				"GetUserById",
				new { id = user.Id },
				user);
		}
		catch (EmailRateLimitException)
		{
			// User was created but email was rate limited
			UserDto? user =
				await messageBus.InvokeAsync<UserDto?>(
					new GetUserByEmailQuery(request.Email),
					cancellationToken);

			if (user is null)
			{
				return StatusCode(
					StatusCodes.Status500InternalServerError,
					new ProblemDetails
					{
						Title = "Unexpected Error",
						Detail = "User was created but could not be retrieved.",
					});
			}

			logger.LogWarning(
				"User {UserId} created but email rate limited",
				user.Id);

			await outputCacheStore.EvictByTagAsync(
				CachePolicyConstants.Users,
				cancellationToken);

			return AcceptedAtRoute(
				"GetUserById",
				new { id = user.Id },
				user);
		}
	}

	/// <summary>
	/// Updates an existing user.
	/// </summary>
	/// <param name="id">
	/// The unique identifier of the user to update.
	/// </param>
	/// <param name="request">
	/// The user update request containing updated user data.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The updated user.
	/// </returns>
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
			return BadRequest(
				new ProblemDetails
				{
					Title = "Invalid Request",
					Detail = "ID in URL does not match ID in request body",
					Status = StatusCodes.Status400BadRequest,
				});
		}

		UserDto user =
			await messageBus.InvokeAsync<UserDto>(
				request,
				cancellationToken);

		await outputCacheStore.EvictByTagAsync(
			CachePolicyConstants.Users,
			cancellationToken);

		return Ok(user);
	}

	/// <summary>
	/// Soft deletes a user by their identifier.
	/// </summary>
	/// <param name="id">
	/// The unique identifier of the user to delete.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// No content if successful.
	/// </returns>
	/// <response code="204">If the user was successfully deleted.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpDelete("{id}", Name = "DeleteUser")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> DeleteAsync(
		long id,
		CancellationToken cancellationToken)
	{
		string username =
			User.GetRequiredUsername();

		Result result =
			await messageBus.InvokeAsync<Result>(
				new DeleteUserCommand(
					id,
					username),
				cancellationToken);

		if (!result.IsSuccess)
		{
			return NotFound();
		}

		await outputCacheStore.EvictByTagAsync(
			CachePolicyConstants.Users,
			cancellationToken);

		return NoContent();
	}

	/// <summary>
	/// Restores a previously soft-deleted user.
	/// </summary>
	/// <param name="id">
	/// The unique identifier of the user to restore.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// No content if successful.
	/// </returns>
	/// <response code="204">If the user was successfully restored.</response>
	/// <response code="404">If the user is not found or not deleted.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("{id}/restore", Name = "RestoreUser")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> RestoreAsync(
		long id,
		CancellationToken cancellationToken)
	{
		Result result =
			await messageBus.InvokeAsync<Result>(
				new RestoreUserCommand(id),
				cancellationToken);

		if (!result.IsSuccess)
		{
			return NotFound();
		}

		await outputCacheStore.EvictByTagAsync(
			CachePolicyConstants.Users,
			cancellationToken);

		return NoContent();
	}

	/// <summary>
	/// Bulk activates multiple users.
	/// </summary>
	/// <param name="ids">
	/// The collection of user IDs to activate.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The number of users activated.
	/// </returns>
	/// <response code="200">Returns the count of activated users.</response>
	/// <response code="400">If the request is invalid.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("bulk/activate", Name = "BulkActivateUsers")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkActivateAsync(
		[FromBody] IEnumerable<long> ids,
		CancellationToken cancellationToken)
	{
		string username =
			User.GetRequiredUsername();

		int count =
			await messageBus.InvokeAsync<int>(
				new BulkUpdateActiveStatusCommand(
					ids,
					true,
					username),
				cancellationToken);

		if (count > 0)
		{
			await outputCacheStore.EvictByTagAsync(
				CachePolicyConstants.Users,
				cancellationToken);
		}

		return Ok(count);
	}

	/// <summary>
	/// Bulk deactivates multiple users.
	/// </summary>
	/// <param name="ids">
	/// The collection of user IDs to deactivate.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// The number of users deactivated.
	/// </returns>
	/// <response code="200">Returns the count of deactivated users.</response>
	/// <response code="400">If the request is invalid.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("bulk/deactivate", Name = "BulkDeactivateUsers")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<int>> BulkDeactivateAsync(
		[FromBody] IEnumerable<long> ids,
		CancellationToken cancellationToken)
	{
		string username =
			User.GetRequiredUsername();

		int count =
			await messageBus.InvokeAsync<int>(
				new BulkUpdateActiveStatusCommand(
					ids,
					false,
					username),
				cancellationToken);

		if (count > 0)
		{
			await outputCacheStore.EvictByTagAsync(
				CachePolicyConstants.Users,
				cancellationToken);
		}

		return Ok(count);
	}

	/// <summary>
	/// Initiates a password reset for a user (sends reset email).
	/// </summary>
	/// <remarks>
	/// Admin action to send a password reset email to a user.
	/// The user will receive an email with a link to set their new password.
	/// </remarks>
	/// <param name="id">
	/// The unique identifier of the user.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// No content if email sent successfully.
	/// </returns>
	/// <response code="204">Password reset email sent successfully.</response>
	/// <response code="404">If the user is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	[HttpPost("{id}/reset-password", Name = "ResetUserPassword")]
	[Authorize(Policy = PolicyConstants.AdminOnly)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<IActionResult> ResetPasswordAsync(
		long id,
		CancellationToken cancellationToken)
	{
		// Verify user exists
		UserDto? user =
			await messageBus.InvokeAsync<UserDto?>(
				new GetUserByIdQuery(id),
				cancellationToken);

		if (user is null)
		{
			return NotFound();
		}

		Result result =
			await messageBus.InvokeAsync<Result>(
				new InitiatePasswordResetCommand(id, IsNewUser: false),
				cancellationToken);

		if (!result.IsSuccess)
		{
			logger.LogWarning(
				"Password reset failed for user {UserId}: {Error}",
				id,
				result.Error);

			return NotFound();
		}

		return NoContent();
	}

	#endregion
}