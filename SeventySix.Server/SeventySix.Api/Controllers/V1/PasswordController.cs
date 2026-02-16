// <copyright file="PasswordController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using SeventySix.Api.Attributes;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using SeventySix.Shared.POCOs;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Password management API endpoints.
/// Handles password change, forgot password, and set password flows.
/// </summary>
/// <param name="messageBus">
/// The Wolverine message bus for CQRS operations.
/// </param>
/// <param name="cookieService">
/// Service for authentication cookie management.
/// </param>
/// <param name="logger">
/// Logger for password operations.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/auth/password")]
public class PasswordController(
	IMessageBus messageBus,
	IAuthCookieService cookieService,
	IOptions<AuthSettings> authSettings,
	ILogger<PasswordController> logger) : AuthControllerBase(cookieService, authSettings, logger)
{
	/// <summary>
	/// Changes the current user's password.
	/// </summary>
	/// <param name="request">
	/// Password change request.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">Password changed successfully.</response>
	/// <response code="400">Invalid current password or validation error.</response>
	/// <response code="401">Not authenticated.</response>
	[HttpPost("change")]
	[Authorize]
	[AllowWithPendingPasswordChange]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> ChangePasswordAsync(
		[FromBody] ChangePasswordRequest request,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new ChangePasswordCommand(userId, request),
				cancellationToken);

		if (!result.Success)
		{
			return HandleFailedAuthResult(result, "Password Change");
		}

		// Clear refresh token after password change
		CookieService.ClearRefreshTokenCookie();

		return NoContent();
	}

	/// <summary>
	/// Initiates password reset for a user by email.
	/// </summary>
	/// <remarks>
	/// Always returns 200 OK to prevent email enumeration attacks.
	/// Email is only sent if the user exists and is active.
	/// </remarks>
	/// <param name="request">
	/// Forgot password request with email.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// 200 OK regardless of whether email exists.
	/// </returns>
	/// <response code="200">Request processed (email sent if user exists).</response>
	/// <response code="400">Invalid email format.</response>
	/// <response code="429">Too many requests.</response>
	[HttpPost("forgot")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests)]
	public async Task<IActionResult> ForgotPasswordAsync(
		[FromBody] ForgotPasswordRequest request,
		CancellationToken cancellationToken)
	{
		await messageBus.InvokeAsync(
			new InitiatePasswordResetByEmailCommand(request),
			cancellationToken);

		// Always return OK to prevent email enumeration
		return Ok(
			new MessageResponse(
				"If an account exists with this email, a reset link has been sent."));
	}

	/// <summary>
	/// Sets a new password using a password reset token.
	/// </summary>
	/// <remarks>
	/// Used for both:
	/// - New user welcome flow (initial password setup from welcome email)
	/// - Forgot password flow (password reset from reset email).
	///
	/// On success, returns auth tokens for immediate login.
	/// </remarks>
	/// <param name="request">
	/// Set password request with token and new password.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie.
	/// </returns>
	/// <response code="200">Password set successfully, includes auth tokens.</response>
	/// <response code="400">Invalid token, expired token, or validation error.</response>
	[HttpPost("set")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<AuthResponse>> SetPasswordAsync(
		[FromBody] SetPasswordRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new SetPasswordCommand(request, clientIp),
				cancellationToken);

		if (!result.Success)
		{
			return HandleFailedAuthResult(result, "Set Password");
		}

		CookieService.SetRefreshTokenCookie(
			result.RefreshToken!,
			rememberMe: false);

		return Ok(
			new AuthResponse(
				AccessToken: result.AccessToken!,
				ExpiresAt: result.ExpiresAt!.Value,
				Email: result.Email!,
				FullName: result.FullName,
				RequiresPasswordChange: false));
	}
}