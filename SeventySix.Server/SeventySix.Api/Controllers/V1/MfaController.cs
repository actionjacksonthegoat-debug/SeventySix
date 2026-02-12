// <copyright file="MfaController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Multi-factor authentication API endpoints.
/// Handles email MFA verification, TOTP enrollment/management, and backup codes.
/// </summary>
/// <param name="messageBus">
/// The Wolverine message bus for CQRS operations.
/// </param>
/// <param name="cookieService">
/// Service for authentication cookie management.
/// </param>
/// <param name="trustedDeviceSettings">
/// Trusted device configuration for cookie lifetime.
/// </param>
/// <param name="logger">
/// Logger for MFA operations.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/auth/mfa")]
public class MfaController(
	IMessageBus messageBus,
	IAuthCookieService cookieService,
	IOptions<TrustedDeviceSettings> trustedDeviceSettings,
	ILogger<MfaController> logger) : AuthControllerBase(cookieService, logger)
{
	/// <summary>
	/// Verifies an MFA code and completes authentication.
	/// </summary>
	/// <param name="request">
	/// The verification request containing challenge token and code.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie on successful verification.
	/// </returns>
	/// <response code="200">MFA verification successful.</response>
	/// <response code="400">Invalid or expired code.</response>
	/// <response code="429">Too many verification attempts.</response>
	[HttpPost("verify")]
	[EnableRateLimiting(RateLimitPolicyConstants.MfaVerify)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests)]
	public async Task<ActionResult<AuthResponse>> VerifyMfaAsync(
		[FromBody] VerifyMfaRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();
		string? userAgent =
			Request.Headers.UserAgent.ToString();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new VerifyMfaCommand(
					request,
					clientIp,
					userAgent),
				cancellationToken);

		if (!result.Success)
		{
			return HandleFailedAuthResult(result, "MFA Verification");
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		CookieService.SetRefreshTokenCookie(validatedResult.RefreshToken);
		SetTrustedDeviceCookieIfPresent(result);

		return Ok(CreateAuthResponse(validatedResult));
	}

	/// <summary>
	/// Resends the MFA verification code.
	/// </summary>
	/// <param name="request">
	/// The resend request containing challenge token.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">Code resent successfully.</response>
	/// <response code="400">Invalid challenge or cooldown not elapsed.</response>
	/// <response code="429">Too many resend attempts.</response>
	[HttpPost("resend")]
	[EnableRateLimiting(RateLimitPolicyConstants.MfaResend)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests)]
	public async Task<IActionResult> ResendMfaCodeAsync(
		[FromBody] ResendMfaCodeRequest request,
		CancellationToken cancellationToken)
	{
		MfaChallengeRefreshResult result =
			await messageBus.InvokeAsync<MfaChallengeRefreshResult>(
				new ResendMfaCodeCommand(request),
				cancellationToken);

		if (!result.Success)
		{
			Logger.LogWarning(
				"MFA code resend failed. Code: {ErrorCode}",
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "MFA Resend Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		return NoContent();
	}

	/// <summary>
	/// Verifies a TOTP code during MFA authentication.
	/// </summary>
	/// <param name="request">
	/// The verification request containing challenge token and TOTP code.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie on successful verification.
	/// </returns>
	/// <response code="200">TOTP verification successful.</response>
	/// <response code="400">Invalid or expired code.</response>
	/// <response code="429">Too many verification attempts.</response>
	[HttpPost("verify-totp")]
	[EnableRateLimiting(RateLimitPolicyConstants.MfaVerify)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests)]
	public async Task<ActionResult<AuthResponse>> VerifyTotpAsync(
		[FromBody] VerifyTotpRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();
		string? userAgent =
			Request.Headers.UserAgent.ToString();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new VerifyTotpCodeCommand(
					request,
					clientIp,
					userAgent),
				cancellationToken);

		if (!result.Success)
		{
			return HandleFailedAuthResult(result, "TOTP Verification");
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		CookieService.SetRefreshTokenCookie(validatedResult.RefreshToken);
		SetTrustedDeviceCookieIfPresent(result);

		return Ok(CreateAuthResponse(validatedResult));
	}

	/// <summary>
	/// Verifies a backup code during MFA authentication.
	/// </summary>
	/// <param name="request">
	/// The verification request containing challenge token and backup code.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie on successful verification.
	/// </returns>
	/// <response code="200">Backup code verification successful.</response>
	/// <response code="400">Invalid or already used code.</response>
	/// <response code="429">Too many verification attempts.</response>
	[HttpPost("verify-backup")]
	[EnableRateLimiting(RateLimitPolicyConstants.MfaVerify)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests)]
	public async Task<ActionResult<AuthResponse>> VerifyBackupCodeAsync(
		[FromBody] VerifyBackupCodeRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();
		string? userAgent =
			Request.Headers.UserAgent.ToString();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new VerifyBackupCodeCommand(
					request,
					clientIp,
					userAgent),
				cancellationToken);

		if (!result.Success)
		{
			return HandleFailedAuthResult(result, "Backup Code Verification");
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		CookieService.SetRefreshTokenCookie(validatedResult.RefreshToken);
		SetTrustedDeviceCookieIfPresent(result);

		return Ok(CreateAuthResponse(validatedResult));
	}

	/// <summary>
	/// Initiates TOTP enrollment for the authenticated user.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// TOTP setup information including secret and QR code URI.
	/// </returns>
	/// <response code="200">TOTP enrollment initiated.</response>
	/// <response code="400">TOTP already configured or other error.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpPost("totp/setup")]
	[Authorize]
	[ProducesResponseType(typeof(TotpSetupResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized)]
	public async Task<ActionResult<TotpSetupResponse>> InitiateTotpEnrollmentAsync(
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		TotpSetupResult result =
			await messageBus.InvokeAsync<TotpSetupResult>(
				new InitiateTotpEnrollmentCommand(userId),
				cancellationToken);

		if (!result.Success)
		{
			Logger.LogWarning(
				"TOTP enrollment initiation failed for user {UserId}. Code: {ErrorCode}",
				userId,
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "TOTP Enrollment Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		return Ok(
			new TotpSetupResponse(
				result.Secret!,
				result.QrCodeUri!));
	}

	/// <summary>
	/// Confirms TOTP enrollment by verifying a code from the authenticator app.
	/// </summary>
	/// <param name="request">
	/// The confirmation request containing the TOTP code.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">TOTP enrollment confirmed.</response>
	/// <response code="400">Invalid code or enrollment not initiated.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpPost("totp/confirm")]
	[Authorize]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> ConfirmTotpEnrollmentAsync(
		[FromBody] ConfirmTotpEnrollmentRequest request,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		Shared.POCOs.Result result =
			await messageBus.InvokeAsync<Shared.POCOs.Result>(
				new ConfirmTotpEnrollmentCommand(userId, request),
				cancellationToken);

		if (!result.IsSuccess)
		{
			Logger.LogWarning(
				"TOTP enrollment confirmation failed for user {UserId}",
				userId);

			return BadRequest(
				new ProblemDetails
				{
					Title = "TOTP Confirmation Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
				});
		}

		return NoContent();
	}

	/// <summary>
	/// Disables TOTP authentication for the authenticated user.
	/// </summary>
	/// <param name="request">
	/// The request containing password for verification.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">TOTP disabled successfully.</response>
	/// <response code="400">Invalid password or TOTP not configured.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpPost("totp/disable")]
	[Authorize]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> DisableTotpAsync(
		[FromBody] DisableTotpRequest request,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		Shared.POCOs.Result result =
			await messageBus.InvokeAsync<Shared.POCOs.Result>(
				new DisableTotpCommand(userId, request),
				cancellationToken);

		if (!result.IsSuccess)
		{
			Logger.LogWarning(
				"TOTP disable failed for user {UserId}",
				userId);

			return BadRequest(
				new ProblemDetails
				{
					Title = "TOTP Disable Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
				});
		}

		return NoContent();
	}

	/// <summary>
	/// Generates new backup codes for the authenticated user.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of generated backup codes (shown once only).
	/// </returns>
	/// <response code="200">Backup codes generated.</response>
	/// <response code="400">Error generating codes.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpPost("backup-codes")]
	[Authorize]
	[ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized)]
	public async Task<ActionResult<IReadOnlyList<string>>> GenerateBackupCodesAsync(
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		BackupCodesResult result =
			await messageBus.InvokeAsync<BackupCodesResult>(
				new GenerateBackupCodesCommand(userId),
				cancellationToken);

		if (!result.Success)
		{
			Logger.LogWarning(
				"Backup code generation failed for user {UserId}. Code: {ErrorCode}",
				userId,
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "Backup Code Generation Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		return Ok(result.Codes);
	}

	/// <summary>
	/// Gets the count of remaining unused backup codes.
	/// </summary>
	/// <param name="backupCodeService">
	/// Backup code service for count retrieval.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The number of remaining backup codes.
	/// </returns>
	/// <response code="200">Remaining count returned.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpGet("backup-codes/remaining")]
	[Authorize]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized)]
	public async Task<ActionResult<int>> GetBackupCodesRemainingAsync(
		[FromServices] IBackupCodeService backupCodeService,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		int remaining =
			await backupCodeService.GetRemainingCountAsync(
				userId,
				cancellationToken);

		return Ok(remaining);
	}

	/// <summary>
	/// Sets the trusted device cookie when the auth result contains a device token.
	/// </summary>
	/// <param name="result">
	/// The auth result to check for a trusted device token.
	/// </param>
	private void SetTrustedDeviceCookieIfPresent(AuthResult result)
	{
		if (result.TrustedDeviceToken is not null)
		{
			CookieService.SetTrustedDeviceCookie(
				result.TrustedDeviceToken,
				trustedDeviceSettings.Value.TokenLifetimeDays);
		}
	}
}