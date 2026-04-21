// <copyright file="TrustedDeviceControllerUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using SeventySix.Api.Controllers;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers.Auth;

/// <summary>
/// Unit tests for <see cref="TrustedDeviceController"/>.
/// Verifies response shapes and side effects using NSubstitute mocks.
/// </summary>
public sealed class TrustedDeviceControllerUnitTests
{
	private readonly ITrustedDeviceService DeviceService =
		Substitute.For<ITrustedDeviceService>();

	private readonly ITrustedDeviceRevocationService RevocationService =
		Substitute.For<ITrustedDeviceRevocationService>();

	private readonly IAuthCookieService CookieService =
		Substitute.For<IAuthCookieService>();

	private readonly TrustedDeviceController Controller;

	/// <summary>
	/// Initializes a new instance of the <see cref="TrustedDeviceControllerUnitTests"/> class.
	/// </summary>
	public TrustedDeviceControllerUnitTests()
	{
		Controller =
			new TrustedDeviceController(
				DeviceService,
				RevocationService,
				CookieService);

		Controller.ControllerContext =
			new ControllerContext
			{
				HttpContext = new DefaultHttpContext()
			};
	}

	/// <summary>
	/// Sets the controller's user claim so <c>User.GetUserId()</c> returns the specified ID.
	/// </summary>
	/// <param name="userId">
	/// The user ID to embed in the sub claim.
	/// </param>
	private void SetAuthenticatedUser(long userId)
	{
		ClaimsIdentity identity =
			new(
				[
					new Claim(
						JwtRegisteredClaimNames.Sub,
						userId.ToString())
				],
				"Bearer");

		Controller.ControllerContext.HttpContext.User =
			new ClaimsPrincipal(identity);
	}

	#region GetDevicesAsync

	/// <summary>
	/// Verifies 200 OK with device list is returned for an authenticated user.
	/// </summary>
	[Fact]
	public async Task GetDevicesAsync_AuthenticatedUser_ReturnsOkWithDevicesAsync()
	{
		// Arrange
		SetAuthenticatedUser(42);

		IReadOnlyList<TrustedDeviceDto> devices =
			[
				new TrustedDeviceDto(
					1,
					"Chrome on Windows",
					DateTimeOffset.UtcNow,
					null,
					DateTimeOffset.UtcNow.AddDays(30),
					false)
			];

		DeviceService
			.GetUserDevicesAsync(
				42,
				Arg.Any<CancellationToken>())
			.Returns(devices);

		// Act
		ActionResult<IReadOnlyList<TrustedDeviceDto>> result =
			await Controller.GetDevicesAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult =
			result.Result.ShouldBeOfType<OkObjectResult>();

		okResult.StatusCode.ShouldBe(StatusCodes.Status200OK);
		okResult.Value.ShouldBe(devices);
	}

	/// <summary>
	/// Verifies 401 Unauthorized is returned when the user claim is missing.
	/// </summary>
	[Fact]
	public async Task GetDevicesAsync_MissingUserClaim_ReturnsUnauthorizedAsync()
	{
		// Arrange — no user set (anonymous context)

		// Act
		ActionResult<IReadOnlyList<TrustedDeviceDto>> result =
			await Controller.GetDevicesAsync(CancellationToken.None);

		// Assert
		result.Result.ShouldBeOfType<UnauthorizedResult>();
	}

	#endregion

	#region RevokeDeviceAsync

	/// <summary>
	/// Verifies 204 No Content is returned when the device is successfully revoked.
	/// </summary>
	[Fact]
	public async Task RevokeDeviceAsync_ExistingDevice_ReturnsNoContentAsync()
	{
		// Arrange
		SetAuthenticatedUser(42);

		RevocationService
			.RevokeDeviceAsync(
				42,
				7,
				Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		IActionResult result =
			await Controller.RevokeDeviceAsync(7, CancellationToken.None);

		// Assert
		result.ShouldBeOfType<NoContentResult>();
	}

	/// <summary>
	/// Verifies 404 Not Found is returned when the device does not exist.
	/// </summary>
	[Fact]
	public async Task RevokeDeviceAsync_DeviceNotFound_ReturnsNotFoundAsync()
	{
		// Arrange
		SetAuthenticatedUser(42);

		RevocationService
			.RevokeDeviceAsync(
				42,
				99,
				Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		IActionResult result =
			await Controller.RevokeDeviceAsync(99, CancellationToken.None);

		// Assert
		result.ShouldBeOfType<NotFoundResult>();
	}

	/// <summary>
	/// Verifies 401 Unauthorized is returned when the user claim is missing.
	/// </summary>
	[Fact]
	public async Task RevokeDeviceAsync_MissingUserClaim_ReturnsUnauthorizedAsync()
	{
		// Arrange — no user set

		// Act
		IActionResult result =
			await Controller.RevokeDeviceAsync(7, CancellationToken.None);

		// Assert
		result.ShouldBeOfType<UnauthorizedResult>();
	}

	#endregion

	#region RevokeAllDevicesAsync

	/// <summary>
	/// Verifies 204 No Content is returned and the trusted device cookie is cleared on success.
	/// </summary>
	[Fact]
	public async Task RevokeAllDevicesAsync_AuthenticatedUser_ClearsCookieAndReturnsNoContentAsync()
	{
		// Arrange
		SetAuthenticatedUser(42);

		RevocationService
			.RevokeAllAsync(
				42,
				Arg.Any<CancellationToken>())
			.Returns(Task.CompletedTask);

		// Act
		IActionResult result =
			await Controller.RevokeAllDevicesAsync(CancellationToken.None);

		// Assert
		result.ShouldBeOfType<NoContentResult>();
		CookieService.Received(1).ClearTrustedDeviceCookie();
	}

	/// <summary>
	/// Verifies 401 Unauthorized is returned when the user claim is missing.
	/// </summary>
	[Fact]
	public async Task RevokeAllDevicesAsync_MissingUserClaim_ReturnsUnauthorizedAsync()
	{
		// Arrange — no user set

		// Act
		IActionResult result =
			await Controller.RevokeAllDevicesAsync(CancellationToken.None);

		// Assert
		result.ShouldBeOfType<UnauthorizedResult>();
		CookieService.DidNotReceive().ClearTrustedDeviceCookie();
	}

	#endregion
}
