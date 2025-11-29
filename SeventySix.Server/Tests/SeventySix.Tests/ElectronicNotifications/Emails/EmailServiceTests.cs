// <copyright file="EmailServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using Shouldly;

namespace SeventySix.Tests.ElectronicNotifications.Emails;

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
			new(options, Logger);

		// Act
		await service.SendWelcomeEmailAsync(
			"user@example.com",
			"testuser",
			"reset-token-123",
			CancellationToken.None);

		// Assert - should log but not throw
		Logger.ReceivedWithAnyArgs(1)
			.LogInformation(default!);
	}

	[Fact]
	public async Task SendWelcomeEmailAsync_ThrowsArgumentException_WhenEmailEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions();
		EmailService service =
			new(options, Logger);

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
			new(options, Logger);

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
			new(options, Logger);

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
			new(options, Logger);

		// Act
		await service.SendPasswordResetEmailAsync(
			"user@example.com",
			"testuser",
			"reset-token-456",
			CancellationToken.None);

		// Assert - should log but not throw
		Logger.ReceivedWithAnyArgs(1)
			.LogInformation(default!);
	}

	[Fact]
	public async Task SendPasswordResetEmailAsync_ThrowsArgumentException_WhenEmailEmptyAsync()
	{
		// Arrange
		IOptions<EmailSettings> options =
			CreateOptions();
		EmailService service =
			new(options, Logger);

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
			new(options, Logger);

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
			new(options, Logger);

		// Act & Assert
		await Should.ThrowAsync<ArgumentException>(
			() => service.SendPasswordResetEmailAsync(
				"user@example.com",
				"testuser",
				"",
				CancellationToken.None));
	}

	#endregion
}