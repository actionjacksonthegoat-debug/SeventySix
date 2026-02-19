// <copyright file="InitiateRegistrationCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Shared.Contracts.Emails;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using Shouldly;
using Wolverine;

namespace SeventySix.Identity.Tests.Commands.InitiateRegistration;

/// <summary>
/// Unit tests for <see cref="InitiateRegistrationCommandHandler"/>.
/// </summary>
/// <remarks>
/// Tests follow 80/20 rule: focus on security-critical scenarios.
/// Email enumeration prevention is critical.
/// </remarks>
public sealed class InitiateRegistrationCommandHandlerTests
{
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IAltchaService AltchaService;
	private readonly IMessageBus MessageBus;
	private readonly FakeTimeProvider TimeProvider;

	/// <summary>
	/// Initializes a new instance of the <see cref="InitiateRegistrationCommandHandlerTests"/> class.
	/// </summary>
	public InitiateRegistrationCommandHandlerTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		AltchaService =
			Substitute.For<IAltchaService>();
		MessageBus =
			Substitute.For<IMessageBus>();
		TimeProvider =
			new FakeTimeProvider(TestTimeProviderBuilder.DefaultTime);

		// Default: ALTCHA disabled for most tests
		AltchaService.IsEnabled.Returns(false);
	}

	/// <summary>
	/// Tests silent return when email already exists to prevent enumeration.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ExistingEmail_SilentlyReturnsAsync()
	{
		// Arrange
		const string Email = "existing@example.com";

		InitiateRegistrationRequest request =
			new(Email);

		ApplicationUser existingUser =
			new() { Email = Email };

		UserManager
			.FindByEmailAsync(Email)
			.Returns(existingUser);

		// Act
		await InitiateRegistrationCommandHandler.HandleAsync(
			request,
			AltchaService,
			UserManager,
			MessageBus,
			TimeProvider,
			CancellationToken.None);

		// Assert - No user creation or email should occur
		await UserManager
			.DidNotReceive()
			.CreateAsync(Arg.Any<ApplicationUser>());

		await MessageBus
			.DidNotReceive()
			.PublishAsync(
				Arg.Any<EnqueueEmailCommand>());
	}

	/// <summary>
	/// Tests successful registration initiation for new email.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NewEmail_CreatesUserAndEnqueuesEmailAsync()
	{
		// Arrange
		const string Email = "newuser@example.com";
		const string VerificationToken = "verification-token-123";

		InitiateRegistrationRequest request =
			new(Email);

		UserManager
			.FindByEmailAsync(Email)
			.Returns((ApplicationUser?)null);

		UserManager
			.CreateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Success);

		UserManager
			.GenerateEmailConfirmationTokenAsync(Arg.Any<ApplicationUser>())
			.Returns(VerificationToken);

		// Act
		await InitiateRegistrationCommandHandler.HandleAsync(
			request,
			AltchaService,
			UserManager,
			MessageBus,
			TimeProvider,
			CancellationToken.None);

		// Assert
		await UserManager
			.Received(1)
			.CreateAsync(Arg.Is<ApplicationUser>(
				user => user.Email == Email && !user.EmailConfirmed));

		await MessageBus
			.Received(1)
			.PublishAsync(
				Arg.Is<EnqueueEmailCommand>(
					command => command.RecipientEmail == Email
						&& command.EmailType == EmailTypeConstants.Verification));
	}

	/// <summary>
	/// Tests that create failure silently returns without sending email.
	/// </summary>
	[Fact]
	public async Task HandleAsync_CreateFails_SilentlyReturnsAsync()
	{
		// Arrange
		const string Email = "test@example.com";

		InitiateRegistrationRequest request =
			new(Email);

		UserManager
			.FindByEmailAsync(Email)
			.Returns((ApplicationUser?)null);

		UserManager
			.CreateAsync(Arg.Any<ApplicationUser>())
			.Returns(IdentityResult.Failed(
				new IdentityError { Description = "Create failed" }));

		// Act
		await InitiateRegistrationCommandHandler.HandleAsync(
			request,
			AltchaService,
			UserManager,
			MessageBus,
			TimeProvider,
			CancellationToken.None);

		// Assert - No email should be enqueued on failure
		await MessageBus
			.DidNotReceive()
			.PublishAsync(
				Arg.Any<EnqueueEmailCommand>());
	}

	/// <summary>
	/// Tests that created user has correct initial state.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NewEmail_CreatesUserWithCorrectStateAsync()
	{
		// Arrange
		const string Email = "newuser@example.com";
		ApplicationUser? capturedUser =
			null;

		InitiateRegistrationRequest request =
			new(Email);

		UserManager
			.FindByEmailAsync(Email)
			.Returns((ApplicationUser?)null);

		UserManager
			.CreateAsync(Arg.Do<ApplicationUser>(
				user => capturedUser = user))
			.Returns(IdentityResult.Success);

		UserManager
			.GenerateEmailConfirmationTokenAsync(Arg.Any<ApplicationUser>())
			.Returns("token");

		// Act
		await InitiateRegistrationCommandHandler.HandleAsync(
			request,
			AltchaService,
			UserManager,
			MessageBus,
			TimeProvider,
			CancellationToken.None);

		// Assert
		capturedUser.ShouldNotBeNull();
		capturedUser.Email.ShouldBe(Email);
		capturedUser.UserName.ShouldBe(Email); // Temporary username
		capturedUser.IsActive.ShouldBeFalse();
		capturedUser.EmailConfirmed.ShouldBeFalse();
	}
}