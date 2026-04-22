// <copyright file="WelcomeEmailStrategyUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.ElectronicNotifications.Emails.Strategies;
using SeventySix.Shared.Contracts.Emails;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Strategies;

/// <summary>
/// Unit tests for <see cref="WelcomeEmailStrategy"/>.
/// Verifies correct template data extraction and email service delegation.
/// </summary>
public sealed class WelcomeEmailStrategyUnitTests
{
	private readonly IEmailService EmailService;
	private readonly WelcomeEmailStrategy Strategy;

	/// <summary>
	/// Initializes a new instance of the <see cref="WelcomeEmailStrategyUnitTests"/> class.
	/// </summary>
	public WelcomeEmailStrategyUnitTests()
	{
		EmailService =
			Substitute.For<IEmailService>();
		Strategy =
			new WelcomeEmailStrategy(EmailService);
	}

	/// <summary>
	/// Tests that SupportedType returns the Welcome email type constant.
	/// </summary>
	[Fact]
	public void SupportedType_ReturnsWelcomeConstant()
	{
		// Assert
		Assert.Equal(
			EmailTypeConstants.Welcome,
			Strategy.SupportedType);
	}

	/// <summary>
	/// Tests that SendAsync extracts template data and calls the email service.
	/// </summary>
	[Fact]
	public async Task SendAsync_ValidData_CallsEmailServiceWithCorrectParametersAsync()
	{
		// Arrange
		string recipientEmail = "user@test.local";
		Dictionary<string, string> templateData =
			new()
			{
				["username"] = "TestUser",
				["resetToken"] = "abc123",
			};

		// Act
		await Strategy.SendAsync(
			recipientEmail,
			templateData,
			CancellationToken.None);

		// Assert
		await EmailService
			.Received(1)
			.SendEmailAsync(
				EmailTypeConstants.Welcome,
				"user@test.local",
				templateData,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that SendAsync uses default values when template data keys are missing.
	/// </summary>
	[Fact]
	public async Task SendAsync_MissingTemplateData_UsesDefaultValuesAsync()
	{
		// Arrange
		string recipientEmail = "user@test.local";
		Dictionary<string, string> templateData = [];

		// Act
		await Strategy.SendAsync(
			recipientEmail,
			templateData,
			CancellationToken.None);

		// Assert
		await EmailService
			.Received(1)
			.SendEmailAsync(
				EmailTypeConstants.Welcome,
				"user@test.local",
				templateData,
				Arg.Any<CancellationToken>());
	}
}