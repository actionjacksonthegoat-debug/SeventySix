// <copyright file="AuthControllerBase.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Base controller for authentication-related endpoints.
/// Provides common helper methods for auth result handling.
/// </summary>
/// <param name="cookieService">
/// Service for authentication cookie management.
/// </param>
/// <param name="authSettings">
/// Authentication settings including session inactivity configuration.
/// </param>
/// <param name="logger">
/// Logger for authentication operations.
/// </param>
public abstract class AuthControllerBase(
	IAuthCookieService cookieService,
	IOptions<AuthSettings> authSettings,
	ILogger logger) : ControllerBase
{
	/// <summary>
	/// Gets the logger instance.
	/// </summary>
	protected ILogger Logger { get; } = logger;

	/// <summary>
	/// Gets the cookie service.
	/// </summary>
	protected IAuthCookieService CookieService { get; } = cookieService;

	/// <summary>
	/// Gets the authentication settings.
	/// </summary>
	protected IOptions<AuthSettings> AuthSettings { get; } = authSettings;

	/// <summary>
	/// Handles a failed authentication result by logging and returning appropriate response.
	/// </summary>
	/// <param name="result">
	/// The failed auth result.
	/// </param>
	/// <param name="operationName">
	/// The name of the operation that failed, used for logging and title.
	/// </param>
	/// <param name="statusCode">
	/// The HTTP status code to return. Defaults to BadRequest (400).
	/// </param>
	/// <returns>
	/// An ObjectResult with appropriate status code and ProblemDetails.
	/// </returns>
	protected ObjectResult HandleFailedAuthResult(
		AuthResult result,
		string operationName,
		int statusCode = StatusCodes.Status400BadRequest)
	{
		Logger.LogWarning(
			"{Operation} failed. Error: {Error}, Code: {ErrorCode}",
			operationName,
			result.Error,
			result.ErrorCode);

		return StatusCode(
			statusCode,
			new ProblemDetails
			{
				Title = $"{operationName} Failed",
				Detail = result.Error,
				Status = statusCode,
				Extensions =
					{ ["errorCode"] = result.ErrorCode },
			});
	}

	/// <summary>
	/// Creates a failure response with a raw title and detail string.
	/// Use when the result type is not <see cref="AuthResult"/> or when bypassing automatic logging.
	/// </summary>
	/// <param name="title">
	/// A short, human-readable summary of the problem type.
	/// </param>
	/// <param name="detail">
	/// A human-readable explanation specific to this occurrence of the problem.
	/// </param>
	/// <param name="statusCode">
	/// The HTTP status code to return. Defaults to BadRequest (400).
	/// </param>
	/// <param name="errorCode">
	/// An optional machine-readable error code added to the Extensions dictionary.
	/// </param>
	/// <returns>
	/// An ObjectResult with appropriate status code and ProblemDetails.
	/// </returns>
	protected ObjectResult HandleFailedResult(
		string title,
		string? detail,
		int statusCode = StatusCodes.Status400BadRequest,
		string? errorCode = null)
	{
		ProblemDetails problemDetails =
			new()
			{
				Title = title,
				Detail = detail,
				Status = statusCode,
			};

		if (errorCode is not null)
		{
			problemDetails.Extensions["errorCode"] = errorCode;
		}

		return StatusCode(statusCode, problemDetails);
	}

	/// <summary>
	/// Gets client IP address from HttpContext.
	/// ForwardedHeadersMiddleware handles X-Forwarded-For validation.
	/// </summary>
	/// <returns>
	/// The client IP address as string, or null if unavailable.
	/// </returns>
	protected string? GetClientIpAddress() =>
		HttpContext.Connection.RemoteIpAddress?.ToString();

	/// <summary>
	/// Validates that a successful AuthResult contains all required fields.
	/// </summary>
	/// <param name="result">
	/// The authentication result to validate.
	/// </param>
	/// <returns>
	/// A validated result with non-nullable token fields.
	/// </returns>
	/// <exception cref="InvalidOperationException">
	/// Thrown when a successful result is missing required fields.
	/// </exception>
	protected static ValidatedAuthResult ValidateSuccessfulAuthResult(
		AuthResult result)
	{
		if (result.AccessToken is null
			|| result.RefreshToken is null
			|| result.ExpiresAt is null
			|| result.Email is null)
		{
			throw new InvalidOperationException(
				"Successful AuthResult must contain AccessToken, RefreshToken, ExpiresAt, and Email.");
		}

		return new ValidatedAuthResult(
			result.AccessToken,
			result.RefreshToken,
			result.ExpiresAt.Value,
			result.Email,
			result.FullName,
			result.RequiresPasswordChange);
	}

	/// <summary>
	/// Creates an AuthResponse from a validated auth result.
	/// </summary>
	/// <param name="validatedResult">
	/// The validated authentication result.
	/// </param>
	/// <returns>
	/// An authentication response for the client.
	/// </returns>
	protected AuthResponse CreateAuthResponse(
		ValidatedAuthResult validatedResult)
	{
		SessionInactivitySettings inactivity =
			AuthSettings.Value.SessionInactivity;

		return new(
			AccessToken: validatedResult.AccessToken,
			ExpiresAt: validatedResult.ExpiresAt,
			Email: validatedResult.Email,
			FullName: validatedResult.FullName,
			RequiresPasswordChange: validatedResult.RequiresPasswordChange,
			SessionInactivityMinutes: inactivity.Enabled
				? inactivity.TimeoutMinutes
				: 0,
			SessionWarningSeconds: inactivity.Enabled
				? inactivity.WarningSeconds
				: 0);
	}

	/// <summary>
	/// Validated authentication result with non-nullable token fields.
	/// </summary>
	/// <param name="AccessToken">
	/// The JWT access token.
	/// </param>
	/// <param name="RefreshToken">
	/// The refresh token.
	/// </param>
	/// <param name="ExpiresAt">
	/// Token expiration time.
	/// </param>
	/// <param name="Email">
	/// User's email address.
	/// </param>
	/// <param name="FullName">
	/// User's full name (optional).
	/// </param>
	/// <param name="RequiresPasswordChange">
	/// Whether user must change password.
	/// </param>
	protected readonly record struct ValidatedAuthResult(
		string AccessToken,
		string RefreshToken,
		DateTimeOffset ExpiresAt,
		string Email,
		string? FullName,
		bool RequiresPasswordChange);

	/// <summary>
	/// Creates HTML response that posts OAuth authorization code to parent window.
	/// Tokens are stored server-side; client exchanges code for tokens via API.
	/// </summary>
	/// <param name="oauthCodeExchange">
	/// OAuth code exchange service.
	/// </param>
	/// <param name="validatedResult">
	/// The validated authentication result containing tokens and user info.
	/// </param>
	/// <returns>
	/// HTML content result.
	/// </returns>
	protected ContentResult CreateOAuthSuccessResponse(
		IOAuthCodeExchangeService oauthCodeExchange,
		ValidatedAuthResult validatedResult)
	{
		string origin =
			CookieService.GetAllowedOrigin();

		// Store tokens and get one-time code (60 second TTL)
		string code =
			oauthCodeExchange.StoreTokens(
				validatedResult.AccessToken,
				validatedResult.RefreshToken,
				validatedResult.ExpiresAt,
				validatedResult.Email,
				validatedResult.FullName,
				validatedResult.RequiresPasswordChange);

		string html =
			$$"""
			<!DOCTYPE html>
			<html>
			<head><title>OAuth Complete</title></head>
			<body>
			<script>
				if (window.opener) {
					window.opener.postMessage({
						type: 'oauth_success',
						code: '{{code}}'
					}, '{{origin}}');
				}
				window.close();
			</script>
			<p>Authentication complete. This window should close automatically.</p>
			</body>
			</html>
			""";

		return Content(html, MediaTypeConstants.TextHtml);
	}

	/// <summary>
	/// Creates HTML response that posts OAuth error to parent window.
	/// </summary>
	/// <param name="error">
	/// The error message.
	/// </param>
	/// <returns>
	/// HTML content result.
	/// </returns>
	protected ContentResult CreateOAuthErrorResponse(string error)
	{
		string origin =
			CookieService.GetAllowedOrigin();

		string escapedError =
			Uri.EscapeDataString(error);

		string html =
			$$"""
			<!DOCTYPE html>
			<html>
			<head><title>OAuth Error</title></head>
			<body>
			<script>
				if (window.opener) {
					window.opener.postMessage({
						type: 'oauth_error',
						error: '{{escapedError}}'
					}, '{{origin}}');
				}
				window.close();
			</script>
			<p>Authentication failed. This window should close automatically.</p>
			</body>
			</html>
			""";

		return Content(html, MediaTypeConstants.TextHtml);
	}

	/// <summary>
	/// Creates HTML response that posts OAuth link success to parent window.
	/// </summary>
	/// <returns>
	/// HTML content result.
	/// </returns>
	protected ContentResult CreateOAuthLinkSuccessResponse()
	{
		string origin =
			CookieService.GetAllowedOrigin();

		string html =
			$$"""
			<!DOCTYPE html>
			<html>
			<head><title>Account Linked</title></head>
			<body>
			<script>
				if (window.opener) {
					window.opener.postMessage({
						type: 'oauth_link_success'
					}, '{{origin}}');
				}
				window.close();
			</script>
			<p>Account linked. This window should close automatically.</p>
			</body>
			</html>
			""";

		return Content(html, MediaTypeConstants.TextHtml);
	}
}
