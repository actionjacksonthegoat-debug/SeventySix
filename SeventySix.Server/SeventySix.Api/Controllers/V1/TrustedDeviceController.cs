// <copyright file="TrustedDeviceController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Trusted device management API endpoints.
/// Allows authenticated users to view and revoke trusted devices.
/// </summary>
/// <param name="trustedDeviceService">
/// Service for trusted device operations.
/// </param>
/// <param name="cookieService">
/// Service for authentication cookie management (trusted device cookie).
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/auth/trusted-devices")]
[Authorize]
public sealed class TrustedDeviceController(
	ITrustedDeviceService trustedDeviceService,
	IAuthCookieService cookieService) : ControllerBase
{
	/// <summary>
	/// Gets the authenticated user's trusted devices.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of trusted devices.
	/// </returns>
	/// <response code="200">Returns the list of trusted devices.</response>
	/// <response code="401">Not authenticated.</response>
	[HttpGet]
	[ProducesResponseType(
		typeof(IReadOnlyList<TrustedDeviceDto>),
		StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public async Task<ActionResult<IReadOnlyList<TrustedDeviceDto>>> GetDevicesAsync(
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		IReadOnlyList<TrustedDeviceDto> devices =
			await trustedDeviceService.GetUserDevicesAsync(
				userId,
				cancellationToken);

		return Ok(devices);
	}

	/// <summary>
	/// Revokes a specific trusted device.
	/// </summary>
	/// <param name="deviceId">
	/// The device ID to revoke.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">Device revoked successfully.</response>
	/// <response code="401">Not authenticated.</response>
	/// <response code="404">Device not found.</response>
	[HttpDelete("{deviceId:long}")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<IActionResult> RevokeDeviceAsync(
		long deviceId,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		bool revoked =
			await trustedDeviceService.RevokeDeviceAsync(
				userId,
				deviceId,
				cancellationToken);

		if (!revoked)
		{
			return NotFound();
		}

		return NoContent();
	}

	/// <summary>
	/// Revokes all trusted devices for the authenticated user.
	/// Also clears the trusted device cookie.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">All devices revoked successfully.</response>
	/// <response code="401">Not authenticated.</response>
	[HttpDelete]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> RevokeAllDevicesAsync(
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		await trustedDeviceService.RevokeAllAsync(
			userId,
			cancellationToken);

		cookieService.ClearTrustedDeviceCookie();

		return NoContent();
	}
}