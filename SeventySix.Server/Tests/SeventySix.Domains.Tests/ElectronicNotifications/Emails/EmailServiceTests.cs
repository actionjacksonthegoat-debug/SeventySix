// <copyright file="EmailServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.ApiTracking;
using SeventySix.ElectronicNotifications.Emails;
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
		Substitute.For<ILogger<EmailService>>();

	private readonly IRateLimitingService RateLimitingService =
		Substitute.For<IRateLimitingService>();

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

	[Fact]
	public async Task SendWelcomeEmailAsync_LogsEmail_WhenDisabledAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions(enabled: false);
		EmailService service =
			new(
				options,
				RateLimitingService,
				Logger);

		// Act
		await service.SendWelcomeEmailAsync(
			"user@example.com",
			"testuser",
			"reset-token-123",
			CancellationToken.None);

		// Assert - should log but not throw
		Logger.ReceivedWithAnyArgs(1)
			.LogWarning(default!);
	}

	[Fact]
	public async Task SendWelcomeEmailAsync_ThrowsArgumentException_WhenEmailEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions();
		EmailService service =
			new(
				options,
				RateLimitingService,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			() => service.SendWelcomeEmailAsync(
				"",
				"testuser",
				"token",
				CancellationToken.None));
	}

	[Fact]
	public async Task SendWelcomeEmailAsync_ThrowsArgumentException_WhenUsernameEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions();
		EmailService service =
			new(
				options,
				RateLimitingService,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			() => service.SendWelcomeEmailAsync(
				"user@example.com",
				"",
				"token",
				CancellationToken.None));
	}

	[Fact]
	public async Task SendWelcomeEmailAsync_ThrowsArgumentException_WhenTokenEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions();
		EmailService service =
			new(
				options,
				RateLimitingService,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			() => service.SendWelcomeEmailAsync(
				"user@example.com",
				"testuser",
				"",
				CancellationToken.None));
	}

	#endregion

	#region SendPasswordResetEmailAsync Tests

	[Fact]
	public async Task SendPasswordResetEmailAsync_LogsEmail_WhenDisabledAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions(enabled: false);
		EmailService service =
			new(
				options,
				RateLimitingService,
				Logger);

		// Act
		await service.SendPasswordResetEmailAsync(
			"user@example.com",
			"testuser",
			"reset-token-456",
			CancellationToken.None);

		// Assert - should log but not throw
		Logger.ReceivedWithAnyArgs(1)
			.LogWarning(default!);
	}

	[Fact]
	public async Task SendPasswordResetEmailAsync_ThrowsArgumentException_WhenEmailEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions();
		EmailService service =
			new(
				options,
				RateLimitingService,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			() => service.SendPasswordResetEmailAsync(
				"",
				"testuser",
				"token",
				CancellationToken.None));
	}

	[Fact]
	public async Task SendPasswordResetEmailAsync_ThrowsArgumentException_WhenUsernameEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions();
		EmailService service =
			new(
				options,
				RateLimitingService,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			() => service.SendPasswordResetEmailAsync(
				"user@example.com",
				"",
				"token",
				CancellationToken.None));
	}

	[Fact]
	public async Task SendPasswordResetEmailAsync_ThrowsArgumentException_WhenTokenEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions();
		EmailService service =
			new(
				options,
				RateLimitingService,
				Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			() => service.SendPasswordResetEmailAsync(
				"user@example.com",
				"testuser",
				"",
				CancellationToken.None));
	}

	#endregion

	#region Rate Limiting Tests

	[Fact]
	public async Task SendWelcomeEmailAsync_ThrowsException_WhenRateLimitExceededAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions(enabled: true);

		IRateLimitingService rateLimiterMock =
			Substitute.For<IRateLimitingService>();

		rateLimiterMock
			.CanMakeRequestAsync(
				ExternalApiConstants.BrevoEmail,
				Arg.Any<CancellationToken>())
			.Returns(false);

		EmailService service =
			new(
				options,
				rateLimiterMock,
				Logger);

		// Act & Assert
		EmailRateLimitException ex =
			await Should.ThrowAsync<EmailRateLimitException>(
				() => service.SendWelcomeEmailAsync(
					"test@example.com",
					"testuser",
					"token123",
					CancellationToken.None));

		ex.Message.ShouldContain("Email daily limit exceeded");
	}

	#endregion
}
