// <copyright file="EmailSendingStrategyResolverUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.ElectronicNotifications.Emails.Services;
using SeventySix.ElectronicNotifications.Emails.Strategies;
using SeventySix.Shared.Contracts.Emails;

namespace SeventySix.Domains.Tests.ElectronicNotifications.Emails.Services;

/// <summary>
/// Unit tests for <see cref="EmailSendingStrategyResolver"/>.
/// Verifies correct strategy resolution by email type.
/// </summary>
public sealed class EmailSendingStrategyResolverUnitTests
{
	private readonly IEmailService EmailService;
	private readonly EmailSendingStrategyResolver Resolver;

	/// <summary>
	/// Initializes a new instance of the <see cref="EmailSendingStrategyResolverUnitTests"/> class.
	/// </summary>
	public EmailSendingStrategyResolverUnitTests()
	{
		EmailService =
			Substitute.For<IEmailService>();

		Resolver =
			new EmailSendingStrategyResolver(
				[
					new WelcomeEmailStrategy(EmailService),
					new PasswordResetEmailStrategy(EmailService),
					new VerificationEmailStrategy(EmailService),
					new MfaCodeEmailStrategy(EmailService),
				]);
	}

	/// <summary>
	/// Tests that Resolve returns the correct strategy for the Welcome email type.
	/// </summary>
	[Fact]
	public void Resolve_WelcomeType_ReturnsWelcomeStrategy()
	{
		// Act
		IEmailSendingStrategy? strategy =
			Resolver.Resolve(EmailTypeConstants.Welcome);

		// Assert
		Assert.NotNull(strategy);
		Assert.IsType<WelcomeEmailStrategy>(strategy);
	}

	/// <summary>
	/// Tests that Resolve returns the correct strategy for the PasswordReset email type.
	/// </summary>
	[Fact]
	public void Resolve_PasswordResetType_ReturnsPasswordResetStrategy()
	{
		// Act
		IEmailSendingStrategy? strategy =
			Resolver.Resolve(EmailTypeConstants.PasswordReset);

		// Assert
		Assert.NotNull(strategy);
		Assert.IsType<PasswordResetEmailStrategy>(strategy);
	}

	/// <summary>
	/// Tests that Resolve returns the correct strategy for the Verification email type.
	/// </summary>
	[Fact]
	public void Resolve_VerificationType_ReturnsVerificationStrategy()
	{
		// Act
		IEmailSendingStrategy? strategy =
			Resolver.Resolve(EmailTypeConstants.Verification);

		// Assert
		Assert.NotNull(strategy);
		Assert.IsType<VerificationEmailStrategy>(strategy);
	}

	/// <summary>
	/// Tests that Resolve returns the correct strategy for the MfaVerification email type.
	/// </summary>
	[Fact]
	public void Resolve_MfaVerificationType_ReturnsMfaCodeStrategy()
	{
		// Act
		IEmailSendingStrategy? strategy =
			Resolver.Resolve(EmailTypeConstants.MfaVerification);

		// Assert
		Assert.NotNull(strategy);
		Assert.IsType<MfaCodeEmailStrategy>(strategy);
	}

	/// <summary>
	/// Tests that Resolve returns null for an unknown email type.
	/// </summary>
	[Fact]
	public void Resolve_UnknownType_ReturnsNull()
	{
		// Act
		IEmailSendingStrategy? strategy =
			Resolver.Resolve("UnknownType");

		// Assert
		Assert.Null(strategy);
	}
}