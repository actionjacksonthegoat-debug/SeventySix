// <copyright file="EmailServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Constants;
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
/// - URL building with token encoding
/// - Brevo HTTP API integration
/// - Rate limiting: slot consumed on Brevo response, released on connection failure.
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

	#region SendWelcomeEmailAsync Tests

	/// <summary>
	/// Verifies that SendWelcomeEmailAsync logs the email instead of sending when disabled.
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_LogsEmail_WhenDisabledAsync()
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
		await service.SendWelcomeEmailAsync(
			"user@example.com",
			"testuser",
			"reset-token-123",
			CancellationToken.None);

		// Assert - should log but not throw
		Logger.ReceivedWithAnyArgs(1).LogWarning(default!);
	}

	/// <summary>
	/// Verifies that SendWelcomeEmailAsync throws when the email is empty.
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_ThrowsArgumentException_WhenEmailEmptyAsync()
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
			service.SendWelcomeEmailAsync(
				"",
				"testuser",
				"token",
				CancellationToken.None));
	}

	/// <summary>
	/// Verifies that SendWelcomeEmailAsync throws when the username is empty.
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_ThrowsArgumentException_WhenUsernameEmptyAsync()
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
			service.SendWelcomeEmailAsync(
				"user@example.com",
				"",
				"token",
				CancellationToken.None));
	}

	/// <summary>
	/// Verifies that SendWelcomeEmailAsync throws when the token is empty.
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_ThrowsArgumentException_WhenTokenEmptyAsync()
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
			service.SendWelcomeEmailAsync(
				"user@example.com",
				"testuser",
				"",
				CancellationToken.None));
	}

	#endregion

	#region SendPasswordResetEmailAsync Tests

	/// <summary>
	/// Verifies that SendPasswordResetEmailAsync logs rather than sending when disabled.
	/// </summary>
	[Fact]
	public async Task SendPasswordResetEmailAsync_LogsEmail_WhenDisabledAsync()
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
		await service.SendPasswordResetEmailAsync(
			"user@example.com",
			"testuser",
			"reset-token-456",
			CancellationToken.None);

		// Assert - should log but not throw
		Logger.ReceivedWithAnyArgs(1).LogWarning(default!);
	}

	/// <summary>
	/// Verifies that SendPasswordResetEmailAsync throws when the email is empty.
	/// </summary>
	[Fact]
	public async Task SendPasswordResetEmailAsync_ThrowsArgumentException_WhenEmailEmptyAsync()
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
			service.SendPasswordResetEmailAsync(
				"",
				"testuser",
				"token",
				CancellationToken.None));
	}

	/// <summary>
	/// Verifies that SendPasswordResetEmailAsync throws when the username is empty.
	/// </summary>
	[Fact]
	public async Task SendPasswordResetEmailAsync_ThrowsArgumentException_WhenUsernameEmptyAsync()
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
			service.SendPasswordResetEmailAsync(
				"user@example.com",
				"",
				"token",
				CancellationToken.None));
	}

	/// <summary>
	/// Verifies that SendPasswordResetEmailAsync throws when the token is empty.
	/// </summary>
	[Fact]
	public async Task SendPasswordResetEmailAsync_ThrowsArgumentException_WhenTokenEmptyAsync()
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
			service.SendPasswordResetEmailAsync(
				"user@example.com",
				"testuser",
				"",
				CancellationToken.None));
	}

	#endregion

	#region Rate Limiting Tests

	/// <summary>
	/// Verifies that SendWelcomeEmailAsync throws <see cref="EmailRateLimitException"/>
	/// when the rate limit reservation fails (TryIncrementRequestCountAsync returns false).
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_ThrowsException_WhenRateLimitExceededAsync()
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
			.Returns(false);

		rateLimiterMock
			.GetRemainingQuotaAsync(
				ExternalApiConstants.BrevoEmail,
				Arg.Any<CancellationToken>())
			.Returns(0);

		rateLimiterMock
			.GetTimeUntilReset()
			.Returns(TimeSpan.FromHours(12));

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

		// Act & Assert
		EmailRateLimitException exception =
			await Should.ThrowAsync<EmailRateLimitException>(() =>
				service.SendWelcomeEmailAsync(
					"test@example.com",
					"testuser",
					"token123",
					CancellationToken.None));

		exception.Message.ShouldContain("Email daily limit exceeded");
	}

	/// <summary>
	/// Verifies that SendPasswordResetEmailAsync throws <see cref="EmailRateLimitException"/>
	/// when the rate limit reservation fails.
	/// </summary>
	[Fact]
	public async Task SendPasswordResetEmailAsync_ThrowsException_WhenRateLimitExceededAsync()
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
			.Returns(false);

		rateLimiterMock
			.GetRemainingQuotaAsync(
				ExternalApiConstants.BrevoEmail,
				Arg.Any<CancellationToken>())
			.Returns(0);

		rateLimiterMock
			.GetTimeUntilReset()
			.Returns(TimeSpan.FromHours(6));

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

		// Act & Assert
		EmailRateLimitException exception =
			await Should.ThrowAsync<EmailRateLimitException>(() =>
				service.SendPasswordResetEmailAsync(
					"test@example.com",
					"testuser",
					"token456",
					CancellationToken.None));

		exception.Message.ShouldContain("Email daily limit exceeded");
	}

	/// <summary>
	/// Verifies that when a connection failure occurs (HTTP request never reached Brevo),
	/// the service releases the previously reserved rate limit slot via
	/// <see cref="IRateLimitingService.TryDecrementRequestCountAsync"/>.
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_ConnectionFailure_ReleasesRateLimitSlotAsync()
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

		using MockHttpMessageHandler handler =
			new(
				(request, cancellationToken) =>
					throw new HttpRequestException(
						HttpRequestError.ConnectionError,
						"Connection refused",
						new SocketException()));

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

		// Act
		await Should.ThrowAsync<HttpRequestException>(() =>
			service.SendWelcomeEmailAsync(
				"test@example.com",
				"testuser",
				"token123",
				CancellationToken.None));

		// Assert — TryDecrementRequestCountAsync was called to release the slot
		await rateLimiterMock
			.Received(1)
			.TryDecrementRequestCountAsync(
				ExternalApiConstants.BrevoEmail,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that when Brevo returns a 400 Bad Request (API was contacted),
	/// the rate limit slot stays consumed — Brevo has counted the call.
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_BrevoReturns400_KeepsRateLimitSlotConsumedAsync()
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

		using HttpResponseMessage badResponse =
			new(HttpStatusCode.BadRequest)
			{
				Content = new StringContent(
					"""{ "code":"invalid","message":"bad"}""",
					System.Text.Encoding.UTF8,
					"application/json"),
			};

		using MockHttpMessageHandler handler =
			new(
				(request, cancellationToken) =>
					Task.FromResult(badResponse));

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

		// Act & Assert
		await Should.ThrowAsync<HttpRequestException>(() =>
			service.SendWelcomeEmailAsync(
				"test@example.com",
				"testuser",
				"token123",
				CancellationToken.None));

		// Slot was NOT released — Brevo received the call
		await rateLimiterMock
			.DidNotReceive()
			.TryDecrementRequestCountAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that when Brevo returns 429 Too Many Requests, an
	/// <see cref="EmailRateLimitException"/> is thrown and the slot stays consumed.
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_BrevoReturns429_ThrowsEmailRateLimitExceptionAsync()
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

		using HttpResponseMessage tooManyResponse =
			new(HttpStatusCode.TooManyRequests);
		tooManyResponse.Headers.TryAddWithoutValidation(
			"x-sib-ratelimit-reset",
			"120");

		using MockHttpMessageHandler handler =
			new(
				(request, cancellationToken) =>
					Task.FromResult(tooManyResponse));

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

		// Act & Assert
		await Should.ThrowAsync<EmailRateLimitException>(() =>
			service.SendWelcomeEmailAsync(
				"test@example.com",
				"testuser",
				"token123",
				CancellationToken.None));

		// Slot was NOT released — Brevo counted the call
		await rateLimiterMock
			.DidNotReceive()
			.TryDecrementRequestCountAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that a successful Brevo API call (201 Created) completes
	/// without exceptions and the rate limit slot stays consumed.
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_BrevoReturns201_CompletesSuccessfullyAsync()
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

		// Act — should not throw
		await service.SendWelcomeEmailAsync(
			"test@example.com",
			"testuser",
			"token123",
			CancellationToken.None);

		// Assert — slot NOT released (Brevo received the call)
		await rateLimiterMock
			.DidNotReceive()
			.TryDecrementRequestCountAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>());
	}

	#endregion
}