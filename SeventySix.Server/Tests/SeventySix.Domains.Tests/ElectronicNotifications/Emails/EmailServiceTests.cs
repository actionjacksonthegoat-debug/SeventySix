// <copyright file="EmailServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Contracts.Emails;
using SeventySix.Shared.Interfaces;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails;

/// <summary>
/// Unit tests for EmailService.
/// </summary>
/// <remarks>
/// Coverage Focus:
/// - SendWelcomeEmailAsync (enabled/disabled modes)
/// - SendPasswordResetEmailAsync (enabled/disabled modes)
/// - Argument validation
/// - Email type validation (Verification, MfaVerification)
/// See <see cref="EmailServiceRateLimitingTests"/> for rate limiting coverage.
/// </remarks>
public sealed class EmailServiceTests
{
	private static readonly Uri BrevoBaseAddress =
		new("https://api.brevo.com");

	private readonly ILogger<EmailService> Logger =
		Substitute.For<ILogger<EmailService>>();

	private readonly IRateLimitingService RateLimitingService =
		Substitute.For<IRateLimitingService>();

	/// <summary>
	/// Creates configured <see cref="IOptions{EmailSettings}"/> for tests.
	/// </summary>
	/// <param name="enabled">
	/// Whether email sending is enabled.
	/// </param>
	/// <param name="clientBaseUrl">
	/// The client base URL used to build links.
	/// </param>
	/// <returns>
	/// A configured <see cref="IOptions{EmailSettings}"/>.
	/// </returns>
	private static IOptions<EmailSettings> CreateOptions(
		bool enabled = false,
		string clientBaseUrl = "https://test.example.com")
	{
		return Options.Create(
			new EmailSettings
			{
				Enabled = enabled,
				ClientBaseUrl = clientBaseUrl,
				FromAddress = "test@example.com",
				FromName = "Test Sender",
				ApiKey = "test-api-key",
				ApiUrl = "https://api.brevo.com",
			});
	}

	/// <summary>
	/// Creates a mock <see cref="IHttpClientFactory"/> returning the given
	/// <see cref="HttpClient"/>. The caller owns disposal of the HttpClient.
	/// </summary>
	private static IHttpClientFactory CreateMockHttpClientFactory(
		HttpClient httpClient)
	{
		IHttpClientFactory factory =
			Substitute.For<IHttpClientFactory>();

		factory
			.CreateClient(EmailService.BrevoHttpClientName)
			.Returns(httpClient);

		return factory;
	}

	/// <summary>
	/// Creates a <see cref="MockHttpMessageHandler"/> that returns a 201 Created
	/// response with a Brevo-style message ID. Both returned objects must be
	/// disposed by the caller.
	/// </summary>
	private static (MockHttpMessageHandler Handler, HttpResponseMessage Response)
		CreateSuccessHandler()
	{
		HttpResponseMessage response =
			new(HttpStatusCode.Created)
			{
				Content = new StringContent(
					"""{ "messageId": "test-123"}""",
					System.Text.Encoding.UTF8,
					"application/json"),
			};

		MockHttpMessageHandler handler =
			new((request, cancellationToken) =>
				Task.FromResult(response));

		return (handler, response);
	}

	#region SendEmailAsync Welcome Tests

	/// <summary>
	/// Verifies that SendEmailAsync logs the email instead of sending when disabled.
	/// </summary>
	[Fact]
	public async Task SendEmailAsync_Welcome_LogsEmail_WhenDisabledAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions(enabled: false);
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		// Act
		await service.SendEmailAsync(
			EmailTypeConstants.Welcome,
			"user@example.com",
			new Dictionary<string, string>
			{
				["username"] = "testuser",
				["resetToken"] = "reset-token-123",
			},
			CancellationToken.None);

		// Assert - should log but not throw
		Logger.ReceivedWithAnyArgs(1).LogWarning(default!);
	}

	/// <summary>
	/// Verifies that SendEmailAsync throws when the recipientEmail is empty.
	/// </summary>
	[Fact]
	public async Task SendEmailAsync_Welcome_ThrowsArgumentException_WhenEmailEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options = CreateOptions();
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(() =>
			service.SendEmailAsync(
				EmailTypeConstants.Welcome,
				"",
				new Dictionary<string, string>
				{
					["username"] = "testuser",
					["resetToken"] = "token",
				},
				CancellationToken.None));
	}

	/// <summary>
	/// Verifies that SendEmailAsync throws when the emailType is empty.
	/// </summary>
	[Fact]
	public async Task SendEmailAsync_ThrowsArgumentException_WhenEmailTypeEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options = CreateOptions();
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(() =>
			service.SendEmailAsync(
				"",
				"user@example.com",
				new Dictionary<string, string>
				{
					["username"] = "testuser",
					["resetToken"] = "token",
				},
				CancellationToken.None));
	}

	/// <summary>
	/// Verifies that SendEmailAsync throws when templateData is null.
	/// </summary>
	[Fact]
	public async Task SendEmailAsync_ThrowsArgumentNullException_WhenTemplateDataNullAsync()
	{
		// Arrange
		IOptions<EmailSettings> options = CreateOptions();
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentNullException>(() =>
			service.SendEmailAsync(
				EmailTypeConstants.Welcome,
				"user@example.com",
				null!,
				CancellationToken.None));
	}

	#endregion

	#region SendEmailAsync PasswordReset Tests

	/// <summary>
	/// Verifies that SendEmailAsync for password reset logs rather than sending when disabled.
	/// </summary>
	[Fact]
	public async Task SendEmailAsync_PasswordReset_LogsEmail_WhenDisabledAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions(enabled: false);
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		// Act
		await service.SendEmailAsync(
			EmailTypeConstants.PasswordReset,
			"user@example.com",
			new Dictionary<string, string>
			{
				["username"] = "testuser",
				["resetToken"] = "reset-token-456",
			},
			CancellationToken.None);

		// Assert - should log but not throw
		Logger.ReceivedWithAnyArgs(1).LogWarning(default!);
	}

	/// <summary>
	/// Verifies that SendEmailAsync for password reset throws when the email is empty.
	/// </summary>
	[Fact]
	public async Task SendEmailAsync_PasswordReset_ThrowsArgumentException_WhenEmailEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options = CreateOptions();
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(() =>
			service.SendEmailAsync(
				EmailTypeConstants.PasswordReset,
				"",
				new Dictionary<string, string>
				{
					["username"] = "testuser",
					["resetToken"] = "token",
				},
				CancellationToken.None));
	}

	/// <summary>
	/// Verifies that SendEmailAsync throws for an unsupported email type.
	/// </summary>
	[Fact]
	public async Task SendEmailAsync_ThrowsArgumentException_WhenEmailTypeUnsupportedAsync()
	{
		// Arrange
		IOptions<EmailSettings> options = CreateOptions();
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(() =>
			service.SendEmailAsync(
				"UnsupportedEmailType",
				"user@example.com",
				new Dictionary<string, string>(),
				CancellationToken.None));
	}

	/// <summary>
	/// Verifies that SendEmailAsync for password reset throws when the recipientEmail is empty.
	/// </summary>
	[Fact]
	public async Task SendEmailAsync_PasswordReset_ThrowsArgumentException_WhenRecipientEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options = CreateOptions();
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(() =>
			service.SendEmailAsync(
				EmailTypeConstants.PasswordReset,
				"",
				new Dictionary<string, string>
				{
					["username"] = "testuser",
					["resetToken"] = "token",
				},
				CancellationToken.None));
	}

	#endregion

	#region SendEmailAsync Verification + MFA Tests

	/// <summary>
	/// Verifies that SendEmailAsync logs the email instead of sending when disabled
	/// for Verification and MfaVerification email types.
	/// </summary>
	[Theory]
	[InlineData(EmailTypeConstants.Verification)]
	[InlineData(EmailTypeConstants.MfaVerification)]
	public async Task SendEmailAsync_LogsEmail_WhenDisabledAsync(string emailType)
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions(enabled: false);
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		Dictionary<string, string> templateData =
			emailType == EmailTypeConstants.Verification
				? new Dictionary<string, string>
				{
					["verificationToken"] = "verify-token-123",
				}
				: new Dictionary<string, string>
				{
					["code"] = "123456",
					["expirationMinutes"] = "5",
				};

		// Act
		await service.SendEmailAsync(
			emailType,
			"user@example.com",
			templateData,
			CancellationToken.None);

		// Assert - should log but not throw
		Logger.ReceivedWithAnyArgs(1).LogWarning(default!);
	}

	/// <summary>
	/// Verifies that Verification and MfaVerification email types complete successfully
	/// when Brevo returns 201 Created.
	/// </summary>
	[Theory]
	[InlineData(EmailTypeConstants.Verification)]
	[InlineData(EmailTypeConstants.MfaVerification)]
	public async Task SendEmailAsync_BrevoReturns201_CompletesSuccessfully_ForEmailTypeAsync(
		string emailType)
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions(enabled: true);

		IRateLimitingService rateLimiterMock =
			Substitute.For<IRateLimitingService>();

		rateLimiterMock
			.TryIncrementRequestCountAsync(
				ExternalApiConstants.BrevoEmail,
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(true);

		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);

		EmailService service =
			new(
				options,
				rateLimiterMock,
				httpClientFactory,
				Logger);

		Dictionary<string, string> templateData =
			emailType == EmailTypeConstants.Verification
				? new Dictionary<string, string>
				{
					["verificationToken"] = "verify-token-123",
				}
				: new Dictionary<string, string>
				{
					["code"] = "123456",
					["expirationMinutes"] = "5",
				};

		// Act — should not throw
		await service.SendEmailAsync(
			emailType,
			"test@example.com",
			templateData,
			CancellationToken.None);

		// Assert — slot NOT released (Brevo received the call)
		await rateLimiterMock
			.DidNotReceive()
			.TryDecrementRequestCountAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that MFA email with an invalid expirationMinutes value uses the default
	/// fallback of 5 minutes without throwing.
	/// </summary>
	[Fact]
	public async Task SendEmailAsync_MfaVerification_UsesDefaultExpiration_WhenParsingFailsAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions(enabled: false);
		(MockHttpMessageHandler handlerValue, HttpResponseMessage responseValue) =
			CreateSuccessHandler();
		using MockHttpMessageHandler handler = handlerValue;
		using HttpResponseMessage successResponse = responseValue;
		using HttpClient httpClient =
			new(handler) { BaseAddress = BrevoBaseAddress };
		IHttpClientFactory httpClientFactory =
			CreateMockHttpClientFactory(httpClient);
		EmailService service =
			new(
				options,
				RateLimitingService,
				httpClientFactory,
				Logger);

		// Act — should not throw even with invalid expirationMinutes
		await service.SendEmailAsync(
			EmailTypeConstants.MfaVerification,
			"user@example.com",
			new Dictionary<string, string>
			{
				["code"] = "123456",
				["expirationMinutes"] = "invalid",
			},
			CancellationToken.None);

		// Assert - logged the email (disabled mode) without exception
		Logger.ReceivedWithAnyArgs(1).LogWarning(default!);
	}

	#endregion
}