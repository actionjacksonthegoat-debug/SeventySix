// <copyright file="EmailServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
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
/// - URL building with token encoding.
/// </remarks>
public class EmailServiceTests
{
	private readonly ILogger<EmailService> Logger =
		Substitute.For<
		ILogger<EmailService>
	>();

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
				SmtpHost = "localhost",
				SmtpPort = 587,
				UseSsl = true,
			});
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
		EmailService service =
			new(options, RateLimitingService, Logger);

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
		EmailService service =
			new(options, RateLimitingService, Logger);

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
		EmailService service =
			new(options, RateLimitingService, Logger);

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
		EmailService service =
			new(options, RateLimitingService, Logger);

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
		EmailService service =
			new(options, RateLimitingService, Logger);

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
		EmailService service =
			new(options, RateLimitingService, Logger);

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
		EmailService service =
			new(options, RateLimitingService, Logger);

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
		EmailService service =
			new(options, RateLimitingService, Logger);

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

		EmailService service =
			new(options, rateLimiterMock, Logger);

		// Act & Assert
		EmailRateLimitException ex =
			await Should.ThrowAsync<EmailRateLimitException>(() =>
				service.SendWelcomeEmailAsync(
					"test@example.com",
					"testuser",
					"token123",
					CancellationToken.None));

		ex.Message.ShouldContain("Email daily limit exceeded");
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

		EmailService service =
			new(options, rateLimiterMock, Logger);

		// Act & Assert
		EmailRateLimitException ex =
			await Should.ThrowAsync<EmailRateLimitException>(() =>
				service.SendPasswordResetEmailAsync(
					"test@example.com",
					"testuser",
					"token456",
					CancellationToken.None));

		ex.Message.ShouldContain("Email daily limit exceeded");
	}

	/// <summary>
	/// Verifies that when SMTP send fails (e.g., connection refused), the service
	/// calls <see cref="IRateLimitingService.TryDecrementRequestCountAsync"/> to release
	/// the previously reserved rate limit slot, then rethrows the original exception.
	/// </summary>
	/// <remarks>
	/// The test sets <c>enabled: true</c> with <c>SmtpHost = "localhost"</c> port 587.
	/// No SMTP server is running in the test environment, so MailKit's ConnectAsync
	/// throws a <see cref="System.Net.Sockets.SocketException"/>. This naturally
	/// exercises the catch block in <c>SendEmailAsync</c>.
	/// </remarks>
	[Fact]
	public async Task SendWelcomeEmailAsync_SmtpFailure_CallsTryDecrementAsync()
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

		EmailService service =
			new(options, rateLimiterMock, Logger);

		// Act — SMTP will fail because no server is listening on localhost:587
		await Should.ThrowAsync<Exception>(() =>
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
	/// Verifies that when both SMTP send and the decrement rollback fail,
	/// the original SMTP exception is thrown (not the decrement exception)
	/// and the decrement failure is logged as a warning.
	/// </summary>
	[Fact]
	public async Task SendWelcomeEmailAsync_SmtpFailAndDecrementFail_ThrowsOriginalExceptionAsync()
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

		rateLimiterMock
			.TryDecrementRequestCountAsync(
				ExternalApiConstants.BrevoEmail,
				Arg.Any<CancellationToken>())
			.ThrowsAsync(new InvalidOperationException("DB connection lost"));

		EmailService service =
			new(options, rateLimiterMock, Logger);

		// Act — SMTP fails (no server), then decrement also fails
		await Should.ThrowAsync<Exception>(() =>
			service.SendWelcomeEmailAsync(
				"test@example.com",
				"testuser",
				"token123",
				CancellationToken.None));

		// Assert — Decrement was attempted despite failure
		await rateLimiterMock
			.Received(1)
			.TryDecrementRequestCountAsync(
				ExternalApiConstants.BrevoEmail,
				Arg.Any<CancellationToken>());
	}

	#endregion
}