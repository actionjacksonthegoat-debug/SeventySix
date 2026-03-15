// <copyright file="AuthControllerBaseUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Api.Controllers;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers.Auth;

/// <summary>
/// Unit tests for <see cref="AuthControllerBase"/> helper methods.
/// Tests protected methods via a concrete test subclass using mocked dependencies.
/// </summary>
public sealed class AuthControllerBaseUnitTests
{
	private readonly IAuthCookieService CookieService =
		Substitute.For<IAuthCookieService>();

	private readonly IOptions<AuthSettings> AuthSettings =
		Options.Create(new AuthSettings());

	private readonly ILogger Logger =
		Substitute.For<ILogger>();

	private readonly TestAuthController Controller;

	/// <summary>
	/// Initializes a new instance of the <see cref="AuthControllerBaseUnitTests"/> class.
	/// </summary>
	public AuthControllerBaseUnitTests()
	{
		Controller =
			new TestAuthController(CookieService, AuthSettings, Logger);

		Controller.ControllerContext =
			new ControllerContext
			{
				HttpContext = new DefaultHttpContext(),
			};
	}

	#region HandleFailedResult

	[Fact]
	public void HandleFailedResult_WithErrorCode_IncludesErrorCodeInExtensions()
	{
		// Act
		ObjectResult result =
			Controller.CallHandleFailedResult(
				"Test Title",
				"Test Detail",
				StatusCodes.Status400BadRequest,
				"TEST_ERROR_CODE");

		// Assert
		result.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);

		ProblemDetails problemDetails =
			result.Value.ShouldBeOfType<ProblemDetails>();

		problemDetails.Title.ShouldBe("Test Title");
		problemDetails.Detail.ShouldBe("Test Detail");
		problemDetails.Extensions.TryGetValue(
			"errorCode",
			out object? errorCodeValue)
			.ShouldBeTrue();
		errorCodeValue.ShouldBe("TEST_ERROR_CODE");
	}

	[Fact]
	public void HandleFailedResult_WithoutErrorCode_ExcludesErrorCodeFromExtensions()
	{
		// Act
		ObjectResult result =
			Controller.CallHandleFailedResult(
				"Test Title",
				"Test Detail",
				StatusCodes.Status400BadRequest,
				null);

		// Assert
		result.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);

		ProblemDetails problemDetails =
			result.Value.ShouldBeOfType<ProblemDetails>();

		problemDetails.Extensions.ContainsKey("errorCode").ShouldBeFalse();
	}

	[Fact]
	public void HandleFailedResult_CustomStatusCode_ReturnsCorrectStatusCode()
	{
		// Act
		ObjectResult result =
			Controller.CallHandleFailedResult(
				"Unauthorized Title",
				null,
				StatusCodes.Status401Unauthorized,
				null);

		// Assert
		result.StatusCode.ShouldBe(StatusCodes.Status401Unauthorized);

		ProblemDetails problemDetails =
			result.Value.ShouldBeOfType<ProblemDetails>();

		problemDetails.Detail.ShouldBeNull();
	}

	#endregion

	#region ValidateSuccessfulAuthResult

	[Theory]
	[InlineData(
		null,
		"refresh-token",
		"user@example.com")]
	[InlineData(
		"access-token",
		null,
		"user@example.com")]
	[InlineData(
		"access-token",
		"refresh-token",
		null)]
	public void ValidateSuccessfulAuthResult_MissingRequiredField_ThrowsInvalidOperationException(
		string? accessToken,
		string? refreshToken,
		string? email)
	{
		// Arrange
		AuthResult incompleteResult =
			new(
				Success: true,
				AccessToken: accessToken,
				RefreshToken: refreshToken,
				ExpiresAt: DateTimeOffset.UtcNow.AddHours(1),
				Email: email);

		// Act & Assert
		Should.Throw<InvalidOperationException>(
			() => TestAuthController.CallValidateAndThrow(incompleteResult));
	}

	[Fact]
	public void ValidateSuccessfulAuthResult_MissingExpiresAt_ThrowsInvalidOperationException()
	{
		// Arrange
		AuthResult incompleteResult =
			new(
				Success: true,
				AccessToken: "access-token",
				RefreshToken: "refresh-token",
				ExpiresAt: null,
				Email: "user@example.com");

		// Act & Assert
		Should.Throw<InvalidOperationException>(
			() => TestAuthController.CallValidateAndThrow(incompleteResult));
	}

	#endregion

	#region CreateOAuthSuccessResponse

	[Fact]
	public void CreateOAuthSuccessResponse_ValidResult_ReturnsHtmlWithNonce()
	{
		// Arrange
		IOAuthCodeExchangeService codeExchange =
			Substitute.For<IOAuthCodeExchangeService>();

		codeExchange
			.StoreTokens(Arg.Any<OAuthCodeExchangeResult>())
			.Returns("test-one-time-code");

		CookieService
			.GetAllowedOrigin()
			.Returns("https://example.com");

		// Act
		ContentResult result =
			Controller.CallCreateOAuthSuccessResponse(
				codeExchange,
				accessToken: "access-token",
				refreshToken: "refresh-token",
				expiresAt: DateTimeOffset.UtcNow.AddHours(1),
				email: "user@example.com",
				fullName: null,
				requiresPasswordChange: false,
				isFirstLogin: false);

		// Assert
		result.ContentType.ShouldBe("text/html");
		result.Content.ShouldNotBeNullOrEmpty();
		result.Content.ShouldContain("oauth_success");
		result.Content.ShouldContain("test-one-time-code");

		System.Text.RegularExpressions.Match nonceMatch =
			System.Text.RegularExpressions.Regex.Match(
				result.Content!,
				"""<script nonce="([^"]+)">""");

		nonceMatch.Success.ShouldBeTrue("HTML should contain <script nonce=\"...\">");
		nonceMatch.Groups[1].Value.ShouldNotBeNullOrWhiteSpace();
	}

	[Fact]
	public void CreateOAuthSuccessResponse_ValidResult_SetsCspWithNonce()
	{
		// Arrange
		IOAuthCodeExchangeService codeExchange =
			Substitute.For<IOAuthCodeExchangeService>();

		codeExchange
			.StoreTokens(Arg.Any<OAuthCodeExchangeResult>())
			.Returns("test-one-time-code");

		CookieService
			.GetAllowedOrigin()
			.Returns("https://example.com");

		// Act
		ContentResult result =
			Controller.CallCreateOAuthSuccessResponse(
				codeExchange,
				accessToken: "access-token",
				refreshToken: "refresh-token",
				expiresAt: DateTimeOffset.UtcNow.AddHours(1),
				email: "user@example.com",
				fullName: null,
				requiresPasswordChange: false,
				isFirstLogin: false);

		// Assert — CSP override was set in HttpContext.Items
		// Key value matches SecurityHeaderConstants.ItemKeys.CspOverride (PR branch constant).
		const string CspOverrideKey = "SecurityHeaders.CspOverride";

		Controller.HttpContext.Items
			.TryGetValue(
				CspOverrideKey,
				out object? cspItem)
			.ShouldBeTrue();

		string csp =
			cspItem.ShouldBeOfType<string>();

		// Extract nonce from HTML to verify CSP matches
		System.Text.RegularExpressions.Match nonceMatch =
			System.Text.RegularExpressions.Regex.Match(
				result.Content!,
				"""<script nonce="([^"]+)">""");

		string nonce =
			nonceMatch.Groups[1].Value;

		csp.ShouldContain("default-src 'none'");
		csp.ShouldContain($"'nonce-{nonce}'");
	}

	[Fact]
	public void CreateOAuthSuccessResponse_TwoRequests_GenerateUniqueNonces()
	{
		// Two separate controller instances to simulate two distinct requests
		TestAuthController secondController =
			new(CookieService, AuthSettings, Logger)
			{
				ControllerContext = new ControllerContext
				{
					HttpContext = new DefaultHttpContext(),
				},
			};

		IOAuthCodeExchangeService codeExchange =
			Substitute.For<IOAuthCodeExchangeService>();

		codeExchange
			.StoreTokens(Arg.Any<OAuthCodeExchangeResult>())
			.Returns("code-1", "code-2");

		CookieService
			.GetAllowedOrigin()
			.Returns("https://example.com");

		// Act
		ContentResult result1 =
			Controller.CallCreateOAuthSuccessResponse(
				codeExchange,
				accessToken: "access-token",
				refreshToken: "refresh-token",
				expiresAt: DateTimeOffset.UtcNow.AddHours(1),
				email: "user@example.com",
				fullName: null,
				requiresPasswordChange: false,
				isFirstLogin: false);

		ContentResult result2 =
			secondController.CallCreateOAuthSuccessResponse(
				codeExchange,
				accessToken: "access-token",
				refreshToken: "refresh-token",
				expiresAt: DateTimeOffset.UtcNow.AddHours(1),
				email: "user@example.com",
				fullName: null,
				requiresPasswordChange: false,
				isFirstLogin: false);

		// Assert — nonces must differ
		System.Text.RegularExpressions.Match nonce1 =
			System.Text.RegularExpressions.Regex.Match(
				result1.Content!,
				"""<script nonce="([^"]+)">""");

		System.Text.RegularExpressions.Match nonce2 =
			System.Text.RegularExpressions.Regex.Match(
				result2.Content!,
				"""<script nonce="([^"]+)">""");

		nonce1.Success.ShouldBeTrue();
		nonce2.Success.ShouldBeTrue();
		nonce1.Groups[1].Value.ShouldNotBe(
			nonce2.Groups[1].Value,
			"Each invocation must produce a unique nonce");
	}

	#endregion

	#region CreateOAuthLinkSuccessResponse

	[Fact]
	public void CreateOAuthLinkSuccessResponse_ReturnsHtmlWithNonce()
	{
		// Arrange
		CookieService
			.GetAllowedOrigin()
			.Returns("https://example.com");

		// Act
		ContentResult result =
			Controller.CallCreateOAuthLinkSuccessResponse();

		// Assert
		result.ContentType.ShouldBe("text/html");
		result.Content.ShouldNotBeNullOrEmpty();
		result.Content.ShouldContain("oauth_link_success");

		System.Text.RegularExpressions.Match nonceMatch =
			System.Text.RegularExpressions.Regex.Match(
				result.Content!,
				"""<script nonce="([^"]+)">""");

		nonceMatch.Success.ShouldBeTrue("HTML should contain <script nonce=\"...\">");
		nonceMatch.Groups[1].Value.ShouldNotBeNullOrWhiteSpace();
	}

	[Fact]
	public void CreateOAuthLinkSuccessResponse_SetsCspWithNonce()
	{
		// Arrange
		CookieService
			.GetAllowedOrigin()
			.Returns("https://example.com");

		// Act
		ContentResult result =
			Controller.CallCreateOAuthLinkSuccessResponse();

		// Assert — CSP override was set in HttpContext.Items
		// Key value matches SecurityHeaderConstants.ItemKeys.CspOverride (PR branch constant).
		const string CspOverrideKey = "SecurityHeaders.CspOverride";

		Controller.HttpContext.Items
			.TryGetValue(
				CspOverrideKey,
				out object? cspItem)
			.ShouldBeTrue();

		string csp =
			cspItem.ShouldBeOfType<string>();

		// Extract nonce from HTML to verify CSP matches
		System.Text.RegularExpressions.Match nonceMatch =
			System.Text.RegularExpressions.Regex.Match(
				result.Content!,
				"""<script nonce="([^"]+)">""");

		string nonce =
			nonceMatch.Groups[1].Value;

		csp.ShouldContain("default-src 'none'");
		csp.ShouldContain($"'nonce-{nonce}'");
	}

	#endregion

	/// <summary>
	/// Minimal concrete implementation of <see cref="AuthControllerBase"/> for unit-testing
	/// protected helper methods without requiring HTTP infrastructure.
	/// </summary>
	/// <param name="cookieService">
	/// Cookie service.
	/// </param>
	/// <param name="authSettings">
	/// Auth settings.
	/// </param>
	/// <param name="logger">
	/// Logger.
	/// </param>
	private sealed class TestAuthController(
		IAuthCookieService cookieService,
		IOptions<AuthSettings> authSettings,
		ILogger logger)
		: AuthControllerBase(cookieService, authSettings, logger)
	{
		/// <summary>
		/// Exposes <see cref="AuthControllerBase.HandleFailedResult"/> for testing.
		/// </summary>
		/// <param name="title">
		/// ProblemDetails title.
		/// </param>
		/// <param name="detail">
		/// ProblemDetails detail.
		/// </param>
		/// <param name="statusCode">
		/// HTTP status code.
		/// </param>
		/// <param name="errorCode">
		/// Optional machine-readable error code.
		/// </param>
		/// <returns>
		/// Result object.
		/// </returns>
		public ObjectResult CallHandleFailedResult(
			string title,
			string? detail,
			int statusCode,
			string? errorCode) =>
			HandleFailedResult(title, detail, statusCode, errorCode);

		/// <summary>
		/// Calls <see cref="AuthControllerBase.ValidateSuccessfulAuthResult"/> and discards the return value.
		/// Intended to surface the exception thrown for invalid results.
		/// </summary>
		/// <param name="result">
		/// The auth result to validate.
		/// </param>
		public static void CallValidateAndThrow(AuthResult result) =>
			ValidateSuccessfulAuthResult(result);

		/// <summary>
		/// Exposes <see cref="AuthControllerBase.CreateOAuthSuccessResponse"/> for testing.
		/// Constructs a <see cref="ValidatedAuthResult"/> internally to avoid exposing the protected type.
		/// </summary>
		/// <param name="oauthCodeExchange">
		/// Code exchange service.
		/// </param>
		/// <param name="accessToken">
		/// Access token.
		/// </param>
		/// <param name="refreshToken">
		/// Refresh token.
		/// </param>
		/// <param name="expiresAt">
		/// Token expiration.
		/// </param>
		/// <param name="email">
		/// User email.
		/// </param>
		/// <param name="fullName">
		/// User full name.
		/// </param>
		/// <param name="requiresPasswordChange">
		/// Requires password change flag.
		/// </param>
		/// <param name="isFirstLogin">
		/// First login flag.
		/// </param>
		/// <returns>
		/// HTML content result.
		/// </returns>
		public ContentResult CallCreateOAuthSuccessResponse(
			IOAuthCodeExchangeService oauthCodeExchange,
			string accessToken,
			string refreshToken,
			DateTimeOffset expiresAt,
			string email,
			string? fullName,
			bool requiresPasswordChange,
			bool isFirstLogin) =>
			CreateOAuthSuccessResponse(
				oauthCodeExchange,
				new ValidatedAuthResult(
					accessToken,
					refreshToken,
					expiresAt,
					email,
					fullName,
					requiresPasswordChange,
					isFirstLogin));

		/// <summary>
		/// Exposes <see cref="AuthControllerBase.CreateOAuthLinkSuccessResponse"/> for testing.
		/// </summary>
		/// <returns>
		/// HTML content result.
		/// </returns>
		public ContentResult CallCreateOAuthLinkSuccessResponse() =>
			CreateOAuthLinkSuccessResponse();
	}
}